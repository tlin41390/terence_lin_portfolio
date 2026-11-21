import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { site } from "@/lib/site";
import { readProjects, getProject } from "@/lib/projects";
import type { Project } from "@/lib/projectTypes";

export async function generateStaticParams() {
  const projects = await readProjects();
  if (projects.length === 0) return [{ slug: "_placeholder" }];
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const projects = await readProjects();
  const project = getProject(projects, slug);
  if (!project) return { title: "~/projects/404" };
  return {
    title: `~/projects/${project.slug}`,
    description: project.summary,
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const projects = await readProjects();
  const project = getProject(projects, slug);
  if (!project) notFound();
  return <ProjectView project={project} />;
}

function ProjectView({ project }: { project: Project }) {
  return (
    <div>
      <p className="prompt">
        {site.handle.toLowerCase()}@portfolio:
        <span className="path">~/projects/{project.slug}</span>$ cat case-study.md
      </p>
      <h1>./{project.slug}</h1>
      <p className="ok" style={{ fontSize: "1.05rem" }}>
        {project.summary}
      </p>

      <h2>stack — `cat stack.txt`</h2>
      <p>
        {project.tech.map((t) => (
          <span key={t} className="tag" style={{ fontSize: "0.85rem" }}>
            {t}
          </span>
        ))}
      </p>

      <h2>notes — `cat case-study.md`</h2>
      <section className="window">
        <div className="window-bar">
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
          <span>case-study.md</span>
        </div>
        <div className="window-body">
          <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
            {project.bullets.map((b, i) => (
              <li key={i} style={{ marginBottom: "0.6rem" }}>
                {b}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {(project.repo || project.demo) && (
        <p style={{ marginTop: "1.5rem" }}>
          {project.repo && (
            <>
              <span className="dim">$ git clone </span>
              <a href={project.repo} target="_blank" rel="noopener noreferrer">
                {project.repo}
              </a>
            </>
          )}
          {project.repo && project.demo && <span className="dim"> · </span>}
          {project.demo && (
            <a href={project.demo} target="_blank" rel="noopener noreferrer">
              live demo
            </a>
          )}
        </p>
      )}

      <p className="footer-note">
        <Link href="/projects">cd ..</Link> back to all projects.
      </p>
    </div>
  );
}
