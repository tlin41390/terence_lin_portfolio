import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

export type GuestbookEntry = {
  id: string;
  name: string;
  message: string;
  createdAt: string;
};

const MAX_ENTRIES = 200;
const MAX_NAME = 40;
const MAX_MESSAGE = 500;

function normalizeEntry(entry: unknown): GuestbookEntry | null {
  if (typeof entry !== "object" || entry === null) return null;
  const e = entry as Record<string, unknown>;
  if (
    typeof e.id !== "string" ||
    typeof e.name !== "string" ||
    typeof e.message !== "string" ||
    typeof e.createdAt !== "string"
  ) {
    return null;
  }
  return {
    id: e.id,
    name: e.name,
    message: e.message,
    createdAt: e.createdAt,
  };
}

export async function readGuestbook(): Promise<GuestbookEntry[]> {
  try {
    const file = path.join(process.cwd(), "data", "guestbook.json");
    const parsed: unknown = JSON.parse(await fs.readFile(file, "utf8"));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeEntry)
      .filter((e): e is GuestbookEntry => e !== null);
  } catch {
    return [];
  }
}

async function writeGuestbook(entries: GuestbookEntry[]): Promise<void> {
  const dir = path.join(process.cwd(), "data");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    path.join(dir, "guestbook.json"),
    JSON.stringify(entries, null, 2),
    "utf8"
  );
}

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function handleGuestbookGet() {
  try {
    const entries = await readGuestbook();
    const sorted = [...entries].sort(
      (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
    );
    return NextResponse.json({ ok: true, entries: sorted });
  } catch {
    return NextResponse.json(
      { ok: false, error: "could not load the guestbook" },
      { status: 500 }
    );
  }
}

export async function handleGuestbookPost(req: Request) {
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
  const message = asString(body.message);

  if (!name) {
    return NextResponse.json(
      { ok: false, error: "field 'name' is required" },
      { status: 400 }
    );
  }
  if (name.length > MAX_NAME) {
    return NextResponse.json(
      { ok: false, error: `field 'name' must be at most ${MAX_NAME} characters` },
      { status: 400 }
    );
  }
  if (!message) {
    return NextResponse.json(
      { ok: false, error: "field 'message' is required" },
      { status: 400 }
    );
  }
  if (message.length > MAX_MESSAGE) {
    return NextResponse.json(
      {
        ok: false,
        error: `field 'message' must be at most ${MAX_MESSAGE} characters`,
      },
      { status: 400 }
    );
  }

  const entry: GuestbookEntry = {
    id: randomUUID(),
    name: name.slice(0, MAX_NAME),
    message: message.slice(0, MAX_MESSAGE),
    createdAt: new Date().toISOString(),
  };

  try {
    const entries = await readGuestbook();
    entries.push(entry);
    await writeGuestbook(entries.slice(-MAX_ENTRIES));
  } catch {
    return NextResponse.json(
      { ok: false, error: "could not save your signature, try again later" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, id: entry.id }, { status: 201 });
}

export async function handleGuestbookDelete(req: Request) {
  const id = new URL(req.url).searchParams.get("id");

  try {
    const entries = await readGuestbook();
    if (id === null) {
      await writeGuestbook([]);
      return NextResponse.json({ ok: true, cleared: entries.length });
    }
    const idx = entries.findIndex((e) => e.id === id);
    if (idx === -1) {
      return NextResponse.json(
        { ok: false, error: `no entry with id '${id}'` },
        { status: 404 }
      );
    }
    entries.splice(idx, 1);
    await writeGuestbook(entries);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "could not delete the entry" },
      { status: 500 }
    );
  }
}
