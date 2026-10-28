import "../styles/ui.css";

/*
 * Generic surface card with an optional icon + title header.
 *
 * Props:
 *  - title:   optional heading text
 *  - icon:    optional element shown in the rounded badge beside the title
 *  - action:  optional element rendered on the right of the header
 *  - className / ...rest forwarded to the wrapper
 */
function Card({ title, icon, action, children, className = "", ...rest }) {
  return (
    <section className={`card ${className}`.trim()} {...rest}>
      {(title || icon || action) && (
        <div className="card__head">
          {icon && <span className="card__icon">{icon}</span>}
          {title && <h3 className="card__title">{title}</h3>}
          {action && <div style={{ marginLeft: "auto" }}>{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export default Card;
