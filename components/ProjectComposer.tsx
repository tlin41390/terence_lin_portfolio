"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Project } from "@/lib/projectTypes";

type Status =
  | { state: "idle" }
  | { state: "submitting" }
  | { state: "success"; message: string }
  | { state: "error"; message: string };

export default function ProjectComposer() {
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [editing, setEditing] = useState<Project | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const loadProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects", {
        headers: { Accept: "application/json" },
      });
      const body = (await res.json().catch(() => null)) as {
        ok?: boolean;
        projects?: Project[];
      } | null;
      if (res.ok && body?.ok && Array.isArray(body.projects)) {
        setProjects(body.projects);
        return;
      }
    } catch {
      setProjects(null);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  function setFieldValue(name: string, value: string) {
    const el = formRef.current?.elements.namedItem(name);
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      el.value = value;
    }
  }

  function startEdit(project: Project) {
    setEditing(project);
    setStatus({ state: "idle" });
    setFieldValue("name", project.name);
    setFieldValue("slug", project.slug);
    setFieldValue("summary", project.summary);
    setFieldValue("tech", project.tech.join(", "));
    setFieldValue("bullets", project.bullets.join("\n"));
    setFieldValue("repo", project.repo ?? "");
    setFieldValue("demo", project.demo ?? "");
  }

  function cancelEdit() {
    setEditing(null);
    setStatus({ state: "idle" });
    formRef.current?.reset();
  }

  async function deleteProject(project: Project) {
    if (!window.confirm(`delete '${project.slug}'? this cannot be undone.`)) return;
    try {
      const res = await fetch(
        `/api/projects/${encodeURIComponent(project.slug)}`,
        { method: "DELETE" }
      );
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
      if (editing?.slug === project.slug) cancelEdit();
      loadProjects();
    } catch {
      setStatus({ state: "error", message: "network error: could not reach the server" });
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") ?? ""),
      slug: String(data.get("slug") ?? ""),
      summary: String(data.get("summary") ?? ""),
      tech: String(data.get("tech") ?? ""),
      bullets: String(data.get("bullets") ?? ""),
      repo: String(data.get("repo") ?? ""),
      demo: String(data.get("demo") ?? ""),
    };

    setStatus({ state: "submitting" });
    try {
      const res = await fetch(
        editing
          ? `/api/projects/${encodeURIComponent(editing.slug)}`
          : "/api/projects",
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
          ? `project updated — view it at /projects/${slug}`
          : `project saved to data/projects.json — view it at /projects/${slug}`,
      });
      setEditing(null);
      form.reset();
      loadProjects();
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
          <label htmlFor="name">name</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={120}
            placeholder="Cool Side Project"
          />
        </div>
        <div>
          <label htmlFor="slug">
            slug (optional — derived from name{editing ? ", locked while editing" : ""})
          </label>
          <input
            id="slug"
            name="slug"
            type="text"
            maxLength={100}
            placeholder="cool-side-project"
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
            placeholder="one-line excerpt shown on /projects"
          />
        </div>
        <div>
          <label htmlFor="tech">tech (comma separated)</label>
          <input
            id="tech"
            name="tech"
            type="text"
            placeholder="Python, FastAPI, Supabase"
          />
        </div>
        <div>
          <label htmlFor="bullets">bullets (one per line)</label>
          <textarea
            id="bullets"
            name="bullets"
            required
            rows={5}
            placeholder={"what you built\nhow it works\nwhat it replaced"}
          />
        </div>
        <div>
          <label htmlFor="repo">repo url (optional)</label>
          <input id="repo" name="repo" type="text" placeholder="https://github.com/…" />
        </div>
        <div>
          <label htmlFor="demo">demo url (optional)</label>
          <input id="demo" name="demo" type="text" placeholder="https://…" />
        </div>
        <button
          className="btn"
          type="submit"
          disabled={status.state === "submitting"}
        >
          {status.state === "submitting"
            ? "saving…"
            : editing
              ? "save changes ✓"
              : "add project ▶"}
        </button>
        {editing && (
          <button className="btn" type="button" onClick={cancelEdit}>
            cancel ✕
          </button>
        )}

        {status.state === "success" && <p className="ok">{status.message}</p>}
        {status.state === "error" && <p className="err">{status.message}</p>}
      </form>

      <h2>existing projects — `ls ~/projects`</h2>
      {projects === null ? (
        <p className="dim">reading ~/projects …</p>
      ) : projects.length === 0 ? (
        <p className="dim">0 projects yet.</p>
      ) : (
        <ul>
          {projects.map((p) => (
            <li key={p.slug}>
              <Link href={`/projects/${p.slug}`}>/projects/{p.slug}</Link>
              <span className="dim"> — {p.name}</span>{" "}
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
                onClick={() => deleteProject(p)}
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
