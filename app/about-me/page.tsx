import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "~/about-me",
  description: `About ${site.name} — ${site.role}.`,
};

const skillGroups: { title: string; items: string[] }[] = [
  {
    title: "languages",
    items: ["Java", "Python", "TypeScript", "JavaScript", "C", "SQL", "Dart", "HTML/CSS"],
  },
  {
    title: "backend & frameworks",
    items: [
      "Spring Boot",
      "FastAPI",
      "Flask",
      "Node.js",
      "Express.js",
      "REST APIs",
      "React.js",
      "Next.js",
      "Flutter",
    ],
  },
  {
    title: "cloud & devops",
    items: [
      "AWS",
      "Microsoft Azure",
      "Docker",
      "Docker Compose",
      "GitHub Actions (CI/CD)",
      "Linux/Unix",
      "Git",
      "Apify",
    ],
  },
  {
    title: "databases",
    items: ["PostgreSQL", "Supabase", "MySQL", "MongoDB", "Pinecone"],
  },
  {
    title: "AI & automation",
    items: [
      "OpenAI API",
      "Claude API",
      "RAG",
      "AI Governance",
      "Selenium",
      "Codex",
      "Claude Code",
    ],
  },
];

const education = [
  {
    school: "Santa Clara University",
    degree: "M.S., Information Systems",
    period: "January 2025 – June 2027 (Expected)",
  },
  {
    school: "University of San Francisco",
    degree: "B.S., Computer Science",
    period: "August 2019 – May 2023",
  },
];

const interests = ["video games", "basketball", "football", "baseball"];

export default function AboutMe() {
  return (
    <div>
      <p className="prompt">
        {site.handle.toLowerCase()}@portfolio:
        <span className="path">~/about-me</span>$ cat about.txt
      </p>
      <h1>about me</h1>
      <section className="window">
        <div className="window-bar">
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
          <span>about.txt — 1 file</span>
        </div>
        <div className="window-body">
          <p>
            Welcome to my personal portfolio website! I&apos;m a full-stack
            developer passionate about building applications and exploring new
            technologies.
          </p>
          <p>
            From a young age, I was fascinated by programming, spending
            countless hours on the computer. This curiosity led me to explore
            how technology works under the hood, shaping my journey into
            software development.
          </p>
        </div>
      </section>

      <h2>education — `cat education.txt`</h2>
      {education.map((e) => (
        <p key={e.school}>
          <span className="ok">{e.school}</span>
          <span className="dim"> — {e.degree}</span>
          <br />
          <span className="faint">{e.period}</span>
        </p>
      ))}

      <h2>when I&apos;m not coding</h2>
      <p>
        {interests.map((i) => (
          <span key={i} className="tag" style={{ fontSize: "0.9rem" }}>
            {i}
          </span>
        ))}
      </p>

      <h2>skills — `ls ~/skills`</h2>
      {skillGroups.map((g) => (
        <p key={g.title}>
          <span className="dim">./{g.title}: </span>
          {g.items.map((s) => (
            <span key={s} className="tag">
              {s}
            </span>
          ))}
        </p>
      ))}

      <h2>this site — `tree ~/`</h2>
      <pre className="dim" style={{ margin: 0 }}>
{`~/
├── about-me/                  you are here
├── experience/                professional experience, documented
├── projects/                  project portfolio with detailed case studies
├── contact-me-server-form/    send me a message (persisted server-side)
└── resume.pdf                 view / download my resume`}
      </pre>

      <p className="footer-note">
        type <b>cd /projects</b> in the docked terminal below to keep exploring,
        or <b>resume</b> to open my resume.
      </p>
    </div>
  );
}
