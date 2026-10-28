import "../styles/Features.css";
import FeatureCard from "./FeatureCard";
import {
  GaugeIcon,
  TargetIcon,
  WandIcon,
  DocumentIcon,
  MicIcon,
  DollarIcon,
  ShieldCheckIcon,
  GitCompareIcon,
  SparkleIcon,
  TerminalIcon,
  PrinterIcon,
  KeyboardIcon,
} from "./icons";

const FEATURES = [
  {
    icon: <TerminalIcon width={24} height={24} />,
    title: "Interactive Developer Terminal & CLI Shell",
    text: "Live bash/zsh shell with custom commands (~ / resume-cli $), ASCII diagnostics, Matrix rain, tactile audio, and direct ATS execution.",
    link: "/terminal",
  },
  {
    icon: <KeyboardIcon width={24} height={24} />,
    title: "Quick Command Palette (⌘K / Ctrl+K)",
    text: "Raycast-style keyboard action palette for lightning-fast fuzzy search across tools, sample resumes, diagnostic probes, and vault actions.",
    link: "/dashboard",
  },
  {
    icon: <PrinterIcon width={24} height={24} />,
    title: "ATS Resume Builder & PDF Exporter Studio",
    text: "Live visual resume editor with 3 compliant templates (Modern Clean, Executive Serif, Tech Monospace) and direct print-to-PDF export.",
    link: "/builder",
  },
  {
    icon: <MicIcon width={24} height={24} />,
    title: "Interactive Voice AI Mock Interviewer",
    text: "Live spoken AI simulation with 4 interviewer personas, real-time microphone transcription, filler-word telemetry, and instant STAR grading.",
    link: "/interview",
  },
  {
    icon: <GaugeIcon width={24} height={24} />,
    title: "Instant ATS Match & Gap Analysis",
    text: "Precise algorithmic parsing and scoring against target job descriptions with keyword gap detection.",
    link: "/dashboard",
  },
  {
    icon: <WandIcon width={24} height={24} />,
    title: "AI Resume Tailor & STAR Studio",
    text: "1-Click bullet point re-writer embedding missing keywords and quantified metrics using the STAR framework.",
    link: "/enhancer",
  },
  {
    icon: <DocumentIcon width={24} height={24} />,
    title: "Executive Cover Letter Generator",
    text: "Craft tailored executive cover letters matching your resume experience with customizable tone.",
    link: "/cover-letter",
  },
  {
    icon: <DollarIcon width={24} height={24} />,
    title: "Salary & Market Fit Estimator",
    text: "Discover estimated compensation bands and identify the highest-ROI missing skills that boost earnings.",
    link: "/salary",
  },
  {
    icon: <ShieldCheckIcon width={24} height={24} />,
    title: "ATS Health & Formatting Audit",
    text: "Scans for parsing red flags, action-verb power ratio, metric density, and eliminates buzzword traps.",
    link: "/diff",
  },
  {
    icon: <DocumentIcon width={24} height={24} />,
    title: "Embedded Database & Vault",
    text: "Persistent JSON storage with backup export, import restore, sample seeds, and instant history inspection.",
    link: "/history",
  },
];


function Features() {
  return (
    <section className="features section" id="features">
      <div className="container">
        <div className="features__head">
          <span className="features__eyebrow">All-In-One Career Engine</span>
          <h2 className="features__title">
            Engineered to outperform every traditional analyzer
          </h2>
          <p className="features__subtitle">
            An elite suite of AI-powered tools that tailor, audit, simulate interviews, and calculate market value — backed by local Ollama and embedded database.
          </p>
        </div>

        <div className="features__grid">
          {FEATURES.map((feature, i) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              text={feature.text}
              link={feature.link}
              delay={i * 60}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;
