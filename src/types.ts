export type QuestionCategory = 
  | 'basic' 
  | 'aiUsage' 
  | 'workProcess' 
  | 'knowledgeManagement' 
  | 'automation' 
  | 'verificationSecurity' 
  | 'freeAnswer';

export interface ChoiceOption {
  label: string;
  score?: number;
  value?: string;
  description?: string;
}

export interface QuestionDefinition {
  id: string;
  number: number;
  category: QuestionCategory;
  categoryTitle: string;
  title: string;
  subtitle?: string;
  type: 'single_choice' | 'score_1_5' | 'textarea';
  options?: ChoiceOption[];
  examples?: string[];
  placeholder?: string;
  riskNote?: string;
}

export interface MaturityLevel {
  levelNumber: number;
  title: string;
  scoreRange: [number, number];
  summary: string;
  detailedAnalysis: string;
  recommendation: string;
  badgeColor: string;
  borderColor: string;
  bgLight: string;
}

export interface CategoryScore {
  key: QuestionCategory;
  title: string;
  rawScore: number; // 3 ~ 15
  maxRawScore: number; // 15
  convertedScore: number; // 0 ~ 100
  percentage: number;
  questionIds: string[];
  statusLabel: '우수' | '양호' | '개선필요' | '시급한보완';
  color: string;
}

export interface RiskAlert {
  id: string;
  title: string;
  conditionDescription: string;
  description: string;
  actionGuideline: string;
  severity: 'critical' | 'warning';
  relatedQuestionId: string;
  triggered: boolean;
}

export interface PriorityTask {
  rank: 1 | 2 | 3;
  title: string;
  category: string;
  why: string;
  actionPlan: string;
  expectedOutcome: string;
  urgency: '즉시실행' | '단기추진' | '중기과제';
}

export interface ConsultantInterviewData {
  q1_timeConsumingPart: string;
  q2_currentOperator: string;
  q3_substituteFeasible: string;
  q4_aiFrustration: string;
  q5_expectedEffects: string[];
  q5_otherText?: string;
  consultantMemo?: string;
  recordedAt?: string;
  interviewDuration?: number;
}

export interface PilotFeedbackData {
  q1_customerUnderstood: number; // 1 ~ 5
  q1_memo?: string;
  q2_newBottleneckFound: number; // 1 ~ 5
  q2_memo?: string;
  q3_feltAccurateToProblem: number; // 1 ~ 5
  q3_memo?: string;
  pilotImprovementNotes?: string;
  savedAt?: string;
}

export interface DiagnosticResult {
  id: string;
  savedAt: string;
  companyName: string;
  evaluatorName: string;
  evaluatorRole: string;
  employeeCount: string;
  currentAiUsage: string;
  rawAnswers: Record<string, any>;
  
  totalRawScore: number; // / 75
  totalScore: number; // 0 ~ 100
  level: MaturityLevel;
  
  categoryScores: {
    aiUsage: CategoryScore;
    workProcess: CategoryScore;
    knowledgeManagement: CategoryScore;
    automation: CategoryScore;
    verificationSecurity: CategoryScore;
  };
  
  strongestDomain: CategoryScore;
  bottleneckDomain: CategoryScore;
  triggeredRisks: RiskAlert[];
  
  priorityTasks: {
    task1: PriorityTask;
    task2: PriorityTask;
    task3: PriorityTask;
  };
  
  freeAnswers: {
    q19_timeWaster: string;
    q20_topPriority: string;
  };
  
  consultantInterview?: ConsultantInterviewData;
  pilotFeedback?: PilotFeedbackData;
  aiDeepReport?: string;
  targetEmail?: string;
  evaluatorEmail?: string;
  syncedAt?: string;
}
