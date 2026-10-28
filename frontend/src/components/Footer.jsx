import "../styles/Footer.css";
import { GithubIcon, SparkleIcon } from "./icons";

/* Grouped footer links — easy to extend without touching markup. */
const LINK_GROUPS = [
  {
    title: "Product",
    links: [
      { label: "About", href: "#about" },
      { label: "Privacy", href: "#privacy" },
    ],
  },
  {
    title: "Resources",
    links: [
      {
        label: "GitHub",
        href: "https://github.com",
        external: true,
        icon: <GithubIcon width={16} height={16} />,
      },
    ],
  },
];

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer" id="footer">
      <div className="container">
        <div className="footer__top">
          <div>
            <a className="footer__brand" href="#top">
              <span className="footer__logo">
                <SparkleIcon width={18} height={18} />
              </span>
              ResumeAI
            </a>
            <p className="footer__tagline">
              AI-powered resume analysis that helps you land your dream job —
              ATS scoring, skill insights and smart suggestions in seconds.
            </p>
          </div>

          <div className="footer__links">
            {LINK_GROUPS.map((group) => (
              <div key={group.title}>
                <p className="footer__col-title">{group.title}</p>
                <ul className="footer__list">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <a
                        className="footer__link"
                        href={link.href}
                        {...(link.external
                          ? { target: "_blank", rel: "noreferrer" }
                          : {})}
                      >
                        {link.icon}
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="footer__bottom">
          <span>© {year} ResumeAI. All rights reserved.</span>
          <span>Built for job seekers, powered by AI.</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
