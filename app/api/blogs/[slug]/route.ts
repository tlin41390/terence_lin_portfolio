import { handleBlogPut, handleBlogDelete } from "@/lib/blogs";

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;
  return handleBlogPut(slug, req);
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;
  return handleBlogDelete(slug);
}
