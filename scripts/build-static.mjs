import { execSync } from "child_process";
import { existsSync, mkdirSync, renameSync, rmSync } from "fs";

const api = "app/api";
const stash = ".static-stash/api";

mkdirSync(".static-stash", { recursive: true });
const stashed = existsSync(api);
if (stashed) renameSync(api, stash);

try {
  execSync("npx next build", {
    stdio: "inherit",
    env: { ...process.env, STATIC_EXPORT: "true" },
  });
} finally {
  if (stashed) renameSync(stash, api);
  rmSync(".static-stash", { recursive: true, force: true });
}
