import { promises as fs } from "fs";
import path from "path";

export type Submission = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  submittedAt: string;
};

function normalizeSubmission(entry: unknown): Submission | null {
  if (typeof entry !== "object" || entry === null) return null;
  const e = entry as Record<string, unknown>;
  if (
    typeof e.id !== "string" ||
    typeof e.name !== "string" ||
    typeof e.email !== "string" ||
    typeof e.subject !== "string" ||
    typeof e.message !== "string" ||
    typeof e.submittedAt !== "string"
  ) {
    return null;
  }
  return {
    id: e.id,
    name: e.name,
    email: e.email,
    subject: e.subject,
    message: e.message,
    read: e.read === true,
    submittedAt: e.submittedAt,
  };
}

export async function readSubmissions(): Promise<Submission[]> {
  try {
    const file = path.join(process.cwd(), "data", "submissions.json");
    const parsed: unknown = JSON.parse(await fs.readFile(file, "utf8"));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeSubmission)
      .filter((s): s is Submission => s !== null);
  } catch {
    return [];
  }
}

export async function writeSubmissions(submissions: Submission[]): Promise<void> {
  const dir = path.join(process.cwd(), "data");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    path.join(dir, "submissions.json"),
    JSON.stringify(submissions, null, 2),
    "utf8"
  );
}
