import { Step } from "./scenario";

// VLM 판단 결과. 좌표와 검증을 함께 반환
export interface Verdict {
  found: boolean;          // 대상 요소를 화면에서 찾았는지
  x: number;               // 탭할 좌표 (0~해상도)
  y: number;
  verdict: "PASS" | "FAIL";
  reason: string;
}

const USE_MOCK = true;

// 스크린샷과 스텝을 받아 대상 좌표와 판정 반환
export async function judge(shotPath: string, step: Step): Promise<Verdict> {
  if (USE_MOCK) {
    return mockJudge(step);
  }
  return realJudge(shotPath, step);
}

// 목: 화면 중앙 좌표를 반환하는 흉내. input 스텝만 FAIL로 완주 검증
function mockJudge(step: Step): Verdict {
  if (step.actionType === "input") {
    return { found: false, x: 0, y: 0, verdict: "FAIL", reason: `목: '${step.actionHint}' 대상 못 찾음(가정)` };
  }
  return { found: true, x: 540, y: 1200, verdict: "PASS", reason: `목: '${step.actionHint}' 대상 확인(가정)` };
}

// 8/25 이후 구현. Claude에 스크린샷 보내고 좌표+판정 JSON 받기
async function realJudge(shotPath: string, step: Step): Promise<Verdict> {
  throw new Error("API 미연동");
}