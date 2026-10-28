import { useState, useEffect, useRef } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import "../styles/ui.css";
import "../styles/MockInterview.css";
import AppLayout from "../components/AppLayout";
import Button from "../components/Button";
import { useResume } from "../context/ResumeContext";
import { useAuth } from "../context/AuthContext";
import {
  MicIcon,
  MicOffIcon,
  VolumeIcon,
  WaveIcon,
  SparkleIcon,
  CheckIcon,
  AlertIcon,
  BrainIcon,
  FlameIcon,
  AwardIcon,
  RefreshIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CopyIcon,
  DownloadIcon,
  SlidersIcon,
  CloseIcon,
  DocumentIcon,
} from "../components/icons";
import {
  generateInterviewPrepWithAi,
  gradeInterviewAnswerWithAi,
  generateFollowUpQuestionWithAi,
  getSampleResumesAndJobs,
  getErrorMessage,
} from "../lib/api";

const PERSONAS = [
  {
    id: "alex",
    name: "Alex Vance",
    title: "Principal System Architect",
    avatar: "👨‍💻",
    tagline: "Probes distributed state, high concurrency, failure modes & architectural trade-offs.",
  },
  {
    id: "sarah",
    name: "Sarah Chen",
    title: "VP of Engineering",
    avatar: "👩‍💼",
    tagline: "Amazon-style STAR behavioral evaluator; tests leadership, ambiguity & team alignment.",
  },
  {
    id: "david",
    name: "David Miller",
    title: "Startup Founder & CTO",
    avatar: "⚡",
    tagline: "Tests rapid debugging, bias for action, scrappy execution & customer ROI delivery.",
  },
  {
    id: "elena",
    name: "Elena Rostova",
    title: "Senior Staff Mentor",
    avatar: "🌟",
    tagline: "Empathetic, deep on software design patterns, testing discipline & clean code.",
  },
];

const MODES = [
  { id: "mixed", label: "Mixed Full-Scope" },
  { id: "behavioral", label: "Behavioral STAR" },
  { id: "system_design", label: "System Architecture" },
];

const DIFFICULTIES = [
  { id: "junior", label: "Junior / Mid (0-3 YOE)" },
  { id: "senior", label: "Senior Engineer (4-8 YOE)" },
  { id: "staff", label: "Principal / Staff (8+ YOE)" },
];

const POPULAR_ROLES = [
  "Senior Full-Stack Engineer",
  "Frontend Architect (React/TypeScript)",
  "Backend & Cloud Engineer (Node/AWS)",
  "AI & Machine Learning Engineer",
  "Engineering Manager / Tech Lead",
];

const FILLER_WORDS = ["um", "uh", "like", "basically", "actually", "sort of", "kind of", "you know"];

export default function MockInterview() {
  const location = useLocation();
  const navigate = useNavigate();

  const { activeResume, activeFileName } = useResume();
  const { user } = useAuth();

  // Passed state or active real resume
  const passedResume = location.state?.resume || activeResume || null;
  const passedRole = location.state?.targetRole || (activeResume?.contact?.name ? (user?.targetTitle || "Senior Full-Stack & Generative AI Engineer") : "");
  const passedJd = location.state?.jobDescription || "";

  // Configuration State
  const [targetRole, setTargetRole] = useState(passedRole || "Senior Full-Stack & AI Engineer");
  const [jobDescription, setJobDescription] = useState(passedJd);
  const [activePersonaId, setActivePersonaId] = useState("alex");
  const [interviewType, setInterviewType] = useState("mixed");
  const [difficulty, setDifficulty] = useState("senior");
  const [resumeData, setResumeData] = useState(passedResume);

  // Questions State
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Candidate Answer & Speech State
  const [userAnswer, setUserAnswer] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  // Audio Playback (TTS) State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [speechRate, setSpeechRate] = useState(1.0);

  // Intel Drawers
  const [showIntel, setShowIntel] = useState(false);
  const [showBlueprint, setShowBlueprint] = useState(false);

  // AI Evaluation State
  const [isGrading, setIsGrading] = useState(false);
  const [evaluations, setEvaluations] = useState({}); // mapped by question.id or index
  const [isChallenging, setIsChallenging] = useState(false);

  // Session Summary Modal State
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);

  const activePersona = PERSONAS.find((p) => p.id === activePersonaId) || PERSONAS[0];
  const activeQuestion = questions[currentIndex] || null;
  const currentEval = activeQuestion ? evaluations[activeQuestion.id || currentIndex] : null;

  // Prioritize real active resume from context or user profile
  useEffect(() => {
    if (!resumeData && activeResume) {
      setResumeData(activeResume);
      if (!passedRole && user?.targetTitle) {
        setTargetRole(user.targetTitle);
      }
    } else if (!resumeData && !activeResume) {
      getSampleResumesAndJobs()
        .then((res) => {
          if (res?.resumes && res.resumes.length > 0) {
            setResumeData(res.resumes[0].data);
            if (!passedRole && res.resumes[0].role) {
              setTargetRole(res.resumes[0].role);
            }
          }
        })
        .catch(() => {});
    }
  }, [activeResume]);

  // Fetch Questions when starting/changing configuration
  async function loadQuestions() {
    setLoadingQuestions(true);
    try {
      const payload = await generateInterviewPrepWithAi({
        resume: resumeData || { skills: ["JavaScript", "TypeScript", "React", "Node.js"] },
        jobDescription: jobDescription || `Target role: ${targetRole}`,
        targetRole,
        interviewType,
        difficulty,
        interviewerPersona: activePersonaId,
      });

      if (payload.questions && payload.questions.length > 0) {
        setQuestions(payload.questions);
        setCurrentIndex(0);
        setUserAnswer("");
        setEvaluations({});

        // If autoSpeak is on, speak first question
        if (autoSpeak) {
          setTimeout(() => {
            handleSpeakText(payload.questions[0].question);
          }, 600);
        }
      }
    } catch (err) {
      console.warn("Error generating interview prep:", err);
    } finally {
      setLoadingQuestions(false);
    }
  }

  // Load questions on first mount once resumeData is present
  useEffect(() => {
    loadQuestions();
  }, [activePersonaId, interviewType, difficulty]);

  // Handle Speech Synthesis
  function handleSpeakText(text) {
    if (!("speechSynthesis" in window)) {
      alert("Speech synthesis is not supported by your browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechRate;
    utterance.pitch = 1.0;

    // Pick a natural voice if available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      (v) => (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Premium")) && v.lang.startsWith("en")
    ) || voices.find((v) => v.lang.startsWith("en"));
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  // Microphone Speech-to-Text Handling
  function toggleMicrophone() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Web Speech Recognition is not supported by your browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isRecording) {
      stopRecording();
      return;
    }

    // Stop speaking if AI is talking
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      let finalSoFar = userAnswer ? userAnswer + " " : "";

      recognition.onstart = () => {
        setIsRecording(true);
        setRecordingSeconds(0);
        timerRef.current = setInterval(() => {
          setRecordingSeconds((prev) => prev + 1);
        }, 1000);
      };

      recognition.onresult = (event) => {
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalSoFar += event.results[i][0].transcript + " ";
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setUserAnswer((finalSoFar + interimTranscript).trim());
      };

      recognition.onerror = (e) => {
        console.warn("Speech recognition error:", e);
        stopRecording();
      };

      recognition.onend = () => {
        stopRecording();
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Microphone startup failed:", err);
      stopRecording();
    }
  }

  function stopRecording() {
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
  }

  // Clean up timers & synthesis on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Compute live speech telemetry
  const wordCount = userAnswer.trim() ? userAnswer.trim().split(/\s+/).length : 0;
  const currentMinutes = recordingSeconds > 0 ? recordingSeconds / 60 : wordCount / 130;
  const liveWpm = currentMinutes > 0 ? Math.round(wordCount / currentMinutes) : 0;

  const foundFillers = FILLER_WORDS.filter((fw) =>
    new RegExp(`\\b${fw}\\b`, "i").test(userAnswer)
  );

  // Switch questions
  function handleSelectQuestion(index) {
    if (index < 0 || index >= questions.length) return;
    stopRecording();
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setCurrentIndex(index);
    const q = questions[index];
    const prevEval = evaluations[q.id || index];
    setUserAnswer(prevEval ? prevEval.candidateAnswer : "");

    if (autoSpeak) {
      setTimeout(() => {
        handleSpeakText(q.question);
      }, 400);
    }
  }

  // Evaluate Answer with AI
  async function handleGradeCurrentAnswer() {
    if (!activeQuestion || !userAnswer.trim() || isGrading) return;
    stopRecording();
    setIsGrading(true);

    try {
      const data = await gradeInterviewAnswerWithAi({
        question: activeQuestion.question,
        userAnswer,
        resume: resumeData,
        jobDescription,
        interviewType,
        interviewerPersona: activePersonaId,
      });

      setEvaluations((prev) => ({
        ...prev,
        [activeQuestion.id || currentIndex]: {
          ...data,
          candidateAnswer: userAnswer,
          questionText: activeQuestion.question,
        },
      }));
    } catch (err) {
      alert(`Grading failed: ${getErrorMessage(err)}`);
    } finally {
      setIsGrading(false);
    }
  }

  // Trigger Follow-up Question Drilldown
  async function handleDrillDownFollowUp() {
    if (!activeQuestion || !userAnswer.trim() || isChallenging) return;
    setIsChallenging(true);

    try {
      const data = await generateFollowUpQuestionWithAi({
        question: activeQuestion.question,
        userAnswer,
        targetRole,
        interviewerPersona: activePersonaId,
      });

      if (data.followUpQuestion) {
        // Append follow up challenge to questions list
        const newQ = {
          id: `followup-${Date.now()}`,
          category: `🔥 Follow-Up Challenge (${activePersona.name})`,
          question: data.followUpQuestion,
          whyTheyAsk: data.interviewerThought || "Probing depth, verification of ownership, and trade-off defense.",
          idealAnswerBlueprint: "Defend your engineering decision directly with metrics, cite the primary trade-off evaluated, and detail fallback plans.",
          keyTalkingPoints: ["Trade-off rationale", "Real production constraint", "Concrete metric verification"],
          difficulty,
        };

        const updated = [...questions];
        updated.splice(currentIndex + 1, 0, newQ);
        setQuestions(updated);
        handleSelectQuestion(currentIndex + 1);
      }
    } catch (err) {
      alert(`Follow-up challenge error: ${getErrorMessage(err)}`);
    } finally {
      setIsChallenging(false);
    }
  }

  // Sample Answer Helper
  function handleLoadSampleAnswer() {
    if (!activeQuestion) return;
    const sample = `In my previous role as ${targetRole}, we encountered an issue where ${activeQuestion.question.slice(0, 65)}... To solve this (Situation & Task), I architected and implemented an event-driven decoupled service utilizing Redis caching with exponential jitter and Kafka streaming (Action). As a result, we lowered p99 latency by 58%, eliminated database lock contention, and maintained 99.99% uptime during peak holiday traffic (Result).`;
    setUserAnswer(sample);
  }

  // Calculate Overall Session Stats
  const evaluatedList = Object.values(evaluations);
  const avgScore = evaluatedList.length > 0
    ? Math.round(evaluatedList.reduce((acc, cur) => acc + (cur.score || 0), 0) / evaluatedList.length)
    : 0;

  let sessionVerdict = "In Progress";
  if (evaluatedList.length > 0) {
    if (avgScore >= 85) sessionVerdict = "Strong Hire (Top 5%)";
    else if (avgScore >= 75) sessionVerdict = "Hire / Strong Candidate";
    else if (avgScore >= 60) sessionVerdict = "Leaning Hire (Needs Polish)";
    else sessionVerdict = "Needs Improvement";
  }

  function handleCopyReport() {
    let report = `AI RESUME ANALYZER - MOCK INTERVIEW PERFORMANCE REPORT\n`;
    report += `=======================================================\n`;
    report += `Candidate Target Role: ${targetRole}\n`;
    report += `Interviewer: ${activePersona.name} (${activePersona.title})\n`;
    report += `Interview Mode: ${interviewType.toUpperCase()} | Difficulty: ${difficulty.toUpperCase()}\n`;
    report += `Session Average Score: ${avgScore}/100 - Verdict: ${sessionVerdict}\n`;
    report += `Questions Evaluated: ${evaluatedList.length} of ${questions.length}\n\n`;

    evaluatedList.forEach((ev, i) => {
      report += `--- QUESTION ${i + 1} ---\n`;
      report += `Prompt: ${ev.questionText}\n`;
      report += `Score: ${ev.score}/100 (${ev.verdict})\n`;
      report += `Candidate Answer:\n${ev.candidateAnswer}\n\n`;
      report += `AI Feedback: ${ev.feedback}\n`;
      if (ev.strengths?.length) report += `Strengths: ${ev.strengths.join("; ")}\n`;
      if (ev.improvements?.length) report += `Areas to Improve: ${ev.improvements.join("; ")}\n`;
      report += `\n`;
    });

    navigator.clipboard.writeText(report);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  }

  function handleDownloadReport() {
    let report = `AI RESUME ANALYZER - MOCK INTERVIEW PERFORMANCE REPORT\n`;
    report += `Candidate Target Role: ${targetRole}\n`;
    report += `Interviewer: ${activePersona.name} (${activePersona.title})\n`;
    report += `Average Score: ${avgScore}/100 (${sessionVerdict})\n\n`;
    evaluatedList.forEach((ev, i) => {
      report += `[Q${i + 1}] ${ev.questionText}\n`;
      report += `Score: ${ev.score}/100 | Verdict: ${ev.verdict}\n`;
      report += `Feedback: ${ev.feedback}\n\n`;
    });

    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Interview_Report_${targetRole.replace(/\s+/g, "_")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppLayout>
      <div className="mock-interview__container">
        {/* Banner */}
        <section className="interview-hero">
          <div className="interview-hero__badge">
            <span className="interview-hero__pulse" />
            Live Voice AI Simulation Studio
          </div>
          <h1 className="interview-hero__title">
            Interactive AI Mock Interviewer
          </h1>
          <p className="interview-hero__subtitle">
            Simulate high-stakes technical & behavioral interviews with conversational voice AI,
            real-time microphone transcription, speaking pace analytics, and STAR answer grading.
          </p>
        </section>

        {/* Configuration Bar */}
        <section className="interview-setup">
          <div className="interview-setup__grid">
            <div className="interview-setup__field" style={{ gridColumn: "span 2" }}>
              <label className="interview-setup__label">Target Role</label>
              <input
                type="text"
                className="interview-setup__input"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Full-Stack Engineer"
              />
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
                {POPULAR_ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setTargetRole(role)}
                    className="quick-tool-btn"
                    style={{ fontSize: "11px", padding: "2px 8px" }}
                  >
                    + {role}
                  </button>
                ))}
              </div>
            </div>

            <div className="interview-setup__field">
              <label className="interview-setup__label">Interview Focus</label>
              <select
                className="interview-setup__select"
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value)}
              >
                {MODES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="interview-setup__field">
              <label className="interview-setup__label">Difficulty Level</label>
              <select
                className="interview-setup__select"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="interview-setup__field">
              <Button
                onClick={loadQuestions}
                disabled={loadingQuestions}
                icon={<RefreshIcon width={16} height={16} />}
                style={{ width: "100%", justifyContent: "center" }}
              >
                {loadingQuestions ? "Generating..." : "New Questions"}
              </Button>
            </div>
          </div>

          {/* Persona Picker */}
          <div className="persona-selector">
            {PERSONAS.map((p) => {
              const active = p.id === activePersonaId;
              return (
                <div
                  key={p.id}
                  className={`persona-card ${active ? "persona-card--active" : ""}`}
                  onClick={() => setActivePersonaId(p.id)}
                >
                  <div className="persona-avatar">{p.avatar}</div>
                  <div className="persona-info">
                    <div className="persona-name">{p.name}</div>
                    <div className="persona-title">{p.title}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Studio Grid */}
        <div className="interview-studio">
          {/* Left: AI Interviewer Card */}
          <div className="interviewer-box">
            <div className="interviewer-box__header">
              <div className="interviewer-profile">
                <div className="interviewer-profile__avatar">
                  {activePersona.avatar}
                </div>
                <div>
                  <div className="interviewer-profile__name">{activePersona.name}</div>
                  <div className="interviewer-profile__role">{activePersona.title}</div>
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <span className="question-badge">
                  Question {currentIndex + 1} of {questions.length}
                </span>
              </div>
            </div>

            {/* Dynamic Sound Wave Visualizer */}
            <div
              className={`sound-wave-stage ${
                isSpeaking
                  ? "sound-wave-stage--speaking"
                  : isRecording
                  ? "sound-wave-stage--listening"
                  : ""
              }`}
            >
              {[...Array(16)].map((_, idx) => (
                <div key={idx} className="sound-bar" />
              ))}
              <div className="sound-wave-label">
                {isSpeaking
                  ? "AI Speaking Question..."
                  : isRecording
                  ? "Listening to Candidate..."
                  : isGrading
                  ? "Evaluating Answer..."
                  : "Studio Ready"}
              </div>
            </div>

            {/* Active Question Content */}
            {activeQuestion ? (
              <div className="question-card">
                <div className="question-meta">
                  <span className="question-badge">{activeQuestion.category || "Technical Interview"}</span>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    Focus: {activePersona.style || activePersona.tagline}
                  </span>
                </div>

                <div className="question-text">
                  "{activeQuestion.question}"
                </div>

                {/* Voice Controls Bar */}
                <div className="voice-controls">
                  <button
                    type="button"
                    className={`voice-btn ${isSpeaking ? "voice-btn--active" : ""}`}
                    onClick={() => handleSpeakText(activeQuestion.question)}
                  >
                    <VolumeIcon width={16} height={16} />
                    {isSpeaking ? "Pause Audio" : "Speak Question"}
                  </button>

                  <div className="voice-settings">
                    <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={autoSpeak}
                        onChange={(e) => setAutoSpeak(e.target.checked)}
                      />
                      Auto-play next
                    </label>

                    <select
                      className="interview-setup__select"
                      style={{ padding: "4px 8px", fontSize: "12px" }}
                      value={speechRate}
                      onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                    >
                      <option value={0.85}>0.85x Speed</option>
                      <option value={1.0}>1.0x Normal</option>
                      <option value={1.15}>1.15x Fast</option>
                    </select>
                  </div>
                </div>

                {/* Expandable Interviewer Intel Drawers */}
                <div className="intel-drawer">
                  <div>
                    <button
                      type="button"
                      className="intel-toggle"
                      onClick={() => setShowIntel(!showIntel)}
                    >
                      <span>💡 Why the Interviewer Asks This</span>
                      <span>{showIntel ? "▲" : "▼"}</span>
                    </button>
                    {showIntel && (
                      <div className="intel-content" style={{ marginTop: "8px" }}>
                        {activeQuestion.whyTheyAsk || "Evaluates architectural foresight, communication clarity, and past experience."}
                      </div>
                    )}
                  </div>

                  <div>
                    <button
                      type="button"
                      className="intel-toggle"
                      onClick={() => setShowBlueprint(!showBlueprint)}
                    >
                      <span>🎯 Ideal STAR Answer Blueprint & Talking Points</span>
                      <span>{showBlueprint ? "▲" : "▼"}</span>
                    </button>
                    {showBlueprint && (
                      <div className="intel-content" style={{ marginTop: "8px" }}>
                        <p style={{ margin: "0 0 8px 0" }}>
                          <strong>Framework:</strong> {activeQuestion.idealAnswerBlueprint}
                        </p>
                        {activeQuestion.keyTalkingPoints && (
                          <ul style={{ margin: 0, paddingLeft: "18px" }}>
                            {activeQuestion.keyTalkingPoints.map((pt, i) => (
                              <li key={i}>{pt}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
                {loadingQuestions ? "Generating personalized questions..." : "Click 'New Questions' to start."}
              </div>
            )}
          </div>

          {/* Right: Candidate Answer & Microphone Studio */}
          <div className="candidate-studio">
            <div className="candidate-studio__header">
              <div className="candidate-studio__title">
                <MicIcon width={18} height={18} />
                Candidate Response Studio
              </div>

              {currentEval && (
                <span className={`verdict-badge verdict-badge--${currentEval.score >= 80 ? "strong" : "leaning"}`}>
                  Scored: {currentEval.score}/100
                </span>
              )}
            </div>

            {/* Mic Push-to-Talk Action Stage */}
            <div className={`mic-stage ${isRecording ? "mic-stage--recording" : ""}`}>
              <button
                type="button"
                className={`mic-trigger-btn ${isRecording ? "mic-trigger-btn--active" : ""}`}
                onClick={toggleMicrophone}
                title={isRecording ? "Stop Recording" : "Start Voice Recording"}
              >
                {isRecording ? <MicOffIcon width={32} height={32} /> : <MicIcon width={32} height={32} />}
              </button>

              <div className="mic-status-label">
                {isRecording ? "Listening Live... (Click to stop)" : "Click to Speak Your Answer"}
              </div>

              <div className="mic-tip">
                Uses browser speech recognition. You can also edit or type directly below.
              </div>
            </div>

            {/* Speech Telemetry Bar */}
            <div className="telemetry-bar">
              <div className="telemetry-card">
                <div className="telemetry-card__value">
                  {Math.floor(recordingSeconds / 60)}:{recordingSeconds % 60 < 10 ? "0" : ""}{recordingSeconds % 60}
                </div>
                <div className="telemetry-card__label">Speaking Time</div>
              </div>

              <div className="telemetry-card">
                <div className="telemetry-card__value">{wordCount}</div>
                <div className="telemetry-card__label">Words</div>
              </div>

              <div className="telemetry-card">
                <div className="telemetry-card__value">
                  {foundFillers.length}
                </div>
                <div className="telemetry-card__label">
                  {foundFillers.length > 0 ? `Fillers (${foundFillers.slice(0, 2).join(",")})` : "0 Fillers"}
                </div>
              </div>
            </div>

            {/* Live Transcript Textarea */}
            <div className="transcript-box">
              <textarea
                className="transcript-textarea"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Your spoken or typed answer appears here. Aim for the STAR framework (Situation, Task, Action, Result) with concrete metrics..."
              />
            </div>

            {/* Quick Action Tools */}
            <div className="quick-tools">
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="quick-tool-btn"
                  onClick={handleLoadSampleAnswer}
                >
                  <SparkleIcon width={14} height={14} />
                  Load STAR Sample Answer
                </button>

                {userAnswer && (
                  <button
                    type="button"
                    className="quick-tool-btn"
                    onClick={() => setUserAnswer("")}
                  >
                    Clear Text
                  </button>
                )}
              </div>

              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                {wordCount < 30 ? "⚠️ Recommended: 40-150 words" : "✅ Good answer length"}
              </span>
            </div>

            {/* Submit Evaluation Button */}
            <button
              type="button"
              className="evaluate-btn"
              onClick={handleGradeCurrentAnswer}
              disabled={isGrading || !userAnswer.trim()}
            >
              {isGrading ? (
                <>Evaluating STAR Response...</>
              ) : (
                <>
                  <AwardIcon width={18} height={18} />
                  Evaluate Answer with AI
                </>
              )}
            </button>
          </div>

          {/* AI Scorecard & Feedback Panel (Appears once scored) */}
          {currentEval && (
            <div className="evaluation-panel">
              <div className="evaluation-panel__header">
                <div className="evaluation-score-block">
                  <div className="score-circle">
                    <span className="score-circle__value">{currentEval.score}</span>
                    <span className="score-circle__label">Score</span>
                  </div>

                  <div>
                    <div className="evaluation-verdict-title">
                      {currentEval.verdict || "Strong Response"}
                    </div>
                    <span className={`verdict-badge verdict-badge--${currentEval.score >= 80 ? "strong" : "leaning"}`}>
                      {currentEval.score >= 85
                        ? "Top 5% Candidate Score"
                        : currentEval.score >= 75
                        ? "Hire Recommendation"
                        : "Leaning Hire - Needs Metric Polish"}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    className="follow-up-action-btn"
                    onClick={handleDrillDownFollowUp}
                    disabled={isChallenging}
                  >
                    <FlameIcon width={16} height={16} />
                    {isChallenging ? "Generating Probe..." : "🔥 Drill-Down Follow-Up"}
                  </button>
                </div>
              </div>

              {/* 4 Performance Dimension Progress Bars */}
              {currentEval.breakdown && (
                <div className="dimension-grid">
                  <div className="dimension-card">
                    <div className="dimension-card__header">
                      <span>Relevance to Prompt</span>
                      <span className="dimension-card__score">{currentEval.breakdown.relevance}%</span>
                    </div>
                    <div className="dimension-card__bar-bg">
                      <div
                        className="dimension-card__bar-fill"
                        style={{ width: `${currentEval.breakdown.relevance}%` }}
                      />
                    </div>
                  </div>

                  <div className="dimension-card">
                    <div className="dimension-card__header">
                      <span>STAR Framework</span>
                      <span className="dimension-card__score">{currentEval.breakdown.starStructure}%</span>
                    </div>
                    <div className="dimension-card__bar-bg">
                      <div
                        className="dimension-card__bar-fill"
                        style={{ width: `${currentEval.breakdown.starStructure}%` }}
                      />
                    </div>
                  </div>

                  <div className="dimension-card">
                    <div className="dimension-card__header">
                      <span>Technical Depth</span>
                      <span className="dimension-card__score">{currentEval.breakdown.technicalDepth}%</span>
                    </div>
                    <div className="dimension-card__bar-bg">
                      <div
                        className="dimension-card__bar-fill"
                        style={{ width: `${currentEval.breakdown.technicalDepth}%` }}
                      />
                    </div>
                  </div>

                  <div className="dimension-card">
                    <div className="dimension-card__header">
                      <span>Clarity & Pacing</span>
                      <span className="dimension-card__score">{currentEval.breakdown.clarityPacing}%</span>
                    </div>
                    <div className="dimension-card__bar-bg">
                      <div
                        className="dimension-card__bar-fill"
                        style={{ width: `${currentEval.breakdown.clarityPacing}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Feedback Summary */}
              {currentEval.feedback && (
                <div className="feedback-summary">
                  <strong>Interviewer Critique: </strong>
                  {currentEval.feedback}
                </div>
              )}

              {/* Strengths & Improvements */}
              <div className="feedback-columns">
                <div className="feedback-col">
                  <div className="feedback-col__title" style={{ color: "#4ade80" }}>
                    <CheckIcon width={16} height={16} />
                    Key Strengths Observed
                  </div>
                  <ul className="feedback-list">
                    {currentEval.strengths?.map((str, i) => (
                      <li key={i} className="feedback-list__item">
                        <span style={{ color: "#4ade80" }}>•</span>
                        {str}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="feedback-col">
                  <div className="feedback-col__title" style={{ color: "#facc15" }}>
                    <AlertIcon width={16} height={16} />
                    Opportunities for Growth
                  </div>
                  <ul className="feedback-list">
                    {currentEval.improvements?.map((imp, i) => (
                      <li key={i} className="feedback-list__item">
                        <span style={{ color: "#facc15" }}>•</span>
                        {imp}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Model 10/10 STAR Answer Rewrite */}
              {currentEval.polishedAnswer && (
                <div className="model-answer-card">
                  <div className="model-answer-card__header">
                    <div className="model-answer-card__title">
                      <AwardIcon width={16} height={16} />
                      Gold Standard 10/10 STAR Response
                    </div>
                    <button
                      type="button"
                      className="quick-tool-btn"
                      onClick={() => handleSpeakText(currentEval.polishedAnswer)}
                    >
                      <VolumeIcon width={14} height={14} />
                      Listen to Model Answer
                    </button>
                  </div>
                  <div className="model-answer-text">
                    "{currentEval.polishedAnswer}"
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Turn-by-Turn Navigation Bar */}
        <section className="interview-nav">
          <Button
            variant="secondary"
            onClick={() => handleSelectQuestion(currentIndex - 1)}
            disabled={currentIndex === 0}
            icon={<ArrowLeftIcon width={16} height={16} />}
          >
            Previous
          </Button>

          <div className="question-pills">
            {questions.map((q, idx) => {
              const active = idx === currentIndex;
              const scored = !!evaluations[q.id || idx];
              return (
                <button
                  key={idx}
                  type="button"
                  className={`question-pill ${active ? "question-pill--active" : ""} ${
                    scored ? "question-pill--done" : ""
                  }`}
                  onClick={() => handleSelectQuestion(idx)}
                  title={`Question ${idx + 1}${scored ? " (Evaluated)" : ""}`}
                >
                  {scored ? "✓" : idx + 1}
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <Button
              variant="secondary"
              onClick={() => setShowSummaryModal(true)}
              icon={<DocumentIcon width={16} height={16} />}
            >
              Session Report ({evaluatedList.length})
            </Button>

            <Button
              onClick={() => handleSelectQuestion(currentIndex + 1)}
              disabled={currentIndex >= questions.length - 1}
              icon={<ArrowRightIcon width={16} height={16} />}
            >
              Next
            </Button>
          </div>
        </section>
      </div>

      {/* Session Summary Modal */}
      {showSummaryModal && (
        <div className="modal-overlay" onClick={() => setShowSummaryModal(false)}>
          <div className="session-report-modal" onClick={(e) => e.stopPropagation()}>
            <div className="session-report-modal__head">
              <div>
                <h3 style={{ margin: 0, fontSize: "20px", color: "#ffffff" }}>
                  Interview Session Performance Report
                </h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--text-muted)" }}>
                  Target Role: {targetRole} • Interviewer: {activePersona.name}
                </p>
              </div>
              <button
                type="button"
                className="quick-tool-btn"
                onClick={() => setShowSummaryModal(false)}
              >
                <CloseIcon width={18} height={18} />
              </button>
            </div>

            <div className="session-report-stats">
              <div className="telemetry-card">
                <div className="telemetry-card__value">{evaluatedList.length} / {questions.length}</div>
                <div className="telemetry-card__label">Answered</div>
              </div>
              <div className="telemetry-card">
                <div className="telemetry-card__value">{avgScore}/100</div>
                <div className="telemetry-card__label">Average Score</div>
              </div>
              <div className="telemetry-card">
                <div className="telemetry-card__value" style={{ fontSize: "14px", marginTop: "2px" }}>
                  {sessionVerdict}
                </div>
                <div className="telemetry-card__label">Hiring Verdict</div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
              {evaluatedList.map((ev, i) => (
                <div
                  key={i}
                  style={{
                    padding: "12px 16px",
                    borderRadius: "10px",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontWeight: 700, fontSize: "13px", color: "#ffffff" }}>
                      Q{i + 1}: {ev.questionText.slice(0, 60)}...
                    </span>
                    <span style={{ fontWeight: 700, color: ev.score >= 80 ? "#4ade80" : "#facc15" }}>
                      {ev.score}/100
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>
                    {ev.feedback}
                  </p>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <Button
                variant="secondary"
                onClick={handleCopyReport}
                icon={<CopyIcon width={16} height={16} />}
              >
                {copiedReport ? "Copied!" : "Copy Report"}
              </Button>
              <Button
                onClick={handleDownloadReport}
                icon={<DownloadIcon width={16} height={16} />}
              >
                Download (.txt)
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
