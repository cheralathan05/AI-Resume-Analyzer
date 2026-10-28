/**
 * Unit tests for the ATS scoring engine.
 *
 * The engine is a set of pure functions, so every behaviour can be asserted in
 * isolation without a database, network, or the parser service. These tests
 * lock in the subtle rules the engine is built around: synonym canonicalization,
 * plural/verb stemming, stopword filtering, false-positive-safe matching
 * (java !== javascript), completeness scoring, and the weighted final score.
 */

const {
  analyzeResume,
  extractKeywords,
  matchKeywords,
  computeSkillMatch,
  computeResumeCompleteness,
  computeAtsScore,
  generateSuggestions,
  tokenize,
  normalize,
  canonicalize,
} = require("../src/services/atsService");

describe("normalize", () => {
  it("lowercases and trims surrounding punctuation", () => {
    expect(normalize("  Express. ")).toBe("express");
    expect(normalize("(React)")).toBe("react");
  });

  it("keeps tech-meaningful symbols", () => {
    expect(normalize("C++")).toBe("c++");
    expect(normalize("node.js")).toBe("node.js");
    expect(normalize("C#")).toBe("c#");
  });

  it("is defensive against non-string input", () => {
    expect(normalize(null)).toBe("");
    expect(normalize(undefined)).toBe("");
  });
});

describe("canonicalize", () => {
  it("expands the MERN acronym into its technologies", () => {
    const out = canonicalize("We use MERN");
    expect(out).toContain("mongodb");
    expect(out).toContain("express");
    expect(out).toContain("react");
    expect(out).toContain("node");
  });

  it("collapses REST API variants to a single token", () => {
    expect(canonicalize("REST API")).toContain("restapi");
    expect(canonicalize("RESTful APIs")).toContain("restapi");
  });

  it("treats CI/CD as one token, never split into ci and cd", () => {
    expect(canonicalize("CI/CD")).toContain("cicd");
    expect(canonicalize("CI - CD")).toContain("cicd");
  });

  it("maps .js framework suffixes to the bare name", () => {
    expect(canonicalize("React.js")).toContain("react");
    expect(canonicalize("Node.js")).toContain("node");
  });

  it("does not conflate java with javascript", () => {
    const out = canonicalize("Java developer");
    expect(out).toContain("java");
    expect(out).not.toContain("javascript");
  });
});

describe("tokenize", () => {
  it("drops stopwords and generic filler", () => {
    const tokens = tokenize("We are looking for a strong developer with experience");
    expect(tokens).not.toContain("looking");
    expect(tokens).not.toContain("strong");
    expect(tokens).not.toContain("experience");
    expect(tokens).not.toContain("developer");
  });

  it("folds simple plurals to a singular base form", () => {
    expect(tokenize("projects")).toContain("project");
    expect(tokenize("libraries")).toContain("library");
  });

  it("protects real tech terms ending in s", () => {
    expect(tokenize("aws kubernetes redis")).toEqual(
      expect.arrayContaining(["aws", "kubernetes", "redis"])
    );
  });

  it("drops bare numbers and single characters", () => {
    const tokens = tokenize("a 2024 x python");
    expect(tokens).toContain("python");
    expect(tokens).not.toContain("2024");
    expect(tokens).not.toContain("x");
  });
});

describe("extractKeywords", () => {
  it("returns frequency-ranked, de-duplicated keywords", () => {
    const jd = "Python Python Python Django Django REST";
    const keywords = extractKeywords(jd);
    expect(keywords[0]).toBe("python"); // most frequent first
    expect(new Set(keywords).size).toBe(keywords.length); // de-duplicated
  });

  it("honours the limit argument", () => {
    const jd = "python java go rust kotlin swift ruby php scala elixir";
    expect(extractKeywords(jd, 3)).toHaveLength(3);
  });
});

describe("matchKeywords", () => {
  it("partitions keywords into matched and missing", () => {
    const { matched, missing } = matchKeywords(
      ["react", "docker"],
      "react node express"
    );
    expect(matched).toContain("react");
    expect(missing).toContain("docker");
  });

  it("does not match java inside javascript (false-positive guard)", () => {
    const { matched, missing } = matchKeywords(["java"], "javascript typescript");
    expect(matched).not.toContain("java");
    expect(missing).toContain("java");
  });
});

describe("computeSkillMatch", () => {
  it("counts JD keywords backed by an explicit resume skill", () => {
    const result = computeSkillMatch(["React.js", "Node.js"], ["react", "docker"]);
    expect(result.matched).toContain("react");
    expect(result.missing).toContain("docker");
    expect(result.percent).toBe(50);
  });

  it("lets a REST API skill satisfy a generic api keyword (implied tokens)", () => {
    const result = computeSkillMatch(["REST APIs"], ["api"]);
    expect(result.matched).toContain("api");
    expect(result.percent).toBe(100);
  });

  it("returns 0 percent when there are no keywords", () => {
    expect(computeSkillMatch(["react"], []).percent).toBe(0);
  });
});

describe("computeResumeCompleteness", () => {
  it("gives 100 percent for a fully populated resume", () => {
    const resume = {
      contact: { name: "Ada", email: "a@x.com", phone: "123456789" },
      skills: ["react"],
      education: ["B.Tech"],
      experience: ["SDE"],
      projects: ["Thing"],
    };
    expect(computeResumeCompleteness(resume).percent).toBe(100);
  });

  it("flags each missing section", () => {
    const { percent, missing } = computeResumeCompleteness({
      contact: { name: "Ada" },
    });
    expect(missing).toEqual(
      expect.arrayContaining(["email", "phone", "skills", "education", "experience", "projects"])
    );
    expect(percent).toBeLessThan(100);
  });

  it("is defensive against a null resume", () => {
    expect(computeResumeCompleteness(null).percent).toBe(0);
  });
});

describe("computeAtsScore", () => {
  it("blends the signals using the documented weights", () => {
    // 0.45*100 + 0.35*100 + 0.20*100 = 100
    expect(
      computeAtsScore({
        keywordMatchPercent: 100,
        skillMatchPercent: 100,
        completenessPercent: 100,
      })
    ).toBe(100);
    // 0.45*100 + 0.35*0 + 0.20*0 = 45
    expect(
      computeAtsScore({
        keywordMatchPercent: 100,
        skillMatchPercent: 0,
        completenessPercent: 0,
      })
    ).toBe(45);
  });

  it("clamps into the 0-100 range", () => {
    expect(
      computeAtsScore({ keywordMatchPercent: 0, skillMatchPercent: 0, completenessPercent: 0 })
    ).toBe(0);
  });
});

describe("generateSuggestions", () => {
  it("advises on missing sections and low skill match", () => {
    const suggestions = generateSuggestions({
      atsScore: 40,
      skillMatchPercent: 20,
      missingKeywords: ["docker", "aws"],
      completeness: { missing: ["skills", "projects"] },
    });
    const joined = suggestions.join(" ");
    expect(joined).toMatch(/Skills section/i);
    expect(joined).toMatch(/docker/);
    expect(joined).toMatch(/less than half/i);
  });
});

describe("analyzeResume (integration of the pure pipeline)", () => {
  const resume = {
    contact: { name: "Arpit Chauhan", email: "a@x.com", phone: "9457337284" },
    skills: ["React.js", "Node.js", "Express", "MongoDB", "JavaScript"],
    education: ["B.Tech ECE, IIIT Surat"],
    experience: ["SDE Intern"],
    projects: ["PlaceTrack", "AI Resume Analyzer"],
    full_text: "Built a MERN app with REST APIs and JWT auth.",
  };

  it("scores a well-matched MERN resume highly", () => {
    const jd = "Looking for a MERN developer skilled in React, Node.js, Express, MongoDB.";
    const result = analyzeResume(resume, jd);
    expect(result.atsScore).toBeGreaterThan(70);
    expect(result.matchedKeywords).toEqual(
      expect.arrayContaining(["react", "node", "express", "mongodb"])
    );
    expect(result.resumeCompleteness).toBe(100);
  });

  it("surfaces missing keywords for an unrelated role", () => {
    const jd = "Seeking a data engineer with Spark, Hadoop, Kafka, and Airflow.";
    const result = analyzeResume(resume, jd);
    expect(result.missingKeywords).toEqual(
      expect.arrayContaining(["spark", "hadoop", "kafka", "airflow"])
    );
    expect(result.atsScore).toBeLessThan(60);
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it("returns a stable shape even for empty input", () => {
    const result = analyzeResume(null, "");
    expect(result).toEqual(
      expect.objectContaining({
        atsScore: expect.any(Number),
        skillMatch: expect.any(Number),
        matchedKeywords: expect.any(Array),
        missingKeywords: expect.any(Array),
        resumeCompleteness: expect.any(Number),
        suggestions: expect.any(Array),
      })
    );
  });
});
