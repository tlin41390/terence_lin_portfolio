import type { Metadata } from "next";
import { site } from "@/lib/site";
import BlogComposer from "@/components/BlogComposer";

export const metadata: Metadata = {
  title: "~/admin/blogs",
  description: `Manage blog posts for ${site.name}.`,
};

export default function BlogAdmin() {
  return (
    <div>
      <p className="prompt">
        {site.handle.toLowerCase()}@portfolio:
        <span className="path">~/admin/blogs</span>$ sudo nano post.md
      </p>
      <h1>blog admin</h1>
      <p className="dim">
        publishing POSTs to <b>/api/blogs</b>; every post is saved as JSON in{" "}
        <b>data/blogs.json</b> and appears on <b>/blogs</b>.
      </p>
      <BlogComposer />
    </div>
  );
}
