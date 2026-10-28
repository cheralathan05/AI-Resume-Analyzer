import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles/ui.css";
import "../styles/Dashboard.css";
import AppLayout from "../components/AppLayout";
import { useToast } from "../context/ToastContext";
import { useResume } from "../context/ResumeContext";
import { useAuth } from "../context/AuthContext";
import Card from "../components/Card";
import StatCard from "../components/StatCard";
import Button from "../components/Button";
import CircularScore from "../components/CircularScore";
import ProgressBar from "../components/ProgressBar";
import AtsRuleChecklistCard from "../components/AtsRuleChecklistCard";
import NegotiationCoachCard from "../components/NegotiationCoachCard";
import {
  analyzeAts,
  analyzeWithAi,
  chatWithAi,
  tailorResumeWithAi,
  generateCoverLetterWithAi,
  generateInterviewPrepWithAi,
  gradeInterviewAnswerWithAi,
  getSalaryEstimateWithAi,
  auditResumeFormat,
  multiMatchJobsWithAts,
  getSampleResumesAndJobs,
  compareCandidatesWithAi,
  generateOutreachPitchWithAi,
  improveBulletWithAi,
  getLearningRoadmapWithAi,
  getLinkedInProfileWithAi,
  getPowerBulletsWithAi,
  getSkillsQuizWithAi,
  listJobApplications,
  createJobApplication,
  updateJobApplication,
  deleteJobApplication,
  seedJobApplications,
  getCareerTrajectoryWithAi,
  getStarStoryBankWithAi,
  getDebiasAuditWithAi,
  getExecutiveBioWithAi,
  getInterviewSprintWithAi,
  getLocalizeResumeWithAi,
  getErrorMessage,
} from "../lib/api";
import {
  DocumentIcon,
  LayersIcon,
  StarIcon,
  TargetIcon,
  BulbIcon,
  ArrowLeftIcon,
  UploadIcon,
  KeyIcon,
  CheckIcon,
  CloseIcon,
  AlertIcon,
  SparkleIcon,
  MessageIcon,
  CopyIcon,
  WandIcon,
  DollarIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
  MicIcon,
  GitCompareIcon,
  DownloadIcon,
  VolumeIcon,
  EditIcon,
  PrinterIcon,
  KanbanIcon,
  BrainIcon,
  TrendingUpIcon,
  GlobeIcon,
  AwardIcon,
  BookOpenIcon,
  CalendarIcon,
  SearchIcon,
} from "../components/icons";


/* Small inline placeholder when section is empty */
function NotFound({ label = "Not found" }) {
  return <p className="not-found">{label}</p>;
}

/* Copy button with feedback */
function CopyButton({ text, label = "Copy" }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button className="copy-btn" onClick={handleCopy} type="button">
      <CopyIcon width={12} height={12} />
      {copied ? "Copied!" : label}
    </button>
  );
}

/* Renders matched/missing keywords with 1-click addition */
function KeywordTags({ keywords, missing = false, onAddMissing = null }) {
  if (!keywords || keywords.length === 0) {
    return <NotFound label={missing ? "No critical gaps found" : "No matches yet"} />;
  }
  return (
    <div className="skill-tags">
      {keywords.map((kw, i) => (
        <span
          className={`skill-tag ${missing ? "skill-tag--missing" : ""}`.trim()}
          key={`${kw}-${i}`}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <span className="skill-tag__dot" />
          {kw}
          {missing && onAddMissing && (
            <button
              type="button"
              onClick={() => onAddMissing(kw)}
              title={`Add ${kw} to your resume skills`}
              style={{
                background: "rgba(255, 255, 255, 0.12)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                color: "#ffffff",
                borderRadius: "4px",
                fontSize: "10px",
                padding: "1px 5px",
                cursor: "pointer",
                marginLeft: "4px",
                fontWeight: "700",
              }}
            >
              + Add
            </button>
          )}
        </span>
      ))}
    </div>
  );
}

const PRESET_JOB_ARCHETYPES = [
  {
    id: "arch-1",
    title: "Senior Full-Stack Engineer",
    company: "Tech Benchmark",
    text: "Senior Full-Stack Software Engineer with 5+ years building scalable distributed web applications. Expertise in React, TypeScript, Node.js, Express, PostgreSQL, REST APIs, Microservices, Docker, CI/CD, AWS, System Architecture, Redis caching, and automated testing.",
  },
  {
    id: "arch-2",
    title: "AI / ML Solutions Engineer",
    company: "Tech Benchmark",
    text: "AI / Machine Learning Engineer with strong experience in Python, PyTorch, LLMs, LangChain, RAG pipelines, Vector Databases, Ollama, API integration, model deployment, fine-tuning, Docker, and full-stack prototyping.",
  },
  {
    id: "arch-3",
    title: "Cloud DevOps & SRE",
    company: "Tech Benchmark",
    text: "DevOps & Site Reliability Engineer specializing in Kubernetes, Docker, Terraform, AWS, Azure, CI/CD pipelines (GitHub Actions, GitLab), Linux systems administration, Prometheus, Grafana, security compliance, and high availability systems.",
  },
  {
    id: "arch-4",
    title: "Data Engineer & Analytics",
    company: "Tech Benchmark",
    text: "Data Engineer skilled in Python, SQL, Apache Spark, Kafka, ETL pipelines, Snowflake, BigQuery, data modeling, dbt, data warehousing, Airflow workflow orchestration, and data visualization.",
  },
  {
    id: "arch-5",
    title: "Technical Product / Team Lead",
    company: "Tech Benchmark",
    text: "Engineering Lead & Technical Product Manager experienced in agile development, cross-functional team leadership, product roadmap execution, stakeholder management, code review standards, sprint planning, and architecture governance.",
  },
];

export default function Dashboard() {
  const toast = useToast();
  const location = useLocation();
  const navState = location.state || {};
  const { activeResume, activeFileName, activeAnalysis, setActiveResume } = useResume();
  const { user } = useAuth();

  // Core resume state - prioritize explicit navState, then global active resume
  const [resume, setResume] = useState(navState.resume || activeResume || null);
  const [fileName, setFileName] = useState(navState.fileName || activeFileName || "Uploaded_Resume.pdf");
  const initialAnalysis = navState.savedAnalysis || activeAnalysis || null;

  // Selected AI Model
  const [currentModel, setCurrentModel] = useState(
    () => localStorage.getItem("ai_selected_model") || "qwen2.5:0.5b"
  );

  // Active Tab & Monolithic Filter Navigation
  const [activeTab, setActiveTab] = useState(navState.targetTab || "overview");
  const [navCategory, setNavCategory] = useState("all"); // 'all' | 'ats' | 'content' | 'career' | 'interview'
  const [navSearch, setNavSearch] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (navState.targetTab) {
      setActiveTab(navState.targetTab);
    }
  }, [navState.targetTab]);


  // Sample presets
  const [sampleData, setSampleData] = useState(null);

  // ATS Analysis State
  const [jobDescription, setJobDescription] = useState(initialAnalysis?.jobDescription || "");
  const [atsResult, setAtsResult] = useState(initialAnalysis || null);
  const [atsLoading, setAtsLoading] = useState(false);
  const [atsError, setAtsError] = useState("");

  // What-If? Score Booster Simulator State
  const [simulatedSkills, setSimulatedSkills] = useState([]);

  // ATS Resume Visual Preview Theme
  const [resumeTemplateTheme, setResumeTemplateTheme] = useState("modern"); // 'modern' | 'white' | 'academic'

  // AI Deep Review
  const [aiReview, setAiReview] = useState(initialAnalysis?.aiAnalysis || null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  // AI Resume Tailor Studio
  const [tailorResult, setTailorResult] = useState(null);
  const [tailorLoading, setTailorLoading] = useState(false);
  const [targetRole, setTargetRole] = useState("Software Engineer");

  // Cover Letter
  const [coverLetterResult, setCoverLetterResult] = useState(null);
  const [coverLoading, setCoverLoading] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [coverTone, setCoverTone] = useState("Professional & Authoritative");

  // Interview Prep & Simulator
  const [interviewPrep, setInterviewPrep] = useState(null);
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [userAnswerText, setUserAnswerText] = useState("");
  const [gradeResult, setGradeResult] = useState(null);
  const [gradingLoading, setGradingLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Interview 2-Minute Practice Timer
  const [timerSeconds, setTimerSeconds] = useState(120);
  const [timerRunning, setTimerRunning] = useState(false);

  // Salary Estimator & Currency Conversion
  const [salaryData, setSalaryData] = useState(null);
  const [salaryLoading, setSalaryLoading] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const CURRENCIES = {
    USD: { symbol: "$", rate: 1, label: "USD ($)" },
    EUR: { symbol: "€", rate: 0.92, label: "EUR (€)" },
    GBP: { symbol: "£", rate: 0.78, label: "GBP (£)" },
    INR: { symbol: "₹", rate: 84.2, label: "INR (₹)" },
  };

  // Formatting Audit
  const [auditData, setAuditData] = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);

  // Multi-Job Battle
  const [multiJobData, setMultiJobData] = useState(null);
  const [multiLoading, setMultiLoading] = useState(false);
  const [customJobTitle, setCustomJobTitle] = useState("");
  const [customJobText, setCustomJobText] = useState("");
  const [customJobsList, setCustomJobsList] = useState([]);

  // Career Coach Chat
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I am your Obsidian AI Career Strategist. Ask me anything about tailoring your resume, STAR bullet points, salary negotiation, or technical interview prep.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);

  // Candidate Head-to-Head Battle State
  const [battleResult, setBattleResult] = useState(null);
  const [battleLoading, setBattleLoading] = useState(false);
  const [selectedOpponentId, setSelectedOpponentId] = useState("");

  // LinkedIn & Cold Outreach Pitches State
  const [outreachPitches, setOutreachPitches] = useState(null);
  const [outreachLoading, setOutreachLoading] = useState(false);
  const [outreachCompany, setOutreachCompany] = useState("");
  const [outreachManager, setOutreachManager] = useState("");

  // Inline Resume Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editSkills, setEditSkills] = useState([]);
  const [newSkillInput, setNewSkillInput] = useState("");
  const [editExperienceText, setEditExperienceText] = useState("");
  const [editEducationText, setEditEducationText] = useState("");
  const [editProjectsText, setEditProjectsText] = useState("");

  // STAR Bullet Enhancer Studio State
  const [bulletInput, setBulletInput] = useState("");
  const [bulletTargetRole, setBulletTargetRole] = useState("Software Engineer");
  const [bulletResult, setBulletResult] = useState(null);
  const [bulletLoading, setBulletLoading] = useState(false);
  const [bulletApplied, setBulletApplied] = useState(false);

  // 30-Day Skill Gap Acceleration Roadmap State
  const [roadmapData, setRoadmapData] = useState(null);
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [roadmapApplied, setRoadmapApplied] = useState(false);

  // LinkedIn Profile Optimizer State
  const [linkedinData, setLinkedinData] = useState(null);
  const [linkedinLoading, setLinkedinLoading] = useState(false);

  // Live ATS Keyword Heatmap Highlight State
  const [highlightHeatmap, setHighlightHeatmap] = useState(false);

  // Application Pipeline (Kanban / CRM) State
  const [applications, setApplications] = useState([]);
  const [pipelineLoading, setPipelineLoading] = useState(false);
  const [pipelineLoaded, setPipelineLoaded] = useState(false);
  const [showNewAppForm, setShowNewAppForm] = useState(false);
  const [newAppCompany, setNewAppCompany] = useState("");
  const [newAppRole, setNewAppRole] = useState("");
  const [newAppStatus, setNewAppStatus] = useState("Wishlist");
  const [newAppSalary, setNewAppSalary] = useState("");
  const [newAppNotes, setNewAppNotes] = useState("");

  // Power Bullet Booster State
  const [powerBulletData, setPowerBulletData] = useState(null);
  const [powerBulletLoading, setPowerBulletLoading] = useState(false);
  const [powerBulletInput, setPowerBulletInput] = useState(
    "Responsible for developing frontend features using React and assisting team members with bugs."
  );
  const [powerBulletSkill, setPowerBulletSkill] = useState("React & Node.js");
  const [powerBulletRole, setPowerBulletRole] = useState("Senior Full-Stack Engineer");
  const [bulletInjectSuccess, setBulletInjectSuccess] = useState(false);

  // Skill Gap Screening Quiz State
  const [quizData, setQuizData] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [userQuizAnswers, setUserQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Multi-Format Export Studio State
  const [exportFormat, setExportFormat] = useState("latex"); // 'latex' | 'markdown' | 'txt' | 'json'

  // 1. AI Career Trajectory & Promotion Velocity Forecaster State
  const [careerTrajectoryData, setCareerTrajectoryData] = useState(null);
  const [careerTrajectoryLoading, setCareerTrajectoryLoading] = useState(false);

  // 2. AI STAR Behavioral Story Bank State
  const [starStoriesData, setStarStoriesData] = useState(null);
  const [starStoriesLoading, setStarStoriesLoading] = useState(false);
  const [activeStarStoryId, setActiveStarStoryId] = useState(1);

  // 3. AI Resume De-Biasing & Blind Screening Audit State
  const [debiasData, setDebiasData] = useState(null);
  const [debiasLoading, setDebiasLoading] = useState(false);

  // 4. AI Executive Bio & Persona Studio State
  const [executiveBioData, setExecutiveBioData] = useState(null);
  const [executiveBioLoading, setExecutiveBioLoading] = useState(false);
  const [activeBioFormat, setActiveBioFormat] = useState("phone"); // 'phone' | 'linkedin' | 'executive' | 'github' | 'founder'

  // 5. AI 7-Day High-Stakes Interview Bootcamp Sprint State
  const [interviewSprintData, setInterviewSprintData] = useState(null);
  const [interviewSprintLoading, setInterviewSprintLoading] = useState(false);
  const [activeSprintDay, setActiveSprintDay] = useState(1);

  // 6. AI Resume Localization & Global Market Adapter State
  const [localizedResumeData, setLocalizedResumeData] = useState(null);
  const [localizedResumeLoading, setLocalizedResumeLoading] = useState(false);
  const [targetCountry, setTargetCountry] = useState("US"); // 'US' | 'UK_EU' | 'UAE' | 'APAC'

  // Sync selected model from OllamaBadge event
  useEffect(() => {
    function handleModelChange(e) {
      if (e.detail) {
        setCurrentModel(e.detail);
      }
    }
    window.addEventListener("ai_model_changed", handleModelChange);
    return () => window.removeEventListener("ai_model_changed", handleModelChange);
  }, []);

  // Interview Timer Countdown Effect
  useEffect(() => {
    let interval = null;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  // Trigger ATS analysis
  async function handleRunAts(customJd = null, customResume = null) {
    const resumeToUse = customResume || resume;
    const jdToUse = (typeof customJd === "string" ? customJd : jobDescription).trim();
    if (!jdToUse || atsLoading || !resumeToUse) return;

    setAtsLoading(true);
    setAtsError("");
    setSimulatedSkills([]);
    try {
      const data = await analyzeAts(resumeToUse, jdToUse, fileName);
      setAtsResult(data);
      handleRunAudit(resumeToUse);
      handleRunSalary(jdToUse, resumeToUse);
    } catch (err) {
      setAtsError(getErrorMessage(err));
    } finally {
      setAtsLoading(false);
    }
  }

  // Handle 1-click ATS Rule Checklist Auto-Fixes
  function handleApplyRuleFix(rule) {
    if (!rule || !rule.autoFixPayload || !resume) return;
    const { field, suggestion, missing, sample } = rule.autoFixPayload;

    if (field === "skills" && Array.isArray(missing) && missing.length > 0) {
      const currentSkills = Array.isArray(resume.skills) ? [...resume.skills] : [];
      missing.forEach((sk) => {
        if (!currentSkills.some((s) => s.toLowerCase() === sk.toLowerCase())) {
          currentSkills.push(sk);
        }
      });
      const updated = { ...resume, skills: currentSkills };
      setResume(updated);
      handleRunAts(jobDescription, updated);
    } else if (field === "summary" && suggestion) {
      const currentFull = resume.full_text || "";
      const updatedText = `SUMMARY\n${suggestion}\n\n${currentFull}`;
      const updated = { ...resume, full_text: updatedText, summary: suggestion };
      setResume(updated);
      handleRunAts(jobDescription, updated);
    } else if (field === "links" && suggestion) {
      const currentFull = resume.full_text || "";
      const updatedText = `${currentFull}\n\nLINKS: ${suggestion}`;
      const updated = { ...resume, full_text: updatedText };
      setResume(updated);
      handleRunAts(jobDescription, updated);
    } else if (field === "metrics" && sample) {
      const currentExp = Array.isArray(resume.experience) ? [...resume.experience] : [];
      if (currentExp.length > 0) {
        currentExp[0] = `${currentExp[0]} (Achievement: ${sample})`;
      } else {
        currentExp.push(sample);
      }
      const updated = { ...resume, experience: currentExp };
      setResume(updated);
      handleRunAts(jobDescription, updated);
    } else if (field === "buzzwords") {
      let cleanText = resume.full_text || "";
      (rule.autoFixPayload.found || []).forEach((bw) => {
        const regex = new RegExp(`\\b${bw}\\b`, "gi");
        cleanText = cleanText.replace(regex, "high-impact technical contributor");
      });
      const updated = { ...resume, full_text: cleanText };
      setResume(updated);
      handleRunAts(jobDescription, updated);
    }
  }

  // Fetch samples on mount and auto-trigger initial analysis
  useEffect(() => {
    getSampleResumesAndJobs()
      .then((data) => {
        setSampleData(data);
        const resolvedResume = resume || activeResume || (data.resumes && data.resumes.length > 0 ? data.resumes[0].data : null);
        const resolvedFileName = fileName || activeFileName || (data.resumes && data.resumes.length > 0 ? `${data.resumes[0].name.replace(/\s+/g, "_")}.pdf` : "Resume.pdf");

        if (!resume && resolvedResume) {
          setResume(resolvedResume);
          setFileName(resolvedFileName);
          setActiveResume(resolvedResume, resolvedFileName);
        }

        if (resolvedResume) {
          if (!initialAnalysis && data.jobDescriptions && data.jobDescriptions.length > 0) {
            const defaultJd = data.jobDescriptions[0].text;
            setJobDescription(defaultJd);
            handleRunAts(defaultJd, resolvedResume);
          } else {
            handleRunAudit(resolvedResume);
            if (jobDescription) {
              handleRunSalary(jobDescription, resolvedResume);
            }
          }
        }
      })
      .catch((err) => {
        console.warn("Sample data fetch error:", err);
        const currentResume = resume || activeResume;
        if (currentResume) {
          handleRunAudit(currentResume);
        }
      });
  }, []);

  // Trigger AI Deep Review
  async function handleRunAiReview() {
    if (!atsResult || aiLoading || !resume) return;
    setAiLoading(true);
    setAiError("");
    try {
      const data = await analyzeWithAi(resume, jobDescription, atsResult.analysisId, currentModel);
      setAiReview(data.insights);
    } catch (err) {
      setAiError(getErrorMessage(err));
    } finally {
      setAiLoading(false);
    }
  }

  // Trigger Resume Tailor
  async function handleRunTailor() {
    if (!resume || tailorLoading) return;
    setTailorLoading(true);
    try {
      const data = await tailorResumeWithAi({
        resume,
        jobDescription: jobDescription || "Modern software engineering position with emphasis on system design and APIs",
        targetRole,
        model: currentModel,
      });
      setTailorResult(data);
    } catch (err) {
      alert(`Tailoring failed: ${getErrorMessage(err)}`);
    } finally {
      setTailorLoading(false);
    }
  }

  // Trigger Cover Letter
  async function handleRunCoverLetter() {
    if (!resume || coverLoading) return;
    setCoverLoading(true);
    try {
      const data = await generateCoverLetterWithAi({
        resume,
        jobDescription: jobDescription || "Target software role",
        companyName: companyName || "Target Company",
        tone: coverTone,
        targetRole,
        model: currentModel,
      });
      setCoverLetterResult(data);
    } catch (err) {
      alert(`Cover letter generation error: ${getErrorMessage(err)}`);
    } finally {
      setCoverLoading(false);
    }
  }

  // Trigger Interview Prep
  async function handleRunInterviewPrep() {
    if (!resume || interviewLoading) return;
    setInterviewLoading(true);
    try {
      const data = await generateInterviewPrepWithAi({
        resume,
        jobDescription: jobDescription || "Target technical role",
        targetRole,
        model: currentModel,
      });
      setInterviewPrep(data);
      if (data.questions && data.questions.length > 0) {
        setActiveQuestion(data.questions[0]);
      }
    } catch (err) {
      alert(`Interview prep error: ${getErrorMessage(err)}`);
    } finally {
      setInterviewLoading(false);
    }
  }

  // Grade Mock Answer
  async function handleGradeAnswer() {
    if (!activeQuestion || !userAnswerText.trim() || gradingLoading) return;
    setGradingLoading(true);
    try {
      const data = await gradeInterviewAnswerWithAi({
        question: activeQuestion.question,
        userAnswer: userAnswerText,
        resume,
        jobDescription,
        model: currentModel,
      });
      setGradeResult(data);
    } catch (err) {
      alert(`Grading failed: ${getErrorMessage(err)}`);
    } finally {
      setGradingLoading(false);
    }
  }

  // Speech: Speak Question Aloud
  function handleSpeakQuestion(text) {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported by your browser.");
      return;
    }
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  // Speech: Dictate Answer with Microphone
  function handleStartVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input requires a browser supporting Web Speech API (like Chrome or Edge).");
      return;
    }
    if (isRecording) {
      setIsRecording(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setUserAnswerText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      setIsRecording(false);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognition.start();
  }

  function handleLoadSampleAnswer() {
    if (!activeQuestion) return;
    const sample = `In my previous role, I was tasked with optimizing our core API services which were suffering from high latency under peak traffic (Situation & Task). I spearheaded the redesign of our caching layer using Redis and restructured database queries in PostgreSQL with targeted indexes (Action). As a result, we reduced endpoint response times by 68% and achieved 99.98% uptime while saving approximately $14,000 monthly in compute overhead (Result).`;
    setUserAnswerText(sample);
  }

  // Salary Estimator
  async function handleRunSalary(customJd = null, customResume = null) {
    const resumeToUse = customResume || resume;
    if (!resumeToUse) return;
    setSalaryLoading(true);
    try {
      const data = await getSalaryEstimateWithAi({
        resume: resumeToUse,
        jobDescription: customJd || jobDescription,
      });
      setSalaryData(data);
    } catch (err) {
      console.warn("Salary error:", err);
    } finally {
      setSalaryLoading(false);
    }
  }

  // Currency Converter Formatter
  function formatSalaryAmount(usdAmount) {
    if (!usdAmount) return "$0";
    const cur = CURRENCIES[currency] || CURRENCIES.USD;
    const converted = Math.round(usdAmount * cur.rate);
    return `${cur.symbol}${converted.toLocaleString()}`;
  }

  // Formatting Audit
  async function handleRunAudit(customResume = null) {
    const resumeToUse = customResume || resume;
    if (!resumeToUse) return;
    setAuditLoading(true);
    try {
      const data = await auditResumeFormat(resumeToUse);
      setAuditData(data);
    } catch (err) {
      console.warn("Audit error:", err);
    } finally {
      setAuditLoading(false);
    }
  }

  // Multi-Job Battle
  async function handleRunMultiMatch(additionalJobs = []) {
    if (!resume) return;
    const baseJds = sampleData?.jobDescriptions || [];
    const allJds = [...baseJds, ...customJobsList, ...additionalJobs];
    if (allJds.length === 0) return;

    setMultiLoading(true);
    try {
      const data = await multiMatchJobsWithAts(resume, allJds);
      setMultiJobData(data);
      toast.success("Battle Matrix Complete", `Evaluated candidate against ${allJds.length} job archetypes.`);
    } catch (err) {
      toast.error("Multi-Match Failed", getErrorMessage(err));
    } finally {
      setMultiLoading(false);
    }
  }

  function handleAddCustomJob() {
    if (!customJobTitle.trim() || !customJobText.trim()) return;
    const newJd = {
      id: `custom-${Date.now()}`,
      title: customJobTitle.trim(),
      company: "Custom Target",
      text: customJobText.trim(),
    };
    const updated = [...customJobsList, newJd];
    setCustomJobsList(updated);
    setCustomJobTitle("");
    setCustomJobText("");
    handleRunMultiMatch([newJd]);
  }

  // Career Coach Chat
  async function handleSendMessage(e) {
    if (e) e.preventDefault();
    if (!chatInput.trim() || chatSending) return;

    const userMsg = chatInput.trim();
    setChatInput("");
    const newHistory = [...messages, { role: "user", content: userMsg }];
    setMessages(newHistory);
    setChatSending(true);

    try {
      const reply = await chatWithAi(resume, jobDescription, userMsg, newHistory, currentModel);
      setMessages([...newHistory, { role: "assistant", content: reply.reply }]);
    } catch (err) {
      setMessages([
        ...newHistory,
        { role: "assistant", content: `AI Error: ${getErrorMessage(err)}` },
      ]);
    } finally {
      setChatSending(false);
    }
  }

  // Candidate Head-to-Head Comparison Battle
  async function handleRunBattle(customOpponent = null) {
    if (!resume || battleLoading) return;
    const opponent =
      customOpponent ||
      sampleData?.resumes?.find((r) => r.id !== (resume?.id || ""))?.data ||
      sampleData?.resumes?.[1]?.data ||
      sampleData?.resumes?.[0]?.data;
    if (!opponent) return;

    setBattleLoading(true);
    try {
      const data = await compareCandidatesWithAi(
        resume,
        opponent,
        jobDescription || "Full Stack Engineer with system design, API, and cloud infrastructure experience.",
        currentModel
      );
      setBattleResult(data);
      toast.success("Head-to-Head Evaluated", "Comparative evaluation matrix is ready.");
    } catch (err) {
      toast.error("Candidate Comparison Failed", getErrorMessage(err));
    } finally {
      setBattleLoading(false);
    }
  }

  // AI LinkedIn & Cold Outreach Pitches
  async function handleRunOutreach() {
    if (!resume || outreachLoading) return;
    setOutreachLoading(true);
    try {
      const data = await generateOutreachPitchWithAi({
        resume,
        jobDescription: jobDescription || "Modern engineering position",
        companyName: outreachCompany || "the hiring team",
        managerName: outreachManager || "Hiring Manager",
        model: currentModel,
      });
      setOutreachPitches(data);
      toast.success("Outreach Pitches Ready", "Generated customized cold pitches and LinkedIn inmails.");
    } catch (err) {
      toast.error("Outreach Generation Failed", getErrorMessage(err));
    } finally {
      setOutreachLoading(false);
    }
  }

  // Live Interactive STAR Bullet Enhancer
  async function handleImproveBullet() {
    if (!bulletInput.trim() || bulletLoading) return;
    setBulletLoading(true);
    setBulletApplied(false);
    try {
      const data = await improveBulletWithAi(bulletInput.trim(), bulletTargetRole, currentModel);
      setBulletResult(data);
      toast.success("STAR Enhancer Complete", "Impactful action-oriented rewrites generated.");
    } catch (err) {
      toast.error("Bullet Enhancement Failed", getErrorMessage(err));
    } finally {
      setBulletLoading(false);
    }
  }

  function handleApplyEnhancedBullet(originalText, improvedText) {
    if (!resume || !improvedText) return;
    const updated = JSON.parse(JSON.stringify(resume));
    let applied = false;
    if (Array.isArray(updated.experience)) {
      for (const exp of updated.experience) {
        if (Array.isArray(exp.bullets)) {
          const idx = exp.bullets.findIndex((b) => b && b.trim() === (originalText || "").trim());
          if (idx !== -1) {
            exp.bullets[idx] = improvedText;
            applied = true;
            break;
          }
        }
      }
      if (!applied && updated.experience.length > 0) {
        if (!Array.isArray(updated.experience[0].bullets)) {
          updated.experience[0].bullets = [];
        }
        updated.experience[0].bullets.unshift(improvedText);
        applied = true;
      }
    }
    setResume(updated);
    setBulletApplied(true);
    setTimeout(() => setBulletApplied(false), 3000);
    handleRunAudit(updated);
  }

  // 30-Day Skill Gap Acceleration Roadmap
  async function handleRunRoadmap() {
    if (!resume || roadmapLoading) return;
    setRoadmapLoading(true);
    try {
      const data = await getLearningRoadmapWithAi({
        resume,
        jobDescription: jobDescription || "Target Software Engineering Role",
        missingSkills: atsResult?.missingKeywords || [],
        model: currentModel,
      });
      setRoadmapData(data);
      toast.success("Learning Roadmap Generated", "30-Day skill gap acceleration roadmap is ready.");
    } catch (err) {
      toast.error("Roadmap Failed", getErrorMessage(err));
    } finally {
      setRoadmapLoading(false);
    }
  }

  function handleApplyRoadmapBullet(bulletText) {
    if (!resume || !bulletText) return;
    handleApplyEnhancedBullet("", bulletText);
    setRoadmapApplied(true);
    setTimeout(() => setRoadmapApplied(false), 3000);
  }

  // LinkedIn Profile Suite
  async function handleRunLinkedIn() {
    if (!resume || linkedinLoading) return;
    setLinkedinLoading(true);
    try {
      const data = await getLinkedInProfileWithAi({
        resume,
        targetRole,
        model: currentModel,
      });
      setLinkedinData(data);
      toast.success("LinkedIn Optimization Ready", "Headline, About summary, and skills recommendations generated.");
    } catch (err) {
      toast.error("LinkedIn Optimization Failed", getErrorMessage(err));
    } finally {
      setLinkedinLoading(false);
    }
  }

  // ========================================================
  // APPLICATION PIPELINE (CRM / KANBAN) HANDLERS
  // ========================================================
  async function loadApplications() {
    setPipelineLoading(true);
    try {
      const res = await listJobApplications(100);
      if (res.applications && res.applications.length > 0) {
        setApplications(res.applications);
      } else {
        // Auto-seed if empty
        const seedRes = await seedJobApplications();
        const refreshed = await listJobApplications(100);
        setApplications(refreshed.applications || []);
      }
      setPipelineLoaded(true);
    } catch (err) {
      console.warn("Could not load applications pipeline:", err.message);
    } finally {
      setPipelineLoading(false);
    }
  }

  async function handleCreateApp(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!newAppCompany.trim() || !newAppRole.trim()) {
      alert("Please provide both Company and Role.");
      return;
    }
    setPipelineLoading(true);
    try {
      const res = await createJobApplication({
        candidateName: resume?.contact?.name || "Candidate",
        company: newAppCompany.trim(),
        role: newAppRole.trim(),
        status: newAppStatus,
        salaryEstimate: newAppSalary.trim() || "$130,000 - $170,000",
        notes: newAppNotes.trim(),
        atsScore: atsResult?.atsScore || 85,
        appliedDate: new Date().toISOString().split("T")[0],
      });
      if (res.application) {
        setApplications((prev) => [res.application, ...prev]);
        setNewAppCompany("");
        setNewAppRole("");
        setNewAppSalary("");
        setNewAppNotes("");
        setShowNewAppForm(false);
      }
    } catch (err) {
      alert("Error tracking application: " + getErrorMessage(err));
    } finally {
      setPipelineLoading(false);
    }
  }

  async function handleQuickTrackCurrentJob() {
    const comp = companyName.trim() || "Target Company";
    const role = targetRole.trim() || "Software Engineer";
    setPipelineLoading(true);
    try {
      const res = await createJobApplication({
        candidateName: resume?.contact?.name || "Candidate",
        company: comp,
        role: role,
        status: "Applied",
        salaryEstimate: salaryData?.estimatedRange?.formatted ? salaryData.estimatedRange.formatted + " USD" : "$140,000 - $180,000",
        atsScore: atsResult?.atsScore || 88,
        notes: "Target job analyzed with ATS match score of " + (atsResult?.atsScore || 88) + "% (" + (atsResult?.skillMatch || 80) + "% skill match).",
        appliedDate: new Date().toISOString().split("T")[0],
      });
      if (res.application) {
        setApplications((prev) => [res.application, ...prev]);
        setActiveTab("pipeline");
        alert("Tracked '" + role + " @ " + comp + "' into your Pipeline under 'Applied'!");
      }
    } catch (err) {
      alert("Error adding application: " + getErrorMessage(err));
    } finally {
      setPipelineLoading(false);
    }
  }

  async function handleMoveAppStatus(appId, newStatus) {
    try {
      await updateJobApplication(appId, { status: newStatus });
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
      );
    } catch (err) {
      alert("Could not update status: " + getErrorMessage(err));
    }
  }

  async function handleDeleteApp(appId) {
    if (!window.confirm("Delete this tracked application?")) return;
    try {
      await deleteJobApplication(appId);
      setApplications((prev) => prev.filter((a) => a.id !== appId));
    } catch (err) {
      alert("Could not delete application: " + getErrorMessage(err));
    }
  }

  // ========================================================
  // POWER BULLET BOOSTER HANDLERS
  // ========================================================
  async function handleRunPowerBullet() {
    if (!powerBulletInput.trim() || powerBulletLoading) return;
    setPowerBulletLoading(true);
    try {
      const data = await getPowerBulletsWithAi({
        bullet: powerBulletInput,
        role: powerBulletRole,
        skill: powerBulletSkill,
        model: currentModel,
      });
      setPowerBulletData(data);
    } catch (err) {
      alert("Power Bullet error: " + getErrorMessage(err));
    } finally {
      setPowerBulletLoading(false);
    }
  }

  function handleInjectBullet(bulletText) {
    if (!resume || !bulletText) return;
    handleApplyEnhancedBullet("", bulletText);
    setBulletInjectSuccess(true);
    setTimeout(() => setBulletInjectSuccess(false), 3000);
  }

  // ========================================================
  // SKILL GAP ASSESSMENT QUIZ HANDLERS
  // ========================================================
  async function handleRunQuiz() {
    if (quizLoading) return;
    setQuizLoading(true);
    setUserQuizAnswers({});
    setQuizSubmitted(false);
    try {
      const missing = atsResult?.missingKeywords && atsResult.missingKeywords.length > 0
        ? atsResult.missingKeywords.slice(0, 4)
        : ["PostgreSQL", "Docker", "System Architecture", "Redis"];
      const data = await getSkillsQuizWithAi({
        skills: missing,
        role: targetRole,
        model: currentModel,
      });
      setQuizData(data);
    } catch (err) {
      alert("Quiz generator error: " + getErrorMessage(err));
    } finally {
      setQuizLoading(false);
    }
  }

  function handleSelectQuizOption(qId, optIdx) {
    if (quizSubmitted) return;
    setUserQuizAnswers((prev) => ({ ...prev, [qId]: optIdx }));
  }

  function handleSubmitQuiz() {
    if (!quizData?.questions) return;
    setQuizSubmitted(true);
  }

  function handleResetQuiz() {
    setUserQuizAnswers({});
    setQuizSubmitted(false);
  }

  // ========================================================
  // 1. AI CAREER TRAJECTORY & PROMOTION VELOCITY HANDLERS
  // ========================================================
  async function handleRunCareerTrajectory(customRole = null, customResume = null) {
    const resumeToUse = customResume || resume;
    if (!resumeToUse || careerTrajectoryLoading) return;
    setCareerTrajectoryLoading(true);
    try {
      const data = await getCareerTrajectoryWithAi({
        resume: resumeToUse,
        jobDescription,
        targetRole: customRole || targetRole,
        model: currentModel,
      });
      setCareerTrajectoryData(data);
    } catch (err) {
      alert("Career Trajectory error: " + getErrorMessage(err));
    } finally {
      setCareerTrajectoryLoading(false);
    }
  }

  // ========================================================
  // 2. AI STAR BEHAVIORAL STORY BANK HANDLERS
  // ========================================================
  async function handleRunStarStories(customResume = null) {
    const resumeToUse = customResume || resume;
    if (!resumeToUse || starStoriesLoading) return;
    setStarStoriesLoading(true);
    try {
      const data = await getStarStoryBankWithAi({
        resume: resumeToUse,
        jobDescription,
        targetRole,
        model: currentModel,
      });
      setStarStoriesData(data);
      if (data?.stories && data.stories.length > 0) {
        setActiveStarStoryId(data.stories[0].id);
      }
      toast.success("STAR Stories Ready", "Behavioral story bank generated with situation, task, action, and results.");
    } catch (err) {
      toast.error("STAR Stories Failed", getErrorMessage(err));
    } finally {
      setStarStoriesLoading(false);
    }
  }

  // ========================================================
  // 3. AI RESUME DE-BIASING & BLIND SCREENING HANDLERS
  // ========================================================
  async function handleRunDebiasAudit(customResume = null) {
    const resumeToUse = customResume || resume;
    if (!resumeToUse || debiasLoading) return;
    setDebiasLoading(true);
    try {
      const data = await getDebiasAuditWithAi({
        resume: resumeToUse,
        model: currentModel,
      });
      setDebiasData(data);
      toast.success("De-Biasing Audit Complete", "Blind screening report and demographic neutralizer evaluated.");
    } catch (err) {
      toast.error("De-Biasing Audit Failed", getErrorMessage(err));
    } finally {
      setDebiasLoading(false);
    }
  }

  // ========================================================
  // 4. AI EXECUTIVE BIO & PERSONA STUDIO HANDLERS
  // ========================================================
  async function handleRunExecutiveBio(customRole = null, customResume = null) {
    const resumeToUse = customResume || resume;
    if (!resumeToUse || executiveBioLoading) return;
    setExecutiveBioLoading(true);
    try {
      const data = await getExecutiveBioWithAi({
        resume: resumeToUse,
        targetRole: customRole || targetRole,
        model: currentModel,
      });
      setExecutiveBioData(data);
      toast.success("Executive Bio Ready", "Persona bios created across 5 professional formats.");
    } catch (err) {
      toast.error("Executive Bio Failed", getErrorMessage(err));
    } finally {
      setExecutiveBioLoading(false);
    }
  }

  // ========================================================
  // 5. AI 7-DAY INTERVIEW BOOTCAMP SPRINT HANDLERS
  // ========================================================
  async function handleRunInterviewSprint(customRole = null, customResume = null, customJd = null) {
    const resumeToUse = customResume || resume;
    if (!resumeToUse || interviewSprintLoading) return;
    setInterviewSprintLoading(true);
    try {
      const data = await getInterviewSprintWithAi({
        resume: resumeToUse,
        jobDescription: customJd || jobDescription,
        targetRole: customRole || targetRole,
        model: currentModel,
      });
      setInterviewSprintData(data);
      toast.success("7-Day Sprint Blueprint Ready", "Daily high-stakes interview curriculum generated.");
    } catch (err) {
      toast.error("Interview Sprint Failed", getErrorMessage(err));
    } finally {
      setInterviewSprintLoading(false);
    }
  }

  // ========================================================
  // 6. AI RESUME LOCALIZATION & GLOBAL MARKET HANDLERS
  // ========================================================
  async function handleRunLocalizedResume(countryToUse = null, customRole = null, customResume = null) {
    const resumeToUse = customResume || resume;
    if (!resumeToUse || localizedResumeLoading) return;
    const country = countryToUse || targetCountry;
    setLocalizedResumeLoading(true);
    try {
      const data = await getLocalizeResumeWithAi({
        resume: resumeToUse,
        targetCountry: country,
        targetRole: customRole || targetRole,
        model: currentModel,
      });
      setLocalizedResumeData(data);
      toast.success("Global Adaptation Complete", `Localized resume standards formatted for ${country}.`);
    } catch (err) {
      toast.error("Resume Localization Failed", getErrorMessage(err));
    } finally {
      setLocalizedResumeLoading(false);
    }
  }

  // ========================================================
  // MULTI-FORMAT EXPORT GENERATORS
  // ========================================================
  function generateLatexCode() {
    const name = resume?.contact?.name || "Jordan Vance";
    const email = resume?.contact?.email || "candidate@example.com";
    const phone = resume?.contact?.phone || "+1 (555) 000-0000";
    const skillsList = (resume?.skills || ["React", "TypeScript", "Node.js", "PostgreSQL", "Docker"]).join(", ");

    return `\\documentclass[letterpaper,10pt]{article}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}

\\pagestyle{fancy}
\\fancyhf{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}
\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

\\begin{document}

\\begin{center}
    \\textbf{\\Huge \\scshape ${name}} \\\\ \\vspace{1pt}
    \\small ${phone} $|$ \\href{mailto:${email}}{\\underline{${email}}} $|$ 
    \\href{https://linkedin.com}{\\underline{linkedin.com}} $|$
    \\href{https://github.com}{\\underline{github.com}}
\\end{center}

\\section{Technical Skills}
\\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
     \\textbf{Core Competencies}{: ${skillsList}} \\\\
     \\textbf{Architecture}{: Distributed Systems, REST APIs, Microservices, CI/CD, Containerization} \\\\
     \\textbf{Cloud \\& Tools}{: AWS, Docker, Kubernetes, Git, PostgreSQL, Redis, Linux}
    }}
\\end{itemize}

\\section{Experience}
\\begin{itemize}[leftmargin=0.15in, label={}]
${(resume?.experience || [
  { role: "Senior Software Engineer", company: "Horizon Cloud", date: "2021 -- Present", bullets: ["Architected distributed microservices handling 4.2M daily transactions with 99.98\\% uptime.", "Spearheaded PostgreSQL database indexing and query optimization, reducing p99 latency by 45\\%."] }
]).map(e => `  \\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{${typeof e === "string" ? e : e.role || "Software Engineer"}} & \\textbf{${e.date || "2021 -- Present"}} \\\\
      \\textit{\\small ${typeof e === "string" ? "Engineering Co" : e.company || "Enterprise Corp"}} & \\textit{\\small San Francisco, CA} \\\\
    \\end{tabular*}\\vspace{-6pt}
    \\begin{itemize}
${(Array.isArray(e.bullets) ? e.bullets : [typeof e === "string" ? e : "Engineered robust software components ensuring high reliability."]).map(b => `      \\item \\small{${b}}`).join("\n")}
    \\end{itemize}`).join("\n")}
\\end{itemize}

\\section{Education}
\\begin{itemize}[leftmargin=0.15in, label={}]
${(resume?.education || ["B.S. in Computer Science -- Top University (2018)"]).map(ed => `  \\item
    \\textbf{${typeof ed === "string" ? ed : ed.school || "University"}} \\\\
    \\textit{\\small ${typeof ed === "string" ? "Degree Completed" : ed.degree || "Bachelor of Science"}}`).join("\n")}
\\end{itemize}

\\end{document}`;
  }

  function generateMarkdownCode() {
    const name = resume?.contact?.name || "Jordan Vance";
    const email = resume?.contact?.email || "candidate@example.com";
    const phone = resume?.contact?.phone || "+1 (555) 000-0000";
    const skills = (resume?.skills || []).join(" • ");

    let md = `# ${name}\n\n`;
    md += `**Email:** ${email} | **Phone:** ${phone} | **Role:** ${targetRole}\n\n`;
    md += `---\n\n## Technical Skills Matrix\n\n${skills}\n\n`;
    md += `## Professional Experience\n\n`;
    (resume?.experience || []).forEach((e) => {
      if (typeof e === "string") {
        md += `- ${e}\n`;
      } else {
        md += `### ${e.role || "Software Engineer"} — ${e.company || "Tech Co"}\n`;
        (e.bullets || []).forEach((b) => {
          md += `- ${b}\n`;
        });
        md += `\n`;
      }
    });
    md += `## Education\n\n`;
    (resume?.education || []).forEach((ed) => {
      md += `- ${typeof ed === "string" ? ed : ed.degree + " (" + ed.school + ")"}\n`;
    });
    return md;
  }

  function generatePlainTxtCode() {
    const name = resume?.contact?.name || "Jordan Vance";
    const email = resume?.contact?.email || "candidate@example.com";
    const phone = resume?.contact?.phone || "+1 (555) 000-0000";

    let txt = `======================================================================\n`;
    txt += `${name.toUpperCase()}\n`;
    txt += `Contact: ${email} | ${phone}\n`;
    txt += `Target:  ${targetRole}\n`;
    txt += `======================================================================\n\n`;
    txt += `[TECHNICAL SKILLS]\n`;
    (resume?.skills || []).forEach((s) => {
      txt += `• ${s}\n`;
    });
    txt += `\n[PROFESSIONAL EXPERIENCE]\n`;
    (resume?.experience || []).forEach((e) => {
      if (typeof e === "string") {
        txt += `* ${e}\n\n`;
      } else {
        txt += `* ${e.role || "Engineer"} at ${e.company || "Company"}\n`;
        (e.bullets || []).forEach((b) => {
          txt += `  - ${b}\n`;
        });
        txt += `\n`;
      }
    });
    txt += `[EDUCATION]\n`;
    (resume?.education || []).forEach((ed) => {
      txt += `• ${typeof ed === "string" ? ed : ed.degree + " - " + ed.school}\n`;
    });
    return txt;
  }

  function generateJsonResumeCode() {
    return JSON.stringify(
      {
        $schema: "https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json",
        basics: {
          name: resume?.contact?.name || "Candidate",
          label: targetRole,
          email: resume?.contact?.email || "",
          phone: resume?.contact?.phone || "",
          summary: aiReview?.executiveSummary || "Senior software engineer with track record of shipping scalable services.",
        },
        skills: (resume?.skills || []).map((s) => ({ name: s, level: "Senior" })),
        work: (resume?.experience || []).map((e) => ({
          company: typeof e === "string" ? "Enterprise" : e.company || "",
          position: typeof e === "string" ? "Engineer" : e.role || "",
          summary: typeof e === "string" ? e : (e.bullets || []).join(". "),
        })),
        education: (resume?.education || []).map((ed) => ({
          institution: typeof ed === "string" ? ed : ed.school || "",
          area: typeof ed === "string" ? "Computer Science" : ed.degree || "",
        })),
      },
      null,
      2
    );
  }

  function handleDownloadExportFile() {
    let content = "";
    let ext = "txt";
    let mime = "text/plain";
    const candidate = resume?.contact?.name || "Candidate";

    if (exportFormat === "latex") {
      content = generateLatexCode();
      ext = "tex";
    } else if (exportFormat === "markdown") {
      content = generateMarkdownCode();
      ext = "md";
      mime = "text/markdown";
    } else if (exportFormat === "json") {
      content = generateJsonResumeCode();
      ext = "json";
      mime = "application/json";
    } else {
      content = generatePlainTxtCode();
      ext = "txt";
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${candidate.replace(/\s+/g, "_")}_Resume.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ATS Keyword Density & Heatmap occurrence counter
  function getKeywordOccurrenceCount(keyword) {
    if (!resume || !keyword) return 0;
    const text = [
      resume.contact?.name || "",
      (resume.skills || []).join(" "),
      (resume.experience || []).flatMap((e) => [e.company, e.role, ...(e.bullets || [])]).join(" "),
      (resume.projects || []).flatMap((p) => [p.name, p.description, ...(p.bullets || [])]).join(" "),
      (resume.education || []).flatMap((ed) => [ed.school, ed.degree]).join(" "),
    ].join(" ").toLowerCase();

    const reg = new RegExp(`\\b${keyword.toLowerCase()}\\b`, "g");
    const m = text.match(reg);
    return m ? m.length : 1;
  }

  // Quick Preset Job Description filler
  function handleSelectPresetJd(jd) {
    setJobDescription(jd.text);
    handleRunAts(jd.text);
  }

  // Quick Preset Resume Switcher
  function handleSelectPresetResume(sample) {
    const newResume = sample.data;
    setResume(newResume);
    setFileName(`${sample.name.replace(/\s+/g, "_")}.pdf`);
    setAtsResult(null);
    setAiReview(null);
    setTailorResult(null);
    setCoverLetterResult(null);
    setInterviewPrep(null);
    setSalaryData(null);
    setAuditData(null);
    setMultiJobData(null);
    setSimulatedSkills([]);
    setCareerTrajectoryData(null);
    setStarStoriesData(null);
    setDebiasData(null);
    setExecutiveBioData(null);
    setInterviewSprintData(null);
    setLocalizedResumeData(null);


    const jdToUse = jobDescription.trim() || (sampleData?.jobDescriptions?.[0]?.text || "");
    if (jdToUse) {
      setJobDescription(jdToUse);
      handleRunAts(jdToUse, newResume);
    } else {
      handleRunAudit(newResume);
    }
  }

  // Resume Refinement / Inline Editor Open
  function handleOpenEditor() {
    setEditName(resume?.contact?.name || "");
    setEditEmail(resume?.contact?.email || "");
    setEditPhone(resume?.contact?.phone || "");
    setEditSkills(Array.isArray(resume?.skills) ? [...resume.skills] : []);
    setNewSkillInput("");
    setEditExperienceText(Array.isArray(resume?.experience) ? resume.experience.join("\n") : "");
    setEditEducationText(Array.isArray(resume?.education) ? resume.education.join("\n") : "");
    setEditProjectsText(Array.isArray(resume?.projects) ? resume.projects.join("\n") : "");
    setIsEditorOpen(true);
  }

  function handleAddSkill(skillToAdd = null) {
    const sk = (typeof skillToAdd === "string" ? skillToAdd : newSkillInput).trim();
    if (!sk) return;
    if (!editSkills.some((s) => s.toLowerCase() === sk.toLowerCase())) {
      setEditSkills((prev) => [...prev, sk]);
    }
    setNewSkillInput("");
  }

  function handleRemoveSkill(indexToRemove) {
    setEditSkills((prev) => prev.filter((_, i) => i !== indexToRemove));
  }

  // 1-Click: Add Missing Keyword Directly into Resume & Recalculate Score
  function handleQuickAddMissingSkill(missingKw) {
    const currentSkills = Array.isArray(resume?.skills) ? [...resume.skills] : [];
    if (!currentSkills.some((s) => s.toLowerCase() === missingKw.toLowerCase())) {
      const updatedResume = {
        ...resume,
        skills: [...currentSkills, missingKw],
      };
      setResume(updatedResume);
      handleRunAts(jobDescription, updatedResume);
    }
  }

  // What-If? Score Booster Simulator Handlers
  function handleToggleSimulatedSkill(kw) {
    setSimulatedSkills((prev) =>
      prev.includes(kw) ? prev.filter((k) => k !== kw) : [...prev, kw]
    );
  }

  function handleApplySimulatedSkills() {
    if (simulatedSkills.length === 0) return;
    const currentSkills = Array.isArray(resume?.skills) ? [...resume.skills] : [];
    const newSkills = Array.from(new Set([...currentSkills, ...simulatedSkills]));
    const updatedResume = { ...resume, skills: newSkills };
    setResume(updatedResume);
    setSimulatedSkills([]);
    handleRunAts(jobDescription, updatedResume);
  }

  // Calculate What-If simulated scores
  const simulatedMatchedCount = (atsResult?.matchedKeywords?.length || 0) + simulatedSkills.length;
  const totalKeywordsCount = Math.max(1, (atsResult?.matchedKeywords?.length || 0) + (atsResult?.missingKeywords?.length || 0));
  const simulatedSkillMatch = Math.min(100, Math.round((simulatedMatchedCount / totalKeywordsCount) * 100));
  const simulatedAtsScore = Math.min(100, Math.round((atsResult?.atsScore || 0) + (simulatedSkills.length * 4.5)));
  const simulatedBoost = Math.max(0, simulatedAtsScore - (atsResult?.atsScore || 0));

  function handleSaveEditor() {
    const updatedResume = {
      ...resume,
      contact: {
        ...resume?.contact,
        name: editName.trim() || "Candidate",
        email: editEmail.trim() || null,
        phone: editPhone.trim() || null,
      },
      skills: editSkills,
      experience: editExperienceText.split("\n").map((l) => l.trim()).filter(Boolean),
      education: editEducationText.split("\n").map((l) => l.trim()).filter(Boolean),
      projects: editProjectsText.split("\n").map((l) => l.trim()).filter(Boolean),
    };

    setResume(updatedResume);
    setIsEditorOpen(false);
    handleRunAts(jobDescription, updatedResume);
  }

  // Print / Save as PDF
  function handlePrint() {
    window.print();
  }

  // Export full report as Executive Candidate Dossier download
  function handleDownloadReport() {
    const candidate = resume?.contact?.name || "Candidate";
    const content = `# EXECUTIVE CANDIDATE DOSSIER & ATS INTELLIGENCE AUDIT
======================================================================
Candidate:    ${candidate}
Email:        ${resume?.contact?.email || "Not specified"} | Phone: ${resume?.contact?.phone || "Not specified"}
Target Role:  ${targetRole || "Software Engineering"}
Document:     ${fileName}
AI Engine:    ${currentModel}
Audit Date:   ${new Date().toLocaleString()}

======================================================================
1. ATS MATCH & KEYWORD BENCHMARK
======================================================================
• Overall ATS Match Score:   ${atsResult?.atsScore ?? "N/A"}/100
• Keyword Alignment:         ${atsResult?.skillMatch ?? "N/A"}%
• Resume Completeness:       ${atsResult?.resumeCompleteness ?? atsResult?.completeness ?? "N/A"}%
• Format Health Score:       ${auditData?.auditScore ?? "N/A"}/100

[MATCHED SKILLS & COMPETENCIES]
${(atsResult?.matchedKeywords || []).map((k) => `  ✓ ${k}`).join("\n") || "  (No matched keywords detected)"}

[CRITICAL KEYWORD GAPS TO BRIDGE]
${(atsResult?.missingKeywords || []).map((k) => `  ✗ ${k}`).join("\n") || "  (No critical gaps identified)"}

======================================================================
2. STRUCTURAL ATS HEALTH & CONTENT AUDIT
======================================================================
• Total Word Count:          ${auditData?.wordCount ?? "N/A"} words
• Action Verbs Detected:     ${auditData?.strongActionVerbsCount ?? "N/A"}
• Quantified Metrics Count:  ${auditData?.metricsFoundCount ?? "N/A"}
• Cliche Buzzwords Flagged:  ${auditData?.buzzwordsFound?.length ? auditData.buzzwordsFound.join(", ") : "0 flagged (Clean)"}

Actionable Health Tips:
${(auditData?.recommendations || []).map((t) => `  • ${t}`).join("\n") || "  • Format meets standard ATS expectations."}

======================================================================
3. MARKET COMPENSATION BENCHMARK
======================================================================
• Estimated Market Base:     ${salaryData ? `${salaryData.estimatedRange.formatted} USD` : "Run Salary Estimator"}
• Seniority Level:           ${salaryData?.seniority || "Mid-Senior"}
• Top Premium Skills:        ${salaryData?.skillPremiumsDetected?.map((s) => s.skill).join(", ") || "N/A"}

======================================================================
4. DEEP AI STRATEGY & EVALUATION
======================================================================
${aiReview?.verdict ? `Verdict: ${aiReview.verdict}\n\nExecutive Profile Summary:\n${aiReview.executiveSummary}\n\nKey Candidate Strengths:\n${(aiReview.keyStrengths || []).map((s) => `• ${s}`).join("\n")}\n\nCritical Gaps to Address:\n${(aiReview.criticalGaps || []).map((g) => `• ${g}`).join("\n")}` : "Deep AI evaluation not yet run for this session."}

======================================================================
End of Dossier • Generated by AI Resume Analyzer Studio
`;

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${candidate.replace(/\s+/g, "_")}_Executive_Dossier.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Export JSON Report
  function handleDownloadJsonReport() {
    const candidate = resume?.contact?.name || "Candidate";
    const dataToExport = {
      candidate,
      fileName,
      exportedAt: new Date().toISOString(),
      model: currentModel,
      atsScore: atsResult?.atsScore,
      skillMatch: atsResult?.skillMatch,
      completeness: atsResult?.resumeCompleteness || atsResult?.completeness,
      matchedKeywords: atsResult?.matchedKeywords,
      missingKeywords: atsResult?.missingKeywords,
      suggestions: atsResult?.suggestions,
      aiReview,
      salaryEstimate: salaryData,
      auditData,
      rawResume: resume,
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${candidate.replace(/\s+/g, "_")}_ATS_Data.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Download Tailored Resume
  function handleDownloadTailoredResume(ext = "md") {
    if (!tailorResult?.fullTailoredResumeMarkdown) return;
    const candidate = resume?.contact?.name || "Candidate";
    const blob = new Blob([tailorResult.fullTailoredResumeMarkdown], {
      type: ext === "md" ? "text/markdown" : "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${candidate.replace(/\s+/g, "_")}_Tailored_Resume.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Download Cover Letter
  function handleDownloadCoverLetter(ext = "md") {
    if (!coverLetterResult?.coverLetter) return;
    const candidate = resume?.contact?.name || "Candidate";
    const blob = new Blob([coverLetterResult.coverLetter], {
      type: ext === "md" ? "text/markdown" : "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${candidate.replace(/\s+/g, "_")}_Cover_Letter.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const candidateName = resume?.contact?.name || "Candidate";
  const skillsCount = Array.isArray(resume?.skills) ? resume.skills.length : 0;
  const expCount = Array.isArray(resume?.experience) ? resume.experience.length : 0;
  const projectsCount = Array.isArray(resume?.projects) ? resume.projects.length : 0;

  const TOOL_METADATA = {
    overview: { label: "ATS Target Match", categoryTitle: "ATS Diagnostics" },
    preview: { label: "ATS Resume Preview", categoryTitle: "ATS Diagnostics" },
    audit: { label: "ATS Red Flags Audit", categoryTitle: "ATS Diagnostics" },
    debias: { label: "Blind ATS De-Biasing", categoryTitle: "ATS Diagnostics" },
    multi: { label: "Multi-Job Matrix", categoryTitle: "ATS Diagnostics" },
    tailor: { label: "AI Resume Tailor Studio", categoryTitle: "Content & Tailoring" },
    bullets: { label: "XYZ Bullet Re-writer", categoryTitle: "Content & Tailoring" },
    coverletter: { label: "Executive Cover Letter", categoryTitle: "Content & Tailoring" },
    linkedin: { label: "LinkedIn Profile Suite", categoryTitle: "Content & Tailoring" },
    bios: { label: "Executive Persona Studio", categoryTitle: "Content & Tailoring" },
    localization: { label: "Global Market Adapter", categoryTitle: "Content & Tailoring" },
    pipeline: { label: "Application Pipeline CRM", categoryTitle: "Career & Pipeline" },
    salary: { label: "Salary & Offer Negotiation", categoryTitle: "Career & Pipeline" },
    trajectory: { label: "Career Trajectory", categoryTitle: "Career & Pipeline" },
    roadmap: { label: "30-Day Skill Roadmap", categoryTitle: "Career & Pipeline" },
    battle: { label: "Candidate Battle", categoryTitle: "Career & Pipeline" },
    export: { label: "Export Studio", categoryTitle: "Career & Pipeline" },
    interview: { label: "Interview Simulator", categoryTitle: "Interview & Pitch" },
    starstories: { label: "STAR Story Matrix", categoryTitle: "Interview & Pitch" },
    sprint: { label: "7-Day Interview Sprint", categoryTitle: "Interview & Pitch" },
    quiz: { label: "Skill Assessment Quiz", categoryTitle: "Interview & Pitch" },
    outreach: { label: "Outreach Pitches", categoryTitle: "Interview & Pitch" },
    chat: { label: "Career Coach Chat", categoryTitle: "Interview & Pitch" },
  };

  const activeToolInfo = TOOL_METADATA[activeTab] || { label: "Career Studio", categoryTitle: "Tools" };

  const TOOL_GROUPS = [
    {
      category: "ats",
      title: "ATS Diagnostics",
      icon: <TargetIcon width={14} height={14} />,
      tools: [
        { id: "overview", label: "ATS Target Match", badge: "10 Rules", icon: <TargetIcon width={15} height={15} />, onClick: () => setActiveTab("overview") },
        { id: "preview", label: "ATS Resume Preview", badge: "3 Themes", icon: <DocumentIcon width={15} height={15} />, onClick: () => setActiveTab("preview") },
        { id: "audit", label: "Red Flags Audit", badge: "Health", icon: <ShieldCheckIcon width={15} height={15} />, onClick: () => { setActiveTab("audit"); if (!auditData) handleRunAudit(); } },
        { id: "debias", label: "Blind De-Biasing", badge: "Fairness", icon: <ShieldCheckIcon width={15} height={15} />, onClick: () => { setActiveTab("debias"); if (!debiasData) handleRunDebiasAudit(); } },
        { id: "multi", label: "Multi-Job Matrix", badge: "5 Benchmarks", icon: <GitCompareIcon width={15} height={15} />, onClick: () => { setActiveTab("multi"); if (!multiJobData) handleRunMultiMatch(); } },
      ],
    },
    {
      category: "content",
      title: "Content & Tailoring",
      icon: <WandIcon width={14} height={14} />,
      tools: [
        { id: "tailor", label: "AI Resume Tailor", badge: "Smart Rewrite", icon: <WandIcon width={15} height={15} />, onClick: () => { setActiveTab("tailor"); if (!tailorResult) handleRunTailor(); } },
        { id: "bullets", label: "XYZ Bullet Re-writer", badge: "Google XYZ", icon: <SparkleIcon width={15} height={15} />, onClick: () => { setActiveTab("bullets"); if (!powerBulletData) handleRunPowerBullet(); } },
        { id: "coverletter", label: "Cover Letter Studio", badge: "Multi-Tone", icon: <DocumentIcon width={15} height={15} />, onClick: () => { setActiveTab("coverletter"); if (!coverLetterResult) handleRunCoverLetter(); } },
        { id: "linkedin", label: "LinkedIn Suite", badge: "SEO Headlines", icon: <DocumentIcon width={15} height={15} />, onClick: () => { setActiveTab("linkedin"); if (!linkedinData) handleRunLinkedIn(); } },
        { id: "bios", label: "Executive Personas", badge: "Leadership", icon: <AwardIcon width={15} height={15} />, onClick: () => { setActiveTab("bios"); if (!executiveBioData) handleRunExecutiveBio(); } },
        { id: "localization", label: "Global Market Adapter", badge: "US/UK/EU", icon: <GlobeIcon width={15} height={15} />, onClick: () => { setActiveTab("localization"); if (!localizedResumeData) handleRunLocalizedResume(); } },
      ],
    },
    {
      category: "career",
      title: "Career & Pipeline CRM",
      icon: <TrendingUpIcon width={14} height={14} />,
      tools: [
        { id: "pipeline", label: "Application Pipeline", badge: "Kanban CRM", icon: <KanbanIcon width={15} height={15} />, onClick: () => { setActiveTab("pipeline"); if (!pipelineLoaded) loadApplications(); } },
        { id: "salary", label: "Salary & Negotiation", badge: "Live Scripts", icon: <DollarIcon width={15} height={15} />, onClick: () => { setActiveTab("salary"); if (!salaryData) handleRunSalary(); } },
        { id: "trajectory", label: "Career Trajectory", badge: "5-Year Plan", icon: <TrendingUpIcon width={15} height={15} />, onClick: () => { setActiveTab("trajectory"); if (!careerTrajectoryData) handleRunCareerTrajectory(); } },
        { id: "roadmap", label: "30-Day Skill Roadmap", badge: "4 Weeks", icon: <SparkleIcon width={15} height={15} />, onClick: () => { setActiveTab("roadmap"); if (!roadmapData) handleRunRoadmap(); } },
        { id: "battle", label: "Candidate Battle", badge: "Head-to-Head", icon: <GitCompareIcon width={15} height={15} />, onClick: () => { setActiveTab("battle"); if (!battleResult) handleRunBattle(); } },
        { id: "export", label: "Export Studio", badge: "PDF/JSON", icon: <DownloadIcon width={15} height={15} />, onClick: () => setActiveTab("export") },
      ],
    },
    {
      category: "interview",
      title: "Interview & Pitch",
      icon: <MicIcon width={14} height={14} />,
      tools: [
        { id: "interview", label: "Interview Simulator", badge: "AI Evaluator", icon: <MicIcon width={15} height={15} />, onClick: () => { setActiveTab("interview"); if (!interviewPrep) handleRunInterviewPrep(); } },
        { id: "starstories", label: "STAR Story Matrix", badge: "Behavioral", icon: <BookOpenIcon width={15} height={15} />, onClick: () => { setActiveTab("starstories"); if (!starStoriesData) handleRunStarStories(); } },
        { id: "sprint", label: "7-Day Interview Sprint", badge: "Checklist", icon: <CalendarIcon width={15} height={15} />, onClick: () => { setActiveTab("sprint"); if (!interviewSprintData) handleRunInterviewSprint(); } },
        { id: "quiz", label: "Skill Assessment Quiz", badge: "10 MCQs", icon: <BrainIcon width={15} height={15} />, onClick: () => { setActiveTab("quiz"); if (!quizData) handleRunQuiz(); } },
        { id: "outreach", label: "Outreach Pitches", badge: "InMail AI", icon: <SparkleIcon width={15} height={15} />, onClick: () => { setActiveTab("outreach"); if (!outreachPitches) handleRunOutreach(); } },
        { id: "chat", label: "Career Coach Chat", badge: "AI Copilot", icon: <MessageIcon width={15} height={15} />, onClick: () => setActiveTab("chat") },
      ],
    },
  ];

  const filteredToolGroups = TOOL_GROUPS.map((group) => {
    if (navCategory !== "all" && group.category !== navCategory) {
      return { ...group, tools: [] };
    }
    const q = navSearch.toLowerCase().trim();
    if (!q) return group;
    const matchingTools = group.tools.filter(
      (t) =>
        t.label.toLowerCase().includes(q) ||
        t.badge.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
    );
    return { ...group, tools: matchingTools };
  }).filter((group) => group.tools.length > 0);

  return (
    <AppLayout fluid={true}>
      <div className="dashboard-page-container">
        <div className={`dashboard-monolith-layout ${isSidebarCollapsed ? "dashboard-monolith-layout--collapsed" : ""}`}>
          {/* Mobile Sidebar Backdrop */}
          {isMobileSidebarOpen && (
            <div
              className="dashboard-sidebar-backdrop"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
          )}

          {/* ========================================================
              LEFT SIDEBAR: 23 TOOLS, CATEGORIES, QUICK SEARCH
              ======================================================== */}
          <aside
            className={`dashboard-sidebar ${
              isSidebarCollapsed ? "dashboard-sidebar--collapsed" : ""
            } ${isMobileSidebarOpen ? "dashboard-sidebar--mobile-open" : ""}`}
          >
            {/* Sidebar Candidate Profile Card */}
            <div className="sidebar-profile-card">
              <div className="sidebar-profile-avatar">
                {candidateName.charAt(0) || "C"}
              </div>
              {!isSidebarCollapsed && (
                <div className="sidebar-profile-meta">
                  <h3 className="sidebar-profile-name" title={candidateName}>{candidateName}</h3>
                  <span className="sidebar-profile-role" title={fileName}>{fileName}</span>
                  <div className="sidebar-profile-stats">
                    <span className="sidebar-stat-badge">
                      {atsResult ? `${atsResult.atsScore}% ATS` : "80%+ Target"}
                    </span>
                    <span className="sidebar-stat-count">{skillsCount} skills</span>
                  </div>
                </div>
              )}
              <button
                type="button"
                className="sidebar-collapse-btn"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isSidebarCollapsed ? "→" : "←"}
              </button>
            </div>

            {/* Quick Tool Search Box */}
            {!isSidebarCollapsed && (
              <div className="sidebar-search-box">
                <SearchIcon width={13} height={13} className="sidebar-search-icon" />
                <input
                  type="text"
                  className="sidebar-search-input"
                  placeholder="Filter 23 tools..."
                  value={navSearch}
                  onChange={(e) => setNavSearch(e.target.value)}
                />
                {navSearch && (
                  <button
                    type="button"
                    className="sidebar-search-clear"
                    onClick={() => setNavSearch("")}
                  >
                    ✕
                  </button>
                )}
              </div>
            )}

            {/* Category Filter Pills */}
            {!isSidebarCollapsed && (
              <div className="sidebar-category-pills">
                <button
                  type="button"
                  className={`sidebar-cat-pill ${navCategory === "all" ? "active" : ""}`}
                  onClick={() => setNavCategory("all")}
                >
                  All (23)
                </button>
                <button
                  type="button"
                  className={`sidebar-cat-pill ${navCategory === "ats" ? "active" : ""}`}
                  onClick={() => setNavCategory("ats")}
                >
                  🎯 ATS (5)
                </button>
                <button
                  type="button"
                  className={`sidebar-cat-pill ${navCategory === "content" ? "active" : ""}`}
                  onClick={() => setNavCategory("content")}
                >
                  ✨ Content (6)
                </button>
                <button
                  type="button"
                  className={`sidebar-cat-pill ${navCategory === "career" ? "active" : ""}`}
                  onClick={() => setNavCategory("career")}
                >
                  📈 Career (6)
                </button>
                <button
                  type="button"
                  className={`sidebar-cat-pill ${navCategory === "interview" ? "active" : ""}`}
                  onClick={() => setNavCategory("interview")}
                >
                  🎙️ Pitch (6)
                </button>
              </div>
            )}

            {/* Grouped 23-Tool Navigation Links */}
            <nav className="sidebar-nav-scroll">
              {filteredToolGroups.map((group) => (
                <div key={group.category} className="sidebar-group">
                  {!isSidebarCollapsed && (
                    <div className="sidebar-group-header">
                      <span className="sidebar-group-title">
                        {group.icon} {group.title}
                      </span>
                      <span className="sidebar-group-count">{group.tools.length}</span>
                    </div>
                  )}
                  <div className="sidebar-group-items">
                    {group.tools.map((tool) => (
                      <button
                        key={tool.id}
                        type="button"
                        className={`sidebar-tool-btn ${activeTab === tool.id ? "sidebar-tool-btn--active" : ""}`}
                        onClick={() => {
                          tool.onClick();
                          setIsMobileSidebarOpen(false);
                        }}
                        title={tool.label}
                      >
                        <span className="sidebar-tool-icon">{tool.icon}</span>
                        {!isSidebarCollapsed && (
                          <span className="sidebar-tool-label">{tool.label}</span>
                        )}
                        {!isSidebarCollapsed && tool.badge && (
                          <span className="sidebar-tool-badge">{tool.badge}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            {/* Sidebar Footer: Quick Actions */}
            <div className="sidebar-footer">
              {!isSidebarCollapsed ? (
                <div className="sidebar-quick-actions">
                  <button onClick={handleOpenEditor} className="sidebar-action-btn" type="button">
                    <EditIcon width={13} height={13} /> Edit
                  </button>
                  <button onClick={handlePrint} className="sidebar-action-btn" type="button">
                    <PrinterIcon width={13} height={13} /> Print
                  </button>
                  <button onClick={handleDownloadReport} className="sidebar-action-btn" type="button">
                    <DownloadIcon width={13} height={13} /> Export
                  </button>
                  <Link to="/upload" className="sidebar-action-btn" style={{ textDecoration: "none" }}>
                    <UploadIcon width={13} height={13} /> Upload
                  </Link>
                </div>
              ) : (
                <div className="sidebar-quick-actions--collapsed">
                  <button onClick={handleOpenEditor} className="sidebar-action-icon-btn" title="Edit Resume" type="button">
                    <EditIcon width={15} height={15} />
                  </button>
                  <button onClick={handlePrint} className="sidebar-action-icon-btn" title="Print / PDF" type="button">
                    <PrinterIcon width={15} height={15} />
                  </button>
                  <button onClick={handleDownloadReport} className="sidebar-action-icon-btn" title="Export Report" type="button">
                    <DownloadIcon width={15} height={15} />
                  </button>
                </div>
              )}
            </div>
          </aside>

          {/* ========================================================
              RIGHT WORKSPACE: WORKSPACE HEAD, STATS, ACTIVE TOOL
              ======================================================== */}
          <section className="dashboard-main-workspace">
            {/* Mobile Header Bar */}
            <div className="dashboard-mobile-bar">
              <button
                type="button"
                className="dashboard-mobile-toggle-btn"
                onClick={() => setIsMobileSidebarOpen(true)}
              >
                ☰ Tools: {activeToolInfo.label}
              </button>
              <span className="dashboard-mobile-score">
                ATS Score: {atsResult ? `${atsResult.atsScore}%` : "—"}
              </span>
            </div>

            {/* Header */}
            <div className="dashboard__head">
              <div>
                <span className="dashboard__eyebrow">
                  <SparkleIcon width={14} height={14} /> Obsidian Career Studio / {activeToolInfo.categoryTitle}
                </span>
                <h1 className="dashboard__title">{activeToolInfo.label}</h1>
                <p className="dashboard__file">
                  <DocumentIcon width={16} height={16} />
                  <span>{fileName}</span>
                  <span style={{ color: "var(--mono-500)" }}>•</span>
                  <span>{skillsCount} Skills</span>
                  <span style={{ color: "var(--mono-500)" }}>•</span>
                  <span>{expCount} Experiences</span>
                  <span style={{ color: "var(--mono-500)" }}>•</span>
                  <span>{projectsCount} Projects</span>
                </p>
              </div>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                <Button onClick={handleOpenEditor} variant="secondary" icon={<EditIcon width={15} height={15} />}>
                  Edit Resume
                </Button>
                <Button onClick={handlePrint} variant="secondary" icon={<PrinterIcon width={15} height={15} />}>
                  Print / PDF
                </Button>
                <Button onClick={handleDownloadReport} variant="secondary" icon={<DownloadIcon width={15} height={15} />}>
                  Export Report
                </Button>
                <Button as={Link} to="/upload" variant="secondary" icon={<UploadIcon width={16} height={16} />}>
                  Upload Another
                </Button>
              </div>
            </div>

            {/* Preset Resumes Switcher */}
            {sampleData && sampleData.resumes && (
              <div className="demo-banner">
                <span className="demo-banner__label">
                  <SparkleIcon width={15} height={15} style={{ color: "#ffffff" }} />
                  Instant Profile Switcher:
                </span>
                <div className="demo-banner__chips">
                  {sampleData.resumes.map((s) => (
                    <button
                      key={s.id}
                      className="demo-chip"
                      onClick={() => handleSelectPresetResume(s)}
                      type="button"
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stat Cards Row */}
            <div className="dashboard__stats">
              <StatCard
                label="ATS Match Score"
                value={atsResult ? `${atsResult.atsScore}%` : "—"}
                delta={atsResult?.atsScore >= 75 ? "+14% vs avg" : "Target: 80%+"}
                icon={<StarIcon width={22} height={22} />}
              />
              <StatCard
                label="Skill Overlap"
                value={atsResult ? `${atsResult.skillMatch}%` : "—"}
                delta={atsResult?.matchedKeywords ? `${atsResult.matchedKeywords.length} matched` : "Paste JD"}
                icon={<TargetIcon width={22} height={22} />}
              />
              <StatCard
                label="Market Compensation"
                value={salaryData ? formatSalaryAmount(salaryData.estimatedRange.median) : "Analyze"}
                delta={salaryData ? salaryData.seniority : "Est. Range"}
                icon={<DollarIcon width={22} height={22} />}
              />
              <StatCard
                label="ATS Formatting Health"
                value={auditData ? `${auditData.auditScore}/100` : "Audit"}
                delta={auditData?.metricsFoundCount ? `${auditData.metricsFoundCount} metrics` : "Red-flags check"}
                icon={<ShieldCheckIcon width={22} height={22} />}
              />
            </div>




          {/* ========================================================
              TAB 1: OVERVIEW & ATS TARGET MATCH
              ======================================================== */}
          {activeTab === "overview" && (
            <div className="dashboard__grid">
              {/* Target Job Description Card */}
              <Card
                className="col-12"
                title="Target Job Description & ATS Parser"
                icon={<TargetIcon width={20} height={20} />}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                  <p className="ats-intro" style={{ margin: 0 }}>
                    Paste a target job description or click a preset archetype to calculate match score and extract gaps.
                  </p>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", alignSelf: "center", marginRight: 4 }}>Role Archetypes:</span>
                    {(sampleData?.jobDescriptions && sampleData.jobDescriptions.length > 0 ? sampleData.jobDescriptions : PRESET_JOB_ARCHETYPES).map((jd, idx) => (
                      <button
                        key={jd.id || idx}
                        className="demo-chip"
                        style={{ fontSize: "11px", padding: "3px 8px" }}
                        onClick={() => handleSelectPresetJd(jd)}
                        type="button"
                      >
                        {jd.title}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  className="ats-textarea"
                  rows={4}
                  placeholder="Paste target job description here…"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />

                <div className="ats-actions">
                  <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    <Button
                      onClick={() => handleRunAts()}
                      disabled={!jobDescription.trim() || atsLoading}
                      icon={<TargetIcon width={18} height={18} />}
                    >
                      {atsLoading ? "Analyzing ATS Match…" : "Analyze ATS Match"}
                    </Button>
                    {atsResult && (
                      <span style={{ fontSize: "12px", color: "#ffffff", background: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(255, 255, 255, 0.2)", borderRadius: "6px", padding: "4px 10px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <CheckIcon width={14} height={14} /> Saved in local database
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleDownloadJsonReport}
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.14)",
                        color: "#94a3b8",
                        borderRadius: "8px",
                        padding: "8px 14px",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      Export Raw JSON
                    </button>
                  </div>
                </div>

                {atsError && (
                  <div className="ats-error" role="alert">
                    <AlertIcon width={18} height={18} />
                    <span>{atsError}</span>
                  </div>
                )}
              </Card>

              {/* Real ATS Results */}
              {atsResult && (
                <>
                  <Card className="col-4 ats-card" title="ATS Match Score" icon={<StarIcon width={20} height={20} />}>
                    <div className="ats-card__ring">
                      <CircularScore value={atsResult.atsScore} caption="ATS Score" />
                    </div>
                    <div className="bar-stack">
                      <ProgressBar
                        label="Skill Match"
                        value={atsResult.skillMatch}
                        variant={atsResult.skillMatch < 50 ? "warn" : "brand"}
                      />
                      <ProgressBar
                        label="Resume Completeness"
                        value={atsResult.resumeCompleteness ?? atsResult.completeness ?? 85}
                        delay={120}
                      />
                    </div>
                  </Card>

                  <Card className="col-8" title="Matched Keywords" icon={<CheckIcon width={20} height={20} />}>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "12px" }}>
                      Keywords from the job posting detected in your resume:
                    </p>
                    <KeywordTags keywords={atsResult.matchedKeywords} />
                  </Card>

                  {/* What-If? Score Booster Simulator */}
                  {atsResult.missingKeywords && atsResult.missingKeywords.length > 0 && (
                    <Card className="col-12" title="⚡ What-If? ATS Score Booster Simulator" icon={<SparkleIcon width={20} height={20} />}>
                      <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "14px" }}>
                        Test how your score will improve if you incorporate missing target skills. Select skills you have experience in, and watch your ATS score jump in real time:
                      </p>

                      <div style={{ display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap", marginBottom: "16px", padding: "14px 18px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.18)" }}>
                        <div>
                          <span style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase" }}>Current Score:</span>
                          <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#ffffff" }}>{atsResult.atsScore}%</div>
                        </div>
                        <div style={{ fontSize: "20px", color: "var(--text-muted)" }}>➔</div>
                        <div>
                          <span style={{ fontSize: "11px", fontWeight: "700", color: "#ffffff", textTransform: "uppercase" }}>Simulated Score:</span>
                          <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#ffffff" }}>
                            {simulatedAtsScore}%
                            {simulatedBoost > 0 && <span style={{ fontSize: "12px", marginLeft: "6px", background: "#ffffff", color: "#000000", fontWeight: "800", padding: "2px 8px", borderRadius: "4px" }}>+{simulatedBoost}% Boost</span>}
                          </div>
                        </div>

                        <div style={{ marginLeft: "auto" }}>
                          <Button
                            onClick={handleApplySimulatedSkills}
                            disabled={simulatedSkills.length === 0}
                            icon={<CheckIcon width={16} height={16} />}
                          >
                            Apply {simulatedSkills.length} Selected to Resume
                          </Button>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {atsResult.missingKeywords.map((kw, i) => {
                          const isChecked = simulatedSkills.includes(kw);
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleToggleSimulatedSkill(kw)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "6px 12px",
                                borderRadius: "8px",
                                fontSize: "12px",
                                fontWeight: "600",
                                cursor: "pointer",
                                border: isChecked ? "1px solid #ffffff" : "1px solid rgba(255,255,255,0.15)",
                                background: isChecked ? "#ffffff" : "rgba(255,255,255,0.03)",
                                color: isChecked ? "#000000" : "#e2e8f0",
                                transition: "all 0.15s ease",
                              }}
                            >
                              <span>{isChecked ? "✓" : "+"}</span>
                              <span>{kw}</span>
                            </button>
                          );
                        })}
                      </div>
                    </Card>
                  )}

                  {/* Interactive STAR Bullet Enhancer Studio Card */}
                  <Card
                    className="col-12"
                    title="✦ AI STAR Bullet Enhancer Studio (Live Metric & Impact Polisher)"
                    icon={<WandIcon width={20} height={20} />}
                  >
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>
                      Transform passive resume bullet points into high-impact, quantified STAR (Situation, Task, Action, Result) achievements calibrated for ATS rankers and hiring managers.
                    </p>

                    {/* Quick Bullet Selector from active resume */}
                    {resume?.experience && resume.experience.length > 0 && (
                      <div style={{ marginBottom: "14px" }}>
                        <span style={{ fontSize: "11px", fontWeight: "700", color: "#a1a1aa", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                          Quick-Select a Bullet from Your Resume:
                        </span>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", maxHeight: "110px", overflowY: "auto" }}>
                          {resume.experience.flatMap((exp) => (exp.bullets || []).map((b, bIdx) => (
                            <button
                              key={`${exp.company || "exp"}-${bIdx}`}
                              type="button"
                              onClick={() => setBulletInput(b)}
                              style={{
                                textAlign: "left",
                                background: bulletInput === b ? "#ffffff" : "rgba(255,255,255,0.04)",
                                color: bulletInput === b ? "#000000" : "#d4d4d8",
                                border: bulletInput === b ? "1px solid #ffffff" : "1px solid rgba(255,255,255,0.12)",
                                borderRadius: "6px",
                                padding: "4px 10px",
                                fontSize: "11px",
                                cursor: "pointer",
                                maxWidth: "340px",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                              title={b}
                            >
                              {b}
                            </button>
                          )))}
                        </div>
                      </div>
                    )}

                    <div style={{ display: "flex", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: "260px" }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Type or paste any resume bullet (e.g. Worked on backend APIs and fixed bugs)"
                          value={bulletInput}
                          onChange={(e) => setBulletInput(e.target.value)}
                          style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", background: "rgba(0,0,0,0.4)", border: "1px solid var(--border)", color: "#ffffff" }}
                        />
                      </div>
                      <div style={{ width: "200px" }}>
                        <select
                          className="form-select"
                          value={bulletTargetRole}
                          onChange={(e) => setBulletTargetRole(e.target.value)}
                          style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", background: "rgba(18,21,33,0.8)", border: "1px solid var(--border)", color: "#ffffff" }}
                        >
                          <option value="Software Engineer">Software Engineer</option>
                          <option value="Senior Tech Lead">Senior Tech Lead</option>
                          <option value="Full-Stack Developer">Full-Stack Developer</option>
                          <option value="AI / ML Engineer">AI / ML Engineer</option>
                          <option value="DevOps & Cloud Architect">DevOps Architect</option>
                          <option value="Product Manager">Product Manager</option>
                        </select>
                      </div>
                      <Button
                        onClick={handleImproveBullet}
                        disabled={!bulletInput.trim() || bulletLoading}
                        icon={<WandIcon width={16} height={16} />}
                      >
                        {bulletLoading ? "Enhancing with AI…" : "Enhance with STAR AI"}
                      </Button>
                    </div>

                    {bulletResult && (
                      <div style={{ marginTop: "16px", padding: "16px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.18)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                          <span style={{ fontSize: "11px", fontWeight: "800", color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            ✦ Enhanced STAR Achievement (Calibrated with {currentModel})
                          </span>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <CopyButton text={bulletResult.improved} label="Copy STAR Bullet" />
                            <Button
                              size="sm"
                              onClick={() => handleApplyEnhancedBullet(bulletInput, bulletResult.improved)}
                              icon={<CheckIcon width={14} height={14} />}
                            >
                              {bulletApplied ? "Applied to Live Resume!" : "Apply to Live Resume"}
                            </Button>
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "10px" }}>
                          <div style={{ padding: "10px 14px", borderRadius: "6px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}>
                            <span style={{ fontSize: "10px", fontWeight: "700", color: "#71717a", textTransform: "uppercase" }}>Original Draft:</span>
                            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#a1a1aa", fontStyle: "italic" }}>
                              "{bulletInput}"
                            </p>
                          </div>
                          <div style={{ padding: "10px 14px", borderRadius: "6px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.2)" }}>
                            <span style={{ fontSize: "10px", fontWeight: "800", color: "#ffffff", textTransform: "uppercase" }}>High-Impact STAR Version:</span>
                            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#ffffff", fontWeight: "600" }}>
                              "{bulletResult.improved}"
                            </p>
                          </div>
                        </div>

                        {bulletResult.keyChange && (
                          <div style={{ fontSize: "12px", color: "#d4d4d8", display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontWeight: "700", color: "#ffffff" }}>Key ATS Enhancement:</span>
                            <span>{bulletResult.keyChange}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>

                  <Card className="col-6" title="Missing Critical Keywords (Gaps)" icon={<CloseIcon width={20} height={20} />}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
                        Click <strong>+ Add</strong> on any gap to inject it directly into your resume:
                      </p>
                    </div>
                    <KeywordTags
                      keywords={atsResult.missingKeywords}
                      missing
                      onAddMissing={handleQuickAddMissingSkill}
                    />
                  </Card>

                  <Card className="col-6" title="Actionable ATS Tips" icon={<BulbIcon width={20} height={20} />}>
                    {atsResult.suggestions && atsResult.suggestions.length > 0 ? (
                      <ul className="tip-list">
                        {atsResult.suggestions.map((tip, i) => (
                          <li className="tip" key={i}>
                            <span className="tip__icon"><BulbIcon width={16} height={16} /></span>
                            <p className="tip__text">{tip}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <NotFound label="No suggestions" />
                    )}
                  </Card>

                  {/* Deep AI Review Card */}
                  <Card className="col-12" title="Ollama & Local AI Deep Evaluation" icon={<SparkleIcon width={20} height={20} />}>
                    {!aiReview && !aiLoading && (
                      <div style={{ textAlign: "center", padding: "24px 16px" }}>
                        <span style={{ display: "inline-flex", width: "48px", height: "48px", borderRadius: "14px", background: "rgba(255,255,255,0.08)", color: "#ffffff", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                          <SparkleIcon width={24} height={24} />
                        </span>
                        <h3 style={{ margin: "0 0 8px", fontSize: "18px", color: "#ffffff" }}>
                          Deep Qualitative LLM Audit
                        </h3>
                        <p style={{ color: "var(--text-muted)", maxWidth: "540px", margin: "0 auto 18px", fontSize: "14px" }}>
                          Evaluates semantic alignment beyond keyword matches: executive summary, strengths, and actionable roadmap using active model ({currentModel}).
                        </p>
                        <Button onClick={handleRunAiReview} icon={<SparkleIcon width={18} height={18} />}>
                          Generate Deep AI Audit
                        </Button>
                      </div>
                    )}

                    {aiLoading && (
                      <div style={{ textAlign: "center", padding: "30px" }}>
                        <div className="upload__spinner" style={{ margin: "0 auto 14px", width: "24px", height: "24px" }} />
                        <p style={{ color: "#ffffff", fontWeight: "600" }}>Running deep AI evaluation with {currentModel}…</p>
                      </div>
                    )}

                    {aiError && (
                      <div className="ats-error" role="alert">
                        <AlertIcon width={18} height={18} />
                        <span>{aiError}</span>
                      </div>
                    )}

                    {aiReview && !aiLoading && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                          <div>
                            <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)" }}>
                              Executive Verdict
                            </span>
                            <h4 style={{ margin: "4px 0 0", color: "#ffffff", fontSize: "1.2rem", fontWeight: "800" }}>
                              {aiReview.verdict || "Match Evaluated"}
                            </h4>
                          </div>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <Button onClick={handleRunAiReview} variant="secondary" icon={<SparkleIcon width={14} height={14} />}>
                              Re-evaluate
                            </Button>
                          </div>
                        </div>

                        {aiReview.executiveSummary && (
                          <div style={{ padding: "14px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                            <span style={{ fontSize: "12px", fontWeight: "700", color: "#ffffff", display: "block", marginBottom: "6px" }}>
                              Executive Profile Summary:
                            </span>
                            <p style={{ margin: 0, fontSize: "0.92rem", lineHeight: "1.6", color: "#e2e8f0" }}>
                              {aiReview.executiveSummary}
                            </p>
                          </div>
                        )}

                        <div className="grid-12">
                          {aiReview.keyStrengths && aiReview.keyStrengths.length > 0 && (
                            <div className="col-6">
                              <span style={{ fontSize: "12px", fontWeight: "700", color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                Key Candidate Strengths
                              </span>
                              <ul style={{ margin: "8px 0 0", paddingLeft: "18px", color: "#e2e8f0", fontSize: "13px", lineHeight: "1.7" }}>
                                {aiReview.keyStrengths.map((str, idx) => (
                                  <li key={idx}>{str}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {aiReview.criticalGaps && aiReview.criticalGaps.length > 0 && (
                            <div className="col-6">
                              <span style={{ fontSize: "12px", fontWeight: "700", color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                Critical Gaps to Address
                              </span>
                              <ul style={{ margin: "8px 0 0", paddingLeft: "18px", color: "#e2e8f0", fontSize: "13px", lineHeight: "1.7" }}>
                                {aiReview.criticalGaps.map((gap, idx) => (
                                  <li key={idx}>{gap}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                </>
              )}

              {/* 10-Point ATS Readiness & Rule Audit Checklist Card with 1-Click Fixes */}
              <div className="col-12" style={{ marginTop: "24px" }}>
                <AtsRuleChecklistCard
                  resume={resume}
                  jobDescription={jobDescription}
                  onApplyFix={handleApplyRuleFix}
                  currentScore={atsResult?.atsScore || 78}
                />
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 2: ATS RESUME VISUAL PREVIEW & FORMATTER
              ======================================================== */}
          {activeTab === "preview" && (
            <div className="dashboard__grid">
              <Card className="col-12" title="ATS-Compliant Resume Visual Preview & Formatter" icon={<DocumentIcon width={20} height={20} />}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
                  <p className="ats-intro" style={{ margin: 0 }}>
                    Standardized, 100% ATS-readable single-column layout engineered to pass all major Applicant Tracking Systems (Workday, Greenhouse, Lever, Taleo).
                  </p>

                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", gap: "4px", background: "rgba(0,0,0,0.4)", padding: "3px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                      <button
                        type="button"
                        onClick={() => setResumeTemplateTheme("modern")}
                        style={{
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "700",
                          border: "none",
                          cursor: "pointer",
                          background: resumeTemplateTheme === "modern" ? "rgba(255,255,255,0.15)" : "transparent",
                          color: resumeTemplateTheme === "modern" ? "#ffffff" : "#94a3b8",
                        }}
                      >
                        Modern Dark
                      </button>
                      <button
                        type="button"
                        onClick={() => setResumeTemplateTheme("white")}
                        style={{
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "700",
                          border: "none",
                          cursor: "pointer",
                          background: resumeTemplateTheme === "white" ? "#ffffff" : "transparent",
                          color: resumeTemplateTheme === "white" ? "#000000" : "#94a3b8",
                        }}
                      >
                        Printable White
                      </button>
                      <button
                        type="button"
                        onClick={() => setResumeTemplateTheme("academic")}
                        style={{
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "700",
                          border: "none",
                          cursor: "pointer",
                          background: resumeTemplateTheme === "academic" ? "#ffffff" : "transparent",
                          color: resumeTemplateTheme === "academic" ? "#000000" : "#94a3b8",
                        }}
                      >
                        Harvard Serif
                      </button>
                    </div>

                    <Button onClick={handlePrint} variant="secondary" icon={<PrinterIcon width={14} height={14} />}>
                      Print ATS PDF
                    </Button>
                    <Button onClick={handleOpenEditor} variant="secondary" icon={<EditIcon width={14} height={14} />}>
                      Edit Content
                    </Button>
                  </div>
                </div>

                {/* ATS Keyword Heatmap & Density Inspector */}
                <div style={{ marginBottom: "20px", padding: "16px 20px", borderRadius: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.15)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: "800", color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        ⚡ Live ATS Keyword Density & Heatmap Inspector
                      </span>
                      <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
                        Recruiter ATS algorithms penalize keyword deficiency (&lt;1.5%) and keyword stuffing (&gt;4.0%).
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase" }}>Calculated Density:</span>
                        <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "#ffffff" }}>
                          {(((atsResult?.matchedKeywords || []).reduce((sum, kw) => sum + getKeywordOccurrenceCount(kw), 0) / Math.max((resume?.full_text || "").split(/\s+/).filter(Boolean).length || 450, 100)) * 100).toFixed(1)}% <span style={{ fontSize: "11px", color: "#d4d4d8", fontWeight: "normal" }}>({(((atsResult?.matchedKeywords || []).reduce((sum, kw) => sum + getKeywordOccurrenceCount(kw), 0) / Math.max((resume?.full_text || "").split(/\s+/).filter(Boolean).length || 450, 100)) * 100) < 1.5 ? "Low Density" : "Optimal (2.0-3.5%)"})</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setHighlightHeatmap((prev) => !prev)}
                        style={{
                          padding: "6px 14px",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: "700",
                          cursor: "pointer",
                          background: highlightHeatmap ? "#ffffff" : "rgba(255,255,255,0.08)",
                          color: highlightHeatmap ? "#000000" : "#ffffff",
                          border: highlightHeatmap ? "1px solid #ffffff" : "1px solid rgba(255,255,255,0.2)",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {highlightHeatmap ? "Heatmap Highlight: ON" : "Toggle Heatmap Highlight"}
                      </button>
                    </div>
                  </div>

                  {atsResult?.matchedKeywords && atsResult.matchedKeywords.length > 0 && (
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {atsResult.matchedKeywords.map((kw, ki) => {
                        const count = getKeywordOccurrenceCount(kw);
                        return (
                          <span
                            key={ki}
                            style={{
                              fontSize: "11px",
                              padding: "3px 8px",
                              borderRadius: "4px",
                              background: highlightHeatmap ? "#ffffff" : "rgba(255,255,255,0.08)",
                              color: highlightHeatmap ? "#000000" : "#ffffff",
                              fontWeight: "600",
                              border: "1px solid rgba(255,255,255,0.2)",
                            }}
                          >
                            {kw} {count > 0 ? `(${count}x)` : ""}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Resume Paper Sheet */}
                <div className={`ats-resume-sheet ats-resume-sheet--${resumeTemplateTheme}`}>
                  {/* Header */}
                  <div style={{ textAlign: "center", marginBottom: "16px" }}>
                    <h1 style={{ margin: "0 0 6px", fontSize: "1.7rem", fontWeight: "800", letterSpacing: "-0.02em" }}>
                      {resume?.contact?.name || "Candidate"}
                    </h1>
                    <div className="resume-subtext" style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap", fontSize: "0.88rem" }}>
                      {resume?.contact?.email && <span>{resume.contact.email}</span>}
                      {resume?.contact?.email && resume?.contact?.phone && <span>•</span>}
                      {resume?.contact?.phone && <span>{resume.contact.phone}</span>}
                      {resume?.contact?.linkedin && (
                        <>
                          <span>•</span>
                          <span>{resume.contact.linkedin}</span>
                        </>
                      )}
                      {resume?.contact?.github && (
                        <>
                          <span>•</span>
                          <span>{resume.contact.github}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Summary */}
                  {tailorResult?.tailoredSummary ? (
                    <div>
                      <div className="resume-section-title">Professional Summary</div>
                      <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: "1.6" }}>
                        {tailorResult.tailoredSummary}
                      </p>
                    </div>
                  ) : null}

                  {/* Technical Skills */}
                  {resume?.skills && resume.skills.length > 0 && (
                    <div>
                      <div className="resume-section-title">Technical Competencies</div>
                      <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: "1.6" }}>
                        <strong>Core Technologies:</strong> {resume.skills.join(" • ")}
                      </p>
                    </div>
                  )}

                  {/* Experience */}
                  {resume?.experience && resume.experience.length > 0 && (
                    <div>
                      <div className="resume-section-title">Professional Work Experience</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
                        {resume.experience.map((exp, idx) => (
                          <div key={idx} style={{ fontSize: "0.88rem", lineHeight: "1.6" }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                              <span style={{ color: "var(--mono-400)" }}>•</span>
                              <span>{exp}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Projects */}
                  {resume?.projects && resume.projects.length > 0 && (
                    <div>
                      <div className="resume-section-title">Key Projects & Implementations</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
                        {resume.projects.map((proj, idx) => (
                          <div key={idx} style={{ fontSize: "0.88rem", lineHeight: "1.6" }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                              <span style={{ color: "var(--mono-400)" }}>•</span>
                              <span>{proj}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {resume?.education && resume.education.length > 0 && (
                    <div>
                      <div className="resume-section-title">Education & Credentials</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
                        {resume.education.map((edu, idx) => (
                          <div key={idx} style={{ fontSize: "0.88rem", lineHeight: "1.6" }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                              <span style={{ color: "var(--mono-400)" }}>•</span>
                              <span>{edu}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* ========================================================
              TAB 3: AI RESUME TAILOR STUDIO
              ======================================================== */}
          {activeTab === "tailor" && (
            <div className="dashboard__grid">
              <Card className="col-12" title="AI Resume Tailor & STAR Bullet Optimization Studio" icon={<WandIcon width={20} height={20} />}>
                <p className="ats-intro">
                  Transforms your resume bullets into high-impact STAR (Situation, Task, Action, Result) accomplishments with quantified metrics, and generates a tailored summary targeting your desired job.
                </p>

                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "18px", alignItems: "center" }}>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="Target Role Title (e.g. Senior Full-Stack Engineer)"
                    style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(7,8,12,0.8)", border: "1px solid var(--border-strong)", color: "#ffffff", minWidth: "260px" }}
                  />
                  <Button onClick={handleRunTailor} disabled={tailorLoading} icon={<WandIcon width={16} height={16} />}>
                    {tailorLoading ? "Tailoring Bullets with AI…" : "Generate Tailored Resume"}
                  </Button>
                </div>

                {tailorResult && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                    {/* Tailored Summary */}
                    <div style={{ padding: "16px", borderRadius: "10px", background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.18)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontSize: "13px", fontWeight: "700", color: "#ffffff" }}>
                          AI-Optimized Professional Summary:
                        </span>
                        <CopyButton text={tailorResult.tailoredSummary} label="Copy Summary" />
                      </div>
                      <p style={{ margin: 0, fontSize: "0.92rem", lineHeight: "1.6", color: "#e2e8f0" }}>
                        {tailorResult.tailoredSummary}
                      </p>
                    </div>

                    {/* Bullet Rewrites */}
                    <div>
                      <h4 style={{ color: "#ffffff", fontSize: "1rem", marginBottom: "12px" }}>
                        STAR Bullet Point Enhancements:
                      </h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {(tailorResult.bulletRewrites || []).map((b, idx) => (
                          <div key={idx} className="bullet-rewrite-card">
                            <div style={{ marginBottom: "8px" }}>
                              <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700" }}>
                                Original Bullet:
                              </span>
                              <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: "0.88rem", textDecoration: "line-through" }}>
                                {b.original}
                              </p>
                            </div>

                            <div style={{ marginBottom: "8px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: "11px", color: "#ffffff", textTransform: "uppercase", fontWeight: "800" }}>
                                  STAR Rewritten with Metrics:
                                </span>
                                <CopyButton text={b.tailored} label="Copy" />
                              </div>
                              <p style={{ margin: "4px 0 0", color: "#ffffff", fontWeight: "600", fontSize: "0.92rem" }}>
                                {b.tailored}
                              </p>
                            </div>

                            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", paddingTop: "6px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                              <span style={{ fontSize: "11px", color: "#ffffff", background: "rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: "4px", fontWeight: "700" }}>
                                Impact: {b.impactMetric}
                              </span>
                              {(b.keywordsAdded || []).map((k, ki) => (
                                <span key={ki} style={{ fontSize: "11px", color: "#e4e4e7", background: "rgba(255,255,255,0.08)", padding: "2px 8px", borderRadius: "4px" }}>
                                  +{k}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Markdown Download & Export */}
                    {tailorResult.fullTailoredResumeMarkdown && (
                      <div style={{ marginTop: "16px", padding: "16px", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                          <span style={{ fontSize: "13px", fontWeight: "700", color: "#ffffff" }}>
                            Full ATS-Formatted Tailored Resume Document:
                          </span>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <Button variant="secondary" onClick={() => handleDownloadTailoredResume("md")} icon={<DownloadIcon width={14} height={14} />}>
                              Download Markdown (.md)
                            </Button>
                            <Button variant="secondary" onClick={() => handleDownloadTailoredResume("txt")} icon={<DownloadIcon width={14} height={14} />}>
                              Download Text (.txt)
                            </Button>
                            <CopyButton text={tailorResult.fullTailoredResumeMarkdown} label="Copy Resume" />
                          </div>
                        </div>
                        <pre style={{ maxHeight: "240px", overflowY: "auto", fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--mono-300)", whiteSpace: "pre-wrap", background: "rgba(0,0,0,0.5)", padding: "12px", borderRadius: "8px" }}>
                          {tailorResult.fullTailoredResumeMarkdown}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ========================================================
              TAB 4: AI EXECUTIVE COVER LETTER
              ======================================================== */}
          {activeTab === "coverletter" && (
            <div className="dashboard__grid">
              <Card className="col-12" title="AI Executive Cover Letter Generator" icon={<DocumentIcon width={20} height={20} />}>
                <p className="ats-intro">
                  Generates an individualized, persuasive cover letter matching candidate accomplishments with the employer&apos;s specific job requirements.
                </p>

                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "18px", alignItems: "center" }}>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Target Company Name (e.g. OpenAI, Google, Stripe)"
                    style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(7,8,12,0.8)", border: "1px solid var(--border-strong)", color: "#ffffff", minWidth: "240px" }}
                  />

                  <select
                    value={coverTone}
                    onChange={(e) => setCoverTone(e.target.value)}
                    style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(7,8,12,0.8)", border: "1px solid var(--border-strong)", color: "#ffffff" }}
                  >
                    <option value="Professional & Authoritative">Professional & Authoritative</option>
                    <option value="Technical & Metrics-Driven">Technical & Metrics-Driven</option>
                    <option value="Creative & Passionate">Creative & Passionate</option>
                    <option value="Concise Executive">Concise Executive</option>
                  </select>

                  <Button onClick={handleRunCoverLetter} disabled={coverLoading} icon={<WandIcon width={16} height={16} />}>
                    {coverLoading ? "Drafting Cover Letter…" : "Generate Cover Letter"}
                  </Button>
                </div>

                {coverLetterResult && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        Hook: <em>&ldquo;{coverLetterResult.hook}&rdquo;</em>
                      </span>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <Button variant="secondary" onClick={() => handleDownloadCoverLetter("md")} icon={<DownloadIcon width={14} height={14} />}>
                          Download (.md)
                        </Button>
                        <Button variant="secondary" onClick={() => handleDownloadCoverLetter("txt")} icon={<DownloadIcon width={14} height={14} />}>
                          Download (.txt)
                        </Button>
                        <CopyButton text={coverLetterResult.coverLetter} label="Copy Letter" />
                      </div>
                    </div>
                    <div className="cover-letter-paper" style={{ whiteSpace: "pre-wrap", lineHeight: "1.7", fontSize: "0.95rem" }}>
                      {coverLetterResult.coverLetter}
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ========================================================
              TAB 5: INTERVIEW SIMULATOR & ANSWER GRADER
              ======================================================== */}
          {activeTab === "interview" && (
            <div className="dashboard__grid">
              <Card className="col-12" title="AI Interview Preparation & Interactive Answer Simulator" icon={<MicIcon width={20} height={20} />}>
                {/* Full-Screen Studio Launch Banner */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.03) 100%)",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  boxShadow: "0 0 25px rgba(255, 255, 255, 0.08)",
                  marginBottom: "20px",
                  flexWrap: "wrap",
                  gap: "14px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      background: "#ffffff",
                      color: "#000000",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: "20px",
                    }}>
                      🎙️
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "16px", color: "#ffffff" }}>
                        Launch Live Voice AI Mock Interview Room
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        Full-screen conversational voice simulation with 4 AI personas, live speech-to-text, and real-time STAR grading.
                      </div>
                    </div>
                  </div>

                  <Button
                    as={Link}
                    to="/interview"
                    state={{ resume, targetRole, jobDescription }}
                    icon={<MicIcon width={16} height={16} />}
                    style={{ background: "#ffffff", color: "#000000" }}
                  >
                    Open Live Studio
                  </Button>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                  <p className="ats-intro" style={{ margin: 0 }}>
                    Questions generated specifically for your profile vs target job gaps. Practice with speech recognition and our mock answer timer!
                  </p>

                  {/* 2-Minute Countdown Timer */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "6px 14px", borderRadius: "8px", background: "rgba(0,0,0,0.4)", border: "1px solid var(--border)" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "700", textTransform: "uppercase" }}>Mock Timer:</span>
                    <span style={{
                      fontSize: "1.1rem",
                      fontWeight: "800",
                      fontFamily: "var(--font-mono)",
                      color: timerSeconds <= 15 ? "#71717a" : timerSeconds <= 30 ? "#d4d4d8" : "#ffffff",
                    }}>
                      {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, "0")}
                    </span>
                    <button
                      type="button"
                      onClick={() => setTimerRunning((prev) => !prev)}
                      style={{
                        padding: "3px 10px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "700",
                        cursor: "pointer",
                        border: "1px solid rgba(255,255,255,0.2)",
                        background: timerRunning ? "#ffffff" : "rgba(255,255,255,0.1)",
                        color: timerRunning ? "#000000" : "#ffffff",
                      }}
                    >
                      {timerRunning ? "Pause" : "Start"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTimerRunning(false); setTimerSeconds(120); }}
                      style={{
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        color: "#94a3b8",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
                  <Button onClick={handleRunInterviewPrep} disabled={interviewLoading} icon={<MicIcon width={16} height={16} />}>
                    {interviewLoading ? "Generating Questions…" : "Regenerate Questions"}
                  </Button>
                </div>

                {interviewPrep && (
                  <div className="grid-12">
                    {/* Questions List */}
                    <div className="col-6" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <span style={{ fontSize: "13px", fontWeight: "700", color: "#ffffff" }}>
                        Role-Specific Questions ({interviewPrep.questions?.length || 0}):
                      </span>
                      {(interviewPrep.questions || []).map((q) => (
                        <div
                          key={q.id}
                          className="interview-item"
                          onClick={() => { setActiveQuestion(q); setGradeResult(null); }}
                          style={{
                            cursor: "pointer",
                            borderColor: activeQuestion?.id === q.id ? "#ffffff" : "var(--border)",
                            background: activeQuestion?.id === q.id ? "rgba(255,255,255,0.06)" : undefined,
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span className="interview-category-tag">{q.category}</span>
                            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{q.id}</span>
                          </div>
                          <p style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.92rem", margin: "6px 0" }}>
                            {q.question}
                          </p>
                          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                            <strong>Why asked:</strong> {q.whyTheyAsk}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Simulator Pane */}
                    <div className="col-6">
                      {activeQuestion ? (
                        <div className="simulator-box">
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700" }}>
                              Simulate Answer:
                            </span>
                            <button
                              type="button"
                              onClick={() => handleSpeakQuestion(activeQuestion.question)}
                              className={isSpeaking ? "audio-pulse" : ""}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                background: isSpeaking ? "#ffffff" : "rgba(255,255,255,0.06)",
                                border: isSpeaking ? "1px solid #ffffff" : "1px solid rgba(255,255,255,0.15)",
                                color: isSpeaking ? "#000000" : "#e2e8f0",
                                padding: "4px 10px",
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontWeight: "600",
                                cursor: "pointer",
                              }}
                            >
                              <VolumeIcon width={14} height={14} />
                              {isSpeaking ? "Listening..." : "Read Aloud"}
                            </button>
                          </div>

                          <h4 style={{ color: "#ffffff", margin: "8px 0 12px", fontSize: "1rem" }}>
                            {activeQuestion.question}
                          </h4>

                          <div style={{ padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", marginBottom: "12px", fontSize: "12px", color: "var(--text)" }}>
                            <strong style={{ color: "#ffffff" }}>Ideal Blueprint:</strong> {activeQuestion.idealAnswerBlueprint}
                          </div>

                          <textarea
                            className="ats-textarea"
                            rows={5}
                            placeholder="Type or dictate your answer using the STAR method (Situation, Task, Action, Result)…"
                            value={userAnswerText}
                            onChange={(e) => setUserAnswerText(e.target.value)}
                          />

                          <div style={{ marginTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <Button onClick={handleGradeAnswer} disabled={!userAnswerText.trim() || gradingLoading} icon={<StarIcon width={16} height={16} />}>
                                {gradingLoading ? "Grading Answer…" : "Grade My Answer"}
                              </Button>
                              <button
                                type="button"
                                onClick={handleStartVoiceInput}
                                className={isRecording ? "audio-pulse" : ""}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  background: isRecording ? "#ffffff" : "rgba(255,255,255,0.06)",
                                  border: isRecording ? "1px solid #ffffff" : "1px solid rgba(255,255,255,0.15)",
                                  color: isRecording ? "#000000" : "#e2e8f0",
                                  padding: "8px 12px",
                                  borderRadius: "8px",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  cursor: "pointer",
                                }}
                              >
                                <MicIcon width={15} height={15} />
                                {isRecording ? "Recording…" : "Voice Input"}
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={handleLoadSampleAnswer}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: "#94a3b8",
                                fontSize: "11px",
                                cursor: "pointer",
                                textDecoration: "underline",
                              }}
                            >
                              Fill Sample Answer
                            </button>
                          </div>

                          {gradeResult && (
                            <div style={{ marginTop: "16px", padding: "14px", borderRadius: "10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.14)" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                <span className="grade-badge" style={{ background: "#ffffff", color: "#000000", fontWeight: "800" }}>
                                  Score: {gradeResult.score}/10 ({gradeResult.verdict})
                                </span>
                              </div>
                              <p style={{ color: "#ffffff", fontSize: "0.88rem", margin: "6px 0" }}>
                                {gradeResult.feedback}
                              </p>

                              {gradeResult.polishedAnswer && (
                                <div style={{ marginTop: "10px", padding: "10px", borderRadius: "6px", background: "rgba(7,8,12,0.8)", border: "1px solid var(--border)" }}>
                                  <span style={{ fontSize: "11px", color: "#ffffff", fontWeight: "700" }}>10/10 Model STAR Response:</span>
                                  <p style={{ color: "#e2e8f0", fontSize: "0.85rem", marginTop: "4px", lineHeight: "1.5" }}>
                                    {gradeResult.polishedAnswer}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <NotFound label="Select a question from the left to start simulator" />
                      )}
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ========================================================
              TAB 6: SALARY & MARKET WORTH ESTIMATOR
              ======================================================== */}
          {activeTab === "salary" && (
            <div className="dashboard__grid">
              <Card className="col-12" title="Salary & Market Fit Intelligence" icon={<DollarIcon width={20} height={20} />}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                  <p className="ats-intro" style={{ margin: 0 }}>
                    Computes market compensation bands based on parsed seniority level and tech stack depth.
                  </p>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600" }}>Currency:</span>
                    {Object.keys(CURRENCIES).map((cur) => (
                      <button
                        key={cur}
                        type="button"
                        onClick={() => setCurrency(cur)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "700",
                          cursor: "pointer",
                          border: currency === cur ? "1px solid #ffffff" : "1px solid rgba(255,255,255,0.15)",
                          background: currency === cur ? "#ffffff" : "rgba(255,255,255,0.05)",
                          color: currency === cur ? "#000000" : "#e2e8f0",
                        }}
                      >
                        {CURRENCIES[cur].label}
                      </button>
                    ))}
                  </div>
                </div>

                {salaryData ? (
                  <div>
                    <div className="salary-display">
                      <div>
                        <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: "700" }}>
                          Estimated Annual Compensation Band:
                        </span>
                        <div className="salary-figure">
                          {formatSalaryAmount(salaryData.estimatedRange.min)} – {formatSalaryAmount(salaryData.estimatedRange.max)}
                        </div>
                        <span style={{ fontSize: "13px", color: "#ffffff", fontWeight: "600" }}>
                          Seniority Level: {salaryData.seniority} (Median: {formatSalaryAmount(salaryData.estimatedRange.median)}/yr)
                        </span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Market Benchmark</span>
                        <div style={{ fontSize: "1rem", fontWeight: "700", color: "#ffffff" }}>US Tech & Global Remote</div>
                      </div>
                    </div>

                    <div className="grid-12">
                      <div className="col-6">
                        <span style={{ fontSize: "13px", fontWeight: "700", color: "#ffffff" }}>
                          High-Value Skills Detected in Your Resume:
                        </span>
                        <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                          {(salaryData.skillPremiumsDetected || []).map((sk, idx) => (
                            <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderRadius: "6px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                              <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.88rem" }}>{sk.skill}</span>
                              <span style={{ color: "#ffffff", fontSize: "0.85rem", fontWeight: "700" }}>
                                +{formatSalaryAmount(sk.premium)} market premium
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="col-6">
                        <span style={{ fontSize: "13px", fontWeight: "700", color: "#ffffff" }}>
                          Highest ROI Skills to Learn Next:
                        </span>
                        <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                          {(salaryData.highestRoiMissingSkills || []).map((sk, idx) => (
                            <div key={idx} style={{ padding: "8px 12px", borderRadius: "6px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "#ffffff", fontWeight: "700", fontSize: "0.88rem" }}>{sk.skill}</span>
                                <span style={{ color: "#ffffff", fontWeight: "800", fontSize: "0.85rem" }}>{sk.estimatedBoost}</span>
                              </div>
                              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>{sk.recommendation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "30px" }}>
                    <Button onClick={() => handleRunSalary()} disabled={salaryLoading} icon={<DollarIcon width={16} height={16} />}>
                      {salaryLoading ? "Calculating..." : "Calculate Market Value"}
                    </Button>
                  </div>
                )}
              </Card>

              {/* AI Salary & Offer Negotiation Coach Card */}
              <div className="col-12" style={{ marginTop: "24px" }}>
                <NegotiationCoachCard
                  defaultRole={targetRole || "Senior Full-Stack Engineer"}
                  defaultLocation="US / Remote"
                />
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 7: ATS RED FLAGS AUDIT
              ======================================================== */}
          {activeTab === "audit" && (
            <div className="dashboard__grid">
              <Card className="col-12" title="ATS Red Flags & Formatting Compliance Audit" icon={<ShieldCheckIcon width={20} height={20} />}>
                <p className="ats-intro">
                  Audits your resume against 20+ algorithmic filters: weak buzzwords, action-verb density, quantifiable metrics ratio, and layout readability.
                </p>

                {auditData ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                    <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "center", padding: "16px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                      <div>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700" }}>
                          ATS Formatting Health Score:
                        </span>
                        <div style={{ fontSize: "2rem", fontWeight: "800", color: "#ffffff" }}>
                          {auditData.auditScore} / 100
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
                        <div style={{ padding: "8px 14px", borderRadius: "8px", background: "rgba(0,0,0,0.4)" }}>
                          <span style={{ fontSize: "11px", color: "#94a3b8" }}>Quantified Metrics</span>
                          <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#ffffff" }}>{auditData.metricsFoundCount} found</div>
                        </div>
                        <div style={{ padding: "8px 14px", borderRadius: "8px", background: "rgba(0,0,0,0.4)" }}>
                          <span style={{ fontSize: "11px", color: "#94a3b8" }}>Strong Action Verbs</span>
                          <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#ffffff" }}>{auditData.strongActionVerbsCount} detected</div>
                        </div>
                        <div style={{ padding: "8px 14px", borderRadius: "8px", background: "rgba(0,0,0,0.4)" }}>
                          <span style={{ fontSize: "11px", color: "#94a3b8" }}>Cliche Buzzwords</span>
                          <div style={{ fontSize: "1.1rem", fontWeight: "700", color: auditData.buzzwordsFound.length > 0 ? "#a1a1aa" : "#ffffff" }}>
                            {auditData.buzzwordsFound.length} flagged
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid-12">
                      <div className="col-6">
                        <span style={{ fontSize: "13px", fontWeight: "700", color: "#a1a1aa" }}>
                          Cliche Buzzwords Flagged by Recruiters:
                        </span>
                        {auditData.buzzwordsFound && auditData.buzzwordsFound.length > 0 ? (
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
                            {auditData.buzzwordsFound.map((b, i) => (
                              <span key={i} className="skill-tag skill-tag--missing">
                                {b}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p style={{ color: "#ffffff", fontSize: "13px", marginTop: "8px" }}>
                            ✓ Zero generic cliches found! Great job.
                          </p>
                        )}
                      </div>

                      <div className="col-6">
                        <span style={{ fontSize: "13px", fontWeight: "700", color: "#ffffff" }}>
                          Actionable Structural Fixes:
                        </span>
                        <ul style={{ margin: "8px 0 0", paddingLeft: "18px", color: "#e2e8f0", fontSize: "13px", lineHeight: "1.6" }}>
                          {(auditData.recommendations || []).map((rec, i) => (
                            <li key={i}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "30px" }}>
                    <Button onClick={() => handleRunAudit()} disabled={auditLoading} icon={<ShieldCheckIcon width={16} height={16} />}>
                      {auditLoading ? "Auditing Layout…" : "Run Full Red Flags Audit"}
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ========================================================
              TAB 8: MULTI-JOB BATTLE MATRIX
              ======================================================== */}
          {activeTab === "multi" && (
            <div className="dashboard__grid">
              <Card className="col-12" title="Multi-Job Description Match Battle (Matrix)" icon={<GitCompareIcon width={20} height={20} />}>
                <p className="ats-intro">
                  Compare your resume against multiple job descriptions in parallel to see which position yields the highest ATS match score and easiest interview conversion.
                </p>

                {/* Add Custom Target Job */}
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "18px", padding: "14px", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}>
                  <input
                    type="text"
                    value={customJobTitle}
                    onChange={(e) => setCustomJobTitle(e.target.value)}
                    placeholder="Add Job Title (e.g. AI Systems Engineer)"
                    style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(7,8,12,0.8)", border: "1px solid var(--border-strong)", color: "#ffffff", minWidth: "220px", fontSize: "13px" }}
                  />
                  <input
                    type="text"
                    value={customJobText}
                    onChange={(e) => setCustomJobText(e.target.value)}
                    placeholder="Job requirements or keywords (e.g. Python, Docker, PyTorch, Kubernetes)"
                    style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", background: "rgba(7,8,12,0.8)", border: "1px solid var(--border-strong)", color: "#ffffff", minWidth: "260px", fontSize: "13px" }}
                  />
                  <Button onClick={handleAddCustomJob} disabled={!customJobTitle.trim() || !customJobText.trim()} icon={<TargetIcon width={14} height={14} />}>
                    + Add to Battle
                  </Button>
                </div>

                {multiJobData ? (
                  <div>
                    {multiJobData.bestFitRole && (
                      <div style={{ padding: "14px 18px", borderRadius: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.2)", marginBottom: "18px" }}>
                        <span style={{ fontSize: "11px", fontWeight: "800", color: "#ffffff", textTransform: "uppercase" }}>Recommended Best Fit:</span>
                        <h4 style={{ color: "#ffffff", margin: "4px 0", fontSize: "1.1rem" }}>
                          {multiJobData.bestFitRole.title} ({multiJobData.bestFitRole.company}) — {multiJobData.bestFitRole.atsScore}% Score
                        </h4>
                      </div>
                    )}

                    <div style={{ overflowX: "auto" }}>
                      <table className="matrix-table">
                        <thead>
                          <tr>
                            <th>Job Role</th>
                            <th>Company</th>
                            <th>ATS Score</th>
                            <th>Skill Overlap</th>
                            <th>Matched Keywords</th>
                            <th>Missing Gaps</th>
                            <th>Verdict</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(multiJobData.rankedJobs || []).map((job) => (
                            <tr key={job.id}>
                              <td style={{ fontWeight: "700", color: "#ffffff" }}>{job.title}</td>
                              <td>{job.company}</td>
                              <td style={{ fontWeight: "800", color: "#ffffff" }}>
                                {job.atsScore}%
                              </td>
                              <td>{job.skillMatch}%</td>
                              <td>
                                <span style={{ color: "#ffffff", fontSize: "12px" }}>
                                  {job.matchedKeywords.slice(0, 3).join(", ")}
                                </span>
                              </td>
                              <td>
                                <span style={{ color: "#a1a1aa", fontSize: "12px" }}>
                                  {job.missingKeywords.slice(0, 3).join(", ")}
                                </span>
                              </td>
                              <td>
                                <span className="tag tag--brand">{job.verdict}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "30px" }}>
                    <Button onClick={() => handleRunMultiMatch()} disabled={multiLoading} icon={<GitCompareIcon width={16} height={16} />}>
                      {multiLoading ? "Comparing JDs…" : "Run Multi-Job Comparison"}
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ========================================================
              TAB 9: CAREER COACH CHAT
              ======================================================== */}
          {activeTab === "chat" && (
            <div className="dashboard__grid">
              <Card className="col-12" title="Obsidian AI Career Coach & Strategist" icon={<MessageIcon width={20} height={20} />}>
                <p className="ats-intro">
                  Chat directly with your local AI career advisor powered by {currentModel}. Ask questions about salary negotiation, STAR formatting, or resume tailoring.
                </p>

                <div className="chat-window">
                  {messages.map((m, idx) => (
                    <div key={idx} className={`chat-bubble chat-bubble--${m.role}`}>
                      {m.content}
                    </div>
                  ))}
                  {chatSending && (
                    <div className="chat-bubble chat-bubble--assistant">
                      <span className="upload__spinner" style={{ display: "inline-block", width: "12px", height: "12px", marginRight: "6px" }} />
                      Consulting career coach ({currentModel})…
                    </div>
                  )}
                </div>

                <form className="chat-form" onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    className="chat-input"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask anything, e.g. 'Rewrite my Acme experience bullet to highlight Kubernetes'…"
                  />
                  <Button type="submit" disabled={!chatInput.trim() || chatSending} icon={<SparkleIcon width={16} height={16} />}>
                    Send
                  </Button>
                </form>
              </Card>
            </div>
          )}

          {/* ========================================================
              TAB 10: CANDIDATE HEAD-TO-HEAD BATTLE
              ======================================================== */}
          {activeTab === "battle" && (
            <div className="dashboard__grid">
              <Card className="col-12" title="Candidate Head-to-Head Resume Battle" icon={<GitCompareIcon width={20} height={20} />}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
                  <p className="ats-intro" style={{ margin: 0 }}>
                    Pit the current candidate against another profile to see who scores higher against the target Job Description, compare unique strengths, and review AI recruiter hiring recommendations.
                  </p>
                  {sampleData?.resumes && (
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>Choose Opponent:</span>
                      {sampleData.resumes.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setSelectedOpponentId(s.id);
                            handleRunBattle(s.data);
                          }}
                          className={`demo-chip ${selectedOpponentId === s.id ? "demo-chip--active" : ""}`}
                          style={{
                            background: selectedOpponentId === s.id ? "#ffffff" : "rgba(255,255,255,0.05)",
                            border: selectedOpponentId === s.id ? "1px solid #ffffff" : "1px solid var(--border)",
                            color: selectedOpponentId === s.id ? "#000000" : "#e2e8f0",
                          }}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {battleLoading ? (
                  <div style={{ textAlign: "center", padding: "40px" }}>
                    <span className="upload__spinner" style={{ display: "inline-block", width: "24px", height: "24px", marginBottom: "12px" }} />
                    <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                      AI evaluating and comparing both candidates against target role…
                    </p>
                  </div>
                ) : battleResult ? (
                  <div>
                    {/* Leader Banner */}
                    <div
                      style={{
                        padding: "16px 20px",
                        borderRadius: "12px",
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.25)",
                        marginBottom: "20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "12px",
                      }}
                    >
                      <div>
                        <span style={{ fontSize: "11px", fontWeight: "800", color: "#ffffff", textTransform: "uppercase" }}>
                          AI Recruiter Match Verdict:
                        </span>
                        <h3 style={{ color: "#ffffff", margin: "4px 0", fontSize: "1.2rem" }}>
                          🏆 Winner / Leader: {battleResult.leader} {battleResult.scoreDiff !== 0 ? `(${Math.abs(battleResult.scoreDiff)}% ATS Delta)` : ""}
                        </h3>
                        <p style={{ color: "var(--mono-200)", fontSize: "13px", margin: "4px 0 0", lineHeight: "1.5" }}>
                          {battleResult.recruiterVerdict}
                        </p>
                      </div>
                      <CopyButton text={`Candidate Battle Verdict:\nLeader: ${battleResult.leader}\n${battleResult.recruiterVerdict}`} label="Copy Verdict" />
                    </div>

                    {/* Side-by-Side Cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                      {/* Candidate A */}
                      <div
                        style={{
                          padding: "20px",
                          borderRadius: "14px",
                          background: battleResult.leader === battleResult.candidateA.name ? "rgba(255,255,255,0.06)" : "rgba(18,21,33,0.7)",
                          border: battleResult.leader === battleResult.candidateA.name ? "1px solid rgba(255,255,255,0.3)" : "1px solid var(--border)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                          <div>
                            <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Current Candidate</span>
                            <h4 style={{ color: "#ffffff", margin: "2px 0 0", fontSize: "1.2rem" }}>{battleResult.candidateA.name}</h4>
                          </div>
                          <div style={{ width: "54px", height: "54px", borderRadius: "50%", display: "grid", placeItems: "center", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.35)", color: "#ffffff", fontWeight: "800", fontSize: "1.2rem" }}>
                            {battleResult.candidateA.atsScore}%
                          </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
                          <div>
                            <strong style={{ color: "var(--text-muted)" }}>Skill Match:</strong> <span style={{ color: "#ffffff" }}>{battleResult.candidateA.skillMatch}%</span>
                          </div>
                          <div>
                            <strong style={{ color: "var(--text-muted)" }}>Matched Keywords ({battleResult.candidateA.matchedKeywords.length}):</strong>
                            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "4px" }}>
                              {battleResult.candidateA.matchedKeywords.slice(0, 6).map((k, ki) => (
                                <span key={ki} className="tag tag--brand" style={{ fontSize: "11px" }}>{k}</span>
                              ))}
                            </div>
                          </div>
                          {battleResult.candidateA.uniqueSkills.length > 0 && (
                            <div>
                              <strong style={{ color: "#ffffff" }}>Unique Advantages:</strong>
                              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "4px" }}>
                                {battleResult.candidateA.uniqueSkills.slice(0, 5).map((u, ui) => (
                                  <span key={ui} style={{ background: "rgba(255,255,255,0.1)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: "4px", fontSize: "11px" }}>
                                    ★ {u}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Candidate B */}
                      <div
                        style={{
                          padding: "20px",
                          borderRadius: "14px",
                          background: battleResult.leader === battleResult.candidateB.name ? "rgba(255,255,255,0.06)" : "rgba(18,21,33,0.7)",
                          border: battleResult.leader === battleResult.candidateB.name ? "1px solid rgba(255,255,255,0.3)" : "1px solid var(--border)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                          <div>
                            <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Benchmark Opponent</span>
                            <h4 style={{ color: "#ffffff", margin: "2px 0 0", fontSize: "1.2rem" }}>{battleResult.candidateB.name}</h4>
                          </div>
                          <div style={{ width: "54px", height: "54px", borderRadius: "50%", display: "grid", placeItems: "center", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.35)", color: "#ffffff", fontWeight: "800", fontSize: "1.2rem" }}>
                            {battleResult.candidateB.atsScore}%
                          </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
                          <div>
                            <strong style={{ color: "var(--text-muted)" }}>Skill Match:</strong> <span style={{ color: "#ffffff" }}>{battleResult.candidateB.skillMatch}%</span>
                          </div>
                          <div>
                            <strong style={{ color: "var(--text-muted)" }}>Matched Keywords ({battleResult.candidateB.matchedKeywords.length}):</strong>
                            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "4px" }}>
                              {battleResult.candidateB.matchedKeywords.slice(0, 6).map((k, ki) => (
                                <span key={ki} className="tag tag--brand" style={{ fontSize: "11px" }}>{k}</span>
                              ))}
                            </div>
                          </div>
                          {battleResult.candidateB.uniqueSkills.length > 0 && (
                            <div>
                              <strong style={{ color: "#ffffff" }}>Unique Advantages:</strong>
                              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "4px" }}>
                                {battleResult.candidateB.uniqueSkills.slice(0, 5).map((u, ui) => (
                                  <span key={ui} style={{ background: "rgba(255,255,255,0.1)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: "4px", fontSize: "11px" }}>
                                    ★ {u}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Shared Skills Overlap */}
                    {battleResult.sharedSkills && battleResult.sharedSkills.length > 0 && (
                      <div style={{ padding: "14px 18px", borderRadius: "10px", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border)", marginBottom: "18px" }}>
                        <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>
                          Shared Core Skills ({battleResult.sharedSkills.length}):
                        </span>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
                          {battleResult.sharedSkills.map((s, si) => (
                            <span key={si} style={{ background: "rgba(255,255,255,0.06)", color: "#ffffff", padding: "2px 8px", borderRadius: "4px", fontSize: "11px" }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Differentiating Interview Questions */}
                    {battleResult.comparisonQuestions && (
                      <div style={{ padding: "16px 20px", borderRadius: "12px", background: "rgba(18,21,33,0.7)", border: "1px solid var(--border)" }}>
                        <h4 style={{ color: "#ffffff", margin: "0 0 10px", fontSize: "14px" }}>
                          🎯 Key Differentiating Interview Questions:
                        </h4>
                        <ul style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", color: "var(--mono-200)" }}>
                          {battleResult.comparisonQuestions.map((q, qi) => (
                            <li key={qi}>{q}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "40px" }}>
                    <Button onClick={() => handleRunBattle()} disabled={battleLoading} icon={<GitCompareIcon width={16} height={16} />}>
                      {battleLoading ? "Comparing Candidates…" : "Start Candidate Battle"}
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ========================================================
              TAB 11: LINKEDIN & OUTREACH PITCH STUDIO
              ======================================================== */}
          {activeTab === "outreach" && (
            <div className="dashboard__grid">
              <Card className="col-12" title="AI Networking & Cold Outreach Pitch Studio" icon={<SparkleIcon width={20} height={20} />}>
                <p className="ats-intro">
                  Generate tailored networking messages, LinkedIn connection requests, cold emails to hiring managers, and internal referral requests citing your verified achievements.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "12px", marginBottom: "20px" }}>
                  <input
                    type="text"
                    value={outreachCompany}
                    onChange={(e) => setOutreachCompany(e.target.value)}
                    placeholder="Target Company (e.g. Stripe, OpenAI, Google)"
                    style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(7,8,12,0.8)", border: "1px solid var(--border-strong)", color: "#ffffff", fontSize: "13px" }}
                  />
                  <input
                    type="text"
                    value={outreachManager}
                    onChange={(e) => setOutreachManager(e.target.value)}
                    placeholder="Hiring Manager / Recruiter Name (e.g. Sarah Connor)"
                    style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(7,8,12,0.8)", border: "1px solid var(--border-strong)", color: "#ffffff", fontSize: "13px" }}
                  />
                  <Button onClick={handleRunOutreach} disabled={outreachLoading} icon={<SparkleIcon width={16} height={16} />}>
                    {outreachLoading ? "Generating…" : "Generate Pitches"}
                  </Button>
                </div>

                {outreachLoading ? (
                  <div style={{ textAlign: "center", padding: "40px" }}>
                    <span className="upload__spinner" style={{ display: "inline-block", width: "24px", height: "24px", marginBottom: "12px" }} />
                    <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                      Crafting tailored pitch templates with {currentModel}…
                    </p>
                  </div>
                ) : outreachPitches ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {/* Template 1: LinkedIn Connection Note */}
                    <div style={{ padding: "18px 22px", borderRadius: "12px", background: "rgba(18,21,33,0.7)", border: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <div>
                          <span style={{ fontSize: "11px", fontWeight: "700", color: "#ffffff", textTransform: "uppercase" }}>
                            Template 1: LinkedIn Connection Note (&lt;300 chars)
                          </span>
                          <h4 style={{ color: "#ffffff", margin: "2px 0 0", fontSize: "15px" }}>Direct Connection Request</h4>
                        </div>
                        <CopyButton text={outreachPitches.connectionNote} label="Copy Note" />
                      </div>
                      <div style={{ padding: "12px 16px", borderRadius: "8px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", fontSize: "13px", color: "#ffffff", lineHeight: "1.6" }}>
                        {outreachPitches.connectionNote}
                      </div>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px", display: "inline-block" }}>
                        Length: {outreachPitches.connectionNote.length} / 300 characters (Fits within LinkedIn limit)
                      </span>
                    </div>

                    {/* Template 2: Cold Email / InMail */}
                    <div style={{ padding: "18px 22px", borderRadius: "12px", background: "rgba(18,21,33,0.7)", border: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <div>
                          <span style={{ fontSize: "11px", fontWeight: "700", color: "#ffffff", textTransform: "uppercase" }}>
                            Template 2: Hiring Manager Direct InMail / Cold Email
                          </span>
                          <h4 style={{ color: "#ffffff", margin: "2px 0 0", fontSize: "15px" }}>Comprehensive Outreach</h4>
                        </div>
                        <CopyButton text={outreachPitches.coldEmail} label="Copy Email" />
                      </div>
                      <pre style={{ padding: "14px 18px", borderRadius: "8px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", fontSize: "13px", color: "#ffffff", whiteSpace: "pre-wrap", fontFamily: "var(--font-sans)", lineHeight: "1.6", margin: 0 }}>
                        {outreachPitches.coldEmail}
                      </pre>
                    </div>

                    {/* Template 3: Referral Request */}
                    <div style={{ padding: "18px 22px", borderRadius: "12px", background: "rgba(18,21,33,0.7)", border: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <div>
                          <span style={{ fontSize: "11px", fontWeight: "700", color: "#ffffff", textTransform: "uppercase" }}>
                            Template 3: Internal Referral Ask
                          </span>
                          <h4 style={{ color: "#ffffff", margin: "2px 0 0", fontSize: "15px" }}>Peer Employee Referral Request</h4>
                        </div>
                        <CopyButton text={outreachPitches.referralAsk} label="Copy Message" />
                      </div>
                      <pre style={{ padding: "14px 18px", borderRadius: "8px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", fontSize: "13px", color: "#ffffff", whiteSpace: "pre-wrap", fontFamily: "var(--font-sans)", lineHeight: "1.6", margin: 0 }}>
                        {outreachPitches.referralAsk}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "40px" }}>
                    <Button onClick={handleRunOutreach} disabled={outreachLoading} icon={<SparkleIcon width={16} height={16} />}>
                      Generate Outreach Messages
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ========================================================
              TAB: 30-DAY SKILL GAP ACCELERATION ROADMAP
              ======================================================== */}
          {activeTab === "roadmap" && (
            <div className="dashboard__grid">
              <Card className="col-12" title="⚡ 30-Day Skill Gap Acceleration Roadmap" icon={<SparkleIcon width={20} height={20} />}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                  <p className="ats-intro" style={{ margin: 0, maxWidth: "700px" }}>
                    Bridge critical ATS keyword gaps with a structured, step-by-step 4-week learning acceleration curriculum designed to take you from concept to production-ready portfolio proof.
                  </p>
                  <Button onClick={handleRunRoadmap} disabled={roadmapLoading} icon={<SparkleIcon width={16} height={16} />}>
                    {roadmapLoading ? "Regenerating Roadmap…" : "Regenerate Roadmap"}
                  </Button>
                </div>

                {roadmapLoading ? (
                  <div style={{ textAlign: "center", padding: "40px" }}>
                    <div className="upload__spinner" style={{ margin: "0 auto 12px", width: "24px", height: "24px" }} />
                    <p style={{ color: "#ffffff", fontWeight: "600" }}>Synthesizing personalized 30-day curriculum with {currentModel}…</p>
                  </div>
                ) : roadmapData ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {/* Header stats banner */}
                    <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "center", padding: "16px 20px", borderRadius: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.15)" }}>
                      <div>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700" }}>Target Skills to Bridge:</span>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
                          {(roadmapData.targetSkills || []).map((sk, i) => (
                            <span key={i} className="skill-tag" style={{ background: "#ffffff", color: "#000000", fontWeight: "700" }}>
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div style={{ marginLeft: "auto", textAlign: "right" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700" }}>Estimated Time to Bridge:</span>
                        <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "#ffffff" }}>
                          {roadmapData.estimatedTimeToBridge}
                        </div>
                      </div>
                    </div>

                    {/* 4-Week Timeline Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      {(roadmapData.weeklyPlan || []).map((w, idx) => (
                        <div key={idx} style={{ padding: "18px 20px", borderRadius: "12px", background: "rgba(18,21,33,0.7)", border: "1px solid rgba(255,255,255,0.12)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <span style={{ fontSize: "11px", fontWeight: "800", color: "#ffffff", textTransform: "uppercase", background: "rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: "4px" }}>
                              {w.week}
                            </span>
                            <span style={{ fontSize: "12px", fontWeight: "700", color: "#e4e4e7" }}>
                              {w.title}
                            </span>
                          </div>
                          <p style={{ margin: "4px 0 10px", fontSize: "13px", color: "#ffffff", fontWeight: "600" }}>
                            {w.focus}
                          </p>
                          <ul style={{ margin: "0 0 12px", paddingLeft: "18px", fontSize: "12px", color: "#a1a1aa", lineHeight: "1.6" }}>
                            {(w.tasks || []).map((t, ti) => (
                              <li key={ti}>{t}</li>
                            ))}
                          </ul>
                          <div style={{ padding: "8px 12px", borderRadius: "6px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", fontSize: "12px" }}>
                            <strong style={{ color: "#ffffff" }}>Milestone Deliverable: </strong>
                            <span style={{ color: "#d4d4d8" }}>{w.handsOnExercise}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Ready to use bullet card */}
                    {roadmapData.readyToUseBullet && (
                      <div style={{ padding: "16px 20px", borderRadius: "12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.2)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                          <span style={{ fontSize: "11px", fontWeight: "800", color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            ✦ Pre-Calibrated ATS Resume Achievement (Ready to incorporate)
                          </span>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <CopyButton text={roadmapData.readyToUseBullet} label="Copy Bullet" />
                            <Button
                              size="sm"
                              onClick={() => handleApplyRoadmapBullet(roadmapData.readyToUseBullet)}
                              icon={<CheckIcon width={14} height={14} />}
                            >
                              {roadmapApplied ? "Applied to Live Resume!" : "Apply to Live Resume"}
                            </Button>
                          </div>
                        </div>
                        <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#ffffff", fontWeight: "600" }}>
                          "{roadmapData.readyToUseBullet}"
                        </p>
                      </div>
                    )}

                    {/* Curated Resources & Quick Wins */}
                    <div className="grid-12">
                      <div className="col-6">
                        <span style={{ fontSize: "13px", fontWeight: "700", color: "#ffffff", display: "block", marginBottom: "10px" }}>
                          Free Curated Hands-on Laboratories & Docs:
                        </span>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {(roadmapData.curatedResources || []).map((res, ri) => (
                            <div key={ri} style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)" }}>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ fontWeight: "700", color: "#ffffff", fontSize: "13px" }}>{res.skill}: {res.title}</span>
                                <span style={{ fontSize: "11px", color: "#a1a1aa" }}>{res.type}</span>
                              </div>
                              <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--text-muted)", wordBreak: "break-all" }}>
                                {res.urlDescription}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="col-6">
                        <span style={{ fontSize: "13px", fontWeight: "700", color: "#ffffff", display: "block", marginBottom: "10px" }}>
                          Immediate Quick-Win Action Steps:
                        </span>
                        <ul style={{ margin: 0, paddingLeft: "18px", color: "#e4e4e7", fontSize: "13px", lineHeight: "1.7" }}>
                          {(roadmapData.quickWinTips || []).map((tip, ti) => (
                            <li key={ti}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "40px" }}>
                    <Button onClick={handleRunRoadmap} disabled={roadmapLoading} icon={<SparkleIcon width={16} height={16} />}>
                      Generate 30-Day Skill Roadmap
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ========================================================
              TAB: LINKEDIN PROFILE OPTIMIZER & PERSONAL BRANDING
              ======================================================== */}
          {activeTab === "linkedin" && (
            <div className="dashboard__grid">
              <Card className="col-12" title="LinkedIn Profile Optimizer & Recruiter SEO Suite" icon={<DocumentIcon width={20} height={20} />}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                  <p className="ats-intro" style={{ margin: 0, maxWidth: "700px" }}>
                    Calibrate your LinkedIn presence for maximum recruiter inbound search ranking, high click-through headlines, compelling narrative storytelling, and peer recommendation outreach.
                  </p>
                  <Button onClick={handleRunLinkedIn} disabled={linkedinLoading} icon={<SparkleIcon width={16} height={16} />}>
                    {linkedinLoading ? "Optimizing…" : "Regenerate Profile"}
                  </Button>
                </div>

                {linkedinLoading ? (
                  <div style={{ textAlign: "center", padding: "40px" }}>
                    <div className="upload__spinner" style={{ margin: "0 auto 12px", width: "24px", height: "24px" }} />
                    <p style={{ color: "#ffffff", fontWeight: "600" }}>Synthesizing executive LinkedIn branding with {currentModel}…</p>
                  </div>
                ) : linkedinData ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {/* Headlines Section */}
                    <div>
                      <span style={{ fontSize: "13px", fontWeight: "700", color: "#ffffff", display: "block", marginBottom: "8px" }}>
                        High-Converting Headlines (Choose your preferred angle):
                      </span>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {(linkedinData.headlines || []).map((h, hi) => (
                          <div
                            key={hi}
                            style={{
                              padding: "14px 18px",
                              borderRadius: "10px",
                              background: "rgba(18,21,33,0.7)",
                              border: "1px solid rgba(255,255,255,0.12)",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              flexWrap: "wrap",
                              gap: "8px",
                            }}
                          >
                            <div style={{ flex: 1, minWidth: "260px" }}>
                              <span style={{ fontSize: "10px", fontWeight: "800", color: "#a1a1aa", textTransform: "uppercase" }}>
                                {h.style}
                              </span>
                              <p style={{ margin: "4px 0 0", fontSize: "14px", fontWeight: "600", color: "#ffffff" }}>
                                {h.text}
                              </p>
                            </div>
                            <CopyButton text={h.text} label="Copy Headline" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* About Story Section */}
                    <div style={{ padding: "18px 22px", borderRadius: "12px", background: "rgba(18,21,33,0.7)", border: "1px solid rgba(255,255,255,0.12)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                        <span style={{ fontSize: "11px", fontWeight: "800", color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          Executive 1st-Person LinkedIn "About" Summary (Hook + Proof + Stack):
                        </span>
                        <CopyButton text={linkedinData.aboutStory} label="Copy About Summary" />
                      </div>
                      <pre style={{ margin: 0, padding: "14px 18px", borderRadius: "8px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", fontSize: "13px", color: "#ffffff", whiteSpace: "pre-wrap", fontFamily: "var(--font-sans)", lineHeight: "1.6" }}>
                        {linkedinData.aboutStory}
                      </pre>
                    </div>

                    {/* Skills & Recommendation ask */}
                    <div className="grid-12">
                      <div className="col-6">
                        <span style={{ fontSize: "13px", fontWeight: "700", color: "#ffffff", display: "block", marginBottom: "8px" }}>
                          Top 5 Strategic Skills to Pin for Recruiter SEO:
                        </span>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          {(linkedinData.topSkillsToPin || []).map((sk, si) => (
                            <span key={si} className="skill-tag" style={{ background: "#ffffff", color: "#000000", fontWeight: "700" }}>
                              ★ {sk}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="col-6">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <span style={{ fontSize: "13px", fontWeight: "700", color: "#ffffff" }}>
                            Recommendation Request Note:
                          </span>
                          <CopyButton text={linkedinData.recommendationRequestTemplate} label="Copy Note" />
                        </div>
                        <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", fontSize: "12px", color: "#a1a1aa", lineHeight: "1.5" }}>
                          {linkedinData.recommendationRequestTemplate}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "40px" }}>
                    <Button onClick={handleRunLinkedIn} disabled={linkedinLoading} icon={<SparkleIcon width={16} height={16} />}>
                      Generate LinkedIn Profile Suite
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ========================================================
              TAB: APPLICATION PIPELINE (KANBAN / CRM)
              ======================================================== */}
          {activeTab === "pipeline" && (
            <div className="dashboard__grid">
              <Card className="col-12" title="🎯 Real-Time Job Application Pipeline (CRM)" icon={<KanbanIcon width={20} height={20} />}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
                  <p className="ats-intro" style={{ margin: 0, maxWidth: "700px" }}>
                    Manage and track your active job application funnel with persistent embedded database storage. Seamlessly track statuses from initial wishlist to written offer letters.
                  </p>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <Button onClick={handleQuickTrackCurrentJob} variant="primary" icon={<SparkleIcon width={16} height={16} />}>
                      Track Analyzed Job (+{atsResult?.atsScore || 85}% Match)
                    </Button>
                    <Button onClick={() => setShowNewAppForm(!showNewAppForm)} variant="secondary">
                      {showNewAppForm ? "Cancel" : "+ Add Application"}
                    </Button>
                  </div>
                </div>

                {/* Collapsible New App Form */}
                {showNewAppForm && (
                  <form onSubmit={handleCreateApp} style={{ padding: "20px", borderRadius: "12px", background: "rgba(18,21,33,0.7)", border: "1px solid rgba(255,255,255,0.12)", marginBottom: "24px" }}>
                    <h4 style={{ margin: "0 0 14px", color: "#ffffff", fontSize: "1rem" }}>Track New Opportunity</h4>
                    <div className="grid-12" style={{ gap: "12px" }}>
                      <div className="col-4">
                        <label className="ats-input-label">Company Name *</label>
                        <input className="ats-input-text" value={newAppCompany} onChange={(e) => setNewAppCompany(e.target.value)} placeholder="e.g. Stripe, Linear, Netflix" required />
                      </div>
                      <div className="col-4">
                        <label className="ats-input-label">Job Title / Role *</label>
                        <input className="ats-input-text" value={newAppRole} onChange={(e) => setNewAppRole(e.target.value)} placeholder="e.g. Senior Full-Stack Engineer" required />
                      </div>
                      <div className="col-4">
                        <label className="ats-input-label">Initial Stage</label>
                        <select className="ats-input-select" value={newAppStatus} onChange={(e) => setNewAppStatus(e.target.value)}>
                          <option value="Wishlist">📌 Wishlist</option>
                          <option value="Applied">📨 Applied</option>
                          <option value="Interviewing">🎙️ Interviewing</option>
                          <option value="Offered">🎉 Offer Received</option>
                          <option value="Archived">📁 Archived</option>
                        </select>
                      </div>
                      <div className="col-4">
                        <label className="ats-input-label">Target Compensation Range</label>
                        <input className="ats-input-text" value={newAppSalary} onChange={(e) => setNewAppSalary(e.target.value)} placeholder="e.g. $160,000 - $190,000" />
                      </div>
                      <div className="col-8">
                        <label className="ats-input-label">Interview Notes & Strategy</label>
                        <input className="ats-input-text" value={newAppNotes} onChange={(e) => setNewAppNotes(e.target.value)} placeholder="e.g. Reached out to engineering manager via warm referral." />
                      </div>
                    </div>
                    <div style={{ marginTop: "14px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                      <Button type="submit" variant="primary" disabled={pipelineLoading}>Save to Pipeline</Button>
                    </div>
                  </form>
                )}

                {/* 5-Column Kanban Board */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", alignItems: "start" }}>
                  {["Wishlist", "Applied", "Interviewing", "Offered", "Archived"].map((colStatus) => {
                    const colApps = applications.filter((a) => a.status === colStatus);
                    const colIcons = {
                      Wishlist: "📌",
                      Applied: "📨",
                      Interviewing: "🎙️",
                      Offered: "🎉",
                      Archived: "📁"
                    };
                    return (
                      <div key={colStatus} style={{ borderRadius: "12px", background: "rgba(10,12,18,0.7)", border: "1px solid rgba(255,255,255,0.08)", padding: "14px", minHeight: "350px", display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "10px" }}>
                          <span style={{ fontSize: "13px", fontWeight: "800", color: "#ffffff", letterSpacing: "0.02em" }}>
                            {colIcons[colStatus]} {colStatus}
                          </span>
                          <span style={{ fontSize: "11px", fontWeight: "700", background: "rgba(255,255,255,0.1)", color: "#e4e4e7", padding: "2px 8px", borderRadius: "10px" }}>
                            {colApps.length}
                          </span>
                        </div>

                        {colApps.length === 0 ? (
                          <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "12px", padding: "24px 8px" }}>
                            No opportunities in this stage.
                          </div>
                        ) : (
                          colApps.map((item) => (
                            <div key={item.id} style={{ borderRadius: "10px", background: "rgba(18,21,33,0.85)", border: "1px solid rgba(255,255,255,0.1)", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "6px" }}>
                                <div>
                                  <h5 style={{ margin: 0, fontSize: "14px", fontWeight: "800", color: "#ffffff", lineHeight: "1.3" }}>
                                    {item.role}
                                  </h5>
                                  <span style={{ fontSize: "12px", fontWeight: "600", color: "#a1a1aa" }}>
                                    {item.company}
                                  </span>
                                </div>
                                <button type="button" onClick={() => handleDeleteApp(item.id)} style={{ background: "transparent", border: "none", color: "#71717a", cursor: "pointer", fontSize: "14px", padding: "0 2px" }} title="Delete">
                                  ✕
                                </button>
                              </div>

                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", flexWrap: "wrap", gap: "4px" }}>
                                <span style={{ background: "rgba(255,255,255,0.08)", color: "#ffffff", padding: "2px 6px", borderRadius: "4px", fontWeight: "700" }}>
                                  ★ {item.atsScore}% ATS Match
                                </span>
                                <span style={{ color: "#a1a1aa" }}>
                                  {item.appliedDate}
                                </span>
                              </div>

                              {item.salaryEstimate && (
                                <div style={{ fontSize: "11px", color: "#ffffff", fontWeight: "600" }}>
                                  💰 {item.salaryEstimate}
                                </div>
                              )}

                              {item.notes && (
                                <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)", lineHeight: "1.4", background: "rgba(0,0,0,0.3)", padding: "6px 8px", borderRadius: "6px" }}>
                                  {item.notes}
                                </p>
                              )}

                              {/* Stage Switcher Controls */}
                              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                                {colStatus !== "Wishlist" && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const stages = ["Wishlist", "Applied", "Interviewing", "Offered", "Archived"];
                                      const prevIdx = stages.indexOf(colStatus) - 1;
                                      if (prevIdx >= 0) handleMoveAppStatus(item.id, stages[prevIdx]);
                                    }}
                                    style={{ background: "transparent", border: "none", color: "#a1a1aa", fontSize: "11px", cursor: "pointer", fontWeight: "700" }}
                                  >
                                    ← Back
                                  </button>
                                )}
                                <div style={{ flex: 1 }} />
                                {colStatus !== "Offered" && colStatus !== "Archived" && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const stages = ["Wishlist", "Applied", "Interviewing", "Offered", "Archived"];
                                      const nextIdx = stages.indexOf(colStatus) + 1;
                                      if (nextIdx < stages.length) handleMoveAppStatus(item.id, stages[nextIdx]);
                                    }}
                                    style={{ background: "transparent", border: "none", color: "#ffffff", fontSize: "11px", cursor: "pointer", fontWeight: "800" }}
                                  >
                                    Advance →
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}

          {/* ========================================================
              TAB: BULLET RE-WRITER (GOOGLE XYZ FORMULA)
              ======================================================== */}
          {activeTab === "bullets" && (
            <div className="dashboard__grid">
              <Card className="col-12" title="✨ Resume Bullet Power-Booster (Google XYZ Formula)" icon={<SparkleIcon width={20} height={20} />}>
                <p className="ats-intro" style={{ marginBottom: "20px" }}>
                  Transform weak, passive job duties into high-impact accomplishment bullets following Google's proven recruitment rubric: <strong>"Accomplished [X] as measured by [Y] by doing [Z]"</strong>.
                </p>

                {bulletInjectSuccess && (
                  <div style={{ padding: "12px 18px", borderRadius: "8px", background: "rgba(255,255,255,0.1)", border: "1px solid #ffffff", color: "#ffffff", fontWeight: "700", marginBottom: "16px" }}>
                    ✓ Accomplishment bullet point injected into your active resume experience!
                  </div>
                )}

                {/* Input Card */}
                <div style={{ padding: "20px", borderRadius: "12px", background: "rgba(18,21,33,0.7)", border: "1px solid rgba(255,255,255,0.12)", marginBottom: "24px" }}>
                  <div className="grid-12" style={{ gap: "14px" }}>
                    <div className="col-12">
                      <label className="ats-input-label">Paste Draft or Weak Bullet Point to Transform:</label>
                      <textarea
                        className="ats-input-textarea"
                        rows={3}
                        value={powerBulletInput}
                        onChange={(e) => setPowerBulletInput(e.target.value)}
                        placeholder="e.g. Responsible for building frontend features in React and helping with bugs"
                      />
                    </div>
                    <div className="col-6">
                      <label className="ats-input-label">Target Technical Skill to Showcase:</label>
                      <input
                        className="ats-input-text"
                        value={powerBulletSkill}
                        onChange={(e) => setPowerBulletSkill(e.target.value)}
                        placeholder="e.g. React, Node.js, Distributed Caching"
                      />
                    </div>
                    <div className="col-6">
                      <label className="ats-input-label">Target Role Level:</label>
                      <input
                        className="ats-input-text"
                        value={powerBulletRole}
                        onChange={(e) => setPowerBulletRole(e.target.value)}
                        placeholder="e.g. Senior Full-Stack Engineer"
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
                    <Button onClick={handleRunPowerBullet} disabled={powerBulletLoading} icon={<SparkleIcon width={16} height={16} />}>
                      {powerBulletLoading ? "Power-Boosting Bullet…" : "Transform with XYZ Formula"}
                    </Button>
                  </div>
                </div>

                {/* Results Section */}
                {powerBulletLoading ? (
                  <div style={{ textAlign: "center", padding: "40px" }}>
                    <div className="upload__spinner" style={{ margin: "0 auto 12px", width: "24px", height: "24px" }} />
                    <p style={{ color: "#ffffff", fontWeight: "600" }}>Synthesizing Google XYZ formula and metric-driven variants with {currentModel}…</p>
                  </div>
                ) : powerBulletData ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {powerBulletData.weakWordsFound && powerBulletData.weakWordsFound.length > 0 && (
                      <div style={{ padding: "14px 18px", borderRadius: "10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "18px" }}>⚠️</span>
                        <div style={{ fontSize: "13px", color: "#e4e4e7" }}>
                          <strong style={{ color: "#ffffff" }}>Passive Words Flagged: </strong>
                          {powerBulletData.weakWordsFound.map((w, wi) => (
                            <span key={wi} style={{ textDecoration: "line-through", color: "#a1a1aa", marginRight: "8px" }}>
                              "{w}"
                            </span>
                          ))}
                          <span style={{ color: "var(--text-muted)", marginLeft: "8px" }}>
                            Recommended Power Action Verbs: <strong>{(powerBulletData.actionVerbsSuggested || []).join(", ")}</strong>
                          </span>
                        </div>
                      </div>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      {(powerBulletData.variants || []).map((v) => (
                        <div
                          key={v.id}
                          style={{
                            padding: "20px",
                            borderRadius: "12px",
                            background: "rgba(18,21,33,0.7)",
                            border: "1px solid rgba(255,255,255,0.12)",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            gap: "14px",
                          }}
                        >
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                              <span style={{ fontSize: "11px", fontWeight: "800", color: "#000000", background: "#ffffff", padding: "2px 8px", borderRadius: "4px" }}>
                                {v.title}
                              </span>
                              <span style={{ fontSize: "11px", color: "#a1a1aa" }}>{v.badge}</span>
                            </div>
                            <p style={{ margin: "10px 0", fontSize: "14px", fontWeight: "600", color: "#ffffff", lineHeight: "1.5" }}>
                              "{v.text}"
                            </p>
                            <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)", lineHeight: "1.4" }}>
                              💡 <em>{v.critique}</em>
                            </p>
                          </div>
                          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "12px" }}>
                            <Button onClick={() => handleInjectBullet(v.text)} variant="secondary">
                              + Inject to Resume
                            </Button>
                            <CopyButton text={v.text} label="Copy Bullet" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </Card>
            </div>
          )}

          {/* ========================================================
              TAB: SKILL GAP SCREENING QUIZ
              ======================================================== */}
          {activeTab === "quiz" && (
            <div className="dashboard__grid">
              <Card className="col-12" title="🧠 Skill Gap Assessment & Technical Screening Quiz" icon={<BrainIcon width={20} height={20} />}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <p className="ats-intro" style={{ margin: 0, maxWidth: "700px" }}>
                      Benchmark your hands-on production knowledge on target skills flagged by ATS parsers. Practice realistic multiple-choice technical questions with interview talking point debriefs.
                    </p>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "10px" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700" }}>Skills Tested:</span>
                      {(quizData?.skillsAssessed || atsResult?.missingKeywords || ["PostgreSQL", "Docker", "System Architecture", "Redis"]).map((sk, ski) => (
                        <span key={ski} className="skill-tag" style={{ background: "#ffffff", color: "#000000", fontWeight: "700" }}>
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Button onClick={handleRunQuiz} disabled={quizLoading} icon={<BrainIcon width={16} height={16} />}>
                    {quizLoading ? "Generating Quiz…" : "Regenerate Quiz"}
                  </Button>
                </div>

                {quizLoading ? (
                  <div style={{ textAlign: "center", padding: "40px" }}>
                    <div className="upload__spinner" style={{ margin: "0 auto 12px", width: "24px", height: "24px" }} />
                    <p style={{ color: "#ffffff", fontWeight: "600" }}>Generating technical assessment scenarios for {targetRole}…</p>
                  </div>
                ) : quizData ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {quizSubmitted && (
                      <div style={{ padding: "18px 24px", borderRadius: "12px", background: "rgba(255,255,255,0.06)", border: "1px solid #ffffff", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                        <div>
                          <span style={{ fontSize: "11px", fontWeight: "800", color: "#a1a1aa", textTransform: "uppercase" }}>Assessment Scorecard</span>
                          <h3 style={{ margin: "4px 0", color: "#ffffff", fontSize: "1.4rem" }}>
                            {Math.round(
                              ((quizData.questions || []).filter((q) => userQuizAnswers[q.id] === q.correctIndex).length / (quizData.questions?.length || 1)) * 100
                            )}% Correct ({quizData.questions.filter((q) => userQuizAnswers[q.id] === q.correctIndex).length} / {quizData.questions.length})
                          </h3>
                          <p style={{ margin: 0, fontSize: "13px", color: "#e4e4e7" }}>
                            {quizData.questions.filter((q) => userQuizAnswers[q.id] === q.correctIndex).length >= 4
                              ? "🌟 Excellent technical readiness! You are ready to ace technical screening rounds."
                              : "⚠️ Review the interview talking points below to strengthen your production depth."}
                          </p>
                        </div>
                        <Button onClick={handleResetQuiz} variant="secondary">Retake Quiz</Button>
                      </div>
                    )}

                    {/* Question Cards */}
                    {(quizData.questions || []).map((q, qIndex) => {
                      const isSelected = userQuizAnswers[q.id] !== undefined;
                      const selectedOpt = userQuizAnswers[q.id];
                      const isCorrect = selectedOpt === q.correctIndex;

                      return (
                        <div
                          key={q.id}
                          style={{
                            padding: "22px",
                            borderRadius: "12px",
                            background: "rgba(18,21,33,0.7)",
                            border: quizSubmitted
                              ? isCorrect
                                ? "1px solid rgba(255,255,255,0.4)"
                                : "1px solid rgba(255,255,255,0.15)"
                              : "1px solid rgba(255,255,255,0.12)",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                              <span style={{ fontSize: "12px", fontWeight: "800", background: "#ffffff", color: "#000000", padding: "2px 8px", borderRadius: "4px" }}>
                                Question {qIndex + 1}
                              </span>
                              <span style={{ fontSize: "12px", fontWeight: "700", color: "#ffffff" }}>
                                {q.skill}
                              </span>
                            </div>
                            <span style={{ fontSize: "11px", color: "#a1a1aa", textTransform: "uppercase", fontWeight: "700" }}>
                              {q.difficulty}
                            </span>
                          </div>

                          <h4 style={{ margin: "0 0 16px", color: "#ffffff", fontSize: "1.05rem", lineHeight: "1.5" }}>
                            {q.question}
                          </h4>

                          {/* Options */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {(q.options || []).map((opt, optIdx) => {
                              const chosen = selectedOpt === optIdx;
                              const shouldHighlightCorrect = quizSubmitted && optIdx === q.correctIndex;

                              let optBg = "rgba(0,0,0,0.3)";
                              let optBorder = "1px solid rgba(255,255,255,0.08)";
                              let optColor = "#e4e4e7";

                              if (quizSubmitted) {
                                if (shouldHighlightCorrect) {
                                  optBg = "rgba(255,255,255,0.12)";
                                  optBorder = "1px solid #ffffff";
                                  optColor = "#ffffff";
                                } else if (chosen && !isCorrect) {
                                  optBg = "rgba(255,255,255,0.04)";
                                  optBorder = "1px solid rgba(255,255,255,0.2)";
                                  optColor = "#a1a1aa";
                                }
                              } else if (chosen) {
                                optBg = "rgba(255,255,255,0.1)";
                                optBorder = "1px solid #ffffff";
                                optColor = "#ffffff";
                              }

                              return (
                                <button
                                  key={optIdx}
                                  type="button"
                                  onClick={() => handleSelectQuizOption(q.id, optIdx)}
                                  disabled={quizSubmitted}
                                  style={{
                                    textAlign: "left",
                                    padding: "12px 16px",
                                    borderRadius: "8px",
                                    background: optBg,
                                    border: optBorder,
                                    color: optColor,
                                    fontSize: "13px",
                                    cursor: quizSubmitted ? "default" : "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    transition: "all 0.15s ease",
                                  }}
                                >
                                  <span style={{ fontWeight: "800", color: "#ffffff", minWidth: "22px" }}>
                                    {String.fromCharCode(65 + optIdx)}.
                                  </span>
                                  <span style={{ flex: 1 }}>{opt}</span>
                                  {quizSubmitted && shouldHighlightCorrect && (
                                    <span style={{ color: "#ffffff", fontWeight: "800", marginLeft: "auto" }}>✓ Correct</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* Explanation and Talking Points when Submitted */}
                          {quizSubmitted && (
                            <div style={{ marginTop: "16px", padding: "14px 18px", borderRadius: "8px", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}>
                              <p style={{ margin: "0 0 8px", fontSize: "13px", color: "#ffffff", lineHeight: "1.5" }}>
                                <strong>Technical Explanation: </strong>
                                <span style={{ color: "#d4d4d8" }}>{q.explanation}</span>
                              </p>
                              <p style={{ margin: 0, fontSize: "12px", color: "#a1a1aa", lineHeight: "1.5" }}>
                                <strong>🎙️ Recruiter / Interviewer Talking Point: </strong>
                                <span style={{ color: "#e4e4e7" }}>{q.interviewTalkingPoint}</span>
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {!quizSubmitted && (
                      <div style={{ textAlign: "center", marginTop: "10px" }}>
                        <Button
                          onClick={handleSubmitQuiz}
                          disabled={Object.keys(userQuizAnswers).length === 0}
                          variant="primary"
                        >
                          Submit Assessment & Reveal Solutions ({Object.keys(userQuizAnswers).length} / {quizData.questions?.length || 0} Answered)
                        </Button>
                      </div>
                    )}
                  </div>
                ) : null}
              </Card>
            </div>
          )}

          {/* ========================================================
              TAB: MULTI-FORMAT EXPORT STUDIO
              ======================================================== */}
          {activeTab === "export" && (
            <div className="dashboard__grid">
              <Card className="col-12" title="📤 Multi-Format Resume Export Studio" icon={<DownloadIcon width={20} height={20} />}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
                  <p className="ats-intro" style={{ margin: 0, maxWidth: "700px" }}>
                    Export your ATS-optimized resume into standardized formats including production-ready LaTeX (Overleaf/pdflatex), clean plain-text ATS scanner format, Markdown, and Schema.org JSON Resume.
                  </p>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <Button onClick={handleDownloadExportFile} icon={<DownloadIcon width={16} height={16} />}>
                      Download .{exportFormat === "latex" ? "tex" : exportFormat === "markdown" ? "md" : exportFormat === "json" ? "json" : "txt"}
                    </Button>
                    <CopyButton
                      text={
                        exportFormat === "latex"
                          ? generateLatexCode()
                          : exportFormat === "markdown"
                          ? generateMarkdownCode()
                          : exportFormat === "json"
                          ? generateJsonResumeCode()
                          : generatePlainTxtCode()
                      }
                      label="Copy Source Code"
                    />
                  </div>
                </div>

                {/* Format Selector Pills */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
                  {[
                    { id: "latex", label: "LaTeX (.tex) — Overleaf Ready" },
                    { id: "markdown", label: "Markdown (.md) — GitHub / Portfolio" },
                    { id: "txt", label: "Plain Text (.txt) — 100% ATS Compliant" },
                    { id: "json", label: "JSON Resume (.json) — Schema Standard" },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setExportFormat(fmt.id)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: "700",
                        cursor: "pointer",
                        background: exportFormat === fmt.id ? "#ffffff" : "rgba(255,255,255,0.06)",
                        color: exportFormat === fmt.id ? "#000000" : "#a1a1aa",
                        border: exportFormat === fmt.id ? "1px solid #ffffff" : "1px solid rgba(255,255,255,0.1)",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>

                {/* Code Viewer Panel */}
                <div style={{ borderRadius: "12px", background: "rgba(10,12,18,0.9)", border: "1px solid rgba(255,255,255,0.12)", padding: "16px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "800", color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Source Code Preview ({exportFormat.toUpperCase()}):
                    </span>
                    <span style={{ fontSize: "11px", color: "#71717a" }}>
                      Ready to compile or upload
                    </span>
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      padding: "16px",
                      borderRadius: "8px",
                      background: "rgba(0,0,0,0.5)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      fontSize: "12px",
                      color: "#e4e4e7",
                      fontFamily: "var(--font-mono, monospace)",
                      lineHeight: "1.5",
                      maxHeight: "450px",
                      overflowY: "auto",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                    }}
                  >
                    {exportFormat === "latex"
                      ? generateLatexCode()
                      : exportFormat === "markdown"
                      ? generateMarkdownCode()
                      : exportFormat === "json"
                      ? generateJsonResumeCode()
                      : generatePlainTxtCode()}
                  </pre>
                </div>
              </Card>
            </div>
          )}

          {/* ========================================================
              TAB 16: AI CAREER TRAJECTORY & PROMOTION VELOCITY
              ======================================================== */}
          {activeTab === "trajectory" && (
            <div className="dashboard__grid">
              <Card
                className="col-12"
                title="AI Career Path & Promotion Velocity Forecaster"
                icon={<TrendingUpIcon width={20} height={20} />}
                action={
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <Button
                      onClick={() => handleRunCareerTrajectory()}
                      variant="secondary"
                      disabled={careerTrajectoryLoading}
                      icon={<SparkleIcon width={14} height={14} />}
                    >
                      {careerTrajectoryLoading ? "Forecasting..." : "Refresh Forecast"}
                    </Button>
                  </div>
                }
              >
                {careerTrajectoryLoading ? (
                  <div style={{ padding: "40px", textAlign: "center" }}>
                    <div className="skeleton" style={{ width: "60px", height: "60px", borderRadius: "50%", margin: "0 auto 16px" }} />
                    <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                      Analyzing career milestones, seniority velocity, and technical trajectory...
                    </p>
                  </div>
                ) : careerTrajectoryData ? (
                  <div>
                    {/* Header Banner */}
                    <div
                      style={{
                        padding: "16px 20px",
                        borderRadius: "12px",
                        background: "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
                        border: "1px solid rgba(255,255,255,0.12)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "12px",
                        marginBottom: "20px",
                      }}
                    >
                      <div>
                        <span style={{ fontSize: "11px", fontWeight: "800", color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          Current Assessed Tier:
                        </span>
                        <h3 style={{ margin: "4px 0 0", color: "#ffffff", fontSize: "18px", fontWeight: "700" }}>
                          {careerTrajectoryData.currentTier}
                        </h3>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Promotion Velocity Index</span>
                          <span style={{ fontSize: "20px", fontWeight: "800", color: "#4ade80" }}>
                            {careerTrajectoryData.velocityScore}% (Top 6%)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 3 Horizon Milestones */}
                    <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#ffffff", marginBottom: "12px" }}>
                      Multi-Horizon Seniority Roadmap:
                    </h4>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: "24px" }}>
                      {/* 1 Year */}
                      <div
                        style={{
                          borderRadius: "12px",
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          padding: "16px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <span style={{ fontSize: "11px", fontWeight: "800", color: "#38bdf8", padding: "2px 8px", background: "rgba(56,189,248,0.12)", borderRadius: "4px" }}>
                              1-Year Horizon
                            </span>
                            <span style={{ fontSize: "12px", fontWeight: "700", color: "#ffffff" }}>
                              {careerTrajectoryData.milestones?.oneYear?.targetComp}
                            </span>
                          </div>
                          <h4 style={{ margin: "6px 0 8px", fontSize: "15px", color: "#ffffff" }}>
                            {careerTrajectoryData.milestones?.oneYear?.title}
                          </h4>
                          <p style={{ fontSize: "12.5px", color: "var(--text-muted)", lineHeight: "1.5", margin: 0 }}>
                            {careerTrajectoryData.milestones?.oneYear?.focus}
                          </p>
                        </div>
                      </div>

                      {/* 3 Year */}
                      <div
                        style={{
                          borderRadius: "12px",
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          padding: "16px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <span style={{ fontSize: "11px", fontWeight: "800", color: "#a855f7", padding: "2px 8px", background: "rgba(168,85,247,0.12)", borderRadius: "4px" }}>
                              3-Year Horizon
                            </span>
                            <span style={{ fontSize: "12px", fontWeight: "700", color: "#ffffff" }}>
                              {careerTrajectoryData.milestones?.threeYear?.targetComp}
                            </span>
                          </div>
                          <h4 style={{ margin: "6px 0 8px", fontSize: "15px", color: "#ffffff" }}>
                            {careerTrajectoryData.milestones?.threeYear?.title}
                          </h4>
                          <p style={{ fontSize: "12.5px", color: "var(--text-muted)", lineHeight: "1.5", margin: 0 }}>
                            {careerTrajectoryData.milestones?.threeYear?.focus}
                          </p>
                        </div>
                      </div>

                      {/* 5 Year */}
                      <div
                        style={{
                          borderRadius: "12px",
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          padding: "16px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <span style={{ fontSize: "11px", fontWeight: "800", color: "#f59e0b", padding: "2px 8px", background: "rgba(245,158,11,0.12)", borderRadius: "4px" }}>
                              5-Year Horizon
                            </span>
                            <span style={{ fontSize: "12px", fontWeight: "700", color: "#ffffff" }}>
                              {careerTrajectoryData.milestones?.fiveYear?.targetComp}
                            </span>
                          </div>
                          <h4 style={{ margin: "6px 0 8px", fontSize: "15px", color: "#ffffff" }}>
                            {careerTrajectoryData.milestones?.fiveYear?.title}
                          </h4>
                          <p style={{ fontSize: "12.5px", color: "var(--text-muted)", lineHeight: "1.5", margin: 0 }}>
                            {careerTrajectoryData.milestones?.fiveYear?.focus}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Promotion Unlocks & Pitfalls */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                      <div style={{ padding: "16px", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <h4 style={{ margin: "0 0 12px", fontSize: "13px", color: "#4ade80", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>
                          <SparkleIcon width={14} height={14} /> Promotion Multipliers (Unlocks):
                        </h4>
                        <ul style={{ margin: 0, paddingLeft: "18px", color: "var(--text-muted)", fontSize: "12.5px", lineHeight: "1.6" }}>
                          {careerTrajectoryData.promotionUnlocks?.map((item, i) => (
                            <li key={i} style={{ marginBottom: "6px" }}>{item}</li>
                          ))}
                        </ul>
                      </div>

                      <div style={{ padding: "16px", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <h4 style={{ margin: "0 0 12px", fontSize: "13px", color: "#f87171", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>
                          <AlertIcon width={14} height={14} /> Stagnation Traps to Avoid:
                        </h4>
                        <ul style={{ margin: 0, paddingLeft: "18px", color: "var(--text-muted)", fontSize: "12.5px", lineHeight: "1.6" }}>
                          {careerTrajectoryData.careerPitfalls?.map((item, i) => (
                            <li key={i} style={{ marginBottom: "6px" }}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* 90-Day Execution Moves */}
                    <div style={{ padding: "14px 18px", borderRadius: "10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
                      <span style={{ fontSize: "11px", fontWeight: "800", color: "#ffffff", textTransform: "uppercase" }}>
                        ⚡ Immediate 90-Day High-Leverage Strategic Moves:
                      </span>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px", marginTop: "10px" }}>
                        {careerTrajectoryData.strategicNextMoves?.map((m, idx) => (
                          <div key={idx} style={{ padding: "8px 12px", background: "rgba(0,0,0,0.3)", borderRadius: "6px", fontSize: "12px", color: "#e4e4e7" }}>
                            {m}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "40px" }}>
                    <p style={{ color: "var(--text-muted)", marginBottom: "16px" }}>
                      Click below to analyze candidate velocity and predict target compensation milestones.
                    </p>
                    <Button onClick={() => handleRunCareerTrajectory()} icon={<TrendingUpIcon width={16} height={16} />}>
                      Generate Career Trajectory Forecast
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ========================================================
              TAB 17: AI STAR BEHAVIORAL STORY MATRIX
              ======================================================== */}
          {activeTab === "starstories" && (
            <div className="dashboard__grid">
              <Card
                className="col-12"
                title="AI STAR Behavioral Story Bank & Conflict Matrix"
                icon={<BookOpenIcon width={20} height={20} />}
                action={
                  <Button
                    onClick={() => handleRunStarStories()}
                    variant="secondary"
                    disabled={starStoriesLoading}
                    icon={<SparkleIcon width={14} height={14} />}
                  >
                    {starStoriesLoading ? "Synthesizing..." : "Regenerate Stories"}
                  </Button>
                }
              >
                {starStoriesLoading ? (
                  <div style={{ padding: "40px", textAlign: "center" }}>
                    <div className="skeleton" style={{ width: "60px", height: "60px", borderRadius: "50%", margin: "0 auto 16px" }} />
                    <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                      Parsing projects and synthesizing FAANG-grade STAR behavioral scenarios...
                    </p>
                  </div>
                ) : starStoriesData?.stories ? (
                  <div>
                    {/* Story Category Selector Pills */}
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
                      {starStoriesData.stories.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setActiveStarStoryId(s.id)}
                          style={{
                            padding: "6px 14px",
                            borderRadius: "8px",
                            fontSize: "12.5px",
                            fontWeight: "700",
                            cursor: "pointer",
                            background: activeStarStoryId === s.id ? "#ffffff" : "rgba(255,255,255,0.06)",
                            color: activeStarStoryId === s.id ? "#000000" : "#a1a1aa",
                            border: activeStarStoryId === s.id ? "1px solid #ffffff" : "1px solid rgba(255,255,255,0.1)",
                            transition: "all 0.15s ease",
                          }}
                        >
                          Story {s.id}: {s.category}
                        </button>
                      ))}
                    </div>

                    {/* Active Story Card */}
                    {(() => {
                      const curStory = starStoriesData.stories.find((s) => s.id === activeStarStoryId) || starStoriesData.stories[0];
                      if (!curStory) return null;
                      const fullAnswer = `Situation: ${curStory.situation}\nTask: ${curStory.task}\nAction: ${curStory.action}\nResult: ${curStory.result}`;

                      return (
                        <div style={{ borderRadius: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.1)", padding: "20px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
                            <div>
                              <span style={{ fontSize: "11px", fontWeight: "800", color: "#38bdf8", textTransform: "uppercase" }}>
                                {curStory.category}
                              </span>
                              <h3 style={{ margin: "4px 0", color: "#ffffff", fontSize: "18px" }}>
                                {curStory.title}
                              </h3>
                            </div>
                            <CopyButton text={fullAnswer} label="Copy Full STAR Answer" />
                          </div>

                          {/* 4 Steps Grid */}
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px", marginBottom: "16px" }}>
                            <div style={{ padding: "12px 14px", background: "rgba(0,0,0,0.4)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
                              <span style={{ fontSize: "11px", fontWeight: "800", color: "#a1a1aa", display: "block", marginBottom: "4px" }}>
                                1. SITUATION
                              </span>
                              <p style={{ margin: 0, fontSize: "12.5px", color: "#e4e4e7", lineHeight: "1.5" }}>
                                {curStory.situation}
                              </p>
                            </div>

                            <div style={{ padding: "12px 14px", background: "rgba(0,0,0,0.4)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
                              <span style={{ fontSize: "11px", fontWeight: "800", color: "#a1a1aa", display: "block", marginBottom: "4px" }}>
                                2. TASK & STAKES
                              </span>
                              <p style={{ margin: 0, fontSize: "12.5px", color: "#e4e4e7", lineHeight: "1.5" }}>
                                {curStory.task}
                              </p>
                            </div>

                            <div style={{ padding: "12px 14px", background: "rgba(0,0,0,0.4)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
                              <span style={{ fontSize: "11px", fontWeight: "800", color: "#38bdf8", display: "block", marginBottom: "4px" }}>
                                3. DECISIVE ACTION
                              </span>
                              <p style={{ margin: 0, fontSize: "12.5px", color: "#e4e4e7", lineHeight: "1.5" }}>
                                {curStory.action}
                              </p>
                            </div>

                            <div style={{ padding: "12px 14px", background: "rgba(0,0,0,0.4)", borderRadius: "8px", border: "1px solid rgba(74,222,128,0.2)" }}>
                              <span style={{ fontSize: "11px", fontWeight: "800", color: "#4ade80", display: "block", marginBottom: "4px" }}>
                                4. QUANTIFIED RESULT
                              </span>
                              <p style={{ margin: 0, fontSize: "12.5px", color: "#ffffff", lineHeight: "1.5", fontWeight: "500" }}>
                                {curStory.result}
                              </p>
                            </div>
                          </div>

                          {/* Trap & Tip Footer */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                            <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px" }}>
                              <span style={{ fontSize: "11px", fontWeight: "800", color: "#f87171" }}>
                                ⚠️ Hiring Committee Trap:
                              </span>
                              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#fca5a5", lineHeight: "1.4" }}>
                                {curStory.trapToAvoid}
                              </p>
                            </div>
                            <div style={{ padding: "10px 14px", background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.2)", borderRadius: "8px" }}>
                              <span style={{ fontSize: "11px", fontWeight: "800", color: "#38bdf8" }}>
                                💡 Bar Raiser Pro-Tip:
                              </span>
                              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#bae6fd", lineHeight: "1.4" }}>
                                {curStory.proTip}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "40px" }}>
                    <p style={{ color: "var(--text-muted)", marginBottom: "16px" }}>
                      Generate high-stakes behavioral STAR stories mapped to your resume.
                    </p>
                    <Button onClick={() => handleRunStarStories()} icon={<BookOpenIcon width={16} height={16} />}>
                      Generate STAR Behavioral Stories
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ========================================================
              TAB 18: AI RESUME DE-BIASING & BLIND SCREENING AUDIT
              ======================================================== */}
          {activeTab === "debias" && (
            <div className="dashboard__grid">
              <Card
                className="col-12"
                title="AI Resume De-Biasing & Blind Screening Audit"
                icon={<ShieldCheckIcon width={20} height={20} />}
                action={
                  <Button
                    onClick={() => handleRunDebiasAudit()}
                    variant="secondary"
                    disabled={debiasLoading}
                    icon={<SparkleIcon width={14} height={14} />}
                  >
                    {debiasLoading ? "Auditing..." : "Re-Scan Resume"}
                  </Button>
                }
              >
                {debiasLoading ? (
                  <div style={{ padding: "40px", textAlign: "center" }}>
                    <div className="skeleton" style={{ width: "60px", height: "60px", borderRadius: "50%", margin: "0 auto 16px" }} />
                    <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                      Auditing resume against blind-screening algorithms and linguistic bias detectors...
                    </p>
                  </div>
                ) : debiasData ? (
                  <div>
                    {/* Top KPI Row */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px", marginBottom: "20px" }}>
                      <div style={{ padding: "16px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase" }}>
                          Blind-Screening Readiness
                        </span>
                        <div style={{ fontSize: "24px", fontWeight: "800", color: "#4ade80", margin: "6px 0" }}>
                          {debiasData.blindScreeningScore}/100
                        </div>
                        <span style={{ fontSize: "11.5px", color: "#a1a1aa" }}>
                          Evaluated against blind ATS algorithmic standards
                        </span>
                      </div>

                      <div style={{ padding: "16px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase" }}>
                          Linguistic Balance Ratio
                        </span>
                        <div style={{ fontSize: "20px", fontWeight: "800", color: "#ffffff", margin: "6px 0" }}>
                          {debiasData.linguisticBalance?.agenticCount} Agentic / {debiasData.linguisticBalance?.communalCount} Communal
                        </div>
                        <span style={{ fontSize: "11.5px", color: "#38bdf8" }}>
                          {debiasData.linguisticBalance?.verdict}
                        </span>
                      </div>
                    </div>

                    {/* Risk Assessments */}
                    <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#ffffff", marginBottom: "10px" }}>
                      Blind ATS Risk Factor Assessments:
                    </h4>
                    <div style={{ display: "grid", gap: "10px", marginBottom: "20px" }}>
                      {debiasData.riskAssessments?.map((r, i) => (
                        <div
                          key={i}
                          style={{
                            padding: "12px 16px",
                            borderRadius: "8px",
                            background: "rgba(0,0,0,0.3)",
                            border: r.severity === "low" ? "1px solid rgba(74,222,128,0.2)" : "1px solid rgba(251,191,36,0.3)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: "8px",
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: "700", color: "#ffffff", fontSize: "13px" }}>
                              {r.factor}:
                            </span>
                            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
                              {r.finding}
                            </p>
                          </div>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: "700",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              background: r.severity === "low" ? "rgba(74,222,128,0.15)" : "rgba(251,191,36,0.15)",
                              color: r.severity === "low" ? "#4ade80" : "#fbbf24",
                            }}
                          >
                            {r.status}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Actionable Neutral Replacements */}
                    <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#ffffff", marginBottom: "10px" }}>
                      High-Impact Phrasing Upgrades:
                    </h4>
                    <div style={{ display: "grid", gap: "10px", marginBottom: "20px" }}>
                      {debiasData.recommendedReplacements?.map((rep, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: "12px 16px",
                            borderRadius: "8px",
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.08)",
                          }}
                        >
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "6px" }}>
                            <div>
                              <span style={{ fontSize: "10px", fontWeight: "800", color: "#f87171", textTransform: "uppercase" }}>
                                Traditional / Passive:
                              </span>
                              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#94a3b8" }}>
                                "{rep.original}"
                              </p>
                            </div>
                            <div>
                              <span style={{ fontSize: "10px", fontWeight: "800", color: "#4ade80", textTransform: "uppercase" }}>
                                Upgraded Executive Phrasing:
                              </span>
                              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#ffffff", fontWeight: "500" }}>
                                "{rep.replacement}"
                              </p>
                            </div>
                          </div>
                          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic" }}>
                            Why: {rep.rationale}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Executive Best Practices */}
                    <div style={{ padding: "14px 18px", borderRadius: "10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
                      <span style={{ fontSize: "11px", fontWeight: "800", color: "#ffffff", textTransform: "uppercase" }}>
                        🛡️ Recommendations for 100% Blind Screening Pass:
                      </span>
                      <ul style={{ margin: "8px 0 0", paddingLeft: "18px", fontSize: "12px", color: "var(--text-muted)", lineHeight: "1.6" }}>
                        {debiasData.executiveActionPlan?.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "40px" }}>
                    <p style={{ color: "var(--text-muted)", marginBottom: "16px" }}>
                      Run the blind-screening audit to detect subconscious bias triggers and age/address filters.
                    </p>
                    <Button onClick={() => handleRunDebiasAudit()} icon={<ShieldCheckIcon width={16} height={16} />}>
                      Audit Resume for Blind Screening
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ========================================================
              TAB 19: AI EXECUTIVE BIO & PERSONA STUDIO
              ======================================================== */}
          {activeTab === "bios" && (
            <div className="dashboard__grid">
              <Card
                className="col-12"
                title="AI Executive Persona & Multi-Channel Bio Studio"
                icon={<AwardIcon width={20} height={20} />}
                action={
                  <Button
                    onClick={() => handleRunExecutiveBio()}
                    variant="secondary"
                    disabled={executiveBioLoading}
                    icon={<SparkleIcon width={14} height={14} />}
                  >
                    {executiveBioLoading ? "Synthesizing..." : "Regenerate Bios"}
                  </Button>
                }
              >
                {executiveBioLoading ? (
                  <div style={{ padding: "40px", textAlign: "center" }}>
                    <div className="skeleton" style={{ width: "60px", height: "60px", borderRadius: "50%", margin: "0 auto 16px" }} />
                    <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                      Crafting multi-channel executive bios tailored for recruiters, LinkedIn, and investors...
                    </p>
                  </div>
                ) : executiveBioData ? (
                  <div>
                    {/* Persona Format Selector Pills */}
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
                      {[
                        { id: "phone", label: "📞 30-Sec Phone Screen Pitch" },
                        { id: "linkedin", label: "💼 LinkedIn 'About' Narrative" },
                        { id: "executive", label: "🎙️ Executive Conference Bio" },
                        { id: "github", label: "💻 GitHub / Developer Readme" },
                        { id: "founder", label: "🚀 Founding Engineer Pitch" },
                      ].map((fmt) => (
                        <button
                          key={fmt.id}
                          type="button"
                          onClick={() => setActiveBioFormat(fmt.id)}
                          style={{
                            padding: "8px 14px",
                            borderRadius: "8px",
                            fontSize: "12.5px",
                            fontWeight: "700",
                            cursor: "pointer",
                            background: activeBioFormat === fmt.id ? "#ffffff" : "rgba(255,255,255,0.06)",
                            color: activeBioFormat === fmt.id ? "#000000" : "#a1a1aa",
                            border: activeBioFormat === fmt.id ? "1px solid #ffffff" : "1px solid rgba(255,255,255,0.1)",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {fmt.label}
                        </button>
                      ))}
                    </div>

                    {/* Active Bio Reader Card */}
                    {(() => {
                      let text = "";
                      let label = "";
                      if (activeBioFormat === "phone") {
                        text = executiveBioData.phoneElevatorPitch;
                        label = "Recruiter Phone Screen Elevator Pitch (30-45 Seconds Spoken)";
                      } else if (activeBioFormat === "linkedin") {
                        text = executiveBioData.linkedInNarrative;
                        label = "LinkedIn First-Person Narrative Story";
                      } else if (activeBioFormat === "executive") {
                        text = executiveBioData.executiveConferenceBio;
                        label = "Formal Third-Person Executive Biography";
                      } else if (activeBioFormat === "github") {
                        text = executiveBioData.gitHubDeveloperBio;
                        label = "GitHub Developer Profile Markdown";
                      } else {
                        text = executiveBioData.foundingEngineerPitch;
                        label = "High-Conviction Startup / Founding Engineer Pitch";
                      }

                      return (
                        <div style={{ borderRadius: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.1)", padding: "20px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                            <div>
                              <span style={{ fontSize: "11px", fontWeight: "800", color: "#38bdf8", textTransform: "uppercase" }}>
                                Active Channel
                              </span>
                              <h3 style={{ margin: "2px 0 0", color: "#ffffff", fontSize: "16px" }}>
                                {label}
                              </h3>
                            </div>
                            <CopyButton text={text} label="Copy Bio" />
                          </div>

                          <div
                            style={{
                              padding: "16px 20px",
                              borderRadius: "8px",
                              background: "rgba(0,0,0,0.4)",
                              border: "1px solid rgba(255,255,255,0.08)",
                              fontSize: "13.5px",
                              color: "#e4e4e7",
                              lineHeight: "1.7",
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {text}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "40px" }}>
                    <p style={{ color: "var(--text-muted)", marginBottom: "16px" }}>
                      Generate 5 multi-channel personas and executive bios mapped to your skills.
                    </p>
                    <Button onClick={() => handleRunExecutiveBio()} icon={<AwardIcon width={16} height={16} />}>
                      Generate Executive Persona Bios
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ========================================================
              TAB 20: AI 7-DAY INTERVIEW BOOTCAMP SPRINT
              ======================================================== */}
          {activeTab === "sprint" && (
            <div className="dashboard__grid">
              <Card
                className="col-12"
                title="AI 7-Day High-Stakes Interview Bootcamp Sprint"
                icon={<CalendarIcon width={20} height={20} />}
                action={
                  <Button
                    onClick={() => handleRunInterviewSprint()}
                    variant="secondary"
                    disabled={interviewSprintLoading}
                    icon={<SparkleIcon width={14} height={14} />}
                  >
                    {interviewSprintLoading ? "Calibrating..." : "Regenerate Sprint"}
                  </Button>
                }
              >
                {interviewSprintLoading ? (
                  <div style={{ padding: "40px", textAlign: "center" }}>
                    <div className="skeleton" style={{ width: "60px", height: "60px", borderRadius: "50%", margin: "0 auto 16px" }} />
                    <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                      Building bespoke 7-day interview agenda tailored to your job description gaps...
                    </p>
                  </div>
                ) : interviewSprintData?.days ? (
                  <div>
                    {/* Day Selector Pills */}
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
                      {interviewSprintData.days.map((d) => (
                        <button
                          key={d.day}
                          type="button"
                          onClick={() => setActiveSprintDay(d.day)}
                          style={{
                            padding: "8px 14px",
                            borderRadius: "8px",
                            fontSize: "12.5px",
                            fontWeight: "700",
                            cursor: "pointer",
                            background: activeSprintDay === d.day ? "#ffffff" : "rgba(255,255,255,0.06)",
                            color: activeSprintDay === d.day ? "#000000" : "#a1a1aa",
                            border: activeSprintDay === d.day ? "1px solid #ffffff" : "1px solid rgba(255,255,255,0.1)",
                            transition: "all 0.15s ease",
                          }}
                        >
                          Day {d.day}: {d.title.split("&")[0]}
                        </button>
                      ))}
                    </div>

                    {/* Active Day Card */}
                    {(() => {
                      const curDay = interviewSprintData.days.find((d) => d.day === activeSprintDay) || interviewSprintData.days[0];
                      if (!curDay) return null;

                      return (
                        <div style={{ borderRadius: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.1)", padding: "20px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                            <div>
                              <span style={{ fontSize: "11px", fontWeight: "800", color: "#38bdf8", textTransform: "uppercase" }}>
                                Sprint Milestone: Day {curDay.day}
                              </span>
                              <h3 style={{ margin: "2px 0 0", color: "#ffffff", fontSize: "18px" }}>
                                {curDay.title}
                              </h3>
                            </div>
                            <span style={{ fontSize: "12px", fontWeight: "700", color: "#4ade80", padding: "4px 10px", background: "rgba(74,222,128,0.15)", borderRadius: "6px" }}>
                              ⏱️ Target: {curDay.hours}
                            </span>
                          </div>

                          <div style={{ padding: "12px 14px", borderRadius: "8px", background: "rgba(0,0,0,0.3)", marginBottom: "16px" }}>
                            <span style={{ fontSize: "11px", fontWeight: "800", color: "#a1a1aa", textTransform: "uppercase" }}>
                              Day Objective:
                            </span>
                            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#ffffff" }}>
                              {curDay.objective}
                            </p>
                          </div>

                          {/* Action Items */}
                          <div style={{ marginBottom: "16px" }}>
                            <span style={{ fontSize: "12px", fontWeight: "800", color: "#ffffff", textTransform: "uppercase" }}>
                              Action Plan & Practical Exercises:
                            </span>
                            <ul style={{ margin: "8px 0 0", paddingLeft: "18px", color: "var(--text-muted)", fontSize: "12.5px", lineHeight: "1.6" }}>
                              {curDay.actionItems?.map((item, idx) => (
                                <li key={idx} style={{ marginBottom: "4px" }}>{item}</li>
                              ))}
                            </ul>
                          </div>

                          {/* Must Practice Drill Question */}
                          <div style={{ padding: "14px 16px", borderRadius: "8px", background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.2)" }}>
                            <span style={{ fontSize: "11px", fontWeight: "800", color: "#38bdf8", textTransform: "uppercase" }}>
                              🎯 Key Practice Drill Question:
                            </span>
                            <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#ffffff", fontWeight: "500", lineHeight: "1.5" }}>
                              "{curDay.drillQuestion}"
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "40px" }}>
                    <p style={{ color: "var(--text-muted)", marginBottom: "16px" }}>
                      Generate a personalized 7-day high-stakes interview bootcamp plan.
                    </p>
                    <Button onClick={() => handleRunInterviewSprint()} icon={<CalendarIcon width={16} height={16} />}>
                      Generate 7-Day Sprint Plan
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ========================================================
              TAB 21: AI RESUME LOCALIZATION & GLOBAL MARKET ADAPTER
              ======================================================== */}
          {activeTab === "localization" && (
            <div className="dashboard__grid">
              <Card
                className="col-12"
                title="AI Resume Localization & Global Market Adapter"
                icon={<GlobeIcon width={20} height={20} />}
                action={
                  <Button
                    onClick={() => handleRunLocalizedResume()}
                    variant="secondary"
                    disabled={localizedResumeLoading}
                    icon={<SparkleIcon width={14} height={14} />}
                  >
                    {localizedResumeLoading ? "Adapting..." : "Re-Adapt Resume"}
                  </Button>
                }
              >
                {localizedResumeLoading ? (
                  <div style={{ padding: "40px", textAlign: "center" }}>
                    <div className="skeleton" style={{ width: "60px", height: "60px", borderRadius: "50%", margin: "0 auto 16px" }} />
                    <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                      Analyzing regional recruitment laws, compensation benchmarks, and CV expectations...
                    </p>
                  </div>
                ) : (
                  <div>
                    {/* Country Selector Pills */}
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
                      {[
                        { id: "US", label: "🇺🇸 United States (Silicon Valley / NYC / Austin)" },
                        { id: "UK_EU", label: "🇬🇧 🇪🇺 UK & European Union (London / Berlin / Amsterdam)" },
                        { id: "UAE", label: "🇦🇪 UAE & Gulf (Dubai / Abu Dhabi)" },
                        { id: "APAC", label: "🌏 Asia-Pacific (Singapore / Bangalore / Sydney)" },
                      ].map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setTargetCountry(c.id);
                            handleRunLocalizedResume(c.id);
                          }}
                          style={{
                            padding: "8px 14px",
                            borderRadius: "8px",
                            fontSize: "12.5px",
                            fontWeight: "700",
                            cursor: "pointer",
                            background: targetCountry === c.id ? "#ffffff" : "rgba(255,255,255,0.06)",
                            color: targetCountry === c.id ? "#000000" : "#a1a1aa",
                            border: targetCountry === c.id ? "1px solid #ffffff" : "1px solid rgba(255,255,255,0.1)",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>

                    {localizedResumeData ? (
                      <div style={{ borderRadius: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.1)", padding: "20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
                          <div>
                            <span style={{ fontSize: "11px", fontWeight: "800", color: "#38bdf8", textTransform: "uppercase" }}>
                              Regional Market Standard
                            </span>
                            <h3 style={{ margin: "2px 0 0", color: "#ffffff", fontSize: "18px" }}>
                              {localizedResumeData.marketDetails?.flag} {localizedResumeData.marketDetails?.name}
                            </h3>
                          </div>
                          <span style={{ fontSize: "12px", fontWeight: "700", color: "#4ade80", padding: "4px 10px", background: "rgba(74,222,128,0.15)", borderRadius: "6px" }}>
                            💰 {localizedResumeData.marketDetails?.compBand}
                          </span>
                        </div>

                        {/* Market Parameters Grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px", marginBottom: "16px" }}>
                          <div style={{ padding: "12px 14px", background: "rgba(0,0,0,0.4)", borderRadius: "8px" }}>
                            <span style={{ fontSize: "11px", fontWeight: "800", color: "#a1a1aa" }}>
                              📄 Page Length Standard:
                            </span>
                            <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "#ffffff" }}>
                              {localizedResumeData.marketDetails?.pageStandard}
                            </p>
                          </div>

                          <div style={{ padding: "12px 14px", background: "rgba(0,0,0,0.4)", borderRadius: "8px" }}>
                            <span style={{ fontSize: "11px", fontWeight: "800", color: "#a1a1aa" }}>
                              🔒 Personal Information & Anti-Bias Rule:
                            </span>
                            <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "#e4e4e7" }}>
                              {localizedResumeData.marketDetails?.personalInfoRule}
                            </p>
                          </div>

                          <div style={{ padding: "12px 14px", background: "rgba(0,0,0,0.4)", borderRadius: "8px" }}>
                            <span style={{ fontSize: "11px", fontWeight: "800", color: "#a1a1aa" }}>
                              🎯 Tone & Content Culture:
                            </span>
                            <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "#e4e4e7" }}>
                              {localizedResumeData.marketDetails?.formattingCulture}
                            </p>
                          </div>

                          <div style={{ padding: "12px 14px", background: "rgba(0,0,0,0.4)", borderRadius: "8px" }}>
                            <span style={{ fontSize: "11px", fontWeight: "800", color: "#a1a1aa" }}>
                              🛂 Visa & Work Authorization:
                            </span>
                            <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "#e4e4e7" }}>
                              {localizedResumeData.marketDetails?.visaAdvice}
                            </p>
                          </div>
                        </div>

                        {/* Localized Summary */}
                        <div style={{ padding: "14px 18px", borderRadius: "8px", background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.2)", marginBottom: "16px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                            <span style={{ fontSize: "11px", fontWeight: "800", color: "#38bdf8", textTransform: "uppercase" }}>
                              Regionally Adapted Executive Summary:
                            </span>
                            <CopyButton text={localizedResumeData.localizedExecutiveSummary} label="Copy Summary" />
                          </div>
                          <p style={{ margin: 0, fontSize: "13px", color: "#ffffff", lineHeight: "1.6" }}>
                            "{localizedResumeData.localizedExecutiveSummary}"
                          </p>
                        </div>

                        {/* Checklist */}
                        <div>
                          <span style={{ fontSize: "11px", fontWeight: "800", color: "#ffffff", textTransform: "uppercase" }}>
                            Regional Compliance Checklist:
                          </span>
                          <ul style={{ margin: "6px 0 0", paddingLeft: "18px", color: "var(--text-muted)", fontSize: "12px", lineHeight: "1.6" }}>
                            {localizedResumeData.actionableChecklist?.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: "center", padding: "40px" }}>
                        <Button onClick={() => handleRunLocalizedResume()} icon={<GlobeIcon width={16} height={16} />}>
                          Adapt Resume to {targetCountry} Market
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ========================================================
              INLINE RESUME REFINEMENT & EDITOR MODAL
              ======================================================== */}
          {isEditorOpen && (
            <div className="editor-overlay">
              <div className="editor-modal">
                <div className="editor-modal__head">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <EditIcon width={18} height={18} style={{ color: "#ffffff" }} />
                    <h3 style={{ margin: 0, color: "#ffffff", fontSize: "1.1rem" }}>
                      Edit & Refine Candidate Resume
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditorOpen(false)}
                    style={{ background: "transparent", border: "none", color: "#94a3b8", fontSize: "20px", cursor: "pointer" }}
                  >
                    ✕
                  </button>
                </div>

                <div className="editor-modal__body">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                    <div className="editor-field">
                      <label className="editor-label">Candidate Name</label>
                      <input
                        type="text"
                        className="editor-input"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    </div>
                    <div className="editor-field">
                      <label className="editor-label">Email Address</label>
                      <input
                        type="email"
                        className="editor-input"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                      />
                    </div>
                    <div className="editor-field">
                      <label className="editor-label">Phone Number</label>
                      <input
                        type="text"
                        className="editor-input"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Skills Editor */}
                  <div className="editor-field">
                    <label className="editor-label">
                      Skills & Technologies ({editSkills.length}):
                    </label>
                    <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                      <input
                        type="text"
                        className="editor-input"
                        placeholder="Add skill (e.g. Docker, GraphQL, PyTorch)... Press Enter"
                        value={newSkillInput}
                        onChange={(e) => setNewSkillInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddSkill();
                          }
                        }}
                        style={{ flex: 1 }}
                      />
                      <Button onClick={() => handleAddSkill()} variant="secondary">
                        + Add Skill
                      </Button>
                    </div>

                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", maxHeight: "120px", overflowY: "auto", padding: "8px", background: "rgba(0,0,0,0.3)", borderRadius: "8px" }}>
                      {editSkills.map((sk, idx) => (
                        <span key={idx} className="editor-chip">
                          {sk}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(idx)}
                            className="editor-chip__del"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>

                    {/* Quick Add Missing Keywords Suggestions */}
                    {atsResult?.missingKeywords && atsResult.missingKeywords.length > 0 && (
                      <div style={{ marginTop: "6px" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600" }}>
                          Missing from target job (Click to add):
                        </span>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
                          {atsResult.missingKeywords.map((gap, gi) => (
                            <button
                              key={gi}
                              type="button"
                              onClick={() => handleAddSkill(gap)}
                              style={{
                                background: "rgba(255, 255, 255, 0.08)",
                                border: "1px solid rgba(255, 255, 255, 0.25)",
                                color: "#ffffff",
                                padding: "2px 8px",
                                borderRadius: "4px",
                                fontSize: "11px",
                                cursor: "pointer",
                              }}
                            >
                              + {gap}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Experience */}
                  <div className="editor-field">
                    <label className="editor-label">Work Experience (1 bullet or entry per line):</label>
                    <textarea
                      rows={5}
                      className="editor-input"
                      value={editExperienceText}
                      onChange={(e) => setEditExperienceText(e.target.value)}
                      style={{ fontFamily: "var(--font-mono)", fontSize: "12px", lineHeight: "1.6" }}
                    />
                  </div>

                  {/* Education & Projects */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div className="editor-field">
                      <label className="editor-label">Education Details:</label>
                      <textarea
                        rows={3}
                        className="editor-input"
                        value={editEducationText}
                        onChange={(e) => setEditEducationText(e.target.value)}
                        style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}
                      />
                    </div>
                    <div className="editor-field">
                      <label className="editor-label">Projects:</label>
                      <textarea
                        rows={3}
                        className="editor-input"
                        value={editProjectsText}
                        onChange={(e) => setEditProjectsText(e.target.value)}
                        style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}
                      />
                    </div>
                  </div>
                </div>

                <div className="editor-modal__foot">
                  <button
                    type="button"
                    onClick={() => setIsEditorOpen(false)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#94a3b8",
                      fontSize: "13px",
                      cursor: "pointer",
                      padding: "8px 16px",
                    }}
                  >
                    Cancel
                  </button>
                  <Button onClick={handleSaveEditor} icon={<CheckIcon width={16} height={16} />}>
                    Save & Recalculate ATS Score
                  </Button>
                </div>
              </div>
            </div>
          )}
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
