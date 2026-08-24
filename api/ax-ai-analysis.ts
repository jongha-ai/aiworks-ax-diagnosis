import { GoogleGenAI } from "@google/genai";

// Vercel Serverless Function: /api/ax-ai-analysis
// Express 서버(server.ts)와 동일한 Gemini 프롬프트·fallback 로직.
// Vercel 정적 배포에서는 dist/server.cjs가 실행되지 않으므로 이 파일이 API를 담당한다.
// (req/res 타입은 any로 받아 @vercel/node 개발 의존성 없이 동작)

const candidateModels = ["gemini-2.5-flash", "gemini-3.7-flash", "gemini-flash-latest"];

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
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
| **추천 AI 도구** | (ChatGPT Team, Claude, Gemini Advanced, Notion AI 등 추천 도구) |
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

    // Fallback: rule-based prescription (server.ts와 동일)
    const buildFallbackReport = () => {
      const levelNum = scores?.level?.levelNumber || 1;
      const levelTitle = scores?.level?.title || "탐색 및 시도 단계";
      const totalScore = scores?.totalScore || 0;
      const company = companyName || "귀사";
      const timeWaster = freeAnswers?.q19 || "자료 수집 및 반복 보고서 작성";
      const topPriority = freeAnswers?.q20 || "실무 문서 작성 및 요약 자동화";

      return `### 1. 경영진 총평 (Executive Summary)
- **현 상태 강점:** ${company}의 종합 점수는 **${totalScore}점 (Level ${levelNum}. ${levelTitle})**으로, 실무 차원의 AI 도구 관심도 및 부분적 시도 의지가 활성화되어 있습니다.
- **핵심 병목/위험:** 표준화된 프롬프트 체계 및 전사 데이터 보안 가이드라인 부재로 인해 단일 담당자 의존도와 수작업 병목이 잔존합니다.
- **AX 전환 한줄 제언:** **현업의 빈도 높은 1개 핵심 반복업무를 표준 템플릿화하여 조기 성공(Quick-Win)을 체험하고, 전사 공유 지식 기반으로 신속히 확장하십시오.**

### 2. 최우선 해결 과제 (Immediate Quick-Win)
| 구분 | 내용 |
| :--- | :--- |
| **대상 업무** | ${timeWaster} 및 ${topPriority} |
| **추천 AI 도구** | ChatGPT Team / Claude / Notion AI |
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
