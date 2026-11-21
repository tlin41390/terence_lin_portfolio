import { handleProjectsGet, handleProjectsPost } from "@/lib/projects";

export async function GET() {
  return handleProjectsGet();
}

export async function POST(req: Request) {
  return handleProjectsPost(req);
}
