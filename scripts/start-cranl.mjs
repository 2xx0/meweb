import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const requestedPort = process.env.PORT ?? "3000";
if (!/^\d+$/.test(requestedPort)) {
  throw new Error("PORT must be a number.");
}

const wrangler = fileURLToPath(
  new URL("../node_modules/wrangler/bin/wrangler.js", import.meta.url),
);

const child = spawn(
  process.execPath,
  [
    "--import",
    "./scripts/sites-env.mjs",
    wrangler,
    "dev",
    "--config",
    "dist/server/wrangler.json",
    "--local",
    "--ip",
    "0.0.0.0",
    "--port",
    requestedPort,
    "--inspector-port",
    "0",
    "--show-interactive-dev-session=false",
  ],
  { stdio: "inherit" },
);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
