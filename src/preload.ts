import { contextBridge, ipcRenderer } from "electron";
import { Scenario } from "./scenario";
import { StepResult } from "./agent";

// 렌더러(UI)에서 window.api.getDevices() 로 호출 가능하게 노출
contextBridge.exposeInMainWorld("api", {
  getDevices: () => ipcRenderer.invoke("get-devices"),
  screenshot: () => ipcRenderer.invoke("take-screenshot"),
  loadScenario: () => ipcRenderer.invoke("load-scenario"),
  runScenario: (scenario: Scenario) => ipcRenderer.invoke("run-scenario", scenario),
  // 진행 상황 실시간 수신
  onStepProgress: (cb: (r: StepResult) => void) =>
    ipcRenderer.on("step-progress", (_e, r) => cb(r)),
});