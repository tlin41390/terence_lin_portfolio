import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import {
  readSubmissions,
  writeSubmissions,
} from "@/lib/submissions";

function unauthorized(reason: string) {
  return NextResponse.json({ ok: false, error: reason }, { status: 401 });
}

function isAdmin(req: Request): boolean {
  const expected = process.env.ADMIN_KEY ?? "";
  if (!expected) return false;
  const provided = req.headers.get("x-admin-key") ?? "";
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function handleMailGet(req: Request) {
  if (!isAdmin(req)) {
    return unauthorized(
      process.env.ADMIN_KEY
        ? "locked — invalid or missing admin key ('mail login <key>')"
        : "locked — ADMIN_KEY is not configured on the server"
    );
  }
  try {
    const submissions = await readSubmissions();
    const sorted = [...submissions].sort(
      (a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt)
    );
    return NextResponse.json({ ok: true, messages: sorted });
  } catch {
    return NextResponse.json(
      { ok: false, error: "could not load the inbox" },
      { status: 500 }
    );
  }
}

export async function handleMailPatch(req: Request) {
  if (!isAdmin(req)) {
    return unauthorized(
      process.env.ADMIN_KEY
        ? "locked — invalid or missing admin key ('mail login <key>')"
        : "locked — ADMIN_KEY is not configured on the server"
    );
  }
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid JSON body" },
      { status: 400 }
    );
  }

  const id = typeof body.id === "string" ? body.id : "";
  if (!id) {
    return NextResponse.json(
      { ok: false, error: "field 'id' is required" },
      { status: 400 }
    );
  }
  if (typeof body.read !== "boolean") {
    return NextResponse.json(
      { ok: false, error: "field 'read' must be a boolean" },
      { status: 400 }
    );
  }

  try {
    const submissions = await readSubmissions();
    const idx = submissions.findIndex((s) => s.id === id);
    if (idx === -1) {
      return NextResponse.json(
        { ok: false, error: `no message with id '${id}'` },
        { status: 404 }
      );
    }
    submissions[idx] = { ...submissions[idx], read: body.read };
    await writeSubmissions(submissions);
    return NextResponse.json({ ok: true, message: submissions[idx] });
  } catch {
    return NextResponse.json(
      { ok: false, error: "could not update the message" },
      { status: 500 }
    );
  }
}

export async function handleMailDelete(req: Request) {
  if (!isAdmin(req)) {
    return unauthorized(
      process.env.ADMIN_KEY
        ? "locked — invalid or missing admin key ('mail login <key>')"
        : "locked — ADMIN_KEY is not configured on the server"
    );
  }
  const id = new URL(req.url).searchParams.get("id");

  try {
    const submissions = await readSubmissions();
    if (id === null) {
      await writeSubmissions([]);
      return NextResponse.json({ ok: true, cleared: submissions.length });
    }
    const idx = submissions.findIndex((s) => s.id === id);
    if (idx === -1) {
      return NextResponse.json(
        { ok: false, error: `no message with id '${id}'` },
        { status: 404 }
      );
    }
    submissions.splice(idx, 1);
    await writeSubmissions(submissions);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "could not delete the message" },
      { status: 500 }
    );
  }
}
