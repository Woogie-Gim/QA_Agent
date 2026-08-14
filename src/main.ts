import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import { getDevices } from "./adb";

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"), // 컴파일되면 .js
    },
  });
  win.loadFile(path.join(__dirname, "../renderer/index.html"));
}

// UI가 "get-devices" 요청하면 ADB 실행해서 결과 반환
ipcMain.handle("get-devices", async () => {
  return await getDevices();
});

app.whenReady().then(createWindow);

// 모든 창 닫히면 앱 종료 (mac 제외 관례)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});