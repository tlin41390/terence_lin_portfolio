import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";
import { experience } from "@/lib/experience";

export const metadata: Metadata = {
  title: "~/experience",
  description: `Professional experience of ${site.name}.`,
};

export default function Experience() {
  return (
    <div>
      <p className="prompt">
        {site.handle.toLowerCase()}@portfolio:
        <span className="path">~/experience</span>$ cat resume.txt
      </p>
      <h1>professional experience</h1>
      <p className="dim">
        {experience.length} positions found — newest first.
      </p>

      {experience.map((e) => (
        <section className="window" key={`${e.org}-${e.period}`}>
          <div className="window-bar">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
            <span>
              {e.period} · {e.location}
            </span>
          </div>
          <div className="window-body">
            <h2 style={{ marginTop: 0 }}>
              {e.role} <span className="dim">@ {e.org}</span>
            </h2>
            {e.tech && (
              <p>
                {e.tech.map((t) => (
                  <span key={t} className="tag">
                    {t}
                  </span>
                ))}
              </p>
            )}
            <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
              {e.bullets.map((b, i) => (
                <li key={i} style={{ marginBottom: "0.6rem" }}>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}

      <p className="footer-note">
        <Link href="/projects">cd /projects</Link> see what I built in these
        roles.
      </p>
    </div>
  );
}
