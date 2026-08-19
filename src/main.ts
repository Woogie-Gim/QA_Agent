import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { getDevices, screenshot, hasDevice, dumpTree, parseElements } from "./adb";
import { loadScenario } from "./scenario";
import { runScenario } from "./agent";
import { writeReport } from "./report";
import { mkdir } from "fs/promises";
import * as path from "path";

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

// 스크린샷 찍어서 reports 폴더에 저장
ipcMain.handle("take-screenshot", async () => {
  // 기기 없으면 에러 대신 상태 객체 반환. UI가 판단하게
  if (!(await hasDevice())) {
    return { ok: false, message: "연결된 기기가 없습니다." };
  }
  const savePath = path.join(__dirname, "../reports", `shot_${Date.now()}.png`);
  const saved = await screenshot(savePath);
  return { ok: true, path: saved };
});
// 파일 선택창 열어서 시나리오 JSON 불러오기
ipcMain.handle("load-scenario", async () => {
  const result = await dialog.showOpenDialog({
    defaultPath: path.join(__dirname, "../scenarios"), // scenarios 폴더에서 시작
    properties: ["openFile"],
    filters: [{ name: "JSON", extensions: ["json"] }],
  });
  if (result.canceled) return null;
  return await loadScenario(result.filePaths[0]);
});

ipcMain.handle("run-scenario", async (event, scenario) => {
  const reportsDir = path.join(__dirname, "../reports");
  // onProgress를 렌더러로 전송. 스텝마다 이벤트 쏨
  const results = await runScenario(scenario, reportsDir, (r) => {
    event.sender.send("step-progress", r);
  });

  // 실행 끝나면 엑셀 리포트 저장
  await mkdir(reportsDir, { recursive: true }); // 폴더 없으면 생성
  const reportPath = path.join(reportsDir, `${scenario.name}_${Date.now()}.xlsx`);
  const summary = await writeReport(results, scenario.name, reportPath);

  return { results, report: summary };
});

// 현재 화면의 요소 목록 반환. actionHint 맞추기와 트리 검증용
ipcMain.handle("inspect-tree", async () => {
  if (!(await hasDevice())) {
    return { ok: false, message: "연결된 기기가 없습니다." };
  }
  const elements = parseElements(await dumpTree());
  return { ok: true, elements };
});

app.whenReady().then(createWindow);

// 모든 창 닫히면 앱 종료 (mac 제외 관례)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});