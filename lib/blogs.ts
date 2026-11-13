import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  tags: string[];
  createdAt: string;
};

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/^-+|-+$/g, "");
}

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function asTags(v: unknown): string[] {
  const raw = Array.isArray(v)
    ? v.map((t) => String(t))
    : typeof v === "string"
      ? v.split(",")
      : [];
  return [
    ...new Set(raw.map((t) => t.trim().toLowerCase()).filter(Boolean)),
  ].slice(0, 8);
}

export async function readBlogs(): Promise<BlogPost[]> {
  try {
    const file = path.join(process.cwd(), "data", "blogs.json");
    const parsed: unknown = JSON.parse(await fs.readFile(file, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeBlogs(blogs: BlogPost[]): Promise<void> {
  const dir = path.join(process.cwd(), "data");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    path.join(dir, "blogs.json"),
    JSON.stringify(blogs, null, 2),
    "utf8"
  );
}

export async function handleBlogsGet() {
  const blogs = await readBlogs();
  const sorted = [...blogs].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
  );
  return NextResponse.json({ ok: true, blogs: sorted });
}

export async function handleBlogsPost(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid JSON body" },
      { status: 400 }
    );
  }

  const title = asString(body.title);
  const summary = asString(body.summary);
  const content = asString(body.content);
  const tags = asTags(body.tags);

  if (!title) {
    return NextResponse.json(
      { ok: false, error: "field 'title' is required" },
      { status: 400 }
    );
  }
  if (title.length > 200) {
    return NextResponse.json(
      { ok: false, error: "field 'title' must be at most 200 characters" },
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
  if (!content) {
    return NextResponse.json(
      { ok: false, error: "field 'content' is required" },
      { status: 400 }
    );
  }

  const rawSlug = asString(body.slug);
  const slug = slugify(rawSlug || title);
  if (!slug || !SLUG_RE.test(slug) || slug.length > 100) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "slug must be lowercase letters, numbers, and hyphens (e.g. my-post)",
      },
      { status: 400 }
    );
  }

  let blogs: BlogPost[];
  try {
    blogs = await readBlogs();
  } catch {
    return NextResponse.json(
      { ok: false, error: "could not save the post, try again later" },
      { status: 500 }
    );
  }

  if (blogs.some((b) => b.slug === slug)) {
    return NextResponse.json(
      { ok: false, error: `slug '${slug}' already exists` },
      { status: 409 }
    );
  }

  const post: BlogPost = {
    id: randomUUID(),
    slug,
    title: title.slice(0, 200),
    summary: summary.slice(0, 300),
    content: content.slice(0, 50000),
    tags: tags.map((t) => t.slice(0, 30)),
    createdAt: new Date().toISOString(),
  };

  try {
    await writeBlogs([...blogs, post]);
  } catch {
    return NextResponse.json(
      { ok: false, error: "could not save the post, try again later" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { ok: true, id: post.id, slug: post.slug },
    { status: 201 }
  );
}
