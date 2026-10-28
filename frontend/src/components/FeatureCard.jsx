import { Link } from "react-router-dom";
import { ArrowRightIcon } from "./icons";

/*
 * Reusable feature card used by the Features section.
 *
 * Props:
 *  - icon:  element rendered in the rounded badge
 *  - title: card heading
 *  - text:  short supporting description
 *  - link:  optional router path to navigate to on click
 *  - delay: optional CSS animation delay for a staggered entrance
 */
function FeatureCard({ icon, title, text, link = null, delay = 0 }) {
  const inner = (
    <>
      <div className="feature-card__icon">{icon}</div>
      <h3 className="feature-card__title">{title}</h3>
      <p className="feature-card__text">{text}</p>
      {link && (
        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--brand-400, #38bdf8)", fontWeight: 600, marginTop: "12px" }}>
          <span>Launch Tool</span>
          <ArrowRightIcon width={12} height={12} />
        </div>
      )}
    </>
  );

  if (link) {
    return (
      <Link
        to={link}
        className="feature-card feature-card--interactive animate-up"
        style={{ animationDelay: `${delay}ms`, textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column" }}
      >
        {inner}
      </Link>
    );
  }

  return (
    <article
      className="feature-card animate-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      {inner}
    </article>
  );
}

export default FeatureCard;
