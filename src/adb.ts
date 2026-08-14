import { execFile } from "child_process";
import { promisify } from "util";

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