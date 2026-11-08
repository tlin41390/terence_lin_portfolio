"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "/" },
  { href: "/about-me", label: "/about-me" },
  { href: "/experience", label: "/experience" },
  { href: "/projects", label: "/projects" },
  { href: "/resume", label: "/resume" },
  { href: "/contact-me-server-form", label: "/contact-me-server-form" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav className="nav">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={pathname === l.href ? "active" : ""}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
