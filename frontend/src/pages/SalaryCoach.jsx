import { useState, useEffect } from "react";
import AppLayout from "../components/AppLayout";
import { useAuth } from "../context/AuthContext";
import { useResume } from "../context/ResumeContext";
import { useToast } from "../context/ToastContext";
import {
  DollarIcon,
  SparkleIcon,
  TrendingUpIcon,
  CopyIcon,
  CheckIcon,
  ShieldCheckIcon,
  BriefcaseIcon,
  AwardIcon,
  RefreshIcon,
} from "../components/icons";
import { getSalaryEstimateWithAi, getNegotiationCoach } from "../lib/api";
import "../styles/ui.css";
import "../styles/SalaryCoach.css";

const PRESET_ROLES = [
  { role: "Senior Full-Stack & Generative AI Architect", location: "San Francisco / US Remote", exp: "senior", base: 175000, equity: 75000, bonus: 25000 },
  { role: "Staff Platform & Distributed Systems Engineer", location: "San Francisco / Remote", exp: "staff", base: 215000, equity: 120000, bonus: 35000 },
  { role: "Senior Frontend Engineer (React/TypeScript)", location: "New York / Remote", exp: "senior", base: 160000, equity: 50000, bonus: 20000 },
  { role: "Engineering Manager / Tech Lead", location: "Austin / Remote", exp: "staff", base: 195000, equity: 80000, bonus: 30000 },
];

export default function SalaryCoach() {
  const { user } = useAuth();
  const { activeResume } = useResume();
  const { showToast } = useToast();

  const [role, setRole] = useState(user?.targetTitle || "Senior Full-Stack & Generative AI Architect");
  const [location, setLocation] = useState(user?.targetLocation || "San Francisco / US Remote");
  const [companyType, setCompanyType] = useState("Unicorn"); // 'FAANG' | 'Unicorn' | 'Enterprise' | 'Startup'
  const [currentOffer, setCurrentOffer] = useState(165000);
  const [targetSalary, setTargetSalary] = useState(185000);
  const [equityGrant, setEquityGrant] = useState(60000); // 4-year annual
  const [percentile, setPercentile] = useState(75);

  const [activeTab, setActiveTab] = useState("scripts"); // 'scripts' | 'breakdown' | 'talking-points'
  const [selectedScriptIndex, setSelectedScriptIndex] = useState(0);
  const [copiedKey, setCopiedKey] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [coachData, setCoachData] = useState(null);

  // Compute calculated compensation figures
  const baseSalary = Math.round((currentOffer * (percentile / 65)));
  const bonusAmount = Math.round(baseSalary * 0.15);
  const totalComp = baseSalary + bonusAmount + Number(equityGrant);

  async function loadNegotiationCoachData() {
    setIsLoading(true);
    try {
      const res = await getNegotiationCoach({
        role,
        location,
        targetSalary,
        currentOffer,
        companyType,
      });
      if (res?.success) {
        setCoachData(res);
      }
    } catch (err) {
      console.warn("Salary coach API error:", err.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadNegotiationCoachData();
  }, [role, location, companyType]);

  function handleSelectPreset(p) {
    setRole(p.role);
    setLocation(p.location);
    setCurrentOffer(p.base);
    setTargetSalary(Math.round(p.base * 1.15));
    setEquityGrant(p.equity);
    showToast(`Loaded benchmark for ${p.role.split(" ")[0]}!`, "info");
  }

  function handleCopy(text, key) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast("Copied script to clipboard!", "success");
    setTimeout(() => setCopiedKey(null), 2000);
  }

  const scripts = [
    {
      id: "competing-offer",
      title: "Scenario 1: Competing Offer Leverage",
      badge: "High Leverage",
      description: "Use when you have another active offer or are near final stages with another company.",
      subject: `Offer Discussion - ${role} - ${user?.name || "Candidate"}`,
      body: `Hi [Recruiter Name],\n\nThank you again for extending the offer to join [Company Name] as ${role}. I am genuinely excited about the team's roadmap and mission.\n\nWhile reviewing the compensation package, I wanted to discuss the base salary component. I am currently evaluating a competing offer in the range of $${(currentOffer * 1.15).toLocaleString()}, which reflects the technical scope required for this level.\n\nBecause [Company Name] is my top preference, if we can adjust the base to $${targetSalary.toLocaleString()} (or increase the initial equity grant to $${(equityGrant * 1.25).toLocaleString()}), I would be delighted to sign immediately and decline other ongoing conversations.\n\nLooking forward to your thoughts!\n\nBest regards,\n${user?.name || "Cheralathan B.N"}`,
    },
    {
      id: "market-value",
      title: "Scenario 2: Market Benchmark Anchor",
      badge: "Data-Driven",
      description: "Use when anchoring against verified 75th percentile market data for your role and tech stack.",
      subject: `Follow-up on Offer Details - ${role}`,
      body: `Hi [Recruiter Name],\n\nI really appreciate the conversation and the offer details shared earlier today. I am very enthusiastic about the opportunity to contribute to [Company Name].\n\nBased on my verified market research for ${role} positions in ${location}—particularly given my hands-on background architecting distributed systems and optimizing microservice latency—the 75th percentile for this level is centered around $${targetSalary.toLocaleString()}.\n\nGiven the immediate business impact I will bring from Day 1, could we explore bringing the base salary to $${targetSalary.toLocaleString()}? I am eager to finalize our agreement.\n\nWarmly,\n${user?.name || "Cheralathan B.N"}`,
    },
    {
      id: "equity-vs-cash",
      title: "Scenario 3: Equity vs. Cash Optimization",
      badge: "Flexible Upside",
      description: "Use when the company is constrained on cash but has flexibility with RSUs or stock options.",
      subject: `Compensation Structure Flexibility - ${role}`,
      body: `Hi [Recruiter Name],\n\nThank you for the thorough breakdown of the package. I have deep conviction in [Company Name]'s long-term trajectory and would love to align myself even closer to company growth.\n\nIf cash base flexibility is tight at $${currentOffer.toLocaleString()}, I would be enthusiastic about offsetting the difference with an additional grant of equity (e.g. an extra $${Math.round(equityGrant * 0.35).toLocaleString()} over the 4-year vesting schedule) and a $${Math.round(currentOffer * 0.08).toLocaleString()} sign-on bonus to ease the transition.\n\nWould that structure be feasible on your end?\n\nBest,\n${user?.name || "Cheralathan B.N"}`,
    },
    {
      id: "accelerated-review",
      title: "Scenario 4: Early Performance Review Clause",
      badge: "Low Risk",
      description: "Use when you want to lock in a guaranteed salary evaluation within 6 months of joining.",
      subject: `Contract Terms Clarification - 6-Month Review`,
      body: `Hi [Recruiter Name],\n\nThank you for working through these details with me. I understand the budget constraints for this band and am happy with the $${currentOffer.toLocaleString()} starting base.\n\nTo ensure we are aligned as I ramp up and ship critical milestones, could we include a written provision for an accelerated 6-month performance review with target progression to $${targetSalary.toLocaleString()} upon meeting our agreed deliverables?\n\nI look forward to hitting the ground running!\n\nBest,\n${user?.name || "Cheralathan B.N"}`,
    },
  ];

  return (
    <AppLayout>
      <div className="salary-coach">
        {/* Header */}
        <div className="coach-header">
          <div>
            <div className="coach-eyebrow">
              <DollarIcon width={13} height={13} />
              <span>Career Intelligence & Compensation Studio</span>
            </div>
            <h1 className="coach-title">Salary Benchmark & Offer Negotiator</h1>
            <p className="coach-subtitle">
              Explore market compensation percentiles (Base, Equity, Bonus), calculate total 4-year package value,
              and copy tailored counter-offer email scripts.
            </p>
          </div>

          <div className="coach-quick-totals">
            <div className="total-chip">
              <span className="total-label">Est. Total Year-1 Comp</span>
              <span className="total-val">${totalComp.toLocaleString()}</span>
            </div>
            <div className="total-chip">
              <span className="total-label">Base Salary (P{percentile})</span>
              <span className="total-val" style={{ color: "#4ade80" }}>${baseSalary.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="preset-bar">
          <span className="preset-label">Industry Benchmarks:</span>
          {PRESET_ROLES.map((p) => (
            <button
              key={p.role}
              type="button"
              className={`preset-btn ${role === p.role ? "active" : ""}`}
              onClick={() => handleSelectPreset(p)}
            >
              <span>{p.role.split(" ")[0]}</span>
              <span className="preset-salary">${(p.base / 1000).toFixed(0)}k Base</span>
            </button>
          ))}
        </div>

        {/* 2-Column Main Workspace */}
        <div className="coach-grid">
          {/* Controls & Breakdown Column */}
          <div className="coach-inputs-card">
            <h3 className="section-title">Offer & Market Parameters</h3>

            <div className="form-group">
              <label>Role & Seniority Level</label>
              <input
                type="text"
                className="input-field"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Senior Full-Stack & Generative AI Architect"
              />
            </div>

            <div className="form-group">
              <label>Location / Geo Tier</label>
              <input
                type="text"
                className="input-field"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. San Francisco, CA / US Remote"
              />
            </div>

            <div className="form-group">
              <label>Company Stage & Type</label>
              <div className="company-type-grid">
                {["FAANG", "Unicorn", "Enterprise", "Startup"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`type-btn ${companyType === type ? "active" : ""}`}
                    onClick={() => setCompanyType(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <label>Target Percentile: P{percentile}</label>
                <span style={{ fontSize: "12px", color: "#4ade80", fontWeight: 700 }}>
                  ${baseSalary.toLocaleString()} Base
                </span>
              </div>
              <input
                type="range"
                min="40"
                max="95"
                step="5"
                value={percentile}
                onChange={(e) => setPercentile(Number(e.target.value))}
                className="percentile-slider"
              />
              <div className="slider-labels">
                <span>P25 ($140k)</span>
                <span>P50 Median ($165k)</span>
                <span>P75 Top ($195k)</span>
                <span>P90 ($230k+)</span>
              </div>
            </div>

            <div className="form-group">
              <label>Annual Equity / RSUs ($/year)</label>
              <input
                type="number"
                className="input-field"
                value={equityGrant}
                onChange={(e) => setEquityGrant(Number(e.target.value))}
                step="5000"
              />
            </div>

            {/* Total Comp Visualizer */}
            <div className="comp-breakdown-card">
              <div className="comp-item">
                <span className="comp-dot base" />
                <span className="comp-name">Base Salary</span>
                <span className="comp-amount">${baseSalary.toLocaleString()}</span>
              </div>
              <div className="comp-item">
                <span className="comp-dot bonus" />
                <span className="comp-name">Target Bonus (15%)</span>
                <span className="comp-amount">${bonusAmount.toLocaleString()}</span>
              </div>
              <div className="comp-item">
                <span className="comp-dot equity" />
                <span className="comp-name">Annual Equity (RSUs)</span>
                <span className="comp-amount">${Number(equityGrant).toLocaleString()}</span>
              </div>
              <div className="comp-total-divider" />
              <div className="comp-item total">
                <span className="comp-name">Total First-Year Comp</span>
                <span className="comp-amount">${totalComp.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Scripts & Negotiation Tactics Column */}
          <div className="coach-scripts-card">
            {/* Tab selector */}
            <div className="script-tab-header">
              <div className="script-tab-group">
                <button
                  type="button"
                  className={`tab-btn ${activeTab === "scripts" ? "active" : ""}`}
                  onClick={() => setActiveTab("scripts")}
                >
                  <CopyIcon width={14} height={14} />
                  <span>Counter-Offer Emails</span>
                </button>
                <button
                  type="button"
                  className={`tab-btn ${activeTab === "talking-points" ? "active" : ""}`}
                  onClick={() => setActiveTab("talking-points")}
                >
                  <ShieldCheckIcon width={14} height={14} />
                  <span>Phone Tactics</span>
                </button>
              </div>
            </div>

            {activeTab === "scripts" && (
              <div className="script-workspace fadeIn">
                {/* Scenario Sub-selector */}
                <div className="scenario-chips">
                  {scripts.map((s, idx) => (
                    <button
                      key={s.id}
                      type="button"
                      className={`scenario-chip ${selectedScriptIndex === idx ? "active" : ""}`}
                      onClick={() => setSelectedScriptIndex(idx)}
                    >
                      <span>{s.title.split(":")[0]}</span>
                      <span className="scenario-badge">{s.badge}</span>
                    </button>
                  ))}
                </div>

                {/* Selected Script Content */}
                {scripts[selectedScriptIndex] && (
                  <div className="script-box">
                    <div className="script-box-head">
                      <div>
                        <h4 className="script-title">{scripts[selectedScriptIndex].title}</h4>
                        <p className="script-desc">{scripts[selectedScriptIndex].description}</p>
                      </div>
                      <button
                        type="button"
                        className="btn btn--secondary btn--sm"
                        onClick={() => handleCopy(scripts[selectedScriptIndex].body, `script-${selectedScriptIndex}`)}
                      >
                        {copiedKey === `script-${selectedScriptIndex}` ? (
                          <CheckIcon width={13} height={13} />
                        ) : (
                          <CopyIcon width={13} height={13} />
                        )}
                        <span>{copiedKey === `script-${selectedScriptIndex}` ? "Copied" : "Copy Script"}</span>
                      </button>
                    </div>

                    <div className="script-subject-row">
                      <span className="subject-tag">Subject:</span>
                      <span className="subject-text">{scripts[selectedScriptIndex].subject}</span>
                    </div>

                    <div className="script-content-preview">
                      <pre>{scripts[selectedScriptIndex].body}</pre>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "talking-points" && (
              <div className="tactics-list fadeIn">
                <div className="tactic-card">
                  <span className="tactic-num">01</span>
                  <div>
                    <h5 className="tactic-title">When Recruiter Asks: "What are your salary expectations?"</h5>
                    <p className="tactic-body">
                      "I want to make sure the role is the right mutual fit before focusing solely on numbers. That said, based on market benchmarks for senior responsibilities in this tier, I am targeting roles in the <strong>${targetSalary.toLocaleString()}</strong> range with strong equity participation."
                    </p>
                  </div>
                </div>

                <div className="tactic-card">
                  <span className="tactic-num">02</span>
                  <div>
                    <h5 className="tactic-title">When Recruiter Says: "This is our final offer budget."</h5>
                    <p className="tactic-body">
                      "I understand budget constraints can be rigid on base salary. Can we explore adjusting the sign-on bonus to bridge the gap, or increasing the equity grant by 20%? That would give me the confidence to make a firm commitment today."
                    </p>
                  </div>
                </div>

                <div className="tactic-card">
                  <span className="tactic-num">03</span>
                  <div>
                    <h5 className="tactic-title">The Golden Rule: Never negotiate against yourself</h5>
                    <p className="tactic-body">
                      Always thank them warmly for the offer, express genuine excitement, and state: "I'd love to review the complete package in writing with my family tonight and get back to you with my thoughts by tomorrow morning."
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
