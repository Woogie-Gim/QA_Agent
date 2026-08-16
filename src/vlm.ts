import { Step } from "./scenario";

// 판단 결과 타입
export interface Verdict {
  verdict: "PASS" | "FAIL";
  reason: string;
}

const USE_MOCK = true; // API 결제 후 false로

// 스크린샷 + 스텝을 받아 Pass/Fail 판단. 지금은 목
export async function judge(shotPath: string, step: Step): Promise<Verdict> {
  if (USE_MOCK) {
    return mockJudge(step);
  }
  return realJudge(shotPath, step);
}

// 목: 스텝 순서로 대충 판단 흉내. input 스텝 하나만 일부러 FAIL 내서 "끝까지 진행" 검증
function mockJudge(step: Step): Verdict {
  if (step.actionType === "input") {
    return { verdict: "FAIL", reason: `목: '${step.actionHint}' 입력 요소 못 찾음(가정)` };
  }
  return { verdict: "PASS", reason: `목: '${step.actionHint}' 정상 확인(가정)` };
}

// 8/25 이후 구현. Claude API 호출 자리
async function realJudge(shotPath: string, step: Step): Promise<Verdict> {
  throw new Error("API 미연동");
}