import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { slugify, SLUG_RE } from "@/lib/slug";
import { defaultProjects, type Project } from "@/lib/projectTypes";

function normalizeProject(entry: unknown): Project | null {
  if (typeof entry !== "object" || entry === null) return null;
  const e = entry as Record<string, unknown>;
  if (
    typeof e.slug !== "string" ||
    typeof e.name !== "string" ||
    typeof e.summary !== "string"
  ) {
    return null;
  }
  const bullets = Array.isArray(e.bullets)
    ? e.bullets.filter((b): b is string => typeof b === "string")
    : [];
  const tech = Array.isArray(e.tech)
    ? e.tech.filter((t): t is string => typeof t === "string")
    : [];
  const project: Project = {
    slug: e.slug,
    name: e.name,
    summary: e.summary,
    tech,
    bullets,
  };
  if (typeof e.repo === "string") project.repo = e.repo;
  if (typeof e.demo === "string") project.demo = e.demo;
  return project;
}

async function readProjectsFile(): Promise<Project[] | null> {
  try {
    const file = path.join(process.cwd(), "data", "projects.json");
    const parsed: unknown = JSON.parse(await fs.readFile(file, "utf8"));
    if (!Array.isArray(parsed)) return null;
    return parsed
      .map(normalizeProject)
      .filter((p): p is Project => p !== null);
  } catch {
    return null;
  }
}

export async function readProjects(): Promise<Project[]> {
  const projects = await readProjectsFile();
  return projects ?? defaultProjects;
}

export function getProject(projects: Project[], slug: string) {
  return projects.find((p) => p.slug === slug);
}

async function writeProjects(projects: Project[]): Promise<void> {
  const dir = path.join(process.cwd(), "data");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    path.join(dir, "projects.json"),
    JSON.stringify(projects, null, 2),
    "utf8"
  );
}

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function asTech(v: unknown): string[] {
  const raw = Array.isArray(v)
    ? v.map((t) => String(t))
    : typeof v === "string"
      ? v.split(",")
      : [];
  return [...new Set(raw.map((t) => t.trim()).filter(Boolean))].slice(0, 8);
}

function asBullets(v: unknown): string[] {
  const raw = Array.isArray(v)
    ? v.map((b) => String(b))
    : typeof v === "string"
      ? v.split(/\r?\n/)
      : [];
  return raw.map((b) => b.trim()).filter(Boolean).slice(0, 10);
}

async function parseJsonBody(req: Request) {
  try {
    return (await req.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function parseProjectInput(body: Record<string, unknown>): Project | NextResponse {
  const name = asString(body.name);
  const summary = asString(body.summary);

  if (!name) {
    return NextResponse.json(
      { ok: false, error: "field 'name' is required" },
      { status: 400 }
    );
  }
  if (name.length > 120) {
    return NextResponse.json(
      { ok: false, error: "field 'name' must be at most 120 characters" },
      { status: 400 }
    );
  }
  if (!summary) {
    return NextResponse.json(
      { ok: false, error: "field 'summary' is required" },
      { status: 400 }
    );
  }
  if (summary.length > 300) {
    return NextResponse.json(
      { ok: false, error: "field 'summary' must be at most 300 characters" },
      { status: 400 }
    );
  }
  const bullets = asBullets(body.bullets);
  if (bullets.length === 0) {
    return NextResponse.json(
      { ok: false, error: "at least one bullet is required (one per line)" },
      { status: 400 }
    );
  }

  const project: Project = {
    slug: "",
    name: name.slice(0, 120),
    summary: summary.slice(0, 300),
    tech: asTech(body.tech).map((t) => t.slice(0, 30)),
    bullets: bullets.map((b) => b.slice(0, 300)),
  };
  const repo = asString(body.repo);
  const demo = asString(body.demo);
  if (repo) project.repo = repo.slice(0, 300);
  if (demo) project.demo = demo.slice(0, 300);
  return project;
}

export async function handleProjectsGet() {
  const projects = await readProjects();
  return NextResponse.json({ ok: true, projects });
}

export async function handleProjectsPost(req: Request) {
  const body = await parseJsonBody(req);
  if (!body) {
    return NextResponse.json(
      { ok: false, error: "invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = parseProjectInput(body);
  if (parsed instanceof NextResponse) return parsed;

  const rawSlug = asString(body.slug);
  const slug = slugify(rawSlug || parsed.name);
  if (!slug || !SLUG_RE.test(slug) || slug.length > 100) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "slug must be lowercase letters, numbers, and hyphens (e.g. my-project)",
      },
      { status: 400 }
    );
  }

  const projects = (await readProjectsFile()) ?? defaultProjects;
  if (projects.some((p) => p.slug === slug)) {
    return NextResponse.json(
      { ok: false, error: `slug '${slug}' already exists` },
      { status: 409 }
    );
  }

  projects.push({ ...parsed, slug });
  try {
    await writeProjects(projects);
  } catch {
    return NextResponse.json(
      { ok: false, error: "could not save the project, try again later" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, slug }, { status: 201 });
}

export async function handleProjectPut(slug: string, req: Request) {
  const body = await parseJsonBody(req);
  if (!body) {
    return NextResponse.json(
      { ok: false, error: "invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = parseProjectInput(body);
  if (parsed instanceof NextResponse) return parsed;

  try {
    const projects = (await readProjectsFile()) ?? defaultProjects;
    const idx = projects.findIndex((p) => p.slug === slug);
    if (idx === -1) {
      return NextResponse.json(
        { ok: false, error: `no project with slug '${slug}'` },
        { status: 404 }
      );
    }
    projects[idx] = { ...parsed, slug };
    await writeProjects(projects);
    return NextResponse.json({ ok: true, project: projects[idx] });
  } catch {
    return NextResponse.json(
      { ok: false, error: "could not save the project, try again later" },
      { status: 500 }
    );
  }
}

export async function handleProjectDelete(slug: string) {
  try {
    const projects = (await readProjectsFile()) ?? defaultProjects;
    const idx = projects.findIndex((p) => p.slug === slug);
    if (idx === -1) {
      return NextResponse.json(
        { ok: false, error: `no project with slug '${slug}'` },
        { status: 404 }
      );
    }
    projects.splice(idx, 1);
    await writeProjects(projects);
    return NextResponse.json({ ok: true, remaining: projects.length });
  } catch {
    return NextResponse.json(
      { ok: false, error: "could not delete the project" },
      { status: 500 }
    );
  }
}
