import {
  handleGuestbookGet,
  handleGuestbookPost,
  handleGuestbookDelete,
} from "@/lib/guestbook";

export async function GET() {
  return handleGuestbookGet();
}

export async function POST(req: Request) {
  return handleGuestbookPost(req);
}

export async function DELETE(req: Request) {
  return handleGuestbookDelete(req);
}
