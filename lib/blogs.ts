import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { slugify, SLUG_RE } from "@/lib/slug";

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  tags: string[];
  createdAt: string;
};

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

type ParsedInput = { title: string; summary: string; content: string; tags: string[] };

function parseBlogInput(body: Record<string, unknown>): ParsedInput | NextResponse {
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
  return { title, summary, content, tags };
}

async function parseJsonBody(req: Request) {
  try {
    return (await req.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function handleBlogsPost(req: Request) {
  const body = await parseJsonBody(req);
  if (!body) {
    return NextResponse.json(
      { ok: false, error: "invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = parseBlogInput(body);
  if (parsed instanceof NextResponse) return parsed;

  const rawSlug = asString(body.slug);
  const slug = slugify(rawSlug || parsed.title);
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

  const blogs = await readBlogs();
  if (blogs.some((b) => b.slug === slug)) {
    return NextResponse.json(
      { ok: false, error: `slug '${slug}' already exists` },
      { status: 409 }
    );
  }

  const post: BlogPost = {
    id: randomUUID(),
    slug,
    title: parsed.title.slice(0, 200),
    summary: parsed.summary.slice(0, 300),
    content: parsed.content.slice(0, 50000),
    tags: parsed.tags.map((t) => t.slice(0, 30)),
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

export async function handleBlogPut(slug: string, req: Request) {
  const body = await parseJsonBody(req);
  if (!body) {
    return NextResponse.json(
      { ok: false, error: "invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = parseBlogInput(body);
  if (parsed instanceof NextResponse) return parsed;

  try {
    const blogs = await readBlogs();
    const idx = blogs.findIndex((b) => b.slug === slug);
    if (idx === -1) {
      return NextResponse.json(
        { ok: false, error: `no post with slug '${slug}'` },
        { status: 404 }
      );
    }
    blogs[idx] = {
      ...blogs[idx],
      title: parsed.title.slice(0, 200),
      summary: parsed.summary.slice(0, 300),
      content: parsed.content.slice(0, 50000),
      tags: parsed.tags.map((t) => t.slice(0, 30)),
    };
    await writeBlogs(blogs);
    return NextResponse.json({ ok: true, post: blogs[idx] });
  } catch {
    return NextResponse.json(
      { ok: false, error: "could not save the post, try again later" },
      { status: 500 }
    );
  }
}

export async function handleBlogDelete(slug: string) {
  try {
    const blogs = await readBlogs();
    const idx = blogs.findIndex((b) => b.slug === slug);
    if (idx === -1) {
      return NextResponse.json(
        { ok: false, error: `no post with slug '${slug}'` },
        { status: 404 }
      );
    }
    blogs.splice(idx, 1);
    await writeBlogs(blogs);
    return NextResponse.json({ ok: true, remaining: blogs.length });
  } catch {
    return NextResponse.json(
      { ok: false, error: "could not delete the post" },
      { status: 500 }
    );
  }
}
