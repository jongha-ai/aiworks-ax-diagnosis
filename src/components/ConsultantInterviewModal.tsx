import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Clock,
  Timer,
  Play,
  Pause,
  RotateCcw,
  CheckSquare,
  Square,
  Save,
  FileCheck,
  Building2,
} from 'lucide-react';
import { ConsultantInterviewData } from '../types';
import { JoCodingAuroraBg } from './JoCodingAuroraBg';

interface ConsultantInterviewModalProps {
  companyName: string;
  interviewData?: ConsultantInterviewData;
  onSaveInterview: (data: ConsultantInterviewData) => void;
  onClose: () => void;
}

export const ConsultantInterviewModal: React.FC<ConsultantInterviewModalProps> = ({
  companyName,
  interviewData,
  onSaveInterview,
  onClose,
}) => {
  // Form states
  const [q1, setQ1] = useState(interviewData?.q1_timeConsumingPart || '');
  const [q2, setQ2] = useState(interviewData?.q2_currentOperator || '');
  const [q3, setQ3] = useState(interviewData?.q3_substituteFeasible || '');
  const [q4, setQ4] = useState(interviewData?.q4_aiFrustration || '');
  const [expectedEffects, setExpectedEffects] = useState<string[]>(
    interviewData?.q5_expectedEffects || []
  );
  const [otherText, setOtherText] = useState(interviewData?.q5_otherText || '');
  const [memo, setMemo] = useState(interviewData?.consultantMemo || '');

  // 10~15 min timer state
  const [seconds, setSeconds] = useState(interviewData?.interviewDuration || 0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else if (!isActive && seconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setSeconds(0);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const effectOptions = [
    '시간 절감',
    '콘텐츠 증가',
    '고객응대 개선',
    '오류 감소',
    '직원 부담 감소',
    '매출·문의 증가',
    '기타',
  ];

  const handleEffectToggle = (opt: string) => {
    if (expectedEffects.includes(opt)) {
      setExpectedEffects(expectedEffects.filter((x) => x !== opt));
    } else {
      setExpectedEffects([...expectedEffects, opt]);
    }
  };

  const handleSave = () => {
    onSaveInterview({
      q1_timeConsumingPart: q1,
      q2_currentOperator: q2,
      q3_substituteFeasible: q3,
      q4_aiFrustration: q4,
      q5_expectedEffects: expectedEffects,
      q5_otherText: otherText,
      consultantMemo: memo,
      recordedAt: new Date().toLocaleDateString('ko-KR'),
      interviewDuration: seconds,
    });
    onClose();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-32">
      {/* Header Banner with 10~15 min Timer (조코딩풍 딥 블루 오로라 그래디언트) */}
      <div className="rounded-2xl p-6 text-white relative overflow-hidden border border-blue-500/30 shadow-2xl bg-[#030611] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <JoCodingAuroraBg />
        <div className="relative z-10 space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-600/30 text-blue-200 border border-blue-400/40">
              14. 컨설턴트 인터뷰 시트
            </span>
            <span className="text-xs text-slate-300">권장 소요시간: 10~15분</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold flex items-center tracking-tight text-white">
            <ClipboardList className="w-5 h-5 mr-2 text-sky-400" />
            {companyName} <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-400 ml-1.5">심층 인터뷰 & 문진표</span>
          </h2>
          <p className="text-xs text-slate-300">
            진단 제출 후 10~15분 동안 타이머로 시간을 체크하며, 아래 5가지 핵심 실무 질문을 직접 기록하는 문진표입니다.
          </p>
        </div>

        {/* Stopwatch Timer Widget */}
        <div className="relative z-10 bg-slate-900/90 backdrop-blur p-3 rounded-xl border border-slate-700/80 flex items-center space-x-3 shrink-0 shadow-lg">
          <div className="text-center pr-2.5 border-r border-slate-800">
            <span className="text-[10px] text-slate-400 block font-semibold flex items-center justify-center">
              <Clock className="w-3 h-3 mr-1 text-blue-400" />
              면담 소요시간
            </span>
            <span className="text-xl font-mono font-bold text-blue-400">{formatTime(seconds)}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              id="interview-timer-toggle-btn"
              type="button"
              onClick={toggleTimer}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-colors cursor-pointer ${
                isActive ? 'bg-amber-600 hover:bg-amber-500' : 'bg-blue-600 hover:bg-blue-500'
              }`}
              title={isActive ? '타이머 일시정지' : '인터뷰 시간 측정 시작 (스톱워치)'}
            >
              {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isActive ? '일시정지' : '타이머 시작'}</span>
            </button>
            <button
              id="interview-timer-reset-btn"
              type="button"
              onClick={resetTimer}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              title="타이머 00:00으로 리셋"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 5 Questions Form (Light Base #FFFFFF) */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        {/* 질문 1 */}
        <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <label htmlFor="interview-q1" className="block text-sm font-extrabold text-slate-900">
            질문 1. 이 업무가 반복될 때 가장 시간이 많이 드는 부분은 어디입니까?
          </label>
          <p className="text-xs text-slate-500 font-medium">
            자료 수집, 포맷 변환, 문장 작성, 복사·붙여넣기, 검수 중 실제 병목 구간 확인
          </p>
          <textarea
            id="interview-q1"
            rows={2}
            value={q1}
            onChange={(e) => setQ1(e.target.value)}
            placeholder="예: 이전 교육 강의록을 읽고 블로그 포맷에 맞게 재구성하고 썸네일 문구를 정하는 과정에 2시간 이상 소요됨"
            className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-medium"
          />
        </div>

        {/* 질문 2 */}
        <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <label htmlFor="interview-q2" className="block text-sm font-extrabold text-slate-900">
            질문 2. 지금 그 업무를 주로 누가 하고 있습니까?
          </label>
          <p className="text-xs text-slate-500 font-medium">
            대표 본인, 특정 핵심 담당자, 신입 직원, 외주 프리랜서 등 실제 수행 주체
          </p>
          <input
            id="interview-q2"
            type="text"
            value={q2}
            onChange={(e) => setQ2(e.target.value)}
            placeholder="예: 마케팅팀 1명 담당자가 전담 / 대표 본인이 직접 짬을 내어 수행"
            className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-medium"
          />
        </div>

        {/* 질문 3 */}
        <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <label htmlFor="interview-q3" className="block text-sm font-extrabold text-slate-900">
            질문 3. 그 담당자가 없으면 다른 사람이 바로 할 수 있습니까?
          </label>
          <p className="text-xs text-slate-500 font-medium">
            업무 인수인계 표준 템플릿 존재 여부 및 Bus Factor 위험도 확인
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {['불가능 (업무 완전 중단)', '어렵다 (기존 담당자에게 크게 의존)', '문서를 보며 일부 가능', '표준 템플릿으로 누구나 바로 가능'].map((choice, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setQ3(choice)}
                className={`text-xs px-3 py-2 rounded-lg border font-semibold transition-all cursor-pointer ${
                  q3 === choice
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {choice}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={q3}
            onChange={(e) => setQ3(e.target.value)}
            placeholder="추가 세부 사항 직접 입력 (선택)"
            className="w-full px-3.5 py-1.5 text-xs bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-lg mt-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* 질문 4 */}
        <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <label htmlFor="interview-q4" className="block text-sm font-extrabold text-slate-900">
            질문 4. AI를 이미 사용하고 있다면 어떤 부분에서 가장 답답합니까?
          </label>
          <p className="text-xs text-slate-500 font-medium">
            원하는 톤앤매너 불일치, 할루시네이션(거짓 정보), 맥락 이해 부족, 툴 간 복붙 피로 등
          </p>
          <textarea
            id="interview-q4"
            rows={2}
            value={q4}
            onChange={(e) => setQ4(e.target.value)}
            placeholder="예: 뻔하고 번역투 같은 문장만 나오고 우리 회사 상황에 맞는 깊이 있는 답변을 얻기 어려움"
            className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-medium"
          />
        </div>

        {/* 질문 5 */}
        <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <label className="block text-sm font-extrabold text-slate-900">
            질문 5. 이 업무가 개선된다면 가장 기대하는 효과는 무엇입니까? (다중 선택)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
            {effectOptions.map((opt) => {
              const isChecked = expectedEffects.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleEffectToggle(opt)}
                  className={`flex items-center space-x-2 p-2.5 rounded-lg border text-xs font-bold text-left transition-all cursor-pointer ${
                    isChecked
                      ? 'bg-blue-50 border-blue-600 text-blue-900 ring-1 ring-blue-600 shadow-2xs'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {isChecked ? (
                    <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>

          {expectedEffects.includes('기타') && (
            <input
              type="text"
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              placeholder="기타 기대 효과를 직접 작성해주세요"
              className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          )}
        </div>

        {/* 컨설턴트 종합 관찰 메모 */}
        <div className="space-y-2 pt-2">
          <label htmlFor="consultant-memo" className="block text-xs font-bold text-slate-700">
            컨설턴트 현장 메모 & 관찰 사항 (Consultant Observation Notes)
          </label>
          <textarea
            id="consultant-memo"
            rows={3}
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="인터뷰 중 발견된 고객의 핵심 페인포인트, 사내 저항 요인, 추천 가능한 최소 솔루션 등"
            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-medium"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
          <button
            id="cancel-interview-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            닫기
          </button>
          <button
            id="save-interview-btn"
            type="button"
            onClick={handleSave}
            className="flex items-center space-x-1.5 px-6 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>인터뷰 내용 리포트에 저장하기</span>
          </button>
        </div>
      </div>
    </div>
  );
};
