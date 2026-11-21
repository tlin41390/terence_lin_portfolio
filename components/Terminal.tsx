"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { site, sections } from "@/lib/site";
import { defaultProjects, type Project } from "@/lib/projectTypes";
import type { Submission } from "@/lib/submissions";
import type { GuestbookEntry } from "@/lib/guestbook";

const HISTORY_KEY = "portfolio:terminal-history";
const HISTORY_LIMIT = 100;
const ADMIN_KEY_STORAGE = "portfolio:admin-key";

function persistHistory(h: string[]) {
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
  } catch {
    return;
  }
}

function getAdminKey(): string {
  try {
    return window.localStorage.getItem(ADMIN_KEY_STORAGE) ?? "";
  } catch {
    return "";
  }
}

function setAdminKey(key: string) {
  try {
    if (key) window.localStorage.setItem(ADMIN_KEY_STORAGE, key);
    else window.localStorage.removeItem(ADMIN_KEY_STORAGE);
  } catch {
    return;
  }
}

type Line = { text: string; kind?: "out" | "dim" | "err" | "ok" };

type Cmd = {
  name: string;
  args?: string;
  desc: string;
  run: (args: string[]) => Line[] | Promise<Line[]>;
};

export default function Terminal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [lines, setLines] = useState<Line[]>([
    {
      text: "TerenceOS 1.0.0 — portfolio shell. Type `help` to list commands.",
      kind: "dim",
    },
  ]);
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [caret, setCaret] = useState(0);
  const [projectsList, setProjectsList] = useState<Project[]>(defaultProjects);
  const routes = [
    "/",
    "/about-me",
    "/experience",
    "/projects",
    "/blogs",
    "/guestbook",
    "/resume",
    "/contact-me",
    ...projectsList.map((p) => `/projects/${p.slug}`),
  ];
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const didFetchProjectsRef = useRef(false);
  const path = usePathname();

  const refreshProjects = useCallback(
    async (): Promise<Project[]> => {
      try {
        const res = await fetch("/api/projects", {
          headers: { Accept: "application/json" },
        });
        const body = (await res.json().catch(() => null)) as {
          ok?: boolean;
          projects?: Project[];
        } | null;
        if (res.ok && body?.ok && Array.isArray(body.projects)) {
          setProjectsList(body.projects);
          return body.projects;
        }
      } catch {
        return projectsList;
      }
      return projectsList;
    },
    [projectsList]
  );

  useEffect(() => {
    if (didFetchProjectsRef.current) return;
    didFetchProjectsRef.current = true;
    void refreshProjects();
  }, [refreshProjects]);

  const print = (out: Line[]) =>
    setLines((prev) => [...prev, ...out].slice(-300));

  const navigate = (to: string) => {
    if (to === path) {
      print([{ text: `already in ${to}`, kind: "dim" }]);
      return;
    }
    print([{ text: `cd ${to}`, kind: "ok" }]);
    router.push(to);
  };

  const banner = (): Line[] => [
    { text: "┌────────────────────────────────────────────┐", kind: "dim" },
    { text: `│  ${site.handle.toLowerCase()}@portfolio — ${site.role.toLowerCase()}   │`, kind: "dim" },
    { text: `│  $ echo "welcome to my portfolio"          │`, kind: "dim" },
    { text: "└────────────────────────────────────────────┘", kind: "dim" },
    { text: `${site.name} — ${site.role}`, kind: "ok" },
  ];

  const mailRef = useRef<{ fetchedAt: number; messages: Submission[] }>({
    fetchedAt: 0,
    messages: [],
  });

  const mailHeaders = (): Record<string, string> => {
    const h: Record<string, string> = { Accept: "application/json" };
    const key = getAdminKey();
    if (key) h["x-admin-key"] = key;
    return h;
  };

  const fetchMail = async (): Promise<Submission[] | "locked" | null> => {
    try {
      const res = await fetch("/api/mail", {
        headers: mailHeaders(),
      });
      const body = (await res.json().catch(() => null)) as {
        ok?: boolean;
        messages?: Submission[];
        error?: string;
      } | null;
      if (res.status === 401) return "locked";
      if (!res.ok || !body?.ok || !Array.isArray(body.messages)) return null;
      mailRef.current = { fetchedAt: Date.now(), messages: body.messages };
      return body.messages;
    } catch {
      return null;
    }
  };

  const patchMail = async (
    id: string,
    read: boolean
  ): Promise<Submission | "locked" | null> => {
    try {
      const res = await fetch("/api/mail", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...mailHeaders(),
        },
        body: JSON.stringify({ id, read }),
      });
      const body = (await res.json().catch(() => null)) as {
        ok?: boolean;
        message?: Submission;
        error?: string;
      } | null;
      if (res.status === 401) return "locked";
      if (!res.ok || !body?.ok || !body.message) return null;
      mailRef.current = {
        fetchedAt: Date.now(),
        messages: mailRef.current.messages.map((m) =>
          m.id === id ? body.message! : m
        ),
      };
      return body.message;
    } catch {
      return null;
    }
  };

  const deleteMail = async (
    id: string | null
  ): Promise<boolean | "locked"> => {
    try {
      const url = id ? `/api/mail?id=${encodeURIComponent(id)}` : "/api/mail";
      const res = await fetch(url, {
        method: "DELETE",
        headers: mailHeaders(),
      });
      const body = (await res.json().catch(() => null)) as { ok?: boolean } | null;
      if (res.status === 401) return "locked";
      if (!res.ok || !body?.ok) return false;
      mailRef.current = {
        fetchedAt: Date.now(),
        messages: id
          ? mailRef.current.messages.filter((m) => m.id !== id)
          : [],
      };
      return true;
    } catch {
      return false;
    }
  };

  const resolveMail = async (
    idxStr: string
  ): Promise<Submission | null | "error" | "locked"> => {
    const n = Number.parseInt(idxStr, 10);
    if (!Number.isInteger(n) || n < 1) return null;
    let msgs = mailRef.current.messages;
    const stale = Date.now() - mailRef.current.fetchedAt > 15000;
    if (msgs.length === 0 || stale) {
      const fetched = await fetchMail();
      if (fetched === null) return "error";
      if (fetched === "locked") return "locked";
      msgs = fetched;
    }
    return n <= msgs.length ? msgs[n - 1] : null;
  };

  const mailNotReached: Line = { text: "mail: could not reach /api/mail", kind: "err" };
  const mailNotFound = (n: string): Line => ({
    text: `mail: no message '${n}' — run 'mail' to list`,
    kind: "err",
  });
  const mailLocked: Line = {
    text: "mail: locked — run 'mail login <key>'",
    kind: "err",
  };

  const verifyAdminKey = async (key: string): Promise<boolean | null> => {
    try {
      const res = await fetch("/api/mail", {
        headers: { Accept: "application/json", "x-admin-key": key },
      });
      if (res.status === 401) return false;
      if (!res.ok) return null;
      const body = (await res.json().catch(() => null)) as { ok?: boolean } | null;
      return body?.ok === true ? true : null;
    } catch {
      return null;
    }
  };

  const runMail = async (args: string[]): Promise<Line[]> => {
    const sub = args[0];
    if (!sub) {
      const msgs = await fetchMail();
      if (msgs === "locked") return [mailLocked];
      if (msgs === null) return [mailNotReached];
      if (msgs.length === 0) {
        return [
          { text: "inbox empty — messages from /contact-me land here", kind: "dim" },
        ];
      }
      const unread = msgs.filter((m) => !m.read).length;
      return [
        {
          text: `inbox: ${msgs.length} message${msgs.length === 1 ? "" : "s"}, ${unread} unread — 'mail <n>' to read`,
          kind: "dim",
        },
        ...msgs.map((m, i) => ({
          text: `  ${String(i + 1).padStart(2)}  ${m.read ? " " : "●"}  ${m.name.slice(0, 14).padEnd(14)}  ${m.subject.slice(0, 12).padEnd(12)}  ${m.message.slice(0, 36)}`,
          kind: (m.read ? "out" : "ok") as Line["kind"],
        })),
      ];
    }

    if (sub === "login") {
      const key = args.slice(1).join(" ").trim();
      if (!key) return [{ text: "usage: mail login <key>", kind: "dim" }];
      const valid = await verifyAdminKey(key);
      if (valid === null) return [mailNotReached];
      if (!valid) return [{ text: "mail: wrong key", kind: "err" }];
      setAdminKey(key);
      return [
        {
          text: "admin unlocked — key stored in this browser's localStorage ('mail logout' to lock)",
          kind: "ok",
        },
      ];
    }

    if (sub === "logout") {
      setAdminKey("");
      return [{ text: "admin session locked", kind: "dim" }];
    }

    if (sub === "read" || sub === "unread") {
      const n = args[1] ?? "";
      const msg = await resolveMail(n);
      if (msg === "locked") return [mailLocked];
      if (msg === "error") return [mailNotReached];
      if (msg === null) return [mailNotFound(n)];
      const updated = await patchMail(msg.id, sub === "read");
      if (updated === "locked") return [mailLocked];
      if (!updated) return [{ text: "mail: could not update the message", kind: "err" }];
      return [{ text: `message ${n} marked as ${sub}`, kind: "dim" }];
    }

    if (sub === "rm") {
      const n = args[1] ?? "";
      const msg = await resolveMail(n);
      if (msg === "locked") return [mailLocked];
      if (msg === "error") return [mailNotReached];
      if (msg === null) return [mailNotFound(n)];
      const deleted = await deleteMail(msg.id);
      if (deleted === "locked") return [mailLocked];
      if (!deleted) return [{ text: "mail: could not delete the message", kind: "err" }];
      return [{ text: `message ${n} deleted`, kind: "dim" }];
    }

    if (sub === "clear") {
      const cleared = await deleteMail(null);
      if (cleared === "locked") return [mailLocked];
      if (!cleared) return [{ text: "mail: could not clear the inbox", kind: "err" }];
      return [{ text: "inbox cleared", kind: "dim" }];
    }

    if (!/^\d+$/.test(sub)) {
      return [
        {
          text: "usage: mail | mail <n> | mail read <n> | mail unread <n> | mail rm <n> | mail clear | mail login <key> | mail logout",
          kind: "dim",
        },
      ];
    }

    const msg = await resolveMail(sub);
    if (msg === "locked") return [mailLocked];
    if (msg === "error") return [mailNotReached];
    if (msg === null) return [mailNotFound(sub)];
    const lines: Line[] = [
      { text: `From:    ${msg.name} <${msg.email}>`, kind: "out" },
      { text: `Subject: ${msg.subject}`, kind: "out" },
      { text: `Date:    ${new Date(msg.submittedAt).toLocaleString()}`, kind: "out" },
      { text: "", kind: "out" },
      { text: msg.message, kind: "out" },
    ];
    if (!msg.read) {
      const updated = await patchMail(msg.id, true);
      if (updated && updated !== "locked") {
        lines.push({ text: "marked as read", kind: "dim" });
      }
    }
    return lines;
  };

  const guestbookRef = useRef<{ fetchedAt: number; entries: GuestbookEntry[] }>({
    fetchedAt: 0,
    entries: [],
  });

  const fetchGuestbook = async (): Promise<GuestbookEntry[] | null> => {
    try {
      const res = await fetch("/api/guestbook", {
        headers: { Accept: "application/json" },
      });
      const body = (await res.json().catch(() => null)) as {
        ok?: boolean;
        entries?: GuestbookEntry[];
      } | null;
      if (!res.ok || !body?.ok || !Array.isArray(body.entries)) return null;
      guestbookRef.current = { fetchedAt: Date.now(), entries: body.entries };
      return body.entries;
    } catch {
      return null;
    }
  };

  const deleteGuestbookEntry = async (id: string | null): Promise<boolean> => {
    try {
      const url = id
        ? `/api/guestbook?id=${encodeURIComponent(id)}`
        : "/api/guestbook";
      const res = await fetch(url, { method: "DELETE" });
      const body = (await res.json().catch(() => null)) as { ok?: boolean } | null;
      if (!res.ok || !body?.ok) return false;
      guestbookRef.current = {
        fetchedAt: Date.now(),
        entries: id
          ? guestbookRef.current.entries.filter((e) => e.id !== id)
          : [],
      };
      return true;
    } catch {
      return false;
    }
  };

  const resolveGuestbookEntry = async (
    idxStr: string
  ): Promise<GuestbookEntry | null | "error"> => {
    const n = Number.parseInt(idxStr, 10);
    if (!Number.isInteger(n) || n < 1) return null;
    let entries = guestbookRef.current.entries;
    const stale = Date.now() - guestbookRef.current.fetchedAt > 15000;
    if (entries.length === 0 || stale) {
      const fetched = await fetchGuestbook();
      if (fetched === null) return "error";
      entries = fetched;
    }
    return n <= entries.length ? entries[n - 1] : null;
  };

  const runSign = async (args: string[]): Promise<Line[]> => {
    const gbNotReached: Line = {
      text: "sign: could not reach /api/guestbook",
      kind: "err",
    };
    const usage: Line = {
      text: "usage: sign <name> <message> | sign list | sign rm <n> | sign clear",
      kind: "dim",
    };
    const sub = args[0];
    if (!sub) return [usage];

    if (sub === "list") {
      const entries = await fetchGuestbook();
      if (entries === null) return [gbNotReached];
      if (entries.length === 0) {
        return [
          { text: "guestbook is empty — be the first: sign <name> <message>", kind: "dim" },
        ];
      }
      return [
        {
          text: `${entries.length} signature${entries.length === 1 ? "" : "s"} — newest first (or see /guestbook)`,
          kind: "dim",
        },
        ...entries.map((e, i) => ({
          text: `  ${String(i + 1).padStart(2)}  ${e.name.slice(0, 16).padEnd(16)}  ${e.message.slice(0, 48)}`,
          kind: "out" as Line["kind"],
        })),
      ];
    }

    if (sub === "rm") {
      const n = args[1] ?? "";
      const entry = await resolveGuestbookEntry(n);
      if (entry === "error") return [gbNotReached];
      if (entry === null)
        return [{ text: `sign: no entry '${n}' — run 'sign list'`, kind: "err" }];
      const deleted = await deleteGuestbookEntry(entry.id);
      if (!deleted)
        return [{ text: "sign: could not delete the entry", kind: "err" }];
      return [{ text: `entry ${n} deleted`, kind: "dim" }];
    }

    if (sub === "clear") {
      const cleared = await deleteGuestbookEntry(null);
      if (!cleared) return [{ text: "sign: could not clear the guestbook", kind: "err" }];
      return [{ text: "guestbook cleared", kind: "dim" }];
    }

    const message = args.slice(1).join(" ").trim();
    if (!message) return [usage];

    try {
      const res = await fetch("/api/guestbook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: sub.slice(0, 40),
          message: message.slice(0, 500),
        }),
      });
      const body = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
      } | null;
      if (!res.ok || !body?.ok) {
        return [{ text: `sign: ${body?.error ?? `endpoint returned ${res.status}`}`, kind: "err" }];
      }
      guestbookRef.current = { fetchedAt: 0, entries: [] };
      return [
        { text: `signed — thanks, ${sub.slice(0, 40)}! see /guestbook`, kind: "ok" },
      ];
    } catch {
      return [gbNotReached];
    }
  };

  const commands: Cmd[] = [
    {
      name: "help",
      desc: "list available commands",
      run: () => [
        { text: "available commands:", kind: "dim" },
        ...commands.map(
          (c) => ({ text: `  ${c.name.padEnd(8)} ${c.desc}`, kind: "out" } as Line)
        ),
        { text: "tip: use Tab to complete, ↑/↓ for history", kind: "dim" },
      ],
    },
    {
      name: "ls",
      args: "[path]",
      desc: "list files/directories",
      run: (args) => {
        const target = args[0] ?? ".";
        if (target === "projects" || target === "/projects" || target === "./projects")
          return [
            { text: "README.md  " + projectsList.map((p) => `${p.slug}/`).join("  "), kind: "out" },
          ];
        return [
          {
            text: [...sections.map((s) => s.label + "/"), "resume.pdf", "README.md"].join("   "),
            kind: "out",
          },
        ];
      },
    },
    {
      name: "cd",
      args: "<path>",
      desc: "navigate to a page (e.g. cd /projects)",
      run: (args) => {
        const target = args[0];
        if (!target) return [{ text: "cd: missing operand", kind: "err" }];
        let to = target;
        if (to === "~" || to === "/" || to === "." || to === "./") to = "/";
        if (!to.startsWith("/")) to = "/" + to;
        if (to === "/projects") {
          navigate("/projects");
          return [];
        }
        const match = routes.find(
          (r) => r === to.replace(/\/$/, "") || r === to
        );
        if (match) {
          navigate(match);
          return [];
        }
        const section = sections.find((s) => "/" + s.label === to.replace(/\/$/, ""));
        if (section) {
          navigate(section.path);
          return [];
        }
        const proj = projectsList.find((p) => "/projects/" + p.slug === to.replace(/\/$/, ""));
        if (proj) {
          navigate("/projects/" + proj.slug);
          return [];
        }
        return [{ text: `cd: ${target}: No such directory`, kind: "err" }];
      },
    },
    {
      name: "open",
      args: "<path|slug>",
      desc: "alias for cd",
      run: (args) => commands.find((c) => c.name === "cd")!.run(args),
    },
    {
      name: "cat",
      args: "<file>",
      desc: "print a file (try cat README.md)",
      run: (args) => {
        const f = args[0];
        if (!f) return [{ text: "cat: missing file operand", kind: "err" }];
        if (f === "README.md" || f === "readme.md")
          return [
            { text: `${site.name} — ${site.role}`, kind: "ok" },
            { text: site.tagline, kind: "out" },
            { text: `location: ${site.location}`, kind: "out" },
            { text: "try: ls, cd /about-me, cd /projects, cd /contact-me", kind: "dim" },
          ];
        if (f === "resume.pdf")
          return (() => {
            navigate("/resume");
            return [{ text: "resume.pdf: binary file — opening /resume…", kind: "dim" }];
          })();
        if (f === "about.txt")
          return [{ text: "that lives in /about-me — run: cd /about-me", kind: "dim" }];
        return [{ text: `cat: ${f}: No such file or directory`, kind: "err" }];
      },
    },
    {
      name: "whoami",
      desc: "print the current user",
      run: () => [
        { text: `${site.name.toLowerCase().replace(/ /g, "_")} — ${site.role}`, kind: "ok" },
        { text: site.tagline, kind: "out" },
      ],
    },
    {
      name: "projects",
      desc: "list projects, or open one with 'projects <slug>'",
      run: async (args) => {
        const list = await refreshProjects();
        if (args[0]) {
          const p = list.find(
            (x) => x.slug === args[0].replace(/^\/?projects\//, "").replace(/\/$/, "")
          );
          if (p) {
            navigate("/projects/" + p.slug);
            return [];
          }
          return [{ text: `projects: no project named '${args[0]}'`, kind: "err" }];
        }
        return [
          { text: "available projects:", kind: "dim" },
          ...list.map(
            (p) => ({ text: `  ${p.slug.padEnd(20)} ${p.name}`, kind: "out" } as Line)
          ),
          { text: "open with: projects <slug>  or  cd /projects/<slug>", kind: "dim" },
        ];
      },
    },
    {
      name: "contact",
      desc: "jump to the contact form",
      run: () => {
        navigate("/contact-me");
        return [];
      },
    },
    {
      name: "mail",
      args: "[n | read n | unread n | rm n | clear | login <key> | logout]",
      desc: "read the contact-form inbox (admin)",
      run: (args) => runMail(args),
    },
    {
      name: "sign",
      args: "<name> <message> | list | rm <n> | clear",
      desc: "sign the guestbook",
      run: (args) => runSign(args),
    },
    {
      name: "resume",
      desc: "open the resume page (view/download PDF)",
      run: () => {
        navigate("/resume");
        return [];
      },
    },
    {
      name: "socials",
      desc: "print social links",
      run: () => [
        ...site.socials.map(
          (s) => ({ text: `  ${s.label}: ${s.url}`, kind: "out" } as Line)
        ),
      ],
    },
    {
      name: "banner",
      desc: "show the ASCII banner",
      run: banner,
    },
    {
      name: "date",
      desc: "print the current date",
      run: () => [{ text: new Date().toString(), kind: "out" }],
    },
    {
      name: "echo",
      desc: "print arguments",
      run: (args) => [{ text: args.join(" "), kind: "out" }],
    },
    {
      name: "history",
      desc: "show command history ('history -c' clears it)",
      run: (args) => {
        if (args[0] === "-c") {
          setHistory([]);
          persistHistory([]);
          return [{ text: "history cleared", kind: "dim" }];
        }
        return history.length
          ? history.map((h, i) => ({ text: `  ${i + 1}  ${h}`, kind: "out" } as Line))
          : [{ text: "history is empty", kind: "dim" }];
      },
    },
    {
      name: "clear",
      desc: "clear the screen",
      run: () => {
        setLines([]);
        return [];
      },
    },
    {
      name: "exit",
      desc: "close the terminal",
      run: () => {
        setOpen(false);
        return [];
      },
    },
    {
      name: "sudo",
      desc: "elevate privileges",
      run: () => [
        { text: "terence is not in the sudoers file. This incident will be reported.", kind: "err" },
      ],
    },
  ];

  const syncCaret = () => {
    const el = inputRef.current;
    if (el) setCaret(el.selectionStart ?? el.value.length);
  };

  const runLine = async (raw: string) => {
    const trimmed = raw.trim();
    print([{ text: `❯ ${trimmed}`, kind: "ok" }]);
    if (!trimmed) return;
    const nextHistory = [...history, trimmed].slice(-HISTORY_LIMIT);
    setHistory(nextHistory);
    setHistIdx(-1);
    persistHistory(nextHistory);
    const parts = trimmed.split(/\s+/);
    const name = parts[0].toLowerCase();
    const args = parts.slice(1);
    const cmd = commands.find((c) => c.name === name);
    if (cmd) {
      const out = await cmd.run(args);
      if (out.length) print(out);
    } else {
      print([
        { text: `${name}: command not found. try 'help'`, kind: "err" },
      ]);
    }
  };

  const complete = () => {
    const tokens = input.split(/\s+/);
    const last = tokens[tokens.length - 1] ?? "";
    let pool: string[];
    if (tokens.length <= 1) pool = commands.map((c) => c.name);
    else if (["cd", "open", "ls"].includes(tokens[0].toLowerCase()))
      pool = ["/", ...sections.map((s) => s.path), "/resume", ...projectsList.map((p) => p.slug)];
    else return;
    const matches = pool.filter((p) => p.startsWith(last) && p !== last);
    if (matches.length === 1) {
      const next = [...tokens.slice(0, -1), matches[0]].join(" ");
      setInput(next.endsWith("/") ? next : next + " ");
    } else if (matches.length > 1) {
      print([{ text: `${last}…  ${matches.join("   ")}`, kind: "dim" }]);
    }
  };

  useEffect(() => {
    if (open && bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [lines, open]);

  useEffect(() => {
    const el = inputRef.current;
    if (el) setCaret(el.selectionStart ?? el.value.length);
  }, [input, open]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(HISTORY_KEY);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setHistory(
          parsed
            .filter((h): h is string => typeof h === "string")
            .slice(-HISTORY_LIMIT)
        );
      }
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "~" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="terminal-dock">
      <div className="dock-head">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label="toggle terminal"
        >
          {open ? "▼" : "▲"} {site.handle.toLowerCase()}@portfolio: ~{" "}
          {open ? "" : "(press ~ or click to open)"}
        </button>
        <span className="faint">{path}</span>
      </div>
      {open && (
        <div className="dock-body" ref={bodyRef} onClick={() => inputRef.current?.focus()}>
          {lines.map((l, i) => (
            <div key={i} className={`line ${l.kind ?? "out"}`}>
              {l.text}
            </div>
          ))}
          <div className="dock-input">
            <span className="prompt">
              {site.handle.toLowerCase()}@portfolio:<span className="path">{path === "/" ? "~" : path}</span>$
            </span>
            <div className="input-wrap">
              <span
                className="type-cursor"
                style={{ left: `${caret}ch` }}
                aria-hidden="true"
              />
              <input
                ref={inputRef}
                autoFocus
                value={input}
                spellCheck={false}
                autoComplete="off"
                onChange={(e) => setInput(e.target.value)}
                onSelect={syncCaret}
                onClick={syncCaret}
                onKeyUp={syncCaret}
                onFocus={syncCaret}
                onKeyDown={(e) => {
                if (e.key === "Enter") {
                  void runLine(input);
                  setInput("");
                } else if (e.key === "Tab") {
                  e.preventDefault();
                  complete();
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  const next = histIdx < 0 ? history.length - 1 : Math.max(0, histIdx - 1);
                  if (history[next] !== undefined) {
                    setInput(history[next]);
                    setHistIdx(next);
                  }
                } else if (e.key === "ArrowDown") {
                  e.preventDefault();
                  if (histIdx >= 0 && histIdx < history.length - 1) {
                    setInput(history[histIdx + 1]);
                    setHistIdx(histIdx + 1);
                  } else {
                    setInput("");
                    setHistIdx(-1);
                  }
                } else if (e.key === "l" && e.ctrlKey) {
                  e.preventDefault();
                  setLines([]);
                }
              }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
