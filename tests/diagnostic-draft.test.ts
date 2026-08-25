import * as assert from "node:assert/strict";
import { test } from "node:test";
import {
  createDiagnosticDraft,
  restoreDiagnosticDraft,
} from "../src/utils/diagnosticDraft.ts";
import { calculateDiagnosticResult } from "../src/utils/axCalculator.ts";

function createHistoryItem(id: string, rawAnswers: Record<string, any> = {}) {
  return {
    id,
    companyName: "가상 검증 기업",
    evaluatorName: "가상 작성자",
    rawAnswers,
  };
}

test("작성 중 10개 응답 draft는 새로고침 뒤에도 같은 session ID와 응답으로 복원된다", () => {
  const draft = createDiagnosticDraft("diagnosis-a");
  draft.answers = Object.fromEntries(Array.from({ length: 10 }, (_, index) => [`q${index + 1}`, `응답-${index + 1}`]));

  const restored = restoreDiagnosticDraft(JSON.stringify(draft), []);

  assert.deepEqual(restored, draft);
  assert.equal(Object.keys(restored?.answers || {}).length, 10);
});

test("새 진단 draft는 고유 ID와 0/20 빈 응답 상태로 시작한다", () => {
  const first = createDiagnosticDraft("diagnosis-a");
  const second = createDiagnosticDraft("diagnosis-b");

  assert.equal(Object.keys(second.answers).length, 0);
  assert.notEqual(first.diagnosisId, second.diagnosisId);
});

test("완료 이력과 같은 session ID의 draft는 다시 복원하지 않는다", () => {
  const completedDraft = createDiagnosticDraft("diagnosis-a");
  completedDraft.answers = { q1: "대표·임원", q2: "2~5명" };

  const restored = restoreDiagnosticDraft(
    JSON.stringify(completedDraft),
    [createHistoryItem("diagnosis-a", completedDraft.answers)]
  );

  assert.equal(restored, null);
});

test("직원 A의 완료 이력이 있어도 직원 B의 별도 draft는 보존된다", () => {
  const employeeADraft = createDiagnosticDraft("diagnosis-a");
  const employeeBDraft = createDiagnosticDraft("diagnosis-b");
  employeeBDraft.answers = { q1: "팀장" };

  const restoredB = restoreDiagnosticDraft(
    JSON.stringify(employeeBDraft),
    [createHistoryItem("diagnosis-a", employeeADraft.answers)]
  );

  assert.equal(restoredB?.diagnosisId, "diagnosis-b");
  assert.deepEqual(restoredB?.answers, { q1: "팀장" });
});

test("직원 A와 직원 B 완료 결과는 서로 다른 session ID로 이력에 함께 보존된다", () => {
  const employeeA = calculateDiagnosticResult({}, "직원 A 기업", "직원 A", "diagnosis-a");
  const employeeB = calculateDiagnosticResult({}, "직원 B 기업", "직원 B", "diagnosis-b");
  const history = [employeeB, ...[employeeA].filter((item) => item.id !== employeeB.id)];

  assert.equal(history.length, 2);
  assert.deepEqual(history.map((item) => item.id), ["diagnosis-b", "diagnosis-a"]);
  assert.deepEqual(history.map((item) => item.companyName), ["직원 B 기업", "직원 A 기업"]);
});
