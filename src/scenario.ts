import { readFile } from "fs/promises";

// 시나리오 스텝 하나의 타입
export interface Step {
  name: string;
  actionHint: string;
  actionType: "tap" | "input" | "none";
  text?: string;
  expect: string;
}

// 시나리오 전체 타입
export interface Scenario {
  name: string;
  steps: Step[];
}

// JSON 파일 읽어서 Scenario로 파싱
export async function loadScenario(path: string): Promise<Scenario> {
  const raw = await readFile(path, "utf-8");
  return JSON.parse(raw) as Scenario;
}