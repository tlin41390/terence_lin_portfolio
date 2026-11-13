"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { BlogPost } from "@/lib/blogs";

type Status =
  | { state: "idle" }
  | { state: "submitting" }
  | { state: "success"; slug: string }
  | { state: "error"; message: string };

export default function BlogComposer() {
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [posts, setPosts] = useState<BlogPost[] | null>(null);

  const loadPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/blogs", {
        headers: { Accept: "application/json" },
      });
      const body = (await res.json().catch(() => null)) as {
        ok?: boolean;
        blogs?: BlogPost[];
      } | null;
      if (res.ok && body?.ok && Array.isArray(body.blogs)) {
        setPosts(body.blogs);
        return;
      }
    } catch {
      setPosts(null);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      title: String(data.get("title") ?? ""),
      slug: String(data.get("slug") ?? ""),
      summary: String(data.get("summary") ?? ""),
      tags: String(data.get("tags") ?? ""),
      content: String(data.get("content") ?? ""),
    };

    setStatus({ state: "submitting" });
    try {
      const res = await fetch("/api/blogs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      const body = (await res.json().catch(() => null)) as {
        ok?: boolean;
        slug?: string;
        error?: string;
      } | null;
      if (!res.ok || !body?.ok || !body.slug) {
        setStatus({
          state: "error",
          message: body?.error ?? `endpoint returned ${res.status}`,
        });
        return;
      }
      setStatus({ state: "success", slug: body.slug });
      form.reset();
      loadPosts();
    } catch {
      setStatus({
        state: "error",
        message: "network error: could not reach the server",
      });
    }
  }

  return (
    <div>
      <form className="termform" onSubmit={onSubmit}>
        <div>
          <label htmlFor="title">title</label>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={200}
            placeholder="how I built this portfolio"
          />
        </div>
        <div>
          <label htmlFor="slug">slug (optional — derived from title)</label>
          <input
            id="slug"
            name="slug"
            type="text"
            maxLength={100}
            placeholder="how-i-built-this-portfolio"
          />
        </div>
        <div>
          <label htmlFor="summary">summary</label>
          <input
            id="summary"
            name="summary"
            type="text"
            required
            maxLength={300}
            placeholder="one-line excerpt shown on /blogs"
          />
        </div>
        <div>
          <label htmlFor="tags">tags (comma separated)</label>
          <input
            id="tags"
            name="tags"
            type="text"
            placeholder="nextjs, react"
          />
        </div>
        <div>
          <label htmlFor="content">content</label>
          <textarea
            id="content"
            name="content"
            required
            maxLength={50000}
            rows={12}
          />
        </div>
        <button
          className="btn"
          type="submit"
          disabled={status.state === "submitting"}
        >
          {status.state === "submitting" ? "publishing…" : "publish ▶"}
        </button>

        {status.state === "success" && (
          <p className="ok">
            exit code 0 — post saved to data/blogs.json. view it at{" "}
            <Link href={`/blogs/${status.slug}`}>/blogs/{status.slug}</Link>
          </p>
        )}
        {status.state === "error" && <p className="err">{status.message}</p>}
      </form>

      <h2>existing posts — `ls ~/blogs`</h2>
      {posts === null ? (
        <p className="dim">reading ~/blogs …</p>
      ) : posts.length === 0 ? (
        <p className="dim">0 posts yet.</p>
      ) : (
        <ul>
          {posts.map((p) => (
            <li key={p.id}>
              <Link href={`/blogs/${p.slug}`}>/blogs/{p.slug}</Link>
              <span className="dim">
                {" "}
                — {p.title} · {new Date(p.createdAt).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
