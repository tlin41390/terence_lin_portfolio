import { handleBlogsGet, handleBlogsPost } from "@/lib/blogs";

export async function GET() {
  return handleBlogsGet();
}

export async function POST(req: Request) {
  return handleBlogsPost(req);
}
