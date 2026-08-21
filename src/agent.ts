import { Scenario } from "./scenario";
import { judge } from "./vlm";
import { screenshot, hasDevice, tap, inputText, wait } from "./adb";
import * as path from "path";

export interface StepResult {
  step: number;
  name: string;
  verdict: "PASS" | "FAIL";
  reason: string;
  x?: number;          // VLM이 탭한 좌표
  y?: number;
  screenshot?: string; // 해당 스텝 스크린샷 경로
}

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
      if (!(await hasDevice())) {
        result = { step: i + 1, name: step.name, verdict: "FAIL", reason: "기기 연결 끊김" };
        results.push(result);
        onProgress(result);
        continue;
      }

      // 매 스텝 스크린샷 후 VLM에 좌표와 판정 요청
      const shot = path.join(reportsDir, `${scenario.name}_${i + 1}.png`);
      await screenshot(shot);
      const v = await judge(shot, step);

      if (!v.found) {
        // 대상 못 찾으면 FAIL, 다음 스텝 진행
        result = { step: i + 1, name: step.name, verdict: "FAIL", reason: v.reason };
      } else {
        // VLM이 준 좌표로 액션 실행
        if (step.actionType === "tap") {
          await tap(v.x, v.y);
        } else if (step.actionType === "input") {
          await tap(v.x, v.y);
          await inputText(step.text ?? "");
        }

        await wait(step.postDelay ?? 1.0);
        result = {
          step: i + 1, name: step.name,
          verdict: v.verdict, reason: v.reason,
          x: v.x, y: v.y, screenshot: shot,
        };
      }
    } catch (e) {
      result = { step: i + 1, name: step.name, verdict: "FAIL", reason: `예외: ${e}` };
    }

    results.push(result);
    onProgress(result);
  }

  return results;
}