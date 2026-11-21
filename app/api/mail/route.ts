import { handleMailGet, handleMailPatch, handleMailDelete } from "@/lib/mail";

export async function GET(req: Request) {
  return handleMailGet(req);
}

export async function PATCH(req: Request) {
  return handleMailPatch(req);
}

export async function DELETE(req: Request) {
  return handleMailDelete(req);
}
