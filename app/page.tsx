import Link from "next/link";
import { site } from "@/lib/site";
import { projects } from "@/lib/projects";

const quickCommands = [
  { href: "/about-me", cmd: "cd /about-me", desc: "learn who I am" },
  { href: "/experience", cmd: "cd /experience", desc: "see where I've worked" },
  { href: "/projects", cmd: "ls /projects", desc: "see what I've built" },
  { href: "/resume", cmd: "open resume.pdf", desc: "view / download my resume" },
  {
    href: "/contact-me-server-form",
    cmd: "./contact --message",
    desc: "send me a message",
  },
];

export default function Home() {
  return (
    <div>
      <section className="window">
        <div className="window-bar">
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
          <span>/dev/portfolio — login: {site.handle.toLowerCase()}</span>
        </div>
        <div className="window-body">
          <p className="dim">
            Last login: {new Date().toDateString()} on tty1
          </p>
          <p>
            <span className="prompt">
              {site.handle.toLowerCase()}@portfolio:<span className="path">~</span>${" "}
            </span>
            whoami
          </p>
          <h1>
            {site.name}{" "}
            <span className="dim" style={{ fontWeight: 400 }}>
              — {site.role}
            </span>
          </h1>
          <p className="ok">{site.tagline}</p>
          <p className="dim">
            location: {site.location} · status:{" "}
            <span className="ok">open to opportunities</span>
            <span className="cursor" aria-hidden="true" />
          </p>
        </div>
      </section>

      <h2>quick start</h2>
      <div className="cards">
        {quickCommands.map((q) => (
          <Link key={q.href} href={q.href} style={{ borderBottom: "none" }}>
            <div className="card">
              <h3>$ {q.cmd}</h3>
              <p>{q.desc}</p>
              <span className="dim" style={{ fontSize: "0.75rem" }}>
                enter ↵
              </span>
            </div>
          </Link>
        ))}
      </div>

      <h2>latest projects</h2>
      <ul>
        {projects.map((p) => (
          <li key={p.slug}>
            <Link href={`/projects/${p.slug}`}>/projects/{p.slug}</Link>
            <span className="dim"> — {p.summary}</span>
          </li>
        ))}
      </ul>

      <p className="footer-note">
        tip: open the docked terminal below and type <b>help</b> to explore this
        site with bash-like commands.
      </p>
    </div>
  );
}
