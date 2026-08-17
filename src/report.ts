import ExcelJS from "exceljs";
import { StepResult } from "./agent";

// 실행 결과를 스타일 적용한 xlsx로 저장
export async function writeReport(
  results: StepResult[],
  scenarioName: string,
  savePath: string
): Promise<{ path: string; total: number; pass: number; fail: number }> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("QA 리포트");

  // 헤더 정의
  ws.columns = [
    { header: "스텝", key: "step", width: 8 },
    { header: "스텝명", key: "name", width: 24 },
    { header: "판정", key: "verdict", width: 10 },
    { header: "근거", key: "reason", width: 40 },
  ];

  // 헤더 행 스타일
  const headerRow = ws.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF305496" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });

  // 데이터 행 추가 및 판정 색칠
  for (const r of results) {
    const row = ws.addRow(r);
    const verdictCell = row.getCell("verdict");
    const isPass = r.verdict === "PASS";
    verdictCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: isPass ? "FFC6EFCE" : "FFFFC7CE" },
    };
    verdictCell.font = { bold: true };
    verdictCell.alignment = { horizontal: "center" };
  }

  // 요약 계산
  const total = results.length;
  const pass = results.filter((r) => r.verdict === "PASS").length;
  const fail = total - pass;

  // 요약 행
  ws.addRow({});
  ws.addRow({ step: "", name: "요약", verdict: "", reason: `전체 ${total} / PASS ${pass} / FAIL ${fail}` });

  ws.views = [{ state: "frozen", ySplit: 1 }];

  await wb.xlsx.writeFile(savePath);
  return { path: savePath, total, pass, fail };
}