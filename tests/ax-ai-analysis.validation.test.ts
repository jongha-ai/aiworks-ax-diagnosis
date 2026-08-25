import * as assert from "node:assert/strict";
import { test } from "node:test";
import handler from "../api/ax-ai-analysis.ts";

type MockResponse = {
  statusCode: number;
  body: any;
  status: (code: number) => MockResponse;
  json: (body: any) => MockResponse;
};

function createResponse(): MockResponse {
  return {
    statusCode: 200,
    body: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: any) {
      this.body = body;
      return this;
    },
  };
}

test("빈 진단 payload는 Gemini를 호출하지 않고 400 JSON 오류를 반환한다", async () => {
  const res = createResponse();

  await handler({ method: "POST", body: {} }, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error.code, "INVALID_DIAGNOSTIC_DATA");
});

test("필수 진단 문항이 누락된 payload는 400 JSON 오류를 반환한다", async () => {
  const res = createResponse();

  await handler({ method: "POST", body: { rawAnswers: { q4: 3 } } }, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error.code, "INVALID_DIAGNOSTIC_DATA");
  assert.ok(res.body.error.fields.includes("rawAnswers.q5"));
});

test("완전한 진단 payload는 데이터 검증을 통과한다", async () => {
  const res = createResponse();
  const rawAnswers = {
    q4: 2, q5: 3, q6: 4,
    q7: 3, q8: 4, q9: 2,
    q10: 1, q11: 2, q12: 3,
    q13: 5, q14: 4, q15: 3,
    q16: 2, q17: 4, q18: 5,
  };

  await handler({
    method: "POST",
    body: {
      companyName: "가상 검증 기업",
      role: "대표·임원",
      employeeCount: "10~19명",
      aiUsageLevel: "일부 업무에 사용한다",
      rawAnswers,
      scores: { totalRawScore: 47, totalScore: 63, level: { levelNumber: 3, title: "업무 적용 단계" } },
      categoryScores: { aiUsage: 60, workProcess: 60, knowledgeManagement: 40, automation: 80, verificationSecurity: 73 },
      risks: [],
      freeAnswers: { q19: "주간 보고서 작성", q20: "고객 문의 요약" },
    },
  }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.notEqual(res.body.error?.code, "INVALID_DIAGNOSTIC_DATA");
});
