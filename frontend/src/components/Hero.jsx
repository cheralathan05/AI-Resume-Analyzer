import { Link } from "react-router-dom";
import "../styles/Hero.css";
import Button from "./Button";
import { CheckIcon, PlayIcon, SparkleIcon, UploadIcon, MicIcon, BriefcaseIcon } from "./icons";
import { useResume } from "../context/ResumeContext";
import { useAuth } from "../context/AuthContext";

const TRUST_POINTS = ["No sign-up required", "Instant results", "100% Privacy-first"];

function Hero() {
  const { activeResume, activeFileName, activeAnalysis } = useResume();
  const { user, isAuthenticated } = useAuth();

  const candidateName = activeResume?.contact?.name || user?.name || "Senior Candidate";
  const displayFileName = activeFileName || "Active_Resume.pdf";
  const atsScore = activeAnalysis?.atsScore || 89;
  const skillMatch = activeAnalysis?.skillMatch || 92;
  const keywordCount = activeResume?.skills?.length || 16;
  const keywordScore = Math.min(98, Math.max(72, Math.round((keywordCount / 16) * 100)));

  const skillBars = [
    { label: "Skill Match", value: skillMatch },
    { label: "Keywords Found", value: keywordScore },
    { label: "ATS Layout & Formats", value: 94 },
  ];

  return (
    <section className="hero" id="top">
      <div className="hero__inner container">
        {/* Copy */}
        <div className="hero__content">
          <span className="hero__badge animate-up">
            <span className="hero__badge-dot" />
            {isAuthenticated ? `Signed in as ${user?.name || "Professional"}` : "AI-powered resume intelligence"}
          </span>

          <h1 className="hero__title animate-up" style={{ animationDelay: "60ms" }}>
            Land Your Dream Job <br />
            with <span className="hero__title-accent editorial-serif">Intelligent Precision</span>
          </h1>

          <p
            className="hero__subtitle animate-up"
            style={{ animationDelay: "120ms" }}
          >
            {activeResume ? (
              <>
                Active candidate profile loaded for <strong>{candidateName}</strong> ({displayFileName}).
                Score ATS compatibility, rewrite STAR bullets with Google XYZ formula, generate cover letters, and simulate live interviews.
              </>
            ) : (
              <>
                Upload your resume and instantly receive ATS Score, Skill Analysis,
                AI Feedback, and practice live with our Interactive Voice AI Mock Interviewer.
              </>
            )}
          </p>

          <div
            className="hero__actions animate-up"
            style={{ animationDelay: "180ms" }}
          >
            <Button
              as={Link}
              to="/dashboard"
              icon={<SparkleIcon width={18} height={18} />}
              style={{ boxShadow: "0 0 20px rgba(255, 255, 255, 0.2)" }}
            >
              Explore Studio
            </Button>
            <Button
              as={Link}
              to="/upload"
              variant="secondary"
              icon={<UploadIcon width={18} height={18} />}
            >
              Upload PDF
            </Button>
            <Button
              as={Link}
              to="/jobs"
              variant="secondary"
              icon={<BriefcaseIcon width={18} height={18} />}
            >
              Job Radar
            </Button>
            <Button
              as={Link}
              to="/interview"
              variant="secondary"
              icon={<MicIcon width={18} height={18} />}
            >
              Voice AI
            </Button>
          </div>

          <ul
            className="hero__trust animate-up"
            style={{ animationDelay: "240ms", listStyle: "none", padding: 0 }}
          >
            {TRUST_POINTS.map((point) => (
              <li className="hero__trust-item" key={point}>
                <CheckIcon width={16} height={16} style={{ color: "var(--brand-500)" }} />
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* Visual mockup */}
        <div className="hero__visual">
          <div className="hero__card">
            <div className="hero__card-head">
              <div>
                <div className="hero__card-title">
                  <SparkleIcon
                    width={16}
                    height={16}
                    style={{ verticalAlign: "-3px", marginRight: 6, color: "var(--brand-500)" }}
                  />
                  {activeResume ? candidateName : "Resume Analysis"}
                </div>
                <div className="hero__card-sub">{displayFileName}</div>
              </div>

              <div className="hero__score">
                <div className="hero__score-inner">
                  <span className="hero__score-value">{atsScore}</span>
                  <span className="hero__score-label">ATS</span>
                </div>
              </div>
            </div>

            <div className="hero__bars">
              {skillBars.map((bar, i) => (
                <div key={bar.label}>
                  <div className="hero__bar-label">
                    <span>{bar.label}</span>
                    <span>{bar.value}%</span>
                  </div>
                  <div className="hero__bar-track">
                    <div
                      className="hero__bar-fill"
                      style={{
                        width: `${bar.value}%`,
                        animationDelay: `${300 + i * 150}ms`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {activeResume?.skills && (
              <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {activeResume.skills.slice(0, 5).map((sk) => (
                  <span
                    key={sk}
                    style={{
                      fontSize: "11px",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      background: "rgba(255, 255, 255, 0.08)",
                      color: "#e2e8f0",
                      fontWeight: 600,
                    }}
                  >
                    {sk}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
