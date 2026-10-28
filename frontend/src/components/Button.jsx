import "../styles/Button.css";

/*
 * Reusable, accessible button.
 *
 * Props:
 *  - variant: "primary" | "secondary" | "ghost"  (visual style)
 *  - icon:    optional element rendered before the label
 *  - as:      render as a different element (e.g. "a" for links)
 *  - block:   stretch to full width
 * Any extra props (onClick, href, type, aria-*) are forwarded.
 */
function Button({
  children,
  variant = "primary",
  icon = null,
  as: Tag = "button",
  block = false,
  className = "",
  ...rest
}) {
  const classes = [
    "btn",
    `btn--${variant}`,
    block ? "btn--block" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag className={classes} {...rest}>
      {icon && <span className="btn__icon">{icon}</span>}
      {children}
    </Tag>
  );
}

export default Button;
