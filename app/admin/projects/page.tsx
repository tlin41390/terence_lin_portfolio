import type { Metadata } from "next";
import { site } from "@/lib/site";
import ProjectComposer from "@/components/ProjectComposer";

export const metadata: Metadata = {
  title: "~/admin/projects",
  description: `Manage projects for ${site.name}.`,
};

export default function ProjectAdmin() {
  return (
    <div>
      <p className="prompt">
        {site.handle.toLowerCase()}@portfolio:
        <span className="path">~/admin/projects</span>$ sudo nano project.md
      </p>
      <h1>projects admin</h1>
      <p className="dim">
        changes POST/PUT/DELETE to <b>/api/projects</b>; every project is saved
        as JSON in <b>data/projects.json</b> and appears on <b>/projects</b>.
      </p>
      <ProjectComposer />
    </div>
  );
}
