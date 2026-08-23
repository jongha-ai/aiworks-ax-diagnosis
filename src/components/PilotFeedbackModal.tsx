import React, { useState } from 'react';
import {
  MessageSquareHeart,
  Star,
  Save,
  FileCheck,
  CheckCircle2,
  Lightbulb,
} from 'lucide-react';
import { PilotFeedbackData } from '../types';
import { JoCodingAuroraBg } from './JoCodingAuroraBg';

interface PilotFeedbackModalProps {
  companyName: string;
  feedbackData?: PilotFeedbackData;
  onSaveFeedback: (data: PilotFeedbackData) => void;
  onClose: () => void;
}

export const PilotFeedbackModal: React.FC<PilotFeedbackModalProps> = ({
  companyName,
  feedbackData,
  onSaveFeedback,
  onClose,
}) => {
  const [q1Score, setQ1Score] = useState(feedbackData?.q1_customerUnderstood || 4);
  const [q1Memo, setQ1Memo] = useState(feedbackData?.q1_memo || '');

  const [q2Score, setQ2Score] = useState(feedbackData?.q2_newBottleneckFound || 4);
  const [q2Memo, setQ2Memo] = useState(feedbackData?.q2_memo || '');

  const [q3Score, setQ3Score] = useState(feedbackData?.q3_feltAccurateToProblem || 5);
  const [q3Memo, setQ3Memo] = useState(feedbackData?.q3_memo || '');

  const [notes, setNotes] = useState(feedbackData?.pilotImprovementNotes || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    onSaveFeedback({
      q1_customerUnderstood: q1Score,
      q1_memo: q1Memo,
      q2_newBottleneckFound: q2Score,
      q2_memo: q2Memo,
      q3_feltAccurateToProblem: q3Score,
      q3_memo: q3Memo,
      pilotImprovementNotes: notes,
      savedAt: new Date().toLocaleDateString('ko-KR'),
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const renderStarRating = (score: number, setScore: (val: number) => void) => (
    <div className="flex items-center space-x-1.5 pt-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setScore(star)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            score === star
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          {star}점 {star === 5 ? '(매우 그렇다)' : star === 1 ? '(전혀 아님)' : ''}
        </button>
      ))}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-32">
      {/* Banner (조코딩풍 딥 블루 오로라 그래디언트) */}
      <div className="rounded-2xl p-6 text-white relative overflow-hidden border border-blue-500/30 shadow-2xl bg-[#030611] space-y-2">
        <JoCodingAuroraBg />
        <div className="relative z-10 space-y-2">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-600/30 text-blue-200 border border-blue-400/40">
              15. 파일럿 검증 기록기
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold flex items-center tracking-tight text-white">
            <MessageSquareHeart className="w-5 h-5 mr-2 text-sky-400" />
            파일럿 검증 <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-400 ml-1.5">3대 핵심 지표 기록</span>
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            진단 점수 자체보다 고객이 질문을 쉽게 이해했는지, 새로운 병목이 발굴되었는지, 진단 결과가 실제 문제와 일치했는지를 
            기록하여 다음 버전의 자동 처방 알고리즘을 고도화합니다.
          </p>
        </div>
      </div>

      {/* 3 Core Feedback Questions (Light Base #FFFFFF) */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        {/* 질문 1 */}
        <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900">
              1. 질문을 고객이 바로 이해했는가?
            </h3>
            <span className="text-xs font-bold text-blue-600">{q1Score}점 / 5점</span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            용어가 모호하거나 해석에 혼선이 있었던 문항이 있는지 확인
          </p>
          {renderStarRating(q1Score, setQ1Score)}
          <input
            type="text"
            value={q1Memo}
            onChange={(e) => setQ1Memo(e.target.value)}
            placeholder="어려워했던 문항이나 질문 피드백 기록 (선택)"
            className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
          />
        </div>

        {/* 질문 2 */}
        <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900">
              2. 진단을 통해 기존에 몰랐던 병목이 발견되었는가?
            </h3>
            <span className="text-xs font-bold text-blue-600">{q2Score}점 / 5점</span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            단순히 알고 있던 사실 외에 미처 인식하지 못했던 리스크/낭비 요소 발견 여부
          </p>
          {renderStarRating(q2Score, setQ2Score)}
          <input
            type="text"
            value={q2Memo}
            onChange={(e) => setQ2Memo(e.target.value)}
            placeholder="새롭게 발견된 병목이나 고객 반응 기록 (선택)"
            className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
          />
        </div>

        {/* 질문 3 */}
        <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900">
              3. 결과 설명 후 고객이 실제 문제와 맞다고 느꼈는가?
            </h3>
            <span className="text-xs font-bold text-blue-600">{q3Score}점 / 5점</span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            도출된 1·2·3순위 AX 과제 및 위험 신호에 대한 고객의 공감도와 현실 적합성
          </p>
          {renderStarRating(q3Score, setQ3Score)}
          <input
            type="text"
            value={q3Memo}
            onChange={(e) => setQ3Memo(e.target.value)}
            placeholder="고객의 공감 피드백 및 이견 사항 기록 (선택)"
            className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
          />
        </div>

        {/* 파일럿 후 문항 수정 및 차기 버전 아이디어 */}
        <div className="space-y-2 pt-2">
          <label htmlFor="pilot-notes" className="block text-xs font-bold text-slate-700 flex items-center">
            <Lightbulb className="w-3.5 h-3.5 mr-1 text-amber-500" />
            파일럿 후 문항 수정 및 차기 버전(자동 처방/결과 웹페이지) 개선 아이디어
          </label>
          <textarea
            id="pilot-notes"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="예: Q14 복사·붙여넣기 질문에 툴 예시 추가 필요, 3인 이하 기업용 전용 처방 룰셋 보완 등"
            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
          <button
            id="close-feedback-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            닫기
          </button>
          <button
            id="save-feedback-btn"
            type="button"
            onClick={handleSave}
            className="flex items-center space-x-1.5 px-6 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-xs transition-all cursor-pointer"
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-blue-200" />
                <span>저장 완료!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>파일럿 검증 지표 저장하기</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
