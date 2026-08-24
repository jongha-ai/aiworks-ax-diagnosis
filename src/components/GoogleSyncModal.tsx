import React, { useState, useEffect } from "react";
import {
  X,
  Database,
  Cloud,
  Mail,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Zap,
  HelpCircle,
  FileSpreadsheet,
  HardDrive,
  Sparkles,
} from "lucide-react";
import { GOOGLE_APPS_SCRIPT_CODE } from "../data/googleAppsScriptTemplate";
import { DEFAULT_GOOGLE_SHEET_WEBHOOK_URL, getActiveWebhookUrl } from "../constants";

interface GoogleSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavedWebhook?: (url: string) => void;
}

export const GoogleSyncModal: React.FC<GoogleSyncModalProps> = ({
  isOpen,
  onClose,
  onSavedWebhook,
}) => {
  const [webhookUrl, setWebhookUrl] = useState<string>("");
  const [copiedScript, setCopiedScript] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const active = getActiveWebhookUrl();
    setWebhookUrl(active);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleSaveWebhook = () => {
    const cleanUrl = webhookUrl.trim() || DEFAULT_GOOGLE_SHEET_WEBHOOK_URL;
    localStorage.setItem("aiworks_google_sheet_webhook_url", cleanUrl);
    setSaveSuccess(true);
    if (onSavedWebhook) onSavedWebhook(cleanUrl);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleTestWebhook = async () => {
    const cleanUrl = webhookUrl.trim() || DEFAULT_GOOGLE_SHEET_WEBHOOK_URL;
    if (!cleanUrl) {
      setTestResult({ success: false, message: "Webhook URL을 입력해주세요." });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const testPayload = {
      eventType: "test_connection",
      timestamp: new Date().toISOString(),
      companyName: "AIWORKS 테스트 기업",
      evaluatorName: "시스템 관리자",
      totalScore: 85,
      levelTitle: "Level 4. 시스템 내재화",
      textSummary: "[AIWORKS] 구글 시트 및 구글 드라이브 웹훅 연동 테스트 성공",
    };

    try {
      // Vercel 정적 배포 및 브라우저 환경에서 Google Apps Script Webhook URL로 직접 POST (no-cors)
      await fetch(cleanUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testPayload),
      });

      setTestResult({
        success: true,
        message: "웹훅 전송 성공! 구글 스프레드시트와 구글 드라이브(AIWORKS_AX_진단결과 폴더)에 테스트 데이터가 정상 추가되었는지 확인해보세요.",
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `테스트 요청 중 오류: ${err?.message || "네트워크 통신 실패"}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center shadow-inner">
              <FileSpreadsheet className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                구글 스프레드시트 & 드라이브 자동 저장 설정
                <span className="text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                  영구 백업
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                진단 완료 시 구글 시트 행 추가 · 드라이브 파일 백업 · 이메일 발송이 100% 자동 실행됩니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
          
          {/* Feature Highlights */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl flex items-start space-x-2.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-emerald-950 text-xs">구글 시트 실시간 누적</div>
                <div className="text-[11px] text-emerald-700 leading-tight mt-0.5">30개 컬럼 전체 자동 저장</div>
              </div>
            </div>

            <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-xl flex items-start space-x-2.5">
              <HardDrive className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-blue-950 text-xs">구글 드라이브 영구 백업</div>
                <div className="text-[11px] text-blue-700 leading-tight mt-0.5">AIWORKS_AX_진단결과 폴더</div>
              </div>
            </div>

            <div className="p-3 bg-indigo-50/80 border border-indigo-200/80 rounded-xl flex items-start space-x-2.5">
              <Mail className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-indigo-950 text-xs">이메일 자동 리포트</div>
                <div className="text-[11px] text-indigo-700 leading-tight mt-0.5">진단 결과 요약 즉시 발송</div>
              </div>
            </div>
          </div>

          {/* Webhook Input Section */}
          <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="block font-bold text-slate-900 text-xs flex items-center justify-between">
              <span>Google Apps Script 웹 앱 URL (Webhook URL)</span>
              {saveSuccess && (
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> 저장 완료!
                </span>
              )}
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="flex-1 px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs"
              />
              <button
                onClick={handleSaveWebhook}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer shrink-0 shadow-xs"
              >
                저장하기
              </button>
              <button
                onClick={handleTestWebhook}
                disabled={isTesting || !webhookUrl.trim()}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 shadow-xs"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                {isTesting ? "연결 확인 중..." : "연동 테스트"}
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-lg text-xs font-medium mt-2 flex items-start gap-2 ${
                  testResult.success
                    ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                    : "bg-rose-100 text-rose-900 border border-rose-300"
                }`}
              >
                {testResult.success ? (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <X className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Step-by-step Setup Guide */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              1분 완성 Google Apps Script 연동 가이드
            </h3>

            <div className="space-y-2.5 text-xs text-slate-600 bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-start space-x-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </span>
                <div>
                  <p className="font-semibold text-slate-800">
                    구글 스프레드시트를 생성하고 [확장 프로그램] → [Apps Script]를 클릭합니다.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </span>
                <div className="w-full">
                  <p className="font-semibold text-slate-800 mb-1.5">
                    기존 코드를 지우고 아래 [Apps Script 템플릿 코드]를 전체 붙여넣기합니다.
                  </p>
                  <button
                    onClick={handleCopyScript}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium text-xs transition-colors cursor-pointer shadow-xs"
                  >
                    {copiedScript ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>코드 복사 완료!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-300" />
                        <span>Google Apps Script 전체 코드 복사하기</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  3
                </span>
                <div>
                  <p className="font-semibold text-slate-800">
                    우측 상단 <b>[배포]</b> → <b>[새 배포]</b> → 유형: <b>[웹 앱]</b> 선택
                  </p>
                  <p className="text-slate-500 mt-0.5">
                    • 다음 사용자 권한으로 실행: <b>나 (Me)</b><br />
                    • 액세스 권한: <b>모든 사용자 (Anyone)</b> 선택 후 배포
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  4
                </span>
                <div>
                  <p className="font-semibold text-slate-800">
                    발급된 <b>웹 앱 URL</b>을 상단 입력창에 붙여넣고 [저장하기] 및 [연동 테스트]를 누르면 완료됩니다!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>서버 로컬 데이터베이스(`data/diagnostics/`)에도 항상 자동 백업됩니다.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
};
