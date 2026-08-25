import { GoogleGenAI } from "@google/genai";

// Vercel Serverless Function: /api/ax-ai-analysis
// Express 서버(server.ts)와 동일한 Gemini 프롬프트·fallback 로직.
// Vercel 정적 배포에서는 dist/server.cjs가 실행되지 않으므로 이 파일이 API를 담당한다.
// (req/res 타입은 any로 받아 @vercel/node 개발 의존성 없이 동작)

const candidateModels = ["gemini-2.5-flash", "gemini-3.7-flash", "gemini-flash-latest"];

const REQUIRED_SCORE_QUESTION_IDS = Array.from({ length: 15 }, (_, index) => `q${index + 4}`);
const REQUIRED_CATEGORY_SCORE_KEYS = [
  "aiUsage",
  "workProcess",
  "knowledgeManagement",
  "automation",
  "verificationSecurity",
] as const;

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateDiagnosticData(payload: unknown): string[] {
  if (!isRecord(payload)) {
    return ["요청 본문"];
  }

  const errors: string[] = [];
  const rawAnswers = payload.rawAnswers;
  if (!isRecord(rawAnswers)) {
    return ["rawAnswers"];
  }

  const answerValues = REQUIRED_SCORE_QUESTION_IDS.map((qid) => Number(rawAnswers[qid]));
  REQUIRED_SCORE_QUESTION_IDS.forEach((qid, index) => {
    const value = answerValues[index];
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      errors.push(`rawAnswers.${qid}`);
    }
  });

  const scores = payload.scores;
  if (!isRecord(scores)) {
    errors.push("scores");
  } else {
    const totalRawScore = answerValues.reduce((sum, value) => sum + value, 0);
    const totalScore = Math.round((totalRawScore / 75) * 100);

    if (scores.totalRawScore !== totalRawScore) errors.push("scores.totalRawScore");
    if (scores.totalScore !== totalScore) errors.push("scores.totalScore");
    if (!isRecord(scores.level) || !Number.isInteger(scores.level.levelNumber) || scores.level.levelNumber < 1 || scores.level.levelNumber > 5) {
      errors.push("scores.level.levelNumber");
    }
  }

  const categoryScores = payload.categoryScores;
  if (!isRecord(categoryScores)) {
    errors.push("categoryScores");
  } else {
    const expectedCategoryScores = [
      Math.round((answerValues.slice(0, 3).reduce((sum, value) => sum + value, 0) / 15) * 100),
      Math.round((answerValues.slice(3, 6).reduce((sum, value) => sum + value, 0) / 15) * 100),
      Math.round((answerValues.slice(6, 9).reduce((sum, value) => sum + value, 0) / 15) * 100),
      Math.round((answerValues.slice(9, 12).reduce((sum, value) => sum + value, 0) / 15) * 100),
      Math.round((answerValues.slice(12, 15).reduce((sum, value) => sum + value, 0) / 15) * 100),
    ];

    REQUIRED_CATEGORY_SCORE_KEYS.forEach((key, index) => {
      if (categoryScores[key] !== expectedCategoryScores[index]) {
        errors.push(`categoryScores.${key}`);
      }
    });
  }

  return errors;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const validationErrors = validateDiagnosticData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_DIAGNOSTIC_DATA",
          message: "진단 데이터가 부족하거나 불완전합니다. Q4~Q18의 모든 응답과 점수 정보가 필요합니다.",
          fields: validationErrors,
        },
      });
    }

    const {
      companyName,
      role,
      employeeCount,
      aiUsageLevel,
      scores,
      categoryScores,
      risks,
      freeAnswers,
      consultantInterview,
    } = req.body || {};

    const apiKey = process.env.GEMINI_API_KEY;

    // Q4~Q18 개별 응답을 문항 정의와 매핑해 상세 전달 (선택지 라벨 포함)
    const QUESTION_META: Record<string, { no: number; title: string; area: string; options: Record<number, string> }> = {
      q4: {
        no: 4, title: "AI 결과가 나오지 않을 때 대처 방식", area: "AI 활용",
        options: {
          1: "AI 사용을 중단한다", 2: "같은 질문을 다시 한다", 3: "질문을 조금 수정한다",
          4: "목적·대상·조건·결과물 형식을 추가해 다시 요청한다", 5: "결과를 확인하면서 단계별로 계속 개선한다",
        },
      },
      q5: {
        no: 5, title: "업무자료를 AI에 전달하는 방식", area: "AI 활용",
        options: {
          1: "자료 없이 바로 질문한다", 2: "필요한 부분만 간단히 설명한다", 3: "관련 자료를 함께 제공한다",
          4: "목적과 자료의 의미까지 설명한다", 5: "목적·자료·제약조건·원하는 결과 형식을 함께 제공한다",
        },
      },
      q6: {
        no: 6, title: "AI 결과물 검증·팩트체크 방식", area: "AI 활용",
        options: {
          1: "대부분 그대로 사용한다", 2: "문장 정도만 확인한다", 3: "중요한 부분을 다시 읽어본다",
          4: "사실·숫자·출처를 별도로 확인한다", 5: "사실 확인과 함께 회사 상황에 맞는지 최종 검토한다",
        },
      },
      q7: {
        no: 7, title: "반복업무 파악 수준", area: "업무 프로세스",
        options: {
          1: "잘 모른다", 2: "직원 개인이 알고 있다", 3: "대표나 관리자는 대략 알고 있다",
          4: "주요 반복업무가 정리되어 있다", 5: "업무별 시간·불편·오류까지 파악하고 있다",
        },
      },
      q8: {
        no: 8, title: "AI/사람 업무 분업 구조", area: "업무 프로세스",
        options: {
          1: "구분하지 않는다", 2: "AI에게 전체 업무를 한 번에 요청한다", 3: "일부 업무만 AI에게 맡긴다",
          4: "반복업무와 판단업무를 어느 정도 구분한다", 5: "사람·AI·자동화의 역할이 명확하게 나뉘어 있다",
        },
      },
      q9: {
        no: 9, title: "담당자 변경 시 업무 연속성(인수인계)", area: "업무 프로세스",
        options: {
          1: "거의 불가능하다", 2: "기존 담당자에게 많이 의존한다", 3: "문서가 일부 있지만 충분하지 않다",
          4: "주요 업무가 문서·템플릿으로 정리되어 있다", 5: "업무 절차와 자료가 표준화되어 쉽게 인수인계할 수 있다",
        },
      },
      q10: {
        no: 10, title: "과거 자료 검색성", area: "자료·지식관리",
        options: {
          1: "어디 있는지 모르는 경우가 많다", 2: "담당자 개인 PC나 메신저에서 찾는다", 3: "클라우드나 폴더에 저장되어 있지만 찾기 어렵다",
          4: "일정한 기준으로 정리되어 있다", 5: "필요한 정보를 빠르게 검색하고 재사용할 수 있다",
        },
      },
      q11: {
        no: 11, title: "프롬프트·성공사례 자산화", area: "자료·지식관리",
        options: {
          1: "따로 관리하지 않는다", 2: "개인이 보관한다", 3: "필요할 때 공유한다",
          4: "공용 폴더나 문서에 저장한다", 5: "팀의 템플릿·업무지식으로 체계적으로 축적한다",
        },
      },
      q12: {
        no: 12, title: "기존 자료 재활용(OSMU)", area: "자료·지식관리",
        options: {
          1: "거의 활용하지 않는다", 2: "필요할 때 과거 자료를 찾아본다", 3: "일부 자료를 복사·수정해 사용한다",
          4: "AI를 활용해 재가공한다", 5: "하나의 원천자료를 여러 형태의 결과물로 반복 활용한다",
        },
      },
      q13: {
        no: 13, title: "반복업무 템플릿·자동화 수준", area: "반복업무·자동화",
        options: {
          1: "대부분 매번 처음부터 한다", 2: "일부 문서 양식만 사용한다", 3: "프롬프트나 템플릿을 일부 사용한다",
          4: "AI와 자동화 도구를 함께 사용하는 업무가 있다", 5: "반복업무 대부분이 표준화·자동화되어 있고 사람이 검수한다",
        },
      },
      q14: {
        no: 14, title: "도구 간 수작업 복붙 정도", area: "반복업무·자동화",
        options: {
          1: "매우 많다", 2: "많은 편이다", 3: "보통이다",
          4: "일부만 남아 있다", 5: "필요한 부분 외에는 대부분 연결되어 있다",
        },
      },
      q15: {
        no: 15, title: "자동화 대상 선정 기준", area: "반복업무·자동화",
        options: {
          1: "새로운 AI 도구가 나오면 사용한다", 2: "직원이 원하는 업무부터 적용한다", 3: "시간이 많이 드는 업무를 우선한다",
          4: "반복성과 효과를 함께 본다", 5: "시간·오류·비용·위험을 비교해 우선순위를 결정한다",
        },
      },
      q16: {
        no: 16, title: "외부 AI 입력 데이터 기준", area: "검증·보안",
        options: {
          1: "별도 기준이 없다", 2: "직원 판단에 맡긴다", 3: "민감한 정보는 조심한다",
          4: "입력 가능한 정보와 금지정보를 구분한다", 5: "회사 차원의 명확한 기준과 승인 절차가 있다",
        },
      },
      q17: {
        no: 17, title: "AI 결과물 대외 발송 전 검수", area: "검증·보안",
        options: {
          1: "자동 또는 거의 그대로 발송한다", 2: "일부만 확인한다", 3: "담당자가 읽어본다",
          4: "중요한 사실과 표현을 검토한다", 5: "책임자가 최종 확인하고 발송한다",
        },
      },
      q18: {
        no: 18, title: "AI 도입 효과 측정", area: "검증·보안",
        options: {
          1: "별도로 확인하지 않는다", 2: "직원들이 편해졌는지만 확인한다", 3: "체감 효과를 이야기한다",
          4: "시간 절감이나 결과물 수를 일부 측정한다", 5: "도입 전후 시간·오류·처리량 등을 비교한다",
        },
      },
    };

    const rawAnswers = (req.body?.rawAnswers || {}) as Record<string, any>;
    const individualAnswersText = Object.entries(QUESTION_META)
      .map(([qid, meta]) => {
        const v = rawAnswers[qid];
        if (v === undefined || v === null || v === "") {
          return `- Q${meta.no} (${meta.area}) ${meta.title}: 응답 없음`;
        }
        if (typeof v === "number") {
          const label = meta.options[v];
          return label
            ? `- Q${meta.no} (${meta.area}) ${meta.title}: ${v}점/5점 — "${label}" 선택`
            : `- Q${meta.no} (${meta.area}) ${meta.title}: ${v}점/5점`;
        }
        return `- Q${meta.no} (${meta.area}) ${meta.title}: ${v}`;
      })
      .join("\n");

    const prompt = `
당신은 대한민국 기업 AX(인공지능 전환) 진단 컨설턴트입니다.
일반적인 컨설팅 보고서를 쓰는 사람이 아니라, **진단 응답에서 패턴·격차·모순을 찾아 이 기업에서 가장 먼저 확인하고 해결해야 할 병목을 특정하는 진단가**입니다.
다음은 'AIWORKS 기업 AX 간이진단 v0.1'의 실제 응답 데이터입니다.

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

[개별 문항 응답 상세 — 판단의 1차 근거]
${individualAnswersText}

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

[판단 규율 — 절대 준수]
1. 모든 핵심 판단에는 근거가 된 Q번호를 명시하라. (예: "Q14에서 1점 — 도구 간 복붙이 많다는 응답")
2. 응답으로 확인되지 않은 사실은 단정하지 마라. 합리적 추론은 "추측이지만" 또는 "가능성이 높다"로 표시하고, 확인이 필요한 것은 '상담에서 확인할 사항'으로 분류하라.
3. 높은 점수를 칭찬하지 마라. 병목과 위험을 우선 분석하라.
4. 여러 문제를 나열하지 말고, 가장 중요한 병목 1개로 좁혀라. 병목 선정 기준은 "점수가 가장 낮은 것"이 아니라 "다른 개선을 막고 있거나 사고로 이어질 것"이다.
5. 일반적인 AI 도입 조언, 도구 나열, 3개월 로드맵 상투어를 쓰지 마라.
6. Q19/Q20(기업이 원하는 것)과 응답 데이터가 가리키는 병목이 다르면, 그 불일치 자체를 지적하라.
7. 처방은 이 기업의 실제 응답에만 성립하는 것이어야 한다. 다른 기업 이름을 넣어도 성립하는 문장이 나오면 실패다.

[반드시 출력할 마크다운 구조 — 섹션 제목 그대로 사용]

## A. 진단 결론

### 1. 우리 회사 AX 유형
(점수 레벨명이 아니라 응답 패턴을 설명하는 20자 내외 유형명 + 2~3줄 설명. 예: "도구는 도입, 연결이 없는 단절형")
- 유형명 작성 규칙: 문제는 분명히 드러내되 고객이 평가받는 느낌을 주지 않게 쓸 것. "무방비", "무원칙", "무능" 같은 사람·조직을 몰아세는 수식은 금지하고, 대신 "기준 정립 전에 도입이 먼저 된", "연결이 아직 없는", "각자 따로 쓰고 있는"처럼 현재 상태를 묘사하는 중립적 표현으로 쓸 것.

### 2. 가장 중요한 병목 1개
(하나만. 왜 다른 후보를 제치고 이것인지 포함)

### 3. 판단 근거
(관련 Q번호와 실제 응답값을 인용하며 설명. 최소 3개 이상의 Q번호 인용)

### 4. 현재 잘못된 접근 또는 착각 가능성
(데이터 근거가 있을 때만 제시. 없으면 "응답 데이터에서 뚜렷한 착각 신호는 없음"이라고 쓸 것)

## B. 행동 처방

### 5. 지금 하지 말아야 할 것
(최대 3개. 각 항목에 금지 이유와 근거 Q번호)
- 작성 규칙: 태도나 마음가짐("장밋빛 기대를 갖지 마라", "조급해하지 마라" 같은 것)이 아니라, 실제로 중단·보류할 수 있는 구체적 행동·지출·계획만 쓸 것. 각 항목은 "…하는 행위/구매/계획을 당분간 보류하라"의 형태여야 하고, 대신 언제 재개하면 되는지 조건 한 줄을 덧붙일 것.

### 6. 이번 주에 할 것
(최대 2개. 구체적 행동 + 완료 기준)

### 7. 2주 안에 바꿀 것
(최대 3개. 구체적 행동 + 완료 기준)
- 작성 규칙: "이번 주에 할 것"을 단순 반복하거나 확장하지 말 것. 가능하면 서로 다른 축(예: 보안·검수 외에 프로세스, 지식자산화, 측정 등)의 다음 단계 과제로 제안할 것.

### 8. 측정할 것 1개
(지금부터 기록해야 할 지표 1개와 측정 방법. Q18 응답을 고려해 선정)

## C. 상담 준비

### 9. 컨설턴트가 반드시 추가로 물어볼 질문
(3~5개. 응답만으로 판단할 수 없어 상담에서 확인해야 할 사항을 질문 형태로. 각 질문이 왜 필요한지 괄호로 표시)

### 10. 아직 판단할 수 없는 사항
(현재 응답만으로 결론 내리면 안 되는 부분을 명시. 없으면 "없음")
`;

    // Fallback: rule-based prescription (Gemini 실패 시 동일 구조의 룰셋 리포트)
    const buildFallbackReport = () => {
      const levelNum = scores?.level?.levelNumber || 1;
      const totalScore = scores?.totalScore || 0;
      const company = companyName || "귀사";
      const timeWaster = freeAnswers?.q19 || "자료 수집 및 반복 보고서 작성";
      const topPriority = freeAnswers?.q20 || "실무 문서 작성 및 요약 자동화";

      const areaEntries: [string, number][] = [
        ["AI 활용", categoryScores?.aiUsage || 0],
        ["업무 프로세스", categoryScores?.workProcess || 0],
        ["자료·지식관리", categoryScores?.knowledgeManagement || 0],
        ["반복업무·자동화", categoryScores?.automation || 0],
        ["검증·보안", categoryScores?.verificationSecurity || 0],
      ];
      const sorted = [...areaEntries].sort((a, b) => a[1] - b[1]);
      const weakest = sorted[0];
      const strongest = sorted[sorted.length - 1];

      return `## A. 진단 결론

### 1. 우리 회사 AX 유형
**"점수 ${totalScore}점, ${weakest[0]} 치우침형"** — ${company}은(는) Level ${levelNum} 구간으로, 5개 영역 중 ${weakest[0]}(${weakest[1]}점)이 가장 낮고 ${strongest[0]}(${strongest[1]}점)이 상대적으로 강합니다.

### 2. 가장 중요한 병목 1개
**${weakest[0]} 영역 (${weakest[1]}점)** — 현재 데이터에서 가장 낮은 점수 영역입니다. (※ 이 리포트는 AI 장애 시 룰셋 기반으로 생성되어 개별 문항 교차 분석이 제한적입니다. 상담에서 정밀 진단이 필요합니다.)

### 3. 판단 근거
- 영역별 점수: ${weakest[0]} ${weakest[1]}점이 5개 영역 중 최저
- Q19 자유응답: "${timeWaster}" — 기업이 체감하는 반복 병목
- Q20 자유응답: "${topPriority}" — 기업이 원하는 개선 방향
- 위험 신호: ${risks && risks.length > 0 ? risks.map((r: any) => r.title).join(", ") : "없음"}

### 4. 현재 잘못된 접근 또는 착각 가능성
개별 문항 응답 기반의 교차 분석이 불가한 룰셋 리포트입니다. Q19(줄이고 싶은 업무)과 Q20(먼저 개선할 업무)이 서로 다른 업무를 가리키는 경우, 우선순위가 아직 정리되지 않았을 가능성이 있습니다.

## B. 행동 처방

### 5. 지금 하지 말아야 할 것
- 여러 업무를 동시에 자동화하지 마세요. (근거: Q14 응답 — 도구 간 수작업이 많은 상태에서는 연결 구조 정리가 먼저입니다)
- 새로운 유료 AI 툴 확대 도입을 보류하세요. (근거: Q15 — 선정 기준 체계가 정립되기 전에는 도입만 누적됩니다)

### 6. 이번 주에 할 것
1. ${timeWaster} 1건을 처리하며 소요 시간을 기록하세요. (완료 기준: 실측 시간 1개 확보)
2. ${weakest[0]} 영역에서 가장 문제되는 행동 1가지를 문서로 정의하세요. (완료 기준: 1페이지 내부 공유)

### 7. 2주 안에 바꿀 것
1. ${timeWaster}의 표준 템플릿+프롬프트 1세트 작성 (완료 기준: 다음 주 동일 업무를 절반 시간으로 처리)
2. 위험 신호(${risks && risks.length > 0 ? risks[0].title : "해당 없음"})에 대한 1페이지 사내 수칙 배포 (완료 기준: 팀 전체 공유)
3. ${topPriority}의 1차 시범 적용 1건 (완료 기준: 결과물 1개)

### 8. 측정할 것 1개
**${timeWaster}의 주당 소요 시간** — 이번 주 실측값을 기준선으로 기록하고, 2주 후 동일 측정으로 비교하세요. (Q18 응답상 효과 측정 체계가 약하므로 가장 작은 단위의 측정부터 시작합니다)

## C. 상담 준비

### 9. 컨설턴트가 반드시 추가로 물어볼 질문
1. ${timeWaster} 업무의 실제 담당자는 몇 명이며, 주당 몇 시간이 소요되는가? (병목 규모 확인)
2. ${topPriority}을(를) 추진할 때 예상되는 내부 반대나 제약은 무엇인가? (실행 가능성 확인)
3. 현재 사용 중인 AI 툴과 유료 계약 현황은? (중복 투자 확인)
4. 데이터 유출 시 최악의 시나리오는 무엇인가? (보안 우선순위 확인)

### 10. 아직 판단할 수 없는 사항
- 개별 문항(Q4~Q18) 응답 간의 교차 모순 여부 (본 리포트는 룰셋 기반)
- 조직 내 AI 활용 격차의 실제 크기
- ${topPriority}의 기대 투자 비용`;
    };

    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });

      for (const modelName of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: { temperature: 0.6 },
          });

          if (response.text && response.text.trim().length > 0) {
            return res.status(200).json({
              success: true,
              analysis: response.text,
              model: modelName,
              isAiGenerated: true,
            });
          }
        } catch (err: any) {
          console.warn(`Model ${modelName} call failed:`, err?.message || err);
        }
      }
    }

    return res.status(200).json({
      success: true,
      analysis: buildFallbackReport(),
      model: "aiworks-expert-ruleset-v1",
      isAiGenerated: false,
      note: !apiKey
        ? "GEMINI_API_KEY가 서버에 설정되지 않아 AIWORKS 전문 진단 처방 룰셋 기반으로 분석 리포트를 생성했습니다."
        : "AI 서비스 응답에 실패하여 AIWORKS 전문 진단 처방 룰셋 기반으로 즉시 분석 리포트가 생성되었습니다.",
    });
  } catch (err: any) {
    console.error("Error in /api/ax-ai-analysis:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Internal server error",
    });
  }
}
