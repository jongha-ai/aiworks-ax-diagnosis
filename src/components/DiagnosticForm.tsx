import React, { useState } from 'react';
import {
  Building2,
  Clock,
  Sparkles,
  Workflow,
  Database,
  Cpu,
  ShieldCheck,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  HelpCircle,
  Lightbulb,
  Info,
} from 'lucide-react';
import { QUESTION_CATEGORIES_INFO, QUESTIONS_DATA } from '../data/questionsData';
import { QuestionCategory } from '../types';
import { JoCodingAuroraBg } from './JoCodingAuroraBg';

interface DiagnosticFormProps {
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, value: any) => void;
  companyName: string;
  setCompanyName: (name: string) => void;
  evaluatorName: string;
  setEvaluatorName: (name: string) => void;
  targetEmail?: string;
  setTargetEmail?: (email: string) => void;
  onSubmit: () => void;
  onLoadPreset: (index: number) => void;
  onOpenGoogleSync?: () => void;
}

export const DiagnosticForm: React.FC<DiagnosticFormProps> = ({
  answers,
  onAnswerChange,
  companyName,
  setCompanyName,
  evaluatorName,
  setEvaluatorName,
  targetEmail = '',
  setTargetEmail,
  onSubmit,
  onLoadPreset,
  onOpenGoogleSync,
}) => {
  const [activeCategoryKey, setActiveCategoryKey] = useState<QuestionCategory | 'all'>('all');

  // Calculate completion
  const totalQuestions = QUESTIONS_DATA.length;
  const answeredCount = QUESTIONS_DATA.filter((q) => answers[q.id] !== undefined && answers[q.id] !== '').length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  // Group questions by category
  const categories = QUESTION_CATEGORIES_INFO;

  const getCategoryIcon = (key: string) => {
    switch (key) {
      case 'basic':
        return <Building2 className="w-4 h-4 text-blue-600" />;
      case 'aiUsage':
        return <Sparkles className="w-4 h-4 text-blue-600" />;
      case 'workProcess':
        return <Workflow className="w-4 h-4 text-blue-600" />;
      case 'knowledgeManagement':
        return <Database className="w-4 h-4 text-blue-600" />;
      case 'automation':
        return <Cpu className="w-4 h-4 text-blue-600" />;
      case 'verificationSecurity':
        return <ShieldCheck className="w-4 h-4 text-blue-600" />;
      case 'freeAnswer':
        return <Edit3 className="w-4 h-4 text-blue-600" />;
      default:
        return <HelpCircle className="w-4 h-4 text-slate-600" />;
    }
  };

  const getCategoryAnsweredCount = (catKey: string) => {
    const catQuestions = QUESTIONS_DATA.filter((q) => q.category === catKey);
    const answered = catQuestions.filter((q) => answers[q.id] !== undefined && answers[q.id] !== '').length;
    return { answered, total: catQuestions.length };
  };

  const isComplete = answeredCount === totalQuestions;

  const scrollToFirstUnanswered = () => {
    const firstUnanswered = QUESTIONS_DATA.find((q) => answers[q.id] === undefined || answers[q.id] === '');
    if (firstUnanswered) {
      if (activeCategoryKey !== 'all' && activeCategoryKey !== firstUnanswered.category) {
        setActiveCategoryKey(firstUnanswered.category as QuestionCategory);
      }
      setTimeout(() => {
        const el = document.getElementById(`question-card-${firstUnanswered.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-2', 'ring-blue-500');
          setTimeout(() => el.classList.remove('ring-2', 'ring-blue-500'), 2000);
        }
      }, 100);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-16">
      {/* 1. 진단 목적 안내 배너 (조코딩 AX 트렌드 리포트 커버 스타일) */}
      <section className="rounded-2xl p-6 sm:p-10 text-white relative overflow-hidden border border-blue-500/30 shadow-2xl bg-[#030611]">
        {/* JoCoding 3D Silk Neon Blue Ribbon Background */}
        <JoCodingAuroraBg />

        <div className="relative z-10 space-y-5">
          {/* Eyebrow & Badges */}
          <div className="space-y-2">
            <p className="text-xs sm:text-sm font-medium tracking-wide text-slate-300">
              기업의 AI 활용 수준을 진단하고, 일하는 방식을 바꾸는 AX 진단 솔루션
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="px-3 py-1 bg-blue-600/30 text-blue-200 border border-blue-400/40 rounded-full text-xs font-bold tracking-tight shadow-sm">
                AIWORKS AX 진단 v0.1
              </span>
              <span className="px-3 py-1 bg-slate-900/80 backdrop-blur border border-slate-700/80 text-slate-300 rounded-full text-xs font-medium flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1 text-sky-400" />
                예상 소요시간: 7~10분
              </span>
              <span className="px-3 py-1 bg-slate-900/80 backdrop-blur border border-slate-700/80 text-slate-300 rounded-full text-xs">
                대상: 대표 · 총괄 관리자
              </span>
            </div>
          </div>

          {/* Main Title matching the bold AX Report Typography */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl md:text-[2.1rem] font-extrabold tracking-tight text-white leading-tight">
              우리 회사 <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-400 to-blue-200">AX 성숙도</span> & 업무 최적화 진단
            </h1>
          </div>

          {/* Description */}
          <div className="text-slate-300 text-[14.5px] sm:text-[15.5px] font-normal leading-[1.75] tracking-[-0.01em] max-w-3xl space-y-2">
            <p>
              본 진단은 AI 도구를 단순히 많이 알고 있는지를 평가하지 않습니다.
            </p>
            <p>
              현재 회사의 AI 활용 수준, 반복업무, 자료관리, 자동화 가능성, 검증·보안 위험을 면밀히 확인하고{' '}
              <strong className="text-sky-300 font-semibold underline underline-offset-4 decoration-sky-400/50">
                가장 먼저 우선 개선할 1·2·3순위 업무
              </strong>
              를 도출하는 실무형 전략 진단입니다.
            </p>
          </div>

          {/* Bottom metadata bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
            <div className="flex items-center space-x-1.5">
              <Info className="w-4 h-4 text-sky-400 shrink-0" />
              <span>실무 맞춤형 진단 (공식 자격·인사평가용이 아닙니다)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-slate-400">빠른 테스트:</span>
              <button
                type="button"
                onClick={() => onLoadPreset(1)}
                className="text-xs text-sky-400 hover:text-sky-300 font-semibold underline underline-offset-2 transition-colors cursor-pointer"
              >
                예시 데이터 자동 채우기
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 회사 기본 정보 입력바 */}
      <section className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center">
            <Building2 className="w-4 h-4 mr-1.5 text-blue-600" />
            진단 대상 기업 정보 및 결과 수신 설정
          </h2>
          {onOpenGoogleSync && (
            <button
              type="button"
              onClick={onOpenGoogleSync}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
              title="구글 스프레드시트 및 구글 드라이브 자동 저장 설정 열기"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>구글 시트/드라이브 자동연동</span>
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="company-name-input" className="block text-xs font-semibold text-slate-700 mb-1">
              회사명 / 조직명 <span className="text-rose-500">*</span>
            </label>
            <input
              id="company-name-input"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="예: (주)에이아이웍스"
              className="w-full px-3.5 py-2 text-sm bg-slate-50/50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
            />
          </div>
          <div>
            <label htmlFor="evaluator-name-input" className="block text-xs font-semibold text-slate-700 mb-1">
              작성자 성함 / 직함
            </label>
            <input
              id="evaluator-name-input"
              type="text"
              value={evaluatorName}
              onChange={(e) => setEvaluatorName(e.target.value)}
              placeholder="예: 홍길동 대표 / 김팀장"
              className="w-full px-3.5 py-2 text-sm bg-slate-50/50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
            />
          </div>
          <div>
            <label htmlFor="target-email-input" className="block text-xs font-semibold text-slate-700 mb-1">
              결과 수신 이메일 <span className="text-slate-400 font-normal">(선택: 자동 발송)</span>
            </label>
            <input
              id="target-email-input"
              type="email"
              value={targetEmail}
              onChange={(e) => setTargetEmail && setTargetEmail(e.target.value)}
              placeholder="예: ceo@company.com"
              className="w-full px-3.5 py-2 text-sm bg-slate-50/50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
            />
          </div>
        </div>
      </section>

      {/* 상단 고정 응답 진행률 바 & 카테고리 네비게이션 (Sticky Top Progress & Nav Header) */}
      <div className="sticky top-16 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 space-y-2.5 transition-all">
        {/* Upper row: Progress Gauge & Action CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left/Center: Progress gauge & count */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="flex items-center space-x-1.5 shrink-0 text-xs font-bold text-slate-900">
              <span>응답 진행률:</span>
              <span className="text-blue-600 font-extrabold">{answeredCount} / {totalQuestions} 문항</span>
              <span className="text-slate-500 font-semibold">({progressPercent}%)</span>
            </div>

            {/* Blue gauge bar */}
            <div className="flex-1 max-w-xs sm:max-w-md h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shrink-0 sm:shrink">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300 relative"
                style={{ width: `${progressPercent}%` }}
              >
                {isComplete && <span className="absolute inset-0 bg-white/30 animate-pulse" />}
              </div>
            </div>

            {/* Status Badge */}
            {isComplete ? (
              <span className="hidden md:inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                모든 문항 완료
              </span>
            ) : (
              <span className="hidden md:inline-flex text-[11px] font-semibold text-slate-500 shrink-0">
                {totalQuestions - answeredCount}개 문항 남음
              </span>
            )}
          </div>

          {/* Right: Step Indicator & Submit CTA */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
            <div className="hidden xl:flex items-center space-x-1.5 text-xs text-slate-500 font-medium mr-1">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span>진단 설문 단계</span>
            </div>

            <button
              id="submit-diagnosis-btn"
              type="button"
              onClick={() => {
                if (isComplete) {
                  onSubmit();
                } else {
                  scrollToFirstUnanswered();
                }
              }}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                isComplete
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm ring-2 ring-blue-500/30 scale-100 hover:scale-[1.02]'
                  : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200 hover:text-slate-800'
              }`}
              title={isComplete ? '진단 결과 리포트 확인하기' : '미응답 문항으로 이동하기'}
            >
              {isComplete ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-200" />
                  <span>진단 결과 리포트 확인하기</span>
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </>
              ) : (
                <>
                  <span>리포트 확인 ({totalQuestions - answeredCount}개 남음)</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Lower row: Category navigation tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-0.5 no-scrollbar border-t border-slate-100 pt-2">
          <button
            type="button"
            onClick={() => setActiveCategoryKey('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
              activeCategoryKey === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            전체 문항 보기 ({answeredCount}/{totalQuestions})
          </button>

          {categories.map((cat) => {
            const { answered, total } = getCategoryAnsweredCount(cat.key);
            const isCatComplete = answered === total;
            const isActive = activeCategoryKey === cat.key;

            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategoryKey(cat.key as QuestionCategory)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : isCatComplete
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{cat.shortTitle}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive
                      ? 'bg-blue-800 text-white'
                      : isCatComplete
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {answered}/{total}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 진단 문항 리스트 */}
      <div className="space-y-12">
        {categories.map((cat) => {
          if (activeCategoryKey !== 'all' && activeCategoryKey !== cat.key) {
            return null;
          }

          const categoryQuestions = QUESTIONS_DATA.filter((q) => q.category === cat.key);

          return (
            <div key={cat.key} className="space-y-6">
              {/* 카테고리 헤더 */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
                    {getCategoryIcon(cat.key)}
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">{cat.title}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">{cat.description}</p>
                  </div>
                </div>
              </div>

              {/* 문항 카드 목록 */}
              <div className="space-y-6">
                {categoryQuestions.map((q) => {
                  const currentValue = answers[q.id];
                  const isAnswered = currentValue !== undefined && currentValue !== '';

                  return (
                    <div
                      key={q.id}
                      id={`question-card-${q.id}`}
                      className={`bg-white rounded-xl p-5 sm:p-6 border transition-all duration-200 shadow-2xs ${
                        isAnswered
                          ? 'border-blue-200 ring-1 ring-blue-500/10'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* 문항 타이틀 */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                            {q.title}
                          </h3>
                          {q.subtitle && (
                            <p className="text-xs text-slate-500 mt-1">{q.subtitle}</p>
                          )}
                        </div>
                        {isAnswered && (
                          <span className="shrink-0 flex items-center text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-blue-600" />
                            선택완료
                          </span>
                        )}
                      </div>

                      {/* 위험 신호 사전 안내 배지 */}
                      {q.riskNote && (
                        <div className="mb-4 flex items-center space-x-1.5 text-xs text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>{q.riskNote}</span>
                        </div>
                      )}

                      {/* 1. 단일 선택형 (기본정보 Q1~Q3) */}
                      {q.type === 'single_choice' && q.options && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                          {q.options.map((opt, idx) => {
                            const isSelected = currentValue === opt.value;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => onAnswerChange(q.id, opt.value)}
                                className={`text-left p-3.5 rounded-xl border text-sm transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-blue-50/70 border-2 border-blue-600 text-slate-950 font-semibold ring-1 ring-blue-500/20 shadow-xs'
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className={`font-semibold ${isSelected ? 'text-blue-950' : 'text-slate-800'}`}>
                                    {opt.label}
                                  </span>
                                  <span
                                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                      isSelected
                                        ? 'border-blue-600 bg-blue-600 text-white'
                                        : 'border-slate-300 bg-white'
                                    }`}
                                  >
                                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                  </span>
                                </div>
                                {opt.description && (
                                  <p className={`text-xs mt-1 ${isSelected ? 'text-blue-800' : 'text-slate-500'}`}>
                                    {opt.description}
                                  </p>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* 2. 1~5점 척도 선택형 (Q4~Q18) */}
                      {q.type === 'score_1_5' && q.options && (
                        <div className="space-y-2 pt-2">
                          {q.options.map((opt) => {
                            const isSelected = Number(currentValue) === opt.score;
                            return (
                              <button
                                key={opt.score}
                                type="button"
                                onClick={() => onAnswerChange(q.id, opt.score)}
                                className={`w-full text-left p-3 sm:p-3.5 rounded-xl border text-sm transition-all flex items-start space-x-3 cursor-pointer ${
                                  isSelected
                                    ? 'bg-blue-50/70 border-2 border-blue-600 text-slate-950 ring-1 ring-blue-500/20 shadow-xs'
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900'
                                }`}
                              >
                                <span
                                  className={`shrink-0 w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center mt-0.5 ${
                                    isSelected
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-slate-100 border border-slate-200 text-slate-600'
                                  }`}
                                >
                                  {opt.score}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className={`font-semibold text-sm ${isSelected ? 'text-blue-950 font-bold' : 'text-slate-800'}`}>
                                    {opt.label.replace(/^\d+점:\s*/, '')}
                                  </div>
                                  {opt.description && (
                                    <div className={`text-xs mt-0.5 leading-normal ${isSelected ? 'text-blue-800' : 'text-slate-500'}`}>
                                      {opt.description}
                                    </div>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* 3. 자유응답 텍스트형 (Q19, Q20) */}
                      {q.type === 'textarea' && (
                        <div className="space-y-3 pt-2">
                          <textarea
                            id={`textarea-${q.id}`}
                            rows={3}
                            value={currentValue || ''}
                            onChange={(e) => onAnswerChange(q.id, e.target.value)}
                            placeholder={q.placeholder}
                            className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                          />

                          {/* 빠른 예시 칩 */}
                          {q.examples && (
                            <div>
                              <div className="text-xs font-semibold text-slate-500 flex items-center mb-1.5">
                                <Lightbulb className="w-3.5 h-3.5 mr-1 text-amber-500" />
                                클릭하여 예시 선택하기:
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {q.examples.map((example, exIdx) => (
                                  <button
                                    key={exIdx}
                                    type="button"
                                    onClick={() => onAnswerChange(q.id, example)}
                                    className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 text-slate-700 rounded-lg border border-slate-200 transition-colors cursor-pointer font-medium"
                                  >
                                    + {example}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 하단 최종 제출 안내 카드 (Bottom Completion Card) */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-4 text-center">
        {isComplete ? (
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">모든 20개 문항 응답이 완료되었습니다!</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              우리 회사의 성숙도 레벨, 1·2·3순위 우선 개선 과제 및 위험 신호 분석 리포트를 확인하세요.
            </p>
            <button
              id="bottom-submit-diagnosis-btn"
              type="button"
              onClick={onSubmit}
              className="inline-flex items-center space-x-2 px-8 py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 hover:scale-[1.02] transition-all cursor-pointer"
            >
              <span>진단 결과 리포트 확인하기</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              아직 작성되지 않은 {totalQuestions - answeredCount}개 문항이 남아있습니다.
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              모든 문항(20문항)에 응답해야 정확한 AX 성숙도 레벨과 맞춤형 개선 처방 리포트가 산출됩니다.
            </p>
            <button
              type="button"
              onClick={scrollToFirstUnanswered}
              className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl font-semibold text-xs bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 text-slate-700 border border-slate-200 transition-all cursor-pointer"
            >
              <span>미응답 문항으로 이동하기</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
