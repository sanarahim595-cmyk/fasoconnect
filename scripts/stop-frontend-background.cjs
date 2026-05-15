const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..");
const pidFile = path.join(rootDir, ".runtime", "frontend.pid.json");

if (!fs.existsSync(pidFile)) {
  console.log("No frontend PID file found.");
  process.exit(0);
}

const { pid } = JSON.parse(fs.readFileSync(pidFile, "utf8"));

if (process.platform === "win32") {
  if (pid) {
    const killed = spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], { stdio: "inherit" });
    if (killed.status !== 0) {
      spawnSync("powershell.exe", [
        "-NoProfile",
        "-Command",
        "Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { taskkill /PID $_ /T /F }",
      ], { stdio: "inherit" });
    }
  } else {
    spawnSync("powershell.exe", [
      "-NoProfile",
      "-Command",
      "Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { taskkill /PID $_ /T /F }",
    ], { stdio: "inherit" });
  }
} else {
  try {
    process.kill(-pid, "SIGTERM");
  } catch {
    process.kill(pid, "SIGTERM");
  }
}

fs.rmSync(pidFile, { force: true });
console.log("FasoTontine frontend stopped.");
