"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { BlogPost } from "@/lib/blogs";

type State =
  | { kind: "loading" }
  | { kind: "missing" }
  | { kind: "error"; message: string }
  | { kind: "loaded"; post: BlogPost };

export default function BlogPostView() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/blogs", {
          headers: { Accept: "application/json" },
        });
        const body = (await res.json().catch(() => null)) as {
          ok?: boolean;
          blogs?: BlogPost[];
        } | null;
        if (cancelled) return;
        if (!res.ok || !body?.ok || !Array.isArray(body.blogs)) {
          setState({ kind: "error", message: `endpoint returned ${res.status}` });
          return;
        }
        const post = body.blogs.find((b) => b.slug === slug);
        setState(post ? { kind: "loaded", post } : { kind: "missing" });
      } catch {
        if (!cancelled) {
          setState({
            kind: "error",
            message:
              "network error: could not reach /api/blogs (the static export has no API — run `npm run dev`)",
          });
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (state.kind === "loading") {
    return <p className="dim">cat ~/blogs/{slug}.md …</p>;
  }

  if (state.kind === "error") {
    return <p className="err">{state.message}</p>;
  }

  if (state.kind === "missing") {
    return (
      <div>
        <p className="err">
          cat: ~/blogs/{slug}.md: No such file or directory
        </p>
        <p>
          <Link href="/blogs">cd ~/blogs</Link> back to all posts.
        </p>
      </div>
    );
  }

  const { post } = state;
  return (
    <article>
      <p className="faint">posted {new Date(post.createdAt).toLocaleString()}</p>
      <h1>{post.title}</h1>
      <p className="ok">{post.summary}</p>
      <p>
        {post.tags.map((t) => (
          <span key={t} className="tag" style={{ fontSize: "0.8rem" }}>
            {t}
          </span>
        ))}
      </p>
      <section className="window">
        <div className="window-bar">
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
          <span>~/blogs/{post.slug}.md</span>
        </div>
        <div className="window-body">
          <p style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>{post.content}</p>
        </div>
      </section>
      <p className="footer-note">
        <Link href="/blogs">cd ..</Link> back to all posts.
      </p>
    </article>
  );
}
