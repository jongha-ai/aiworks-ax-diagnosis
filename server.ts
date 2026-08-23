import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Ensure local persistence directory exists
const DATA_DIR = path.join(process.cwd(), "data", "diagnostics");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// API health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Helper: Format diagnosis summary for email / text
function generateTextSummary(data: any): string {
  const comp = data.companyName || "미지정 기업";
  const evalName = data.evaluatorName || "담당자";
  const email = data.targetEmail || data.evaluatorEmail || "미입력";
  const levelNum = data.level?.levelNumber || 1;
  const levelTitle = data.level?.title || "초기단계";
  const totalScore = data.totalScore || 0;
  const totalRaw = data.totalRawScore || 0;
  const savedAt = data.savedAt || new Date().toLocaleString("ko-KR");

  return `========================================
[AIWORKS 기업 AX 간이진단 v0.1 결과 요약]
========================================
■ 진단 일시: ${savedAt}
■ 회사명: ${comp}
■ 평가자: ${evalName} (${data.evaluatorRole || "미지정"})
■ 이메일: ${email}
■ 규모/활용수준: ${data.employeeCount || "미지정"} / ${data.currentAiUsage || "미지정"}

----------------------------------------
[종합 진단 결과]
----------------------------------------
■ 성숙도 레벨: Level ${levelNum}. ${levelTitle}
■ 종합 점수: ${totalScore}점 / 100점 (원점수 ${totalRaw}/75점)
■ 핵심 강점 영역: ${data.strongestDomain?.title || "-"} (${data.strongestDomain?.convertedScore || 0}점)
■ 최대 병목 영역: ${data.bottleneckDomain?.title || "-"} (${data.bottleneckDomain?.convertedScore || 0}점)

----------------------------------------
[5대 영역별 점수 (각 100점 만점)]
----------------------------------------
1. AI 활용: ${data.categoryScores?.aiUsage?.convertedScore || 0}점 (${data.categoryScores?.aiUsage?.statusLabel || "-"})
2. 업무 프로세스: ${data.categoryScores?.workProcess?.convertedScore || 0}점 (${data.categoryScores?.workProcess?.statusLabel || "-"})
3. 자료·지식관리: ${data.categoryScores?.knowledgeManagement?.convertedScore || 0}점 (${data.categoryScores?.knowledgeManagement?.statusLabel || "-"})
4. 반복업무·자동화: ${data.categoryScores?.automation?.convertedScore || 0}점 (${data.categoryScores?.automation?.statusLabel || "-"})
5. 검증·보안: ${data.categoryScores?.verificationSecurity?.convertedScore || 0}점 (${data.categoryScores?.verificationSecurity?.statusLabel || "-"})

----------------------------------------
[감지된 핵심 위험 신호]
----------------------------------------
${data.triggeredRisks && data.triggeredRisks.length > 0
  ? data.triggeredRisks.map((r: any, idx: number) => `${idx + 1}. [${r.title}] ${r.description}\n   -> 조치방안: ${r.actionGuideline}`).join("\n")
  : "특이 위험 신호 없음"}

----------------------------------------
[3대 우선 추진 AX 과제]
----------------------------------------
[1순위] ${data.priorityTasks?.task1?.title || "-"} (${data.priorityTasks?.task1?.urgency || "즉시실행"})
- 추진 배경: ${data.priorityTasks?.task1?.why || "-"}
- 실행 방안: ${data.priorityTasks?.task1?.actionPlan || "-"}
- 기대 효과: ${data.priorityTasks?.task1?.expectedOutcome || "-"}

[2순위] ${data.priorityTasks?.task2?.title || "-"} (${data.priorityTasks?.task2?.urgency || "단기추진"})
- 추진 배경: ${data.priorityTasks?.task2?.why || "-"}
- 실행 방안: ${data.priorityTasks?.task2?.actionPlan || "-"}

[3순위] ${data.priorityTasks?.task3?.title || "-"} (${data.priorityTasks?.task3?.urgency || "중기과제"})
- 추진 배경: ${data.priorityTasks?.task3?.why || "-"}
- 실행 방안: ${data.priorityTasks?.task3?.actionPlan || "-"}

----------------------------------------
[현업 자유 응답]
----------------------------------------
- 가장 줄이고 싶은 반복업무 (Q19): ${data.freeAnswers?.q19_timeWaster || "미입력"}
- AI로 가장 먼저 개선하고 싶은 업무 (Q20): ${data.freeAnswers?.q20_topPriority || "미입력"}
${data.consultantInterview ? `
----------------------------------------
[10분 컨설턴트 인터뷰 내용]
----------------------------------------
- 병목 단계: ${data.consultantInterview.q1_timeConsumingPart || "미기재"}
- 현재 담당자: ${data.consultantInterview.q2_currentOperator || "미기재"}
- 대체 가능 여부: ${data.consultantInterview.q3_substituteFeasible || "미기재"}
- AI 애로사항: ${data.consultantInterview.q4_aiFrustration || "미기재"}
- 기대 효과: ${(data.consultantInterview.q5_expectedEffects || []).join(", ") || "미기재"}
- 컨설턴트 메모: ${data.consultantInterview.consultantMemo || "없음"}
` : ""}
========================================
AIWORKS Enterprise AX Diagnostic System v0.1
`;
}

// 1. Sync / Save Diagnosis Result to Local DB & Google Sheets Webhook
app.post("/api/sync-result", async (req, res) => {
  try {
    const payload = req.body;
    const {
      result,
      targetEmail,
      webhookUrl: clientWebhookUrl,
    } = payload;

    if (!result) {
      return res.status(400).json({ success: false, error: "Result data is required" });
    }

    const recordId = result.id || `diag_${Date.now()}`;
    const timestamp = new Date().toISOString();
    const fullData = {
      ...result,
      id: recordId,
      targetEmail: targetEmail || result.targetEmail || "",
      syncedAt: timestamp,
    };

    // 1) Local file storage (Permanent backup in data/diagnostics/)
    const filePath = path.join(DATA_DIR, `${recordId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(fullData, null, 2), "utf-8");

    // Also update all_records.json index
    const allRecordsPath = path.join(DATA_DIR, "all_records.json");
    let allRecords: any[] = [];
    if (fs.existsSync(allRecordsPath)) {
      try {
        allRecords = JSON.parse(fs.readFileSync(allRecordsPath, "utf-8"));
      } catch (e) {
        allRecords = [];
      }
    }
    allRecords = [fullData, ...allRecords.filter((r) => r.id !== recordId)];
    fs.writeFileSync(allRecordsPath, JSON.stringify(allRecords, null, 2), "utf-8");

    // Append to CSV summary
    const csvPath = path.join(DATA_DIR, "summary.csv");
    const csvHeader = "ID,Timestamp,CompanyName,EvaluatorName,Email,Level,TotalScore,AIUsage,WorkProcess,Knowledge,Automation,Security,Bottleneck,Q19_TimeWaster,Q20_Priority\n";
    const escapeCsv = (str: any) => `"${String(str || "").replace(/"/g, '""')}"`;
    const csvRow = [
      escapeCsv(recordId),
      escapeCsv(fullData.savedAt || timestamp),
      escapeCsv(fullData.companyName),
      escapeCsv(fullData.evaluatorName),
      escapeCsv(fullData.targetEmail),
      escapeCsv(fullData.level?.levelNumber),
      escapeCsv(fullData.totalScore),
      escapeCsv(fullData.categoryScores?.aiUsage?.convertedScore),
      escapeCsv(fullData.categoryScores?.workProcess?.convertedScore),
      escapeCsv(fullData.categoryScores?.knowledgeManagement?.convertedScore),
      escapeCsv(fullData.categoryScores?.automation?.convertedScore),
      escapeCsv(fullData.categoryScores?.verificationSecurity?.convertedScore),
      escapeCsv(fullData.bottleneckDomain?.title),
      escapeCsv(fullData.freeAnswers?.q19_timeWaster),
      escapeCsv(fullData.freeAnswers?.q20_topPriority),
    ].join(",") + "\n";

    if (!fs.existsSync(csvPath)) {
      fs.writeFileSync(csvPath, "\uFEFF" + csvHeader + csvRow, "utf-8"); // UTF-8 BOM for Excel
    } else {
      fs.appendFileSync(csvPath, csvRow, "utf-8");
    }

    // 2) Google Sheets & Drive Webhook forwarder
    const activeWebhookUrl = clientWebhookUrl || process.env.GOOGLE_SHEET_WEBHOOK_URL;
    let sheetsSyncSuccess = false;
    let sheetsSyncMessage = "";

    const textSummary = generateTextSummary(fullData);

    if (activeWebhookUrl) {
      try {
        const webhookPayload = {
          eventType: "ax_diagnosis_submitted",
          id: recordId,
          timestamp: fullData.savedAt || timestamp,
          companyName: fullData.companyName,
          evaluatorName: fullData.evaluatorName,
          evaluatorRole: fullData.evaluatorRole,
          targetEmail: fullData.targetEmail,
          employeeCount: fullData.employeeCount,
          currentAiUsage: fullData.currentAiUsage,
          levelNumber: fullData.level?.levelNumber,
          levelTitle: fullData.level?.title,
          totalScore: fullData.totalScore,
          totalRawScore: fullData.totalRawScore,
          score_aiUsage: fullData.categoryScores?.aiUsage?.convertedScore,
          score_workProcess: fullData.categoryScores?.workProcess?.convertedScore,
          score_knowledge: fullData.categoryScores?.knowledgeManagement?.convertedScore,
          score_automation: fullData.categoryScores?.automation?.convertedScore,
          score_security: fullData.categoryScores?.verificationSecurity?.convertedScore,
          strongestDomain: fullData.strongestDomain?.title,
          bottleneckDomain: fullData.bottleneckDomain?.title,
          task1_title: fullData.priorityTasks?.task1?.title,
          task2_title: fullData.priorityTasks?.task2?.title,
          task3_title: fullData.priorityTasks?.task3?.title,
          q19_timeWaster: fullData.freeAnswers?.q19_timeWaster,
          q20_topPriority: fullData.freeAnswers?.q20_topPriority,
          triggeredRisks: (fullData.triggeredRisks || []).map((r: any) => r.title).join(", "),
          consultantInterview: fullData.consultantInterview || null,
          textSummary: textSummary,
          fullJsonData: JSON.stringify(fullData),
        };

        const sheetRes = await fetch(activeWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(webhookPayload),
        });

        if (sheetRes.ok) {
          sheetsSyncSuccess = true;
          sheetsSyncMessage = "구글 스프레드시트 및 구글 드라이브에 안전하게 자동 저장되었습니다.";
        } else {
          sheetsSyncMessage = `Webhook 응답 코드: ${sheetRes.status}`;
        }
      } catch (webhookErr: any) {
        console.warn("Webhook forward failed:", webhookErr?.message || webhookErr);
        sheetsSyncMessage = `Webhook 전송 오류: ${webhookErr?.message}`;
      }
    }

    return res.json({
      success: true,
      recordId,
      savedLocally: true,
      syncedToSheets: sheetsSyncSuccess,
      sheetsMessage: sheetsSyncMessage,
      summaryText: textSummary,
      timestamp,
    });
  } catch (err: any) {
    console.error("Error in /api/sync-result:", err);
    return res.status(500).json({ success: false, error: err?.message || "Internal server error" });
  }
});

// 2. Test Webhook Connection
app.post("/api/test-webhook", async (req, res) => {
  const { webhookUrl } = req.body;
  if (!webhookUrl) {
    return res.status(400).json({ success: false, error: "Webhook URL is required" });
  }

  try {
    const testPayload = {
      eventType: "test_connection",
      timestamp: new Date().toISOString(),
      companyName: "AIWORKS 테스트 기업",
      evaluatorName: "시스템 관리자",
      totalScore: 85,
      levelTitle: "Level 4. 시스템 내재화",
      textSummary: "[AIWORKS] 구글 시트 및 구글 드라이브 웹훅 연동 테스트 성공",
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testPayload),
    });

    if (response.ok) {
      return res.json({ success: true, message: "Webhook 연동 테스트 성공! 구글 시트와 드라이브를 확인하세요." });
    } else {
      return res.status(400).json({ success: false, message: `Webhook 응답 코드: ${response.status}` });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Webhook 요청 실패" });
  }
});

// 3. Get All Saved Diagnostic Records
app.get("/api/records", (_req, res) => {
  try {
    const allRecordsPath = path.join(DATA_DIR, "all_records.json");
    if (fs.existsSync(allRecordsPath)) {
      const data = JSON.parse(fs.readFileSync(allRecordsPath, "utf-8"));
      return res.json({ success: true, records: data, count: data.length });
    }
    return res.json({ success: true, records: [], count: 0 });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message });
  }
});

// Gemini AI AX deep analysis endpoint with multi-model fallback & intelligent synthesis
app.post("/api/ax-ai-analysis", async (req, res) => {
  const { companyName, role, employeeCount, aiUsageLevel, scores, categoryScores, risks, freeAnswers, consultantInterview } = req.body;

  const apiKey = process.env.GEMINI_API_KEY;

  const prompt = `
당신은 대한민국 최고 수준의 기업 AX(인공지능 전환) 및 업무 생산성 전문 컨설턴트입니다.
다음은 'AIWORKS 기업 AX 간이진단 v0.1'을 수행한 기업의 진단 결과 데이터입니다.

[진단 기본정보]
- 회사명: ${companyName || "미입력"}
- 응답자 역할: ${role || "미지정"}
- 기업 규모(직원수): ${employeeCount || "미지정"}
- 현재 AI 활용 수준: ${aiUsageLevel || "미지정"}
- 종합 점수: ${scores?.totalScore || 0}점 / 100점 (Level ${scores?.level?.levelNumber || 1}: ${scores?.level?.title || "초기단계"})

[영역별 점수 (각 100점 만점)]
1. AI 활용: ${categoryScores?.aiUsage || 0}점
2. 업무 프로세스: ${categoryScores?.workProcess || 0}점
3. 자료·지식관리: ${categoryScores?.knowledgeManagement || 0}점
4. 반복업무·자동화: ${categoryScores?.automation || 0}점
5. 검증·보안: ${categoryScores?.verificationSecurity || 0}점

[감지된 위험 신호]
${risks && risks.length > 0 ? risks.map((r: any) => `- [${r.title}] ${r.description}`).join("\n") : "특이 위험 신호 없음"}

[자유 응답]
- 가장 시간을 줄이고 싶은 반복업무 (Q19): ${freeAnswers?.q19 || "없음"}
- AI로 가장 먼저 개선하고 싶은 업무 (Q20): ${freeAnswers?.q20 || "없음"}

${consultantInterview ? `
[컨설턴트 인터뷰 내용]
- 병목 단계 (질문 1): ${consultantInterview.q1 || "미기재"}
- 현재 담당자 (질문 2): ${consultantInterview.q2 || "미기재"}
- 대체 가능 여부 (질문 3): ${consultantInterview.q3 || "미기재"}
- 현재 AI 애로사항 (질문 4): ${consultantInterview.q4 || "미기재"}
- 기대 효과 (질문 5): ${consultantInterview.expectedEffects?.join(", ") || "미기재"}
` : ""}

[작성 지침 - 절대 준수 규칙]
1. 긴 줄글 및 3단계 중첩 불릿(• • •) 생성을 엄격히 금지합니다.
2. 가독성을 극대화하기 위해 반드시 아래 마크다운 템플릿 구조와 표(Markdown Table), 인용구(>) 형식을 100% 엄수하여 작성하세요.
3. 대상 기업(${companyName || "귀사"})의 실제 진단 점수와 취약 영역, Q19/Q20 자유응답 내용을 바탕으로 매우 구체적이고 실전적인 처방을 제시하세요.

### [반드시 출력할 마크다운 포맷]

### 1. 경영진 총평 (Executive Summary)
- **현 상태 강점:** (진단 점수 및 현재 조직의 긍정적 측면 1줄 핵심 요약)
- **핵심 병목/위험:** (최하위 점수 영역 및 감지된 위험 신호 1줄 핵심 요약)
- **AX 전환 한줄 제언:** **(조직의 성숙도 레벨에 맞춘 명확하고 실천적인 방향성 1줄 제시)**

### 2. 최우선 해결 과제 (Immediate Quick-Win)
| 구분 | 내용 |
| :--- | :--- |
| **대상 업무** | (Q19/Q20 또는 인터뷰에 기반한 즉각 개선 대상 업무명) |
| **추천 AI 도구** | (ChatGPT Team, Claude 3.7, Gemini Advanced, Notion AI 등 추천 도구) |
| **기대 효과** | 소요 시간 XX% 단축 (주당 X시간 절감 및 휴먼에러 제거) |

> 💡 **실전 프롬프트 템플릿**
> \`[역할]: (구체적 전문가 페르소나)\`
> \`[입력]: (원본 자료/양식/데이터)\`
> \`[요청]: 1) 핵심 3줄 요약  2) 표준 문서 포맷 초안 생성  3) 검수 체크리스트 작성\`

### 3. 단계별 3단계 AX 실행 로드맵 (Roadmap Table)
| 단계 (일정) | 핵심 목표 | 실행 과제 (Action Items) | 도입/활용 도구 | 보안 및 주의사항 |
| :--- | :--- | :--- | :--- | :--- |
| **1단계: 기반 구축**<br>(1~2주차) | (표준 가이드라인 및 지식 기반 마련) | • (실행 과제 1)<br>• (실행 과제 2) | (추천 툴 1, 2) | (개인정보/기밀 마스킹 등 보안 수칙) |
| **2단계: 자동화 연계**<br>(1~2개월차) | (반복업무 자동화 파이프라인 확장) | • (실행 과제 1)<br>• (실행 과제 2) | (추천 툴 1, 2) | (중앙 지식베이스 동기화 등) |
| **3단계: 전사 확산**<br>(3개월차 이후) | (데이터 보안 강화 및 AI 문화 내재화) | • (실행 과제 1)<br>• (실행 과제 2) | (전사 엔터프라이즈 솔루션) | (비인가 툴 통제 및 권한 관리) |
`;

  // Candidate models to try in sequence for resilience against 503 / rate limit spikes
  const candidateModels = ["gemini-2.5-flash", "gemini-3.7-flash", "gemini-flash-latest"];

  if (apiKey) {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    for (const modelName of candidateModels) {
      try {
        console.log(`Attempting AI prescription with model: ${modelName}`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            temperature: 0.6,
          },
        });

        if (response.text && response.text.trim().length > 0) {
          return res.json({
            success: true,
            analysis: response.text,
            model: modelName,
            isAiGenerated: true,
          });
        }
      } catch (err: any) {
        console.warn(`Model ${modelName} call failed with error:`, err?.message || err);
        // Continue to the next fallback model in candidateModels
      }
    }
  }

  // Fallback: If AI API experiences temporary high demand / 503 or API key unavailable,
  // provide an instant, domain-expert rule-based tailored prescription report
  const levelNum = scores?.level?.levelNumber || 1;
  const levelTitle = scores?.level?.title || "탐색 및 시도 단계";
  const totalScore = scores?.totalScore || 0;
  const company = companyName || "귀사";
  const timeWaster = freeAnswers?.q19 || "자료 수집 및 반복 보고서 작성";
  const topPriority = freeAnswers?.q20 || "실무 문서 작성 및 요약 자동화";

  const fallbackReport = `### 1. 경영진 총평 (Executive Summary)
- **현 상태 강점:** ${company}의 종합 점수는 **${totalScore}점 (Level ${levelNum}. ${levelTitle})**으로, 실무 차원의 AI 도구 관심도 및 부분적 시도 의지가 활성화되어 있습니다.
- **핵심 병목/위험:** 표준화된 프롬프트 체계 및 전사 데이터 보안 가이드라인 부재로 인해 단일 담당자 의존도와 수작업 병목이 잔존합니다.
- **AX 전환 한줄 제언:** **현업의 빈도 높은 1개 핵심 반복업무를 표준 템플릿화하여 조기 성공(Quick-Win)을 체험하고, 전사 공유 지식 기반으로 신속히 확장하십시오.**

### 2. 최우선 해결 과제 (Immediate Quick-Win)
| 구분 | 내용 |
| :--- | :--- |
| **대상 업무** | ${timeWaster} 및 ${topPriority} |
| **추천 AI 도구** | ChatGPT Team / Claude 3.7 Sonnet / Notion AI |
| **기대 효과** | 수작업 소요 시간 70% 단축 (주당 4~6시간 이상 절감) |

> 💡 **실전 프롬프트 템플릿**
> \`[역할]: 10년 차 B2B 실무 비즈니스 문서 및 자동화 에디터\`
> \`[입력]: 당사 회의록 원본 또는 정형 업무 기초 데이터\`
> \`[요청]: 1) 핵심 실행과제 3줄 요약  2) 고객 보고용 표준 포맷 초안 생성  3) 리스크 검수 체크리스트 표 작성\`

### 3. 단계별 3단계 AX 실행 로드맵 (Roadmap Table)
| 단계 (일정) | 핵심 목표 | 실행 과제 (Action Items) | 도입/활용 도구 | 보안 및 주의사항 |
| :--- | :--- | :--- | :--- | :--- |
| **1단계: 기반 구축**<br>(1~2주차) | 표준 가이드라인 및 지식 기반 마련 | • 전사 AI 활용 3대 원칙 수립<br>• 업무별 프롬프트 노션 템플릿화 | Notion, ChatGPT Team | 개인/기업 민감정보 마스킹 원칙 공지 |
| **2단계: 자동화 연계**<br>(1~2개월차) | 반복업무 자동화 파이프라인 확장 | • ${timeWaster} 1차 초안 자동화<br>• 고객 문의/데이터 정제 연동 | Claude, Make/Zapier | 중앙 지식 베이스(Drive/Notion) 동기화 |
| **3단계: 전사 확산**<br>(3개월차 이후) | 데이터 보안 강화 및 AI 문화 내재화 | • 부서별 AX 시간 절감 성과 공유회<br>• 전사 AI 유료 툴 계정 통합 관리 | Enterprise AI Solution | 비인가 AI 툴 사용 제한 및 접근 권한 통제 |`;

  return res.json({
    success: true,
    analysis: fallbackReport,
    model: "aiworks-expert-ruleset-v1",
    isAiGenerated: false,
    note: "AI 서비스 서버의 일시적 트래픽 급증(503)에 대비하여 AIWORKS 전문 진단 처방 룰셋 기반으로 즉시 분석 리포트가 생성되었습니다.",
  });
});

// Vite middleware / static serve
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
