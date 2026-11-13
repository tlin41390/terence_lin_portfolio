# tlin41390.github.io

A terminal-themed developer portfolio built with Next.js, deployed to GitHub Pages.

```bash
terence@portfolio:~$ whoami
terence_lin — Software Engineer
```

Live site: **https://tlin41390.github.io/terence_lin_portfolio/**

## About Me

I'm a full-stack developer passionate about building applications and exploring
new technologies. From a young age, I was fascinated by programming — spending
countless hours on the computer led me to explore how technology works under
the hood, shaping my journey into software development.

I hold an **M.S. in Information Systems** from Santa Clara University (expected
June 2027) and a **B.S. in Computer Science** from the University of San
Francisco.

### What I'm Looking For

- **Backend Engineer** — designing APIs, services, and data pipelines
- **DevOps** — CI/CD pipelines, containerization, and cloud infrastructure

## Skills

| Category | Technologies |
| --- | --- |
| **Languages** | Java, Python, TypeScript, JavaScript, C, SQL, Dart, HTML/CSS |
| **Backend & Frameworks** | Spring Boot, FastAPI, Flask, Node.js, Express.js, REST APIs, React.js, Next.js, Flutter |
| **Cloud & DevOps** | AWS, Microsoft Azure, Docker, Docker Compose, GitHub Actions (CI/CD), Linux/Unix, Git, Apify |
| **Databases** | PostgreSQL, Supabase, MySQL, MongoDB, Pinecone |
| **AI & Automation** | OpenAI API, Claude API, RAG, AI Governance, Selenium, Codex, Claude Code |

## Site Features

- **Terminal theme** — green-phosphor CRT look with scanlines and a blinking block cursor
- **Interactive shell** — a bash-like terminal docked at the bottom of every page:
  navigate with `cd /projects`, list with `ls`, open the resume with `resume`,
  and more (type `help`; Tab completes, ↑/↓ walks history)
- **Dynamic project routes** — case studies served from `/projects/[slug]`
- **Contact form** — Formspree on the live site; a local API route saves
  submissions to `data/submissions.json` in development
- **Resume page** — embedded viewer with direct download at `/resume`

## Running Locally

```bash
npm install
npm run dev        # http://localhost:3000 — includes the JSON-saving contact API
```

## Deployment

The site is a static export deployed by GitHub Actions
(`.github/workflows/deploy.yml`). Every push to `main` rebuilds and republishes:

```bash
npm run build:static   # exports the site to out/ (API routes excluded)
```

## Contact

- Email: [linterence4@gmail.com](mailto:linterence4@gmail.com)
- LinkedIn: [terence-lin](https://www.linkedin.com/in/terence-lin-22b023197/)
- GitHub: [tlin41390](https://github.com/tlin41390)
- Or use the form at [/contact-me](https://tlin41390.github.io/terence_lin_portfolio/contact-me/)

---

© 2026 Terence Lin
