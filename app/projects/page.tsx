import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";
import { projects } from "@/lib/projects";

export const metadata: Metadata = {
  title: "~/projects",
  description: `Projects by ${site.name}.`,
};

export default function Projects() {
  return (
    <div>
      <p className="prompt">
        {site.handle.toLowerCase()}@portfolio:
        <span className="path">~/projects</span>$ ls -la
      </p>
      <h1>projects</h1>
      <p className="dim">
        {projects.length} directories found. open one with{" "}
        <b>cd /projects/&lt;slug&gt;</b> or click below.
      </p>
      <div className="cards">
        {projects.map((p) => (
          <Link
            key={p.slug}
            href={`/projects/${p.slug}`}
            style={{ borderBottom: "none" }}
          >
            <div className="card">
              <h3>./{p.slug}</h3>
              <p>{p.summary}</p>
              <div>
                {p.tech.slice(0, 4).map((t) => (
                  <span key={t} className="tag">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
      <p className="footer-note">
        terminal users: try <b>projects nba-shot-chart-analysis</b> in the dock
        below.
      </p>
    </div>
  );
}
