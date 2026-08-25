import React from 'react';
import logoLight from '../../logo/logo_horizontal_light.svg';
import {
  ClipboardCheck,
  FileText,
  ClipboardList,
  MessageSquareHeart,
  History,
  RotateCcw,
  BookOpen,
  FileSpreadsheet,
} from 'lucide-react';

interface HeaderProps {
  currentView: 'form' | 'report' | 'interview' | 'feedback' | 'history';
  setCurrentView: (view: 'form' | 'report' | 'interview' | 'feedback' | 'history') => void;
  hasResult: boolean;
  hasActiveDraft: boolean;
  onReset: () => void;
  onLoadPreset: (presetIndex: number) => void;
  historyCount: number;
  onOpenGoogleSync?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  setCurrentView,
  hasResult,
  hasActiveDraft,
  onReset,
  onLoadPreset,
  historyCount,
  onOpenGoogleSync,
}) => {
  return (
    <header
      className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs print:hidden whitespace-nowrap flex-nowrap"
      style={{ flexWrap: 'nowrap', whiteSpace: 'nowrap' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="flex items-center justify-between h-[60px] whitespace-nowrap flex-nowrap overflow-x-auto"
          style={{ flexWrap: 'nowrap', whiteSpace: 'nowrap' }}
        >
          {/* Logo & Branding: AIWORKS Light Logo (h-8 w-auto) + AX 간이진단 v0.1 Badge */}
          <div
            className="flex items-center space-x-2.5 cursor-pointer py-1 shrink-0 select-none mr-3 sm:mr-6 flex-nowrap whitespace-nowrap"
            onClick={() => setCurrentView('form')}
            title="AIWORKS AX 진단 홈으로 이동"
            style={{ flexWrap: 'nowrap', whiteSpace: 'nowrap' }}
          >
            <img
              src={logoLight}
              alt="AIWORKS"
              className="h-8 w-auto object-contain shrink-0"
            />
            <span className="text-[11px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] px-2 py-0.5 rounded-full tracking-tight whitespace-nowrap shrink-0">
              AX 간이진단 v0.1
            </span>
          </div>

          {/* Navigation tabs: single row layout */}
          <nav
            className="flex items-center space-x-1 sm:space-x-1.5 shrink-0 flex-nowrap whitespace-nowrap"
            style={{ flexWrap: 'nowrap', whiteSpace: 'nowrap' }}
          >
            <button
              id="nav-form-btn"
              onClick={() => {
                if (hasActiveDraft) setCurrentView('form');
                else onReset();
              }}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[13.5px] font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                currentView === 'form'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="whitespace-nowrap">진단 설문</span>
            </button>

            <button
              id="nav-report-btn"
              onClick={() => {
                if (hasResult) setCurrentView('report');
              }}
              disabled={!hasResult}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[13.5px] font-semibold transition-colors whitespace-nowrap shrink-0 ${
                currentView === 'report'
                  ? 'bg-blue-600 text-white shadow-xs cursor-pointer'
                  : hasResult
                  ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 cursor-pointer'
                  : 'text-slate-300 cursor-not-allowed'
              }`}
            >
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="whitespace-nowrap">결과 리포트</span>
              {hasResult && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse ml-0.5 shrink-0" />}
            </button>

            <button
              id="nav-interview-btn"
              onClick={() => {
                if (hasResult) setCurrentView('interview');
              }}
              disabled={!hasResult}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[13.5px] font-semibold transition-colors whitespace-nowrap shrink-0 ${
                currentView === 'interview'
                  ? 'bg-slate-900 text-white shadow-xs cursor-pointer'
                  : hasResult
                  ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 cursor-pointer'
                  : 'text-slate-300 cursor-not-allowed'
              }`}
              title="10~15분 인터뷰 타이머 & 문진표 작성"
            >
              <ClipboardList className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 shrink-0" />
              <span className="hidden md:inline whitespace-nowrap">인터뷰 타이머 & 시트</span>
              <span className="md:hidden whitespace-nowrap">인터뷰 시트</span>
            </button>

            <button
              id="nav-feedback-btn"
              onClick={() => setCurrentView('feedback')}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[13.5px] font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                currentView === 'feedback'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="마음챙김 놀이터 파일럿 피드백"
            >
              <MessageSquareHeart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 shrink-0" />
              <span className="hidden md:inline whitespace-nowrap">파일럿 피드백</span>
              <span className="md:hidden whitespace-nowrap">피드백</span>
            </button>

            <button
              id="nav-history-btn"
              onClick={() => setCurrentView('history')}
              className={`flex items-center space-x-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-[13.5px] font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                currentView === 'history'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="진단 이력 목록"
            >
              <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">이력</span>
              {historyCount > 0 && (
                <span className="text-[11px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded-full font-bold shrink-0">
                  {historyCount}
                </span>
              )}
            </button>
          </nav>

          {/* Quick preset & new diagnostic buttons */}
          <div className="flex items-center space-x-1.5 shrink-0 flex-nowrap ml-2 sm:ml-4">
            <div className="hidden xl:flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
              <span className="text-[11px] text-slate-500 font-semibold px-1.5 flex items-center whitespace-nowrap">
                <BookOpen className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                샘플:
              </span>
              <button
                id="preset-level1-btn"
                onClick={() => onLoadPreset(0)}
                className="text-xs px-2 py-0.5 bg-white hover:bg-slate-200 text-slate-700 rounded border border-slate-200 font-medium transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                title="Level 1 탐색/위험 기업"
              >
                Level 1
              </button>
              <button
                id="preset-level3-btn"
                onClick={() => onLoadPreset(1)}
                className="text-xs px-2 py-0.5 bg-white hover:bg-slate-200 text-slate-700 rounded border border-slate-200 font-medium transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                title="Level 3 성장 중소기업"
              >
                Level 3
              </button>
              <button
                id="preset-level5-btn"
                onClick={() => onLoadPreset(2)}
                className="text-xs px-2 py-0.5 bg-white hover:bg-slate-200 text-slate-700 rounded border border-slate-200 font-medium transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                title="Level 5 선도기업"
              >
                Level 5
              </button>
            </div>

            {onOpenGoogleSync && (
              <button
                onClick={onOpenGoogleSync}
                className="flex items-center space-x-1 px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer shrink-0 whitespace-nowrap shadow-2xs"
                title="구글 스프레드시트 및 드라이브 자동 저장 설정"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden lg:inline">구글 시트 연동</span>
              </button>
            )}

            <button
              id="header-reset-btn"
              onClick={onReset}
              className="flex items-center space-x-1 px-2 py-1.5 text-xs font-bold text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer shrink-0 whitespace-nowrap"
              title="새 진단 시작"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">새 진단</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
