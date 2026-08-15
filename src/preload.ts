import { contextBridge, ipcRenderer } from "electron";

// 렌더러(UI)에서 window.api.getDevices() 로 호출 가능하게 노출
contextBridge.exposeInMainWorld("api", {
  getDevices: () => ipcRenderer.invoke("get-devices"),
  screenshot: () => ipcRenderer.invoke("take-screenshot"),
  loadScenario: () => ipcRenderer.invoke("load-scenario"),
});