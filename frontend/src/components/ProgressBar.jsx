import "../styles/ui.css";

/*
 * Labelled horizontal progress bar.
 * Reuses the same gradient fill + grow animation as the hero mockup.
 *
 * Props:
 *  - label: text shown on the left
 *  - value: 0–100 percentage (also drives the fill width)
 *  - variant: "brand" (default) | "warn" for weak/low scores
 *  - delay: optional ms delay so groups can stagger their entrance
 */
function ProgressBar({ label, value = 0, variant = "brand", delay = 0 }) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className="progress">
      {label && (
        <div className="progress__label">
          <span>{label}</span>
          <span className="progress__value">{clamped}%</span>
        </div>
      )}
      <div
        className="progress__track"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={`progress__fill ${
            variant === "warn" ? "progress__fill--warn" : ""
          }`.trim()}
          style={{ width: `${clamped}%`, animationDelay: `${delay}ms` }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;
