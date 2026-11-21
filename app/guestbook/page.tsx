import type { Metadata } from "next";
import { site } from "@/lib/site";
import Guestbook from "@/components/Guestbook";

export const metadata: Metadata = {
  title: "~/guestbook",
  description: `Sign the guestbook — ${site.name}'s portfolio.`,
};

export default function GuestbookPage() {
  return (
    <div>
      <p className="prompt">
        {site.handle.toLowerCase()}@portfolio:
        <span className="path">~/guestbook</span>$ cat guestbook.txt
      </p>
      <h1>guestbook</h1>
      <p className="dim">
        a rite of the old web: leave a signature. stored in{" "}
        <b>data/guestbook.json</b> via <b>/api/guestbook</b> — or use{" "}
        <b>sign &lt;name&gt; &lt;message&gt;</b> in the docked terminal.
      </p>
      <Guestbook />
    </div>
  );
}
