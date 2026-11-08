import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "~/resume",
  description: `Resume of ${site.name} — ${site.role}.`,
};

const bp = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function Resume() {
  return (
    <div>
      <p className="prompt">
        {site.handle.toLowerCase()}@portfolio:<span className="path">~/resume</span>$
        cat resume.pdf
      </p>
      <h1>resume</h1>
      <p className="dim">
        {site.name} — {site.role} · last updated with this site&apos;s deploy
      </p>
      <p style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <a href={`${bp}/resume.pdf`} target="_blank" rel="noopener noreferrer">
          [ open in new tab ]
        </a>
        <a href={`${bp}/resume.pdf`} download="Terence_Lin_Resume.pdf">
          [ download resume.pdf ]
        </a>
      </p>
      <section className="window">
        <div className="window-bar">
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
          <span>resume.pdf — embedded viewer</span>
        </div>
        <iframe
          src={`${bp}/resume.pdf`}
          title="Terence Lin — Resume"
          style={{
            width: "100%",
            height: "75vh",
            border: 0,
            display: "block",
            background: "#fff",
          }}
        />
      </section>
      <p className="footer-note">
        terminal users: type <b>resume</b> in the dock below.
      </p>
    </div>
  );
}
