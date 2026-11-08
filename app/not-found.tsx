import Link from "next/link";

export default function NotFound() {
  return (
    <div>
      <p className="prompt">
        terence@portfolio:<span className="path">~</span>$ cd $(pwd)
      </p>
      <h1>
        404 <span className="dim">— no such file or directory</span>
      </h1>
      <p className="err">
        bash: cd: {""}
        <span className="dim">the page you requested does not exist</span>
      </p>
      <p>
        <Link href="/">cd /</Link> return home · <Link href="/projects">cd /projects</Link>{" "}
        view projects
      </p>
    </div>
  );
}
