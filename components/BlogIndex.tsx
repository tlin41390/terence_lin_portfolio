"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { BlogPost } from "@/lib/blogs";

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "loaded"; posts: BlogPost[] };

export default function BlogIndex() {
  const [state, setState] = useState<State>({ kind: "loading" });

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const res = await fetch("/api/blogs", {
        headers: { Accept: "application/json" },
      });
      const body = (await res.json().catch(() => null)) as {
        ok?: boolean;
        blogs?: BlogPost[];
        error?: string;
      } | null;
      if (!res.ok || !body?.ok || !Array.isArray(body.blogs)) {
        setState({
          kind: "error",
          message: body?.error ?? `endpoint returned ${res.status}`,
        });
        return;
      }
      setState({ kind: "loaded", posts: body.blogs });
    } catch {
      setState({
        kind: "error",
        message:
          "network error: could not reach /api/blogs (the static export has no API — run `npm run dev`)",
      });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (state.kind === "loading") {
    return <p className="dim">reading ~/blogs …</p>;
  }

  if (state.kind === "error") {
    return (
      <div>
        <p className="err">{state.message}</p>
        <p>
          <button className="btn" type="button" onClick={load}>
            retry ↻
          </button>
        </p>
      </div>
    );
  }

  if (state.posts.length === 0) {
    return (
      <p className="dim">
        0 posts found. create your first one at <Link href="/admin/blogs">/admin/blogs</Link>.
      </p>
    );
  }

  return (
    <div>
      <p className="dim">{state.posts.length} posts found — newest first.</p>
      {state.posts.map((p) => (
        <section className="window" key={p.id}>
          <div className="window-bar">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
            <span>~/blogs/{p.slug}</span>
          </div>
          <div className="window-body">
            <h2 style={{ marginTop: 0 }}>
              <Link href={`/blogs/${p.slug}`}>./{p.slug}</Link>
            </h2>
            <p className="ok">{p.title}</p>
            <p className="dim">{p.summary}</p>
            <p>
              {p.tags.map((t) => (
                <span key={t} className="tag" style={{ fontSize: "0.8rem" }}>
                  {t}
                </span>
              ))}
            </p>
            <p className="faint">
              posted {new Date(p.createdAt).toLocaleString()}
            </p>
          </div>
        </section>
      ))}
    </div>
  );
}
