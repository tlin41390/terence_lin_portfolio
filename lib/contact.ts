import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  readSubmissions,
  writeSubmissions,
  type Submission,
} from "@/lib/submissions";

const SUBJECTS = ["question", "feedback", "opportunity"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function handleContactPost(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid JSON body" },
      { status: 400 }
    );
  }

  const name = asString(body.name);
  const email = asString(body.email);
  const subject = asString(body.subject).toLowerCase();
  const message = asString(body.message);

  if (!name) {
    return NextResponse.json(
      { ok: false, error: "field 'name' is required" },
      { status: 400 }
    );
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: "field 'email' must be a valid email address" },
      { status: 400 }
    );
  }
  if (!SUBJECTS.includes(subject)) {
    return NextResponse.json(
      {
        ok: false,
        error: `field 'subject' must be one of: ${SUBJECTS.join(", ")}`,
      },
      { status: 400 }
    );
  }
  if (!message) {
    return NextResponse.json(
      { ok: false, error: "field 'message' is required" },
      { status: 400 }
    );
  }

  const submission: Submission = {
    id: randomUUID(),
    name: name.slice(0, 120),
    email: email.slice(0, 200),
    subject: subject.slice(0, 40),
    message: message.slice(0, 5000),
    read: false,
    submittedAt: new Date().toISOString(),
  };

  try {
    const submissions = await readSubmissions();
    submissions.push(submission);
    await writeSubmissions(submissions);
  } catch {
    return NextResponse.json(
      { ok: false, error: "could not save your message, try again later" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, id: submission.id }, { status: 201 });
}
