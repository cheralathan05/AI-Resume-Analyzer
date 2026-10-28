import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/ui.css";
import "../styles/Loading.css";
import AppHeader from "../components/AppHeader";
import { SparkleIcon, CheckIcon } from "../components/icons";

/* Fake analysis pipeline — purely cosmetic, no real work happens. */
const STEPS = [
  "Reading Resume",
  "Extracting Skills",
  "Matching ATS Keywords",
  "AI Analysis",
  "Preparing Dashboard",
];

const STEP_DURATION = 1100; // ms per step

/*
 * Premium loading screen.
 * Walks through a set of fake analysis steps with a shimmering progress
 * bar, ticking each step off as it completes, then auto-navigates to the
 * dashboard. No backend / API is involved.
 */
function LoadingAnalysis() {
  const navigate = useNavigate();
  const location = useLocation();
  const fileName = location.state?.fileName;

  // index of the step currently in progress
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (current >= STEPS.length) {
      // brief pause on completion, then go to the dashboard
      const done = setTimeout(() => {
        navigate("/dashboard", { state: { fileName }, replace: true });
      }, 650);
      return () => clearTimeout(done);
    }

    const timer = setTimeout(() => {
      setCurrent((c) => c + 1);
    }, STEP_DURATION);
    return () => clearTimeout(timer);
  }, [current, navigate, fileName]);

  const completed = Math.min(current, STEPS.length);
  const percent = Math.round((completed / STEPS.length) * 100);

  return (
    <div className="app-page">
      <div className="app-glow" />
      <AppHeader showHome={false} />

      <main className="app-page__main">
        <section className="loading container">
          <div className="loading__card">
            <div className="loading__orb">
              <span className="loading__orb-ring" />
              <span className="loading__orb-core">
                <SparkleIcon width={30} height={30} />
              </span>
            </div>

            <h1 className="loading__title">Analyzing Resume...</h1>
            <p className="loading__subtitle">
              {fileName
                ? `Crunching “${fileName}” — this only takes a moment.`
                : "Hang tight while our AI reviews your resume."}
            </p>

            <div
              className="loading__progress"
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="loading__progress-fill"
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="loading__percent">{percent}%</span>

            <ul className="loading__steps">
              {STEPS.map((step, i) => {
                const isDone = i < current;
                const isActive = i === current;
                const stepClass = [
                  "loading__step",
                  isDone ? "loading__step--done" : "",
                  isActive ? "loading__step--active" : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <li key={step} className={stepClass}>
                    <span className="loading__step-mark">
                      {isDone ? (
                        <CheckIcon width={15} height={15} />
                      ) : isActive ? (
                        <span className="loading__spinner" />
                      ) : (
                        i + 1
                      )}
                    </span>
                    {step}
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}

export default LoadingAnalysis;
