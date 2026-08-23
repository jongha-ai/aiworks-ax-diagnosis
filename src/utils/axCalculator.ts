import {
  DiagnosticResult,
  CategoryScore,
  MaturityLevel,
  RiskAlert,
  PriorityTask,
} from '../types';
import { MATURITY_LEVELS, RISK_DEFINITIONS } from '../data/questionsData';

export function calculateDiagnosticResult(
  answers: Record<string, any>,
  companyName: string = '주식회사 예시',
  evaluatorName: string = '홍길동',
  existingId?: string,
  consultantInterview?: any,
  pilotFeedback?: any,
  aiDeepReport?: string
): DiagnosticResult {
  // Extract scores for Q4 ~ Q18 (15 scored questions)
  const q4 = Number(answers.q4) || 1;
  const q5 = Number(answers.q5) || 1;
  const q6 = Number(answers.q6) || 1;
  const q7 = Number(answers.q7) || 1;
  const q8 = Number(answers.q8) || 1;
  const q9 = Number(answers.q9) || 1;
  const q10 = Number(answers.q10) || 1;
  const q11 = Number(answers.q11) || 1;
  const q12 = Number(answers.q12) || 1;
  const q13 = Number(answers.q13) || 1;
  const q14 = Number(answers.q14) || 1;
  const q15 = Number(answers.q15) || 1;
  const q16 = Number(answers.q16) || 1;
  const q17 = Number(answers.q17) || 1;
  const q18 = Number(answers.q18) || 1;

  // Domain Calculations
  const aiUsageRaw = q4 + q5 + q6; // max 15
  const workProcessRaw = q7 + q8 + q9; // max 15
  const knowledgeRaw = q10 + q11 + q12; // max 15
  const automationRaw = q13 + q14 + q15; // max 15
  const securityRaw = q16 + q17 + q18; // max 15

  const totalRawScore = aiUsageRaw + workProcessRaw + knowledgeRaw + automationRaw + securityRaw;
  const totalScore = Math.round((totalRawScore / 75) * 100);

  const getStatusLabel = (score: number): '우수' | '양호' | '개선필요' | '시급한보완' => {
    if (score >= 80) return '우수';
    if (score >= 60) return '양호';
    if (score >= 40) return '개선필요';
    return '시급한보완';
  };

  const aiUsageScore: CategoryScore = {
    key: 'aiUsage',
    title: 'AI 활용',
    rawScore: aiUsageRaw,
    maxRawScore: 15,
    convertedScore: Math.round((aiUsageRaw / 15) * 100),
    percentage: Math.round((aiUsageRaw / 15) * 100),
    questionIds: ['q4', 'q5', 'q6'],
    statusLabel: getStatusLabel(Math.round((aiUsageRaw / 15) * 100)),
    color: '#3b82f6', // blue
  };

  const workProcessScore: CategoryScore = {
    key: 'workProcess',
    title: '업무 프로세스',
    rawScore: workProcessRaw,
    maxRawScore: 15,
    convertedScore: Math.round((workProcessRaw / 15) * 100),
    percentage: Math.round((workProcessRaw / 15) * 100),
    questionIds: ['q7', 'q8', 'q9'],
    statusLabel: getStatusLabel(Math.round((workProcessRaw / 15) * 100)),
    color: '#8b5cf6', // purple
  };

  const knowledgeScore: CategoryScore = {
    key: 'knowledgeManagement',
    title: '자료·지식관리',
    rawScore: knowledgeRaw,
    maxRawScore: 15,
    convertedScore: Math.round((knowledgeRaw / 15) * 100),
    percentage: Math.round((knowledgeRaw / 15) * 100),
    questionIds: ['q10', 'q11', 'q12'],
    statusLabel: getStatusLabel(Math.round((knowledgeRaw / 15) * 100)),
    color: '#10b981', // emerald
  };

  const automationScore: CategoryScore = {
    key: 'automation',
    title: '반복업무·자동화',
    rawScore: automationRaw,
    maxRawScore: 15,
    convertedScore: Math.round((automationRaw / 15) * 100),
    percentage: Math.round((automationRaw / 15) * 100),
    questionIds: ['q13', 'q14', 'q15'],
    statusLabel: getStatusLabel(Math.round((automationRaw / 15) * 100)),
    color: '#f59e0b', // amber
  };

  const securityScore: CategoryScore = {
    key: 'verificationSecurity',
    title: '검증·보안',
    rawScore: securityRaw,
    maxRawScore: 15,
    convertedScore: Math.round((securityRaw / 15) * 100),
    percentage: Math.round((securityRaw / 15) * 100),
    questionIds: ['q16', 'q17', 'q18'],
    statusLabel: getStatusLabel(Math.round((securityRaw / 15) * 100)),
    color: '#ef4444', // red
  };

  const categoryScores = {
    aiUsage: aiUsageScore,
    workProcess: workProcessScore,
    knowledgeManagement: knowledgeScore,
    automation: automationScore,
    verificationSecurity: securityScore,
  };

  // Maturity Level
  const level = MATURITY_LEVELS.find(
    (l) => totalScore >= l.scoreRange[0] && totalScore <= l.scoreRange[1]
  ) || MATURITY_LEVELS[0];

  // Strongest and Bottleneck Domains
  const domainList = [aiUsageScore, workProcessScore, knowledgeScore, automationScore, securityScore];
  const sortedDomains = [...domainList].sort((a, b) => b.convertedScore - a.convertedScore);
  const strongestDomain = sortedDomains[0];
  const bottleneckDomain = sortedDomains[sortedDomains.length - 1];

  // Risk Signal Trigger Checks
  const triggeredRisks: RiskAlert[] = RISK_DEFINITIONS.map((def) => {
    let triggered = false;
    if (def.id === 'risk_security' && q16 <= 2) triggered = true;
    if (def.id === 'risk_external_dispatch' && q17 === 1) triggered = true;
    if (def.id === 'risk_person_dependency' && q9 <= 2) triggered = true;
    if (def.id === 'risk_knowledge_dispersion' && q10 <= 2) triggered = true;

    return {
      ...def,
      triggered,
    };
  }).filter((r) => r.triggered);

  // Generate 1st, 2nd, 3rd Priority AX Tasks
  const q19_timeWaster = (answers.q19 || '').trim();
  const q20_topPriority = (answers.q20 || '').trim();

  const priorityTasks = generatePriorityTasks({
    totalScore,
    bottleneckDomain,
    triggeredRisks,
    q19_timeWaster,
    q20_topPriority,
    categoryScores,
  });

  return {
    id: existingId || `ax-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    savedAt: new Date().toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
    }),
    companyName: companyName || '미지정 기업',
    evaluatorName: evaluatorName || '담당자',
    evaluatorRole: answers.q1 || '대표·임원',
    employeeCount: answers.q2 || '2~5명',
    currentAiUsage: answers.q3 || '글쓰기·요약 등 일부 업무에 사용한다',
    rawAnswers: answers,
    totalRawScore,
    totalScore,
    level,
    categoryScores,
    strongestDomain,
    bottleneckDomain,
    triggeredRisks,
    priorityTasks,
    freeAnswers: {
      q19_timeWaster: q19_timeWaster || '기재 없음',
      q20_topPriority: q20_topPriority || '기재 없음',
    },
    consultantInterview,
    pilotFeedback,
    aiDeepReport,
  };
}

function generatePriorityTasks({
  totalScore,
  bottleneckDomain,
  triggeredRisks,
  q19_timeWaster,
  q20_topPriority,
  categoryScores,
}: {
  totalScore: number;
  bottleneckDomain: CategoryScore;
  triggeredRisks: RiskAlert[];
  q19_timeWaster: string;
  q20_topPriority: string;
  categoryScores: Record<string, CategoryScore>;
}): { task1: PriorityTask; task2: PriorityTask; task3: PriorityTask } {
  // Priority 1: User's explicit free-response bottleneck/priority OR Immediate Security/Risk fix
  let task1: PriorityTask;
  if (triggeredRisks.some((r) => r.id === 'risk_security' || r.id === 'risk_external_dispatch')) {
    task1 = {
      rank: 1,
      title: '사내 AI 데이터 보안 가이드라인 및 대외 발송 사전 검수 체계 수립',
      category: '검증·보안 거버넌스',
      why: '현재 고객 정보 또는 사내 기밀이 외부 AI에 무방비로 유출되거나, AI 생성물이 사람의 교차 검증 없이 대외로 발송될 치명적 리스크가 감지되었습니다.',
      actionPlan: '입력 가능/불가 데이터 명문화(비식별화 마스킹 수칙), 대외 발송 전 3단계 팩트체크 체크리스트 전사 배포 및 팀장 승인 절차 도입.',
      expectedOutcome: '데이터 유출 및 할루시네이션 대외 사고 위험 100% 차단 및 안전한 전사 AI 도입 기반 마련.',
      urgency: '즉시실행',
    };
  } else if (q20_topPriority && q20_topPriority !== '기재 없음') {
    task1 = {
      rank: 1,
      title: `[핵심 과제] '${q20_topPriority}' 전용 표준 AI 파이프라인 구축`,
      category: '현업 Quick-Win',
      why: `회사에서 가장 시급하게 개선하고자 희망하는 최우선 과제로, 성공 시 체감 생산성 향상과 조직 만족도가 가장 큽니다.`,
      actionPlan: `해당 업무의 3단계 분업화(자료 준비 -> 정교한 프롬프트 입력 -> 담당자 최종 검수)를 정립하고 전용 템플릿 제작.`,
      expectedOutcome: `해당 업무 소요 시간 60~80% 단축 및 담당자 피로도 대폭 경감.`,
      urgency: '즉시실행',
    };
  } else if (q19_timeWaster && q19_timeWaster !== '기재 없음') {
    task1 = {
      rank: 1,
      title: `[병목 해결] '${q19_timeWaster}' 반복 시간 단축 템플릿화`,
      category: '반복업무 최적화',
      why: `가장 많은 시간을 낭비하고 있는 반복 업무를 표준화하여 일일 가용 리소스를 즉각 확보합니다.`,
      actionPlan: `기존 우수 결과물 3~5개를 역공학하여 One-Click 프롬프트 양식으로 변환하고 팀 공용 노션/드라이브에 배포.`,
      expectedOutcome: `주당 최소 3~5시간 이상의 실질적 시간 절감 효과 확보.`,
      urgency: '즉시실행',
    };
  } else {
    task1 = {
      rank: 1,
      title: '주요 고비용 반복업무 1건에 대한 AI 표준 템플릿 제작',
      category: '현업 Quick-Win',
      why: 'AI를 전사로 확장하기 전에 1개의 뚜렷한 최소 성공 사례(Quick-Win)를 만드는 것이 가장 효과적입니다.',
      actionPlan: 'SNS 콘텐츠 제작, 고객 FAQ 응대, 보고서 초안 등 가장 빈번한 업무를 골라 전용 프롬프트를 템플릿화합니다.',
      expectedOutcome: '업무 소요시간 50% 이상 단축 및 전사 AI 신뢰도 상승.',
      urgency: '즉시실행',
    };
  }

  // Priority 2: Bottleneck Domain Resolution
  let task2: PriorityTask;
  switch (bottleneckDomain.key) {
    case 'knowledgeManagement':
      task2 = {
        rank: 2,
        title: '사내 원천자료 중앙 집약화 및 One Source Multi-Use(OSMU) 체계',
        category: '자료·지식관리',
        why: `현재 '자료·지식관리' 영역 점수(${bottleneckDomain.convertedScore}점)가 가장 낮아, 사내 문서가 파편화되어 AI에 맥락을 제공하기 어렵습니다.`,
        actionPlan: '중앙 지식베이스(Notion/Google Drive) 일원화, 핵심 강의록/보고서 1건으로 블로그/SNS/뉴스레터 자동 재생산 구조 설계.',
        expectedOutcome: '자료 검색 시간 70% 단축 및 1개 원천 데이터로부터 다양한 파생 결과물 생산.',
        urgency: '단기추진',
      };
      break;
    case 'automation':
      task2 = {
        rank: 2,
        title: '수작업 복사·붙여넣기 제거 및 업무 템플릿-자동화 툴 연동',
        category: '반복업무·자동화',
        why: `현재 '반복업무·자동화' 영역 점수(${bottleneckDomain.convertedScore}점)가 가장 낮아, AI를 쓰면서도 사람의 복붙 노가다가 여전히 심각합니다.`,
        actionPlan: '구글 시트/노션과 AI API 또는 Make/Zapier 연계를 통한 반복 데이터 전달 자동화.',
        expectedOutcome: '수작업 입력 오류 90% 제거 및 단순 반복 작업 완전 무인화.',
        urgency: '단기추진',
      };
      break;
    case 'workProcess':
      task2 = {
        rank: 2,
        title: '담당자 부재에도 돌아가는 업무 표준 매뉴얼 및 AI 분업화',
        category: '업무 프로세스',
        why: `현재 '업무 프로세스' 영역 점수(${bottleneckDomain.convertedScore}점)가 가장 낮아, 업무가 특정 개인에게 과도하게 의존되고 있습니다.`,
        actionPlan: '주요 업무별 [AI 할 일(초안/분석) vs 사람 할 일(의사결정/검수)] 명확히 분리 후 인수인계 템플릿 문서화.',
        expectedOutcome: '신규 입사자/대체 인력의 즉각적인 업무 투입 가능 및 Bus Factor 리스크 해소.',
        urgency: '단기추진',
      };
      break;
    case 'aiUsage':
      task2 = {
        rank: 2,
        title: '실전 프롬프트 엔지니어링 및 팩트체크 역량 사내 워크숍',
        category: 'AI 활용 역량',
        why: `현재 'AI 활용' 영역 점수(${bottleneckDomain.convertedScore}점)가 낮아, AI에게 단문 질문만 하거나 할루시네이션 검증이 부족합니다.`,
        actionPlan: '역할(Role)-맥락(Context)-조건(Constraints)-출력형식(Format) 프롬프트 4원칙 전파 및 실습.',
        expectedOutcome: 'AI 산출물 1차 완성도 200% 개선 및 재질문 시행착오 횟수 대폭 감소.',
        urgency: '단기추진',
      };
      break;
    default:
      task2 = {
        rank: 2,
        title: '팀 공용 프롬프트 라이브러리 및 노하우 축적 채널 개설',
        category: '지식 자산화',
        why: '개인이 만든 우수 프롬프트와 성공 사례가 팀 전체의 자산으로 모이지 않고 증발하고 있습니다.',
        actionPlan: '사내 메신저에 #ai-prompt-공유 채널 개설 및 주간 베스트 프롬프트 템플릿 등록.',
        expectedOutcome: '팀원 간 AI 활용 격차 해소 및 팀 전체의 집단 지성 가속화.',
        urgency: '단기추진',
      };
  }

  // Priority 3: Long-term / Scalability & Measurement
  let task3: PriorityTask;
  if (totalScore < 50) {
    task3 = {
      rank: 3,
      title: '전사 AI 툴 유료 플랜 통합(Team 플랜) 및 사용 규칙 공지',
      category: '인프라 및 환경',
      why: '개별 무료 버전 사용 시 데이터 학습 위험이 있고, 팀 간 프롬프트 공유 및 프로젝트 협업 기능이 제한됩니다.',
      actionPlan: 'ChatGPT Team 또는 Claude Team 플랜 일원화로 기업 데이터 학습 방지 및 공용 GPTs 구축 환경 조성.',
      expectedOutcome: '기업 데이터 보안 보장 및 팀 단위 협업 워크스페이스 확보.',
      urgency: '중기과제',
    };
  } else {
    task3 = {
      rank: 3,
      title: 'AX 도입 성과(시간·비용 절감, 오류 감소) 정량 대시보드 구축',
      category: '성과 관리 및 고도화',
      why: 'AI 도입 효과를 숫자로 증명하고 지속적인 개선 피드백 루프를 만들기 위한 KPI 관리가 필요합니다.',
      actionPlan: '월별 AI 도입 전후 처리 시간, 건수, 절감 비용을 측정하는 간이 대시보드 운영.',
      expectedOutcome: 'AX 투자 정당성 확보 및 데이터 기반의 추가 자동화 영역 발굴.',
      urgency: '중기과제',
    };
  }

  return { task1, task2, task3 };
}

// Sample presets for quick testing and demonstration
export const SAMPLE_PRESETS: { name: string; description: string; data: Record<string, any>; companyName: string; evaluatorName: string }[] = [
  {
    name: '대표 예시 A: Level 1 (탐색/보안위험 기업)',
    description: 'AI를 가끔 쓰지만 기준과 템플릿이 없고 보안 및 대외 발송 위험이 존재하는 3인 스타트업',
    companyName: '(주)마인드스튜디오',
    evaluatorName: '김대표',
    data: {
      q1: '대표·임원',
      q2: '2~5명',
      q3: '가끔 검색·질문에 사용한다',
      q4: 2,
      q5: 1,
      q6: 1,
      q7: 2,
      q8: 1,
      q9: 1,
      q10: 1,
      q11: 1,
      q12: 1,
      q13: 1,
      q14: 1,
      q15: 1,
      q16: 1,
      q17: 1,
      q18: 1,
      q19: '매주 교육 후 SNS 카드뉴스 제작 및 고객 개별 답변',
      q20: '인스타그램 콘텐츠 제작 자동화 및 사내 강의자료 정리',
    },
  },
  {
    name: '대표 예시 B: Level 3 (업무적용/성장 중소기업)',
    description: '글쓰기와 요약에 적극 활용하나 툴 간 수작업 복붙과 개인 의존도가 높은 15인 교육기업',
    companyName: '에듀넥스트 (주)',
    evaluatorName: '이팀장',
    data: {
      q1: '팀장·관리자',
      q2: '11~30명',
      q3: '여러 업무에서 정기적으로 사용한다',
      q4: 4,
      q5: 3,
      q6: 3,
      q7: 3,
      q8: 3,
      q9: 2,
      q10: 2,
      q11: 3,
      q12: 3,
      q13: 3,
      q14: 2,
      q15: 3,
      q16: 3,
      q17: 3,
      q18: 2,
      q19: '강의록 요약 후 블로그 포스팅 및 뉴스레터 발행',
      q20: 'One Source Multi-Use 콘텐츠 자동 파이프라인 및 노션 지식베이스 구축',
    },
  },
  {
    name: '대표 예시 C: Level 5 (조직자산화/선도기업)',
    description: '워크플로우와 자동화, 보안, 정량적 KPI 관리가 고도화된 선도 AX 조직',
    companyName: '알파웍스랩',
    evaluatorName: '박이사',
    data: {
      q1: '대표·임원',
      q2: '31명 이상',
      q3: '업무 프로세스에 AI가 이미 포함되어 있다',
      q4: 5,
      q5: 5,
      q6: 5,
      q7: 5,
      q8: 5,
      q9: 5,
      q10: 5,
      q11: 5,
      q12: 5,
      q13: 5,
      q14: 5,
      q15: 5,
      q16: 5,
      q17: 5,
      q18: 5,
      q19: '신규 고객 온보딩 및 맞춤형 견적서 생성 파이프라인 고도화',
      q20: '자체 사내 데이터 기반 도메인 특화 AI 에이전트 자산화',
    },
  },
];
