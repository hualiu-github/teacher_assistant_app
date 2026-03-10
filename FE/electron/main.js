import { app, BrowserWindow, session, systemPreferences } from "electron";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
let sidecar = null;

function setupMediaPermissions() {
  const ses = session.defaultSession;

  ses.setPermissionCheckHandler((_webContents, permission) => {
    if (permission === "media" || permission === "microphone" || permission === "camera") {
      return true;
    }
    return false;
  });

  ses.setPermissionRequestHandler((_webContents, permission, callback) => {
    if (permission === "media" || permission === "microphone" || permission === "camera") {
      callback(true);
      return;
    }
    callback(false);
  });
}

async function ensureMacMicAccess() {
  if (process.platform !== "darwin") return;
  try {
    await systemPreferences.askForMediaAccess("microphone");
  } catch {
    // Ignore; frontend will still surface explicit getUserMedia errors.
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL("http://127.0.0.1:5173");
}

function startSidecar() {
  const beDir = path.resolve(__dirname, "../../BE");
  sidecar = spawn("python", ["-m", "uvicorn", "app.main:app", "--port", "8766"], {
    cwd: beDir,
    stdio: "ignore",
    windowsHide: true,
  });
}

function stopSidecar() {
  if (sidecar && !sidecar.killed) {
    sidecar.kill("SIGTERM");
    sidecar = null;
  }
}

app.whenReady().then(async () => {
  setupMediaPermissions();
  await ensureMacMicAccess();
  startSidecar();
  createWindow();
});

app.on("window-all-closed", () => {
  stopSidecar();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  stopSidecar();
});