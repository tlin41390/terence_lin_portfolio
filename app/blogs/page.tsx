import type { Metadata } from "next";
import { site } from "@/lib/site";
import BlogIndex from "@/components/BlogIndex";

export const metadata: Metadata = {
  title: "~/blogs",
  description: `Blog posts by ${site.name}.`,
};

export default function Blogs() {
  return (
    <div>
      <p className="prompt">
        {site.handle.toLowerCase()}@portfolio:
        <span className="path">~/blogs</span>$ ls -lt
      </p>
      <h1>blog posts</h1>
      <p className="dim">
        fetched live from <b>GET /api/blogs</b> · stored in{" "}
        <b>data/blogs.json</b>.
      </p>
      <BlogIndex />
    </div>
  );
}
