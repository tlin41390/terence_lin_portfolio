"use client";

import { useState } from "react";
import { site } from "@/lib/site";

const SUBJECTS = ["question", "feedback", "opportunity"] as const;

const formspreeEndpoint = process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT;
const isStaticExport = process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";

type Status =
  | { state: "idle" }
  | { state: "submitting" }
  | { state: "success"; detail: string }
  | { state: "error"; message: string };

export default function ContactForm() {
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const endpoint = formspreeEndpoint ?? (isStaticExport ? undefined : "/api/contacts");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      subject: String(data.get("subject") ?? ""),
      message: String(data.get("message") ?? ""),
    };

    if (endpoint) {
      setStatus({ state: "submitting" });
      try {
        const res = await fetch(endpoint, {
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
        setStatus({
          state: "success",
          detail:
            endpoint.startsWith("/api/")
              ? "message saved to data/submissions.json on the server."
              : "message delivered — it lands in my Formspree inbox.",
        });
        form.reset();
      } catch {
        setStatus({
          state: "error",
          message: "network error: could not reach the server",
        });
      }
      return;
    }

    setStatus({
      state: "success",
      detail: "opening your email client — hit send to deliver.",
    });
    const body = `${payload.message}\n\n— ${payload.name} (${payload.email})`;
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(
      `[portfolio:${payload.subject}] message from ${payload.name}`
    )}&body=${encodeURIComponent(body)}`;
  }

  return (
    <form className="termform" onSubmit={onSubmit}>
      <div>
        <label htmlFor="name">name</label>
        <input id="name" name="name" type="text" required maxLength={120} />
      </div>
      <div>
        <label htmlFor="email">email</label>
        <input id="email" name="email" type="email" required maxLength={200} />
      </div>
      <div>
        <label htmlFor="subject">subject</label>
        <select
          id="subject"
          name="subject"
          className="termform"
          style={{ padding: "0.55rem 0.7rem" }}
          defaultValue="question"
        >
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="message">message</label>
        <textarea id="message" name="message" required maxLength={5000} />
      </div>
      <button className="btn" type="submit" disabled={status.state === "submitting"}>
        {status.state === "submitting" ? "transmitting…" : "submit ▶"}
      </button>

      {status.state === "success" && (
        <p className="ok">
          exit code 0 — {status.detail}
        </p>
      )}
      {status.state === "error" && <p className="err">{status.message}</p>}
    </form>
  );
}
