import { handleContactPost } from "@/lib/contact";

export async function POST(req: Request) {
  return handleContactPost(req);
}
