"use client";

import { useCallback, useEffect, useState } from "react";
import type { GuestbookEntry } from "@/lib/guestbook";

type Status =
  | { state: "idle" }
  | { state: "submitting" }
  | { state: "success"; message: string }
  | { state: "error"; message: string };

type ListState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "loaded"; entries: GuestbookEntry[] };

export default function Guestbook() {
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [list, setList] = useState<ListState>({ kind: "loading" });

  const loadEntries = useCallback(async () => {
    setList({ kind: "loading" });
    try {
      const res = await fetch("/api/guestbook", {
        headers: { Accept: "application/json" },
      });
      const body = (await res.json().catch(() => null)) as {
        ok?: boolean;
        entries?: GuestbookEntry[];
        error?: string;
      } | null;
      if (!res.ok || !body?.ok || !Array.isArray(body.entries)) {
        setList({
          kind: "error",
          message: body?.error ?? `endpoint returned ${res.status}`,
        });
        return;
      }
      setList({ kind: "loaded", entries: body.entries });
    } catch {
      setList({
        kind: "error",
        message:
          "network error: could not reach /api/guestbook (the static export has no API — run `npm run dev`)",
      });
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") ?? ""),
      message: String(data.get("message") ?? ""),
    };

    setStatus({ state: "submitting" });
    try {
      const res = await fetch("/api/guestbook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
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
      setStatus({ state: "success", message: `signed — thanks, ${payload.name}!` });
      form.reset();
      loadEntries();
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
          <label htmlFor="gb-name">name</label>
          <input
            id="gb-name"
            name="name"
            type="text"
            required
            maxLength={40}
            placeholder="anon"
          />
        </div>
        <div>
          <label htmlFor="gb-message">message</label>
          <textarea
            id="gb-message"
            name="message"
            required
            maxLength={500}
            rows={4}
            placeholder="say hi — it lands in data/guestbook.json"
          />
        </div>
        <button
          className="btn"
          type="submit"
          disabled={status.state === "submitting"}
        >
          {status.state === "submitting" ? "signing…" : "sign ▶"}
        </button>

        {status.state === "success" && (
          <p className="ok">exit code 0 — {status.message}</p>
        )}
        {status.state === "error" && <p className="err">{status.message}</p>}
      </form>

      <h2>signatures — `cat guestbook.txt`</h2>
      {list.kind === "loading" && <p className="dim">reading guestbook …</p>}
      {list.kind === "error" && (
        <div>
          <p className="err">{list.message}</p>
          <p>
            <button className="btn" type="button" onClick={loadEntries}>
              retry ↻
            </button>
          </p>
        </div>
      )}
      {list.kind === "loaded" && list.entries.length === 0 && (
        <p className="dim">no signatures yet — be the first.</p>
      )}
      {list.kind === "loaded" &&
        list.entries.map((e) => (
          <p key={e.id}>
            <span className="ok">{e.name}</span>
            <span className="faint">
              {" "}
              · {new Date(e.createdAt).toLocaleString()}
            </span>
            <br />
            <span>{e.message}</span>
          </p>
        ))}
    </div>
  );
}
