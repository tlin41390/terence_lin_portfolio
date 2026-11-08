import type { Metadata } from "next";
import { site } from "@/lib/site";
import Nav from "@/components/Nav";
import Terminal from "@/components/Terminal";
import "./globals.css";

export const metadata: Metadata = {
  title: `${site.handle}@portfolio: ~`,
  description: `${site.name} — ${site.role}. ${site.tagline}`,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="scanlines" aria-hidden="true" />
        <header className="titlebar">
          <div className="title">
            <span className="lit">● ● ●</span>{" "}
            {site.handle.toLowerCase()}@portfolio: ~
          </div>
          <Nav />
        </header>
        <main className="content">{children}</main>
        <Terminal />
      </body>
    </html>
  );
}
