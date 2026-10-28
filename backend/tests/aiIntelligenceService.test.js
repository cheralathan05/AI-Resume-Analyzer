// Mock getOllamaStatus to test the fast, resilient embedded intelligence engine
jest.mock("../src/services/ollamaService", () => {
  const actual = jest.requireActual("../src/services/ollamaService");
  return {
    ...actual,
    getOllamaStatus: jest.fn().mockResolvedValue({
      connected: false,
      models: [],
    }),
  };
});

const {
  generateCareerTrajectory,
  generateStarStoryBank,
  generateDebiasAudit,
  generateExecutiveBio,
  generateInterviewSprint,
  generateLocalizedResume,
} = require("../src/services/aiIntelligenceService");

const sampleResume = {
  contact: {
    name: "Alex Vance",
    email: "alex@example.com",
    phone: "+1 (555) 019-2834",
  },
  skills: [
    "React",
    "Node.js",
    "TypeScript",
    "PostgreSQL",
    "Redis",
    "Docker",
    "AWS",
    "GraphQL",
    "Generative AI",
    "REST APIs"
  ],
  experience: [
    {
      role: "Senior Full-Stack Engineer",
      company: "Horizon Cloud",
      date: "2022 - Present",
      bullets: [
        "Architected distributed microservices handling 4.2M daily transactions with 99.98% uptime.",
        "Spearheaded PostgreSQL database indexing and Redis caching, reducing p99 latency by 58%."
      ]
    }
  ],
  education: [
    {
      degree: "B.S. in Computer Science",
      school: "State University"
    }
  ],
  projects: [
    {
      name: "Sovereign AI Knowledge Engine",
      description: "Low-latency context retrieval platform with vector embeddings."
    }
  ]
};

describe("AI Advanced Career Intelligence Engines", () => {
  describe("generateCareerTrajectory", () => {
    it("returns multi-horizon milestones and promotion velocity score", async () => {
      const res = await generateCareerTrajectory({
        resume: sampleResume,
        targetRole: "Senior Full-Stack Engineer",
      });

      expect(res.success).toBe(true);
      expect(typeof res.velocityScore).toBe("number");
      expect(res.velocityScore).toBeGreaterThanOrEqual(70);
      expect(res.milestones).toHaveProperty("oneYear");
      expect(res.milestones).toHaveProperty("threeYear");
      expect(res.milestones).toHaveProperty("fiveYear");
      expect(Array.isArray(res.promotionUnlocks)).toBe(true);
      expect(res.promotionUnlocks.length).toBeGreaterThan(0);
      expect(Array.isArray(res.careerPitfalls)).toBe(true);
    });
  });

  describe("generateStarStoryBank", () => {
    it("generates 5 high-stakes STAR behavioral stories with metrics and trap warnings", async () => {
      const res = await generateStarStoryBank({
        resume: sampleResume,
        targetRole: "Senior Full-Stack Engineer",
      });

      expect(res.success).toBe(true);
      expect(Array.isArray(res.stories)).toBe(true);
      expect(res.stories.length).toBe(5);

      const firstStory = res.stories[0];
      expect(firstStory).toHaveProperty("category");
      expect(firstStory).toHaveProperty("situation");
      expect(firstStory).toHaveProperty("task");
      expect(firstStory).toHaveProperty("action");
      expect(firstStory).toHaveProperty("result");
      expect(firstStory).toHaveProperty("trapToAvoid");
      expect(firstStory).toHaveProperty("proTip");
    });
  });

  describe("generateDebiasAudit", () => {
    it("analyzes blind-screening readiness, linguistic balance, and recommendations", async () => {
      const res = await generateDebiasAudit({
        resume: sampleResume,
      });

      expect(res.success).toBe(true);
      expect(typeof res.blindScreeningScore).toBe("number");
      expect(res.blindScreeningScore).toBeGreaterThanOrEqual(0);
      expect(res.blindScreeningScore).toBeLessThanOrEqual(100);
      expect(res).toHaveProperty("linguisticBalance");
      expect(Array.isArray(res.riskAssessments)).toBe(true);
      expect(Array.isArray(res.recommendedReplacements)).toBe(true);
      expect(Array.isArray(res.executiveActionPlan)).toBe(true);
    });
  });

  describe("generateExecutiveBio", () => {
    it("generates 5 distinct personal branding bios across different channels", async () => {
      const res = await generateExecutiveBio({
        resume: sampleResume,
        targetRole: "Staff Software Engineer",
      });

      expect(res.success).toBe(true);
      expect(typeof res.phoneElevatorPitch).toBe("string");
      expect(res.phoneElevatorPitch.length).toBeGreaterThan(30);
      expect(typeof res.linkedInNarrative).toBe("string");
      expect(typeof res.executiveConferenceBio).toBe("string");
      expect(typeof res.gitHubDeveloperBio).toBe("string");
      expect(typeof res.foundingEngineerPitch).toBe("string");
    });
  });

  describe("generateInterviewSprint", () => {
    it("generates a complete 7-day intensive interview preparation sprint", async () => {
      const res = await generateInterviewSprint({
        resume: sampleResume,
        jobDescription: "Senior Distributed Systems Engineer with Docker, Kubernetes, and Redis",
        targetRole: "Senior Distributed Systems Engineer",
      });

      expect(res.success).toBe(true);
      expect(Array.isArray(res.days)).toBe(true);
      expect(res.days.length).toBe(7);
      expect(res.days[0]).toHaveProperty("day", 1);
      expect(res.days[0]).toHaveProperty("actionItems");
      expect(res.days[0]).toHaveProperty("drillQuestion");
      expect(Array.isArray(res.proTips)).toBe(true);
    });
  });

  describe("generateLocalizedResume", () => {
    it("returns market-specific formatting rules, compensation bands, and cultural checklist", async () => {
      const res = await generateLocalizedResume({
        resume: sampleResume,
        targetCountry: "US",
        targetRole: "Senior Engineer",
      });

      expect(res.success).toBe(true);
      expect(res.targetRegion).toBe("US");
      expect(res.marketDetails).toHaveProperty("pageStandard");
      expect(res.marketDetails).toHaveProperty("compBand");
      expect(res.marketDetails).toHaveProperty("personalInfoRule");
      expect(Array.isArray(res.actionableChecklist)).toBe(true);

      const ukRes = await generateLocalizedResume({
        resume: sampleResume,
        targetCountry: "UK_EU",
        targetRole: "Senior Engineer",
      });
      expect(ukRes.targetRegion).toBe("UK_EU");
      expect(ukRes.marketDetails.flag).toContain("🇬🇧");
    });
  });
});
