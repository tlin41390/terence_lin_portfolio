import type { Metadata } from "next";
import { readBlogs } from "@/lib/blogs";
import BlogPostView from "@/components/BlogPostView";

export async function generateStaticParams() {
  const blogs = await readBlogs();
  if (blogs.length === 0) return [{ slug: "_placeholder" }];
  return blogs.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  let description: string | undefined;
  try {
    const blogs = await readBlogs();
    description = blogs.find((b) => b.slug === slug)?.summary;
  } catch {
    description = undefined;
  }
  return { title: `~/blogs/${slug}`, description };
}

export default function BlogPostPage() {
  return <BlogPostView />;
}
