import React from 'react';
import {
  History,
  Trash2,
  ExternalLink,
  Download,
  Building2,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { DiagnosticResult } from '../types';

interface HistoryDrawerProps {
  history: DiagnosticResult[];
  onSelectResult: (result: DiagnosticResult) => void;
  onDeleteResult: (id: string) => void;
  onClearAll: () => void;
  onClose: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  history,
  onSelectResult,
  onDeleteResult,
  onClearAll,
  onClose,
}) => {
  const exportAllHistoryAsJson = () => {
    const dataStr = JSON.stringify(history, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aiworks-ax-diagnostic-history-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 pb-32">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">기업 AX 간이진단 이력 ({history.length}건)</h2>
            <p className="text-xs text-slate-500">로컬 브라우저에 저장된 과거 진단 결과 목록입니다.</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {history.length > 0 && (
            <>
              <button
                id="export-all-history-btn"
                type="button"
                onClick={exportAllHistoryAsJson}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                title="전체 이력 JSON 내보내기"
              >
                <Download className="w-3.5 h-3.5" />
                <span>JSON 백업</span>
              </button>
              <button
                id="clear-all-history-btn"
                type="button"
                onClick={onClearAll}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>전체 삭제</span>
              </button>
            </>
          )}
          <button
            id="close-history-btn"
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-white hover:bg-slate-700 transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
          <History className="w-10 h-10 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-slate-700">저장된 진단 이력이 없습니다.</p>
          <p className="text-xs text-slate-400">설문을 완료하고 결과를 산출하면 자동으로 이력에 보관됩니다.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {history.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl p-5 border border-slate-200 hover:border-blue-300 shadow-2xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${item.level.badgeColor}`}>
                    Level {item.level.levelNumber}
                  </span>
                  <h3 className="font-extrabold text-base text-slate-900 truncate">{item.companyName}</h3>
                  <span className="text-xs text-slate-500">| {item.savedAt}</span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                  <span>작성자: <strong className="text-slate-800">{item.evaluatorName}</strong></span>
                  <span>종합점수: <strong className="text-blue-600 font-bold">{item.totalScore}점</strong></span>
                  <span>가장 큰 병목: <strong className="text-amber-600 font-semibold">{item.bottleneckDomain.title}</strong></span>
                  {item.triggeredRisks.length > 0 && (
                    <span className="text-rose-600 font-semibold flex items-center">
                      <AlertTriangle className="w-3 h-3 mr-0.5" />
                      위험 {item.triggeredRisks.length}건
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 truncate font-medium">
                  1순위 과제: {item.priorityTasks.task1.title}
                </p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onSelectResult(item)}
                  className="flex items-center space-x-1 px-3.5 py-2 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  <span>리포트 열기</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteResult(item.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
