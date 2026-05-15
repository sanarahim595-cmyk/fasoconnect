const fs = require("fs");
const path = require("path");
const { spawn, spawnSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..");
const frontendDir = path.join(rootDir, "frontend");
const runtimeDir = path.join(rootDir, ".runtime");
const logDir = path.join(runtimeDir, "logs");
const pidFile = path.join(runtimeDir, "frontend.pid.json");

fs.mkdirSync(logDir, { recursive: true });

const nextBin = path.join(frontendDir, "node_modules", "next", "dist", "bin", "next");

if (!fs.existsSync(nextBin)) {
  console.error("Next.js is not installed. Run npm install inside frontend first.");
  process.exit(1);
}

const build = spawnSync(process.execPath, [nextBin, "build"], {
  cwd: frontendDir,
  stdio: "inherit",
});

if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

const child = spawn(
  process.execPath,
  [nextBin, "start", "--hostname", "127.0.0.1", "--port", "3001"],
  {
    cwd: frontendDir,
    detached: true,
    windowsHide: true,
    stdio: "ignore",
  },
);

fs.writeFileSync(
  pidFile,
  JSON.stringify(
    {
      pid: child.pid,
      url: "http://localhost:3001",
      startedAt: new Date().toISOString(),
    },
    null,
    2,
  ),
);

child.unref();
console.log(`FasoTontine frontend started in background on http://localhost:3001`);
console.log(`PID: ${child.pid}`);
console.log(`PID file: ${path.relative(rootDir, pidFile)}`);
