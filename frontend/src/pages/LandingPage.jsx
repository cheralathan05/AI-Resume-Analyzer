import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Footer from "../components/Footer";
import useTheme from "../hooks/useTheme";

/*
 * Landing page composition.
 * Owns the single source of truth for the theme and passes it down,
 * then stacks the page sections in order.
 */
function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <Navbar theme={theme} onToggleTheme={toggleTheme} />
      <main>
        <Hero />
        <Features />
      </main>
      <Footer />
    </>
  );
}

export default LandingPage;
