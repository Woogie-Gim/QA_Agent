import { execFile } from "child_process";
import { promisify } from "util";
import { writeFile } from "fs/promises";
import { setTimeout as sleep } from "timers/promises";

const run = promisify(execFile);

// adb 명령 실행 공통 래퍼
async function adb(args: string[]): Promise<string> {
  const { stdout } = await run("adb", args);
  return stdout;
}

// 연결된 기기 목록 반환. 세팅 확인용
export async function getDevices(): Promise<string[]> {
  const out = await adb(["devices"]);
  return out
    .split("\n")
    .slice(1) // 첫 줄은 "List of devices attached" 헤더라 제외
    .filter((line) => line.includes("\tdevice"))
    .map((line) => line.split("\t")[0]);
}

// 화면 캡처해서 PC에 png로 저장. exec-out은 파일 안 남기고 바로 받아서 빠름
export async function screenshot(savePath: string): Promise<string> {
  const { stdout } = await run("adb", ["exec-out", "screencap", "-p"], {
    encoding: "buffer", // png는 바이너리라 buffer로 받아야 함
    maxBuffer: 1024 * 1024 * 50, // 스크린샷 용량 대비 버퍼 넉넉히
  });
  await writeFile(savePath, stdout);
  return savePath;
}

// 기기가 하나라도 연결돼 있는지 확인. 액션 전 가드용
export async function hasDevice(): Promise<boolean> {
  const devices = await getDevices();
  return devices.length > 0;
}

// UI 요소 하나의 정보
export interface UIElement {
  label: string;
  center: [number, number];
}

// uiautomator로 현재 화면 UI 트리를 XML로 덤프
export async function dumpTree(): Promise<string> {
  await adb(["shell", "uiautomator", "dump", "/sdcard/ui.xml"]);
  return await adb(["shell", "cat", "/sdcard/ui.xml"]);
}

// XML에서 라벨 있는 요소만 뽑아 중심 좌표 계산
export function parseElements(xml: string): UIElement[] {
  const elements: UIElement[] = [];
  const nodeRegex = /<node[^>]*?(?:text|content-desc)="([^"]+)"[^>]*?bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/g;
  let m;
  while ((m = nodeRegex.exec(xml)) !== null) {
    const label = m[1].trim();
    if (!label) continue;
    const [x1, y1, x2, y2] = [m[2], m[3], m[4], m[5]].map(Number);
    elements.push({ label, center: [(x1 + x2) >> 1, (y1 + y2) >> 1] });
  }
  return elements;
}

// 지정 좌표 탭
export async function tap(x: number, y: number): Promise<void> {
  await adb(["shell", "input", "tap", String(x), String(y)]);
}

// 포커스된 입력창에 텍스트 입력
export async function inputText(text: string): Promise<void> {
  await adb(["shell", "input", "text", text.replace(/ /g, "%s")]);
}

// 초 단위 대기
export async function wait(seconds: number): Promise<void> {
  await sleep(seconds * 1000);
}