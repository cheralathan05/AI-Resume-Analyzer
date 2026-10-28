import "../styles/ThemeToggle.css";
import { MoonIcon, SunIcon } from "./icons";

/*
 * Light/Dark theme switch.
 * Controlled by the parent so the theme state has a single owner (App).
 */
function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? <SunIcon width={20} height={20} /> : <MoonIcon width={20} height={20} />}
    </button>
  );
}

export default ThemeToggle;
