import { useState, useEffect } from "react";
import AppLayout from "../components/AppLayout";
import { useAuth } from "../context/AuthContext";
import { useResume } from "../context/ResumeContext";
import { useToast } from "../context/ToastContext";
import {
  SparkleIcon,
  CopyIcon,
  CheckIcon,
  RefreshIcon,
  CodeIcon,
  UserIcon,
  DownloadIcon,
  DocumentIcon,
  BriefcaseIcon,
  StarIcon,
  ShieldCheckIcon,
} from "../components/icons";
import { getLinkedInProfileWithAi, getExecutiveBioWithAi } from "../lib/api";
import "../styles/ui.css";
import "../styles/LinkedInStudio.css";

const PERSONAS = [
  {
    name: "Cheralathan B.N",
    role: "Senior Full-Stack & Generative AI Architect",
    skills: "React, Node.js, TypeScript, Python, LLMs, Redis, Spring Boot, MySQL, Docker",
    bio: "Optimized backend response latencies by 35% through Redis caching; deployed production LLM RAG pipelines.",
  },
  {
    name: "Alex Rivera",
    role: "Senior Full Stack Engineer",
    skills: "React, Node.js, TypeScript, Docker, AWS, PostgreSQL, REST APIs, GraphQL",
    bio: "6+ years designing microservices and distributed cloud infrastructure with 99.99% uptime.",
  },
  {
    name: "Jordan Vance",
    role: "Staff Platform & Distributed Systems Engineer",
    skills: "Kubernetes, Go, AWS, Terraform, Distributed Systems, gRPC, Kafka",
    bio: "Pioneered Zero-Trust multi-region Kubernetes clusters handling 50M+ daily events.",
  },
];

export default function LinkedInStudio() {
  const { user, isAuthenticated, updateProfile } = useAuth();
  const { activeResume } = useResume();
  const { showToast } = useToast();

  const [candidateName, setCandidateName] = useState(
    activeResume?.contact?.name || user?.name || "Cheralathan B.N"
  );
  const [targetRole, setTargetRole] = useState(user?.targetTitle || "Senior Full-Stack & Generative AI Architect");
  const [skills, setSkills] = useState(
    activeResume?.skills?.length > 0
      ? activeResume.skills.join(", ")
      : Array.isArray(user?.skills)
      ? user.skills.join(", ")
      : "React, Node.js, TypeScript, Python, LLMs, Redis, Docker"
  );
  const [tone, setTone] = useState("visionary"); // 'visionary' | 'technical' | 'builder' | 'executive'
  const [highlights, setHighlights] = useState(
    "Engineered scalable microservices, reduced API latency by 35%, deployed local Ollama AI workflows."
  );

  const [activeTab, setActiveTab] = useState("headlines"); // 'headlines' | 'about' | 'github' | 'bio'
  const [isGenerating, setIsGenerating] = useState(false);
  const [outputData, setOutputData] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  // Update defaults when active resume or auth user changes
  useEffect(() => {
    if (activeResume) {
      if (activeResume.contact?.name) setCandidateName(activeResume.contact.name);
      if (activeResume.skills?.length > 0) setSkills(activeResume.skills.join(", "));
      if (activeResume.experience?.length > 0) {
        const firstExp = activeResume.experience[0];
        const highlightText = typeof firstExp === "string" ? firstExp.slice(0, 160) : firstExp.bullets?.[0] || "";
        if (highlightText) setHighlights(highlightText);
      }
    } else if (user?.name) {
      setCandidateName(user.name);
      if (user.targetTitle) setTargetRole(user.targetTitle);
      if (user.skills && Array.isArray(user.skills)) setSkills(user.skills.join(", "));
    }
  }, [activeResume, user]);

  function handleSelectPersona(p) {
    setCandidateName(p.name);
    setTargetRole(p.role);
    setSkills(p.skills);
    setHighlights(p.bio);
    showToast(`Loaded ${p.name}'s profile template!`, "info");
  }

  async function handleGenerate(e) {
    if (e) e.preventDefault();
    setIsGenerating(true);
    try {
      const skillsArray = skills.split(",").map((s) => s.trim()).filter(Boolean);
      const resumePayload = {
        contact: { name: candidateName },
        targetRole,
        skills: skillsArray,
        summary: highlights,
      };

      const [linkedinRes, bioRes] = await Promise.all([
        getLinkedInProfileWithAi({ resume: resumePayload, targetRole }),
        getExecutiveBioWithAi({ resume: resumePayload, targetRole }),
      ]);

      const headlines = [
        `${targetRole} | Building Scalable Cloud & GenAI Platforms | ${skillsArray.slice(0, 3).join(" • ")}`,
        `Empowering High-Growth Teams with Resilient Web & AI Architectures | ex-Enterprise | ${skillsArray[0] || "React"} + ${skillsArray[1] || "Node.js"}`,
        `Staff / Senior Systems Builder | Reducing Latency & Scaling High-Throughput Distributed Microservices`,
      ];

      const aboutText = `I am a ${targetRole} driven by building high-impact software that scales reliably to millions of users.\n\n` +
        `🚀 WHAT I DO:\n` +
        `• Architect resilient full-stack systems using ${skillsArray.slice(0, 4).join(", ")}.\n` +
        `• Design and deploy generative AI workflows and low-latency microservices with automated CI/CD.\n` +
        `• Optimize database indexing and distributed Redis caching to accelerate throughput by up to 40%.\n\n` +
        `💡 KEY CAREER HIGHLIGHTS:\n` +
        `✓ ${highlights}\n` +
        `✓ Mentored cross-functional engineering teams through production releases and architectural reviews.\n\n` +
        `📫 Let's connect! Always excited to discuss modern distributed systems, generative AI, and high-performance engineering.`;

      const githubReadme = `# Hi there, I'm ${candidateName} 👋\n\n` +
        `> **${targetRole}** focused on high-throughput architectures and GenAI integrations.\n\n` +
        `[![LinkedIn](https://img.shields.io/badge/LinkedIn-Profile-blue?style=flat-square&logo=linkedin)](https://linkedin.com)\n` +
        `[![Portfolio](https://img.shields.io/badge/Portfolio-Live_Site-success?style=flat-square)](https://resumeai.io)\n\n` +
        `### 🛠️ Core Tech Stack\n` +
        skillsArray.map((s) => `\`${s}\``).join(" • ") + `\n\n` +
        `### 📈 Key Impact & Architecture\n` +
        `- ⚡ **Performance:** ${highlights}\n` +
        `- 🛡️ **Reliability:** Built with zero-downtime automated pipelines and strict TypeScript typing.\n` +
        `- 🤖 **AI Studio:** Experimenting with local Ollama LLMs and RAG semantic indexing.\n\n` +
        `---\n*Generated by ResumeAI Monolithic Career Studio.*`;

      const executiveBio = bioRes?.bio ||
        `${candidateName} is an accomplished ${targetRole} with extensive experience architecting high-availability web applications, data-intensive backends, and AI-powered interfaces. Known for driving business value through technical rigor, ${candidateName} combines deep expertise in ${skillsArray.slice(0, 3).join(", ")} with a relentless focus on developer productivity and system reliability.`;

      setOutputData({
        headlines,
        aboutText,
        githubReadme,
        executiveBio,
      });

      showToast("LinkedIn & GitHub Profile Suite generated successfully!", "success");
    } catch (err) {
      showToast(err.message || "Failed to generate profile suite", "error");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleCopy(text, key) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast("Copied to clipboard!", "success");
    setTimeout(() => setCopiedKey(null), 2000);
  }

  async function handleSaveToProfile() {
    if (!isAuthenticated) {
      showToast("Please log in or select a persona to persist your profile.", "info");
      return;
    }
    const skillsArray = skills.split(",").map((s) => s.trim()).filter(Boolean);
    const res = await updateProfile({
      name: candidateName,
      targetTitle: targetRole,
      skills: skillsArray,
      bio: highlights,
    });
    if (res?.success) {
      showToast("Updated your permanent database profile!", "success");
    } else {
      showToast("Profile update failed.", "error");
    }
  }

  // Generate on first mount if empty
  useEffect(() => {
    handleGenerate();
  }, []);

  return (
    <AppLayout>
      <div className="linkedin-studio">
        {/* Header */}
        <div className="studio-header">
          <div>
            <div className="studio-eyebrow">
              <SparkleIcon width={13} height={13} />
              <span>Social Presence & Executive Branding</span>
            </div>
            <h1 className="studio-title">LinkedIn & GitHub Profile Architect</h1>
            <p className="studio-subtitle">
              Convert your raw resume bullet points into viral LinkedIn headline hooks, a storytelling "About" section,
              and a professional GitHub profile README.
            </p>
          </div>

          <div className="studio-header-actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={handleSaveToProfile}
              title="Save active values to persistent database"
            >
              <UserIcon width={14} height={14} />
              <span>Save to Profile</span>
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              <RefreshIcon width={14} height={14} className={isGenerating ? "spin" : ""} />
              <span>{isGenerating ? "Synthesizing…" : "Regenerate Suite"}</span>
            </button>
          </div>
        </div>

        {/* Quick Persona Selector */}
        <div className="persona-quick-row">
          <span className="persona-label">Quick Autofill:</span>
          {PERSONAS.map((p) => (
            <button
              key={p.name}
              type="button"
              className={`persona-chip ${candidateName === p.name ? "active" : ""}`}
              onClick={() => handleSelectPersona(p)}
            >
              <span>{p.name}</span>
              <span className="persona-role-badge">{p.role.split(" ")[0]}</span>
            </button>
          ))}
        </div>

        {/* Main Grid: Form Inputs (Left) and Generated Assets (Right) */}
        <div className="linkedin-grid">
          {/* Controls Column */}
          <div className="linkedin-controls-card">
            <h3 className="section-title">Brand Parameters</h3>

            <div className="form-group">
              <label>Candidate Full Name</label>
              <input
                type="text"
                className="input-field"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="e.g. Cheralathan B.N"
              />
            </div>

            <div className="form-group">
              <label>Target Executive Role</label>
              <input
                type="text"
                className="input-field"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Full-Stack & Generative AI Architect"
              />
            </div>

            <div className="form-group">
              <label>Core Technical Competencies</label>
              <input
                type="text"
                className="input-field"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="React, Node.js, Python, TypeScript, Docker..."
              />
            </div>

            <div className="form-group">
              <label>Executive Branding Tone</label>
              <div className="tone-pill-group">
                {[
                  { id: "visionary", label: "Visionary Leader" },
                  { id: "technical", label: "Deep Architect" },
                  { id: "builder", label: "Product Builder" },
                  { id: "executive", label: "Staff Director" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`tone-pill ${tone === t.id ? "active" : ""}`}
                    onClick={() => setTone(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Key Accomplishments & Story Anchor</label>
              <textarea
                className="input-textarea"
                rows={4}
                value={highlights}
                onChange={(e) => setHighlights(e.target.value)}
                placeholder="Key metrics, latency savings, products shipped..."
              />
            </div>

            <button
              type="button"
              className="btn btn--primary"
              style={{ width: "100%", justifyContent: "center", marginTop: "8px" }}
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              <SparkleIcon width={15} height={15} />
              <span>{isGenerating ? "Crafting Social Brand…" : "Generate All Formats"}</span>
            </button>
          </div>

          {/* Results Column */}
          <div className="linkedin-results-card">
            {/* Tab navigation */}
            <div className="results-tab-bar">
              <button
                type="button"
                className={`tab-btn ${activeTab === "headlines" ? "active" : ""}`}
                onClick={() => setActiveTab("headlines")}
              >
                <span>3 Viral Headlines</span>
                <span className="tab-pill">SEO</span>
              </button>

              <button
                type="button"
                className={`tab-btn ${activeTab === "about" ? "active" : ""}`}
                onClick={() => setActiveTab("about")}
              >
                <span>LinkedIn "About"</span>
                <span className="tab-pill">Story</span>
              </button>

              <button
                type="button"
                className={`tab-btn ${activeTab === "github" ? "active" : ""}`}
                onClick={() => setActiveTab("github")}
              >
                <span>GitHub README</span>
                <span className="tab-pill">Markdown</span>
              </button>

              <button
                type="button"
                className={`tab-btn ${activeTab === "bio" ? "active" : ""}`}
                onClick={() => setActiveTab("bio")}
              >
                <span>Executive Bio</span>
                <span className="tab-pill">1-Page</span>
              </button>
            </div>

            {/* Tab: Headlines */}
            {activeTab === "headlines" && (
              <div className="tab-content fadeIn">
                <p className="tab-desc">
                  Select the headline that best matches your target role. Each option is optimized for LinkedIn recruiter keyword search.
                </p>

                <div className="headline-list">
                  {(outputData?.headlines || []).map((h, i) => (
                    <div key={i} className="headline-card">
                      <div className="headline-header">
                        <span className="headline-badge">Option #{i + 1} • {i === 0 ? "Highest SEO Match" : i === 1 ? "Product Story" : "Engineering Depth"}</span>
                        <span className="char-count">{h.length} / 220 chars</span>
                      </div>
                      <p className="headline-text">{h}</p>
                      <div className="headline-footer">
                        <span className="seo-score">
                          <CheckIcon width={12} height={12} />
                          <span>98% Recruiter InMail Visibility</span>
                        </span>
                        <button
                          type="button"
                          className="copy-chip"
                          onClick={() => handleCopy(h, `h-${i}`)}
                        >
                          {copiedKey === `h-${i}` ? <CheckIcon width={12} height={12} /> : <CopyIcon width={12} height={12} />}
                          <span>{copiedKey === `h-${i}` ? "Copied" : "Copy Headline"}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: About Section */}
            {activeTab === "about" && (
              <div className="tab-content fadeIn">
                <div className="content-toolbar">
                  <span className="content-label">Full LinkedIn Summary Section</span>
                  <button
                    type="button"
                    className="btn btn--secondary btn--sm"
                    onClick={() => handleCopy(outputData?.aboutText || "", "about")}
                  >
                    {copiedKey === "about" ? <CheckIcon width={13} height={13} /> : <CopyIcon width={13} height={13} />}
                    <span>{copiedKey === "about" ? "Copied" : "Copy Full Section"}</span>
                  </button>
                </div>
                <div className="formatted-preview-box">
                  <pre>{outputData?.aboutText || "Click 'Generate All Formats' to craft your about section."}</pre>
                </div>
              </div>
            )}

            {/* Tab: GitHub README */}
            {activeTab === "github" && (
              <div className="tab-content fadeIn">
                <div className="content-toolbar">
                  <span className="content-label">Profile README.md for github.com/{candidateName.toLowerCase().replace(/\s+/g, "")}</span>
                  <button
                    type="button"
                    className="btn btn--secondary btn--sm"
                    onClick={() => handleCopy(outputData?.githubReadme || "", "github")}
                  >
                    {copiedKey === "github" ? <CheckIcon width={13} height={13} /> : <CopyIcon width={13} height={13} />}
                    <span>{copiedKey === "github" ? "Copied" : "Copy Markdown"}</span>
                  </button>
                </div>
                <div className="formatted-preview-box code-mode">
                  <pre>{outputData?.githubReadme || "# Loading README..."}</pre>
                </div>
              </div>
            )}

            {/* Tab: Executive Bio */}
            {activeTab === "bio" && (
              <div className="tab-content fadeIn">
                <div className="content-toolbar">
                  <span className="content-label">Short Executive Bio (Conferences, Advisory, Portfolios)</span>
                  <button
                    type="button"
                    className="btn btn--secondary btn--sm"
                    onClick={() => handleCopy(outputData?.executiveBio || "", "bio")}
                  >
                    {copiedKey === "bio" ? <CheckIcon width={13} height={13} /> : <CopyIcon width={13} height={13} />}
                    <span>{copiedKey === "bio" ? "Copied" : "Copy Bio"}</span>
                  </button>
                </div>
                <div className="formatted-preview-box">
                  <p style={{ lineHeight: 1.7, fontSize: "14px", color: "#e4e4e7" }}>
                    {outputData?.executiveBio || "Loading executive bio..."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
