import { Step } from "./scenario";
import Anthropic from "@anthropic-ai/sdk";
import { readFile } from "fs/promises";

// VLM 판단 결과. 좌표와 검증을 함께 반환
export interface Verdict {
  found: boolean;
  x: number;
  y: number;
  verdict: "PASS" | "FAIL";
  reason: string;
}

const USE_MOCK = true; // API 결제 후 false로

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

// 실제 Claude 호출. USE_MOCK을 false로 바꾸면 활성화
async function realJudge(shotPath: string, step: Step): Promise<Verdict> {
  const client = new Anthropic(); // API 키는 환경변수 ANTHROPIC_API_KEY

  const imageData = await readFile(shotPath, { encoding: "base64" });
  const userText = `현재 스텝:
- 대상 요소(actionHint): ${step.actionHint}
- 동작 종류(actionType): ${step.actionType}
- 기대 상태(expect): ${step.expect}

이 화면에서 대상 요소의 좌표와 판정을 반환하라.`;

  const resp = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: "image/png", data: imageData } },
        { type: "text", text: userText },
      ],
    }],
  });

  const text = resp.content.find((b) => b.type === "text")?.text ?? "";
  const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
  return JSON.parse(clean) as Verdict;
}

const SYSTEM_PROMPT = `너는 모바일 게임 QA 자동화 에이전트다.
스크린샷과 현재 테스트 스텝 정보를 받아 두 가지를 판단한다.
1. 스텝의 대상 요소(actionHint)가 화면에 존재하는지와 그 중심 좌표(픽셀)
2. 현재 화면이 스텝의 기대 상태(expect)와 일치하는지

반드시 아래 JSON 형식으로만 응답한다. 다른 텍스트는 절대 포함하지 않는다.
{"found": true, "x": 540, "y": 1200, "verdict": "PASS", "reason": "판단 근거"}

found가 false면 x와 y는 0으로 한다.
좌표는 이미지 좌상단이 (0,0)인 픽셀 기준이다.`;