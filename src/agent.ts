import { Scenario } from "./scenario";
import { judge } from "./vlm";
import { screenshot, hasDevice } from "./adb";
import * as path from "path";

// 스텝 하나의 실행 결과
export interface StepResult {
  step: number;
  name: string;
  verdict: "PASS" | "FAIL";
  reason: string;
}

// 시나리오를 스텝별로 실행. onProgress로 진행 상황을 UI에 흘려보냄
export async function runScenario(
  scenario: Scenario,
  reportsDir: string,
  onProgress: (r: StepResult) => void
): Promise<StepResult[]> {
  const results: StepResult[] = [];

  for (let i = 0; i < scenario.steps.length; i++) {
    const step = scenario.steps[i];
    let result: StepResult;

    try {
      // 기기 끊기면 이 스텝만 FAIL 처리하고 계속
      if (!(await hasDevice())) {
        result = { step: i + 1, name: step.name, verdict: "FAIL", reason: "기기 연결 끊김" };
      } else {
        const shot = path.join(reportsDir, `${scenario.name}_${i + 1}.png`);
        await screenshot(shot);
        const v = await judge(shot, step); // 판단 (목)
        result = { step: i + 1, name: step.name, verdict: v.verdict, reason: v.reason };
      }
    } catch (e) {
      // 예외도 FAIL로 기록하고 루프 안 죽임
      result = { step: i + 1, name: step.name, verdict: "FAIL", reason: `예외: ${e}` };
    }

    results.push(result);
    onProgress(result); // UI에 실시간 반영
  }

  return results;
}