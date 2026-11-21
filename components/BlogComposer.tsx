"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { BlogPost } from "@/lib/blogs";

type Status =
  | { state: "idle" }
  | { state: "submitting" }
  | { state: "success"; message: string }
  | { state: "error"; message: string };

export default function BlogComposer() {
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [posts, setPosts] = useState<BlogPost[] | null>(null);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

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

  function setFieldValue(name: string, value: string) {
    const el = formRef.current?.elements.namedItem(name);
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      el.value = value;
    }
  }

  function startEdit(post: BlogPost) {
    setEditing(post);
    setStatus({ state: "idle" });
    setFieldValue("title", post.title);
    setFieldValue("slug", post.slug);
    setFieldValue("summary", post.summary);
    setFieldValue("tags", post.tags.join(", "));
    setFieldValue("content", post.content);
  }

  function cancelEdit() {
    setEditing(null);
    setStatus({ state: "idle" });
    formRef.current?.reset();
  }

  async function deletePost(post: BlogPost) {
    if (!window.confirm(`delete '${post.slug}'? this cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/blogs/${encodeURIComponent(post.slug)}`, {
        method: "DELETE",
      });
      const body = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
      } | null;
      if (!res.ok || !body?.ok) {
        setStatus({
          state: "error",
          message: body?.error ?? `endpoint returned ${res.status}`,
        });
        return;
      }
      if (editing?.slug === post.slug) cancelEdit();
      loadPosts();
    } catch {
      setStatus({ state: "error", message: "network error: could not reach the server" });
    }
  }

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
      const res = await fetch(
        editing ? `/api/blogs/${encodeURIComponent(editing.slug)}` : "/api/blogs",
        {
          method: editing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        }
      );
      const body = (await res.json().catch(() => null)) as {
        ok?: boolean;
        slug?: string;
        error?: string;
      } | null;
      if (!res.ok || !body?.ok) {
        setStatus({
          state: "error",
          message: body?.error ?? `endpoint returned ${res.status}`,
        });
        return;
      }
      const slug = editing ? editing.slug : body.slug ?? "";
      setStatus({
        state: "success",
        message: editing
          ? `post updated — view it at /blogs/${slug}`
          : `post saved to data/blogs.json — view it at /blogs/${slug}`,
      });
      setEditing(null);
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
      <form ref={formRef} className="termform" onSubmit={onSubmit}>
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
          <label htmlFor="slug">
            slug (optional — derived from title{editing ? ", locked while editing" : ""})
          </label>
          <input
            id="slug"
            name="slug"
            type="text"
            maxLength={100}
            placeholder="how-i-built-this-portfolio"
            disabled={editing !== null}
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
          {status.state === "submitting"
            ? "publishing…"
            : editing
              ? "save changes ✓"
              : "publish ▶"}
        </button>
        {editing && (
          <button className="btn" type="button" onClick={cancelEdit}>
            cancel ✕
          </button>
        )}

        {status.state === "success" && <p className="ok">{status.message}</p>}
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
              </span>{" "}
              <button
                type="button"
                className="btn"
                style={{ fontSize: "0.75rem", padding: "0.15rem 0.6rem" }}
                onClick={() => startEdit(p)}
              >
                edit
              </button>{" "}
              <button
                type="button"
                className="btn"
                style={{ fontSize: "0.75rem", padding: "0.15rem 0.6rem" }}
                onClick={() => deletePost(p)}
              >
                rm
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
