"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { site, sections } from "@/lib/site";
import { projects } from "@/lib/projects";

type Line = { text: string; kind?: "out" | "dim" | "err" | "ok" };

type Cmd = {
  name: string;
  args?: string;
  desc: string;
  run: (args: string[]) => Line[];
};

const ROUTES = [
  "/",
  "/about-me",
  "/experience",
  "/projects",
  "/resume",
  "/contact-me-server-form",
  ...projects.map((p) => `/projects/${p.slug}`),
];

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
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const path = usePathname();

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
            { text: "README.md  " + projects.map((p) => `${p.slug}/`).join("  "), kind: "out" },
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
        const match = ROUTES.find(
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
        const proj = projects.find((p) => "/projects/" + p.slug === to.replace(/\/$/, ""));
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
            { text: "try: ls, cd /about-me, cd /projects, cd /contact-me-server-form", kind: "dim" },
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
      run: (args) => {
        if (args[0]) {
          const p = projects.find(
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
          ...projects.map(
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
        navigate("/contact-me-server-form");
        return [];
      },
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
      desc: "show command history",
      run: () =>
        history.length
          ? history.map((h, i) => ({ text: `  ${i + 1}  ${h}`, kind: "out" } as Line))
          : [{ text: "history is empty", kind: "dim" }],
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

  const runLine = (raw: string) => {
    const trimmed = raw.trim();
    print([{ text: `❯ ${trimmed}`, kind: "ok" }]);
    if (!trimmed) return;
    setHistory((h) => [...h, trimmed]);
    setHistIdx(-1);
    const parts = trimmed.split(/\s+/);
    const name = parts[0].toLowerCase();
    const args = parts.slice(1);
    const cmd = commands.find((c) => c.name === name);
    if (cmd) {
      const out = cmd.run(args);
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
      pool = ["/", ...sections.map((s) => s.path), "/resume", ...projects.map((p) => p.slug)];
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
                  runLine(input);
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
