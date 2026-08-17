import { Scenario } from "./scenario";
import { judge } from "./vlm";
import { screenshot, hasDevice, dumpTree, parseElements, tap, inputText, wait } from "./adb";
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
      if (!(await hasDevice())) {
        result = { step: i + 1, name: step.name, verdict: "FAIL", reason: "기기 연결 끊김" };
        results.push(result);
        onProgress(result);
        continue;
      }

      // 현재 화면 트리에서 대상 요소 탐색
      const elements = parseElements(await dumpTree());
      const target = elements.find((e) => e.label.includes(step.actionHint));

      if (!target) {
        // 요소 못 찾으면 FAIL, 다음 스텝 진행
        result = { step: i + 1, name: step.name, verdict: "FAIL", reason: `요소 '${step.actionHint}' 없음` };
      } else {
        // 액션 실행
        if (step.actionType === "tap") {
          await tap(...target.center);
        } else if (step.actionType === "input") {
          await tap(...target.center);
          await inputText(step.text ?? "");
        }

        // 게임 로딩 대기
        await wait(step.postDelay ?? 1.0);

        // verify 스텝만 VLM 판단, 나머지는 실행 성공으로 PASS
        if (step.verify) {
          const shot = path.join(reportsDir, `${scenario.name}_${i + 1}.png`);
          await screenshot(shot);
          const v = await judge(shot, step);
          result = { step: i + 1, name: step.name, verdict: v.verdict, reason: v.reason };
        } else {
          result = { step: i + 1, name: step.name, verdict: "PASS", reason: `'${step.actionHint}' 탭 완료` };
        }
      }
    } catch (e) {
      result = { step: i + 1, name: step.name, verdict: "FAIL", reason: `예외: ${e}` };
    }

    results.push(result);
    onProgress(result);
  }

  return results;
}