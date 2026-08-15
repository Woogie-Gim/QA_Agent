import { execFile } from "child_process";
import { promisify } from "util";
import { writeFile } from "fs/promises";

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