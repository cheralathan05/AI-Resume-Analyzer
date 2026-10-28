import "../styles/ui.css";
import { TrendUpIcon } from "./icons";

/*
 * Compact KPI card for the dashboard summary row.
 *
 * Props:
 *  - icon:  element shown in the rounded badge
 *  - label: metric name (e.g. "ATS Score")
 *  - value: the big number / text (e.g. "82%")
 *  - delta: optional change indicator text (e.g. "+12")
 *  - trend: "up" (default) | "down" — colours the delta chip
 *  - delay: optional entrance animation delay (ms)
 */
function StatCard({ icon, label, value, delta, trend = "up", delay = 0 }) {
  return (
    <article
      className="stat-card animate-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="stat-card__top">
        <span className="stat-card__icon">{icon}</span>
        {delta && (
          <span className={`stat-card__delta stat-card__delta--${trend}`}>
            <TrendUpIcon
              width={14}
              height={14}
              style={{ transform: trend === "down" ? "scaleY(-1)" : "none" }}
            />
            {delta}
          </span>
        )}
      </div>
      <div className="stat-card__value">{value}</div>
      <div className="stat-card__label">{label}</div>
    </article>
  );
}

export default StatCard;
