import { handleProjectPut, handleProjectDelete } from "@/lib/projects";

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;
  return handleProjectPut(slug, req);
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;
  return handleProjectDelete(slug);
}
