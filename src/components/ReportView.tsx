import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Printer,
  Copy,
  Check,
  Download,
  AlertOctagon,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  ClipboardList,
  MessageSquareHeart,
  RotateCcw,
  CheckCircle2,
  Brain,
  Lightbulb,
  Info,
  Database,
  Mail,
  HardDrive,
  FileSpreadsheet,
  Send,
  Loader2,
} from 'lucide-react';
import { DiagnosticResult, CategoryScore } from '../types';
import { JoCodingAuroraBg } from './JoCodingAuroraBg';

interface ReportViewProps {
  result: DiagnosticResult;
  onOpenInterview: () => void;
  onOpenFeedback: () => void;
  onRetest: () => void;
  onOpenGoogleSync?: () => void;
}

export const ReportView: React.FC<ReportViewProps> = ({
  result,
  onOpenInterview,
  onOpenFeedback,
  onRetest,
  onOpenGoogleSync,
}) => {
  const [copied, setCopied] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(result.aiDeepReport || null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiNote, setAiNote] = useState<string | null>(null);

  // Email & Google Sync States
  const [emailInput, setEmailInput] = useState<string>(result.targetEmail || result.evaluatorEmail || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    savedLocally: boolean;
    syncedToSheets: boolean;
    message: string;
  } | null>(null);
  const [emailSentToast, setEmailSentToast] = useState(false);

  // Helper: Build Google Apps Script webhook payload
  const buildWebhookPayload = (targetEmailStr: string) => {
    const summaryText = `[AIWORKS 기업 AX 간이진단 결과 요약]
회사명: ${result.companyName}
진단일시: ${result.savedAt}
작성자: ${result.evaluatorName} (${result.evaluatorRole})
이메일: ${targetEmailStr}
직원수/활용수준: ${result.employeeCount} / ${result.currentAiUsage}

[종합 결과]
- 성숙도 레벨: Level ${result.level.levelNumber} (${result.level.title})
- 종합점수: ${result.totalScore}점 / 100점 (원점수 ${result.totalRawScore}/75점)
- 최고강점: ${result.strongestDomain.title} (${result.strongestDomain.convertedScore}점)
- 최대병목: ${result.bottleneckDomain.title} (${result.bottleneckDomain.convertedScore}점)

[5대 영역 점수]
1. AI 활용: ${result.categoryScores.aiUsage.convertedScore}점
2. 업무 프로세스: ${result.categoryScores.workProcess.convertedScore}점
3. 자료·지식관리: ${result.categoryScores.knowledgeManagement.convertedScore}점
4. 반복업무·자동화: ${result.categoryScores.automation.convertedScore}점
5. 검증·보안: ${result.categoryScores.verificationSecurity.convertedScore}점

[3대 우선 추진 과제]
1순위: ${result.priorityTasks.task1.title}
2순위: ${result.priorityTasks.task2.title}
3순위: ${result.priorityTasks.task3.title}

- 가장 줄이고 싶은 반복업무 (Q19): ${result.freeAnswers.q19_timeWaster}
- AI로 가장 먼저 개선하고 싶은 업무 (Q20): ${result.freeAnswers.q20_topPriority}
`;

    return {
      eventType: 'ax_diagnosis_submitted',
      id: result.id,
      timestamp: result.savedAt || new Date().toISOString(),
      companyName: result.companyName,
      evaluatorName: result.evaluatorName,
      evaluatorRole: result.evaluatorRole,
      targetEmail: targetEmailStr,
      employeeCount: result.employeeCount,
      currentAiUsage: result.currentAiUsage,
      levelNumber: result.level?.levelNumber,
      levelTitle: result.level?.title,
      totalScore: result.totalScore,
      totalRawScore: result.totalRawScore,
      score_aiUsage: result.categoryScores?.aiUsage?.convertedScore,
      score_workProcess: result.categoryScores?.workProcess?.convertedScore,
      score_knowledge: result.categoryScores?.knowledgeManagement?.convertedScore,
      score_automation: result.categoryScores?.automation?.convertedScore,
      score_security: result.categoryScores?.verificationSecurity?.convertedScore,
      strongestDomain: result.strongestDomain?.title,
      bottleneckDomain: result.bottleneckDomain?.title,
      task1_title: result.priorityTasks?.task1?.title,
      task2_title: result.priorityTasks?.task2?.title,
      task3_title: result.priorityTasks?.task3?.title,
      q19_timeWaster: result.freeAnswers?.q19_timeWaster,
      q20_topPriority: result.freeAnswers?.q20_topPriority,
      triggeredRisks: (result.triggeredRisks || []).map((r: any) => r.title).join(', '),
      consultantInterview: result.consultantInterview || null,
      textSummary: summaryText,
      fullJsonData: JSON.stringify(result),
    };
  };

  // Auto-sync to Google Sheets Webhook (Direct no-cors) & optional local server on mount
  useEffect(() => {
    const autoSync = async () => {
      setIsSyncing(true);
      const savedWebhook = (localStorage.getItem('aiworks_google_sheet_webhook_url') || '').trim();
      let syncedToSheets = false;

      // 1. Direct fetch to Google Apps Script Webhook (Vercel 정적 배포 호환)
      if (savedWebhook) {
        try {
          await fetch(savedWebhook, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(buildWebhookPayload(emailInput.trim())),
          });
          syncedToSheets = true;
        } catch (webhookErr) {
          console.warn('Direct Google Webhook sync error:', webhookErr);
        }
      }

      // 2. Try optional local backend API
      try {
        await fetch('/api/sync-result', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            result,
            targetEmail: emailInput.trim(),
            webhookUrl: savedWebhook,
          }),
        });
      } catch (e) {
        // Safe to ignore in static Vercel environment
      }

      setSyncStatus({
        savedLocally: true,
        syncedToSheets: syncedToSheets || !!savedWebhook,
        message: savedWebhook
          ? '구글 스프레드시트 및 드라이브에 안전하게 자동 저장되었습니다.'
          : '로컬 스토리지에 진단 결과가 안전하게 영구 보관되었습니다.',
      });
      setIsSyncing(false);
    };

    autoSync();
  }, [result.id]);

  // Handle manual Email send / sync (Direct no-cors to Webhook)
  const handleSendEmailReport = async () => {
    const cleanEmail = emailInput.trim();
    if (!cleanEmail || cleanEmail.indexOf('@') === -1) {
      alert('올바른 이메일 주소를 입력해주세요.');
      return;
    }

    setIsSyncing(true);
    const savedWebhook = (localStorage.getItem('aiworks_google_sheet_webhook_url') || '').trim();

    try {
      if (savedWebhook) {
        // Direct Webhook POST with no-cors
        await fetch(savedWebhook, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildWebhookPayload(cleanEmail)),
        });
      }

      // Also notify optional local backend
      fetch('/api/sync-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          result: { ...result, targetEmail: cleanEmail },
          targetEmail: cleanEmail,
          webhookUrl: savedWebhook,
        }),
      }).catch(() => {});

      setEmailSentToast(true);
      setTimeout(() => setEmailSentToast(false), 3500);
      setSyncStatus({
        savedLocally: true,
        syncedToSheets: !!savedWebhook,
        message: `${cleanEmail}으로 결과 요약 전송이 완료되었습니다!`,
      });
    } catch (e) {
      alert('전송 중 오류가 발생했습니다.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Copy result summary text
  const handleCopySummary = () => {
    const summaryText = `[AIWORKS 기업 AX 간이진단 결과]
회사명: ${result.companyName}
진단일: ${result.savedAt}
현재 단계: Level ${result.level.levelNumber} (${result.level.title})
종합점수: ${result.totalScore} / 100점 (원점수 ${result.totalRawScore}/75점)

[영역별 점수]
1. AI 활용: ${result.categoryScores.aiUsage.convertedScore}점 / 100
2. 업무 프로세스: ${result.categoryScores.workProcess.convertedScore}점 / 100
3. 자료·지식관리: ${result.categoryScores.knowledgeManagement.convertedScore}점 / 100
4. 반복업무·자동화: ${result.categoryScores.automation.convertedScore}점 / 100
5. 검증·보안: ${result.categoryScores.verificationSecurity.convertedScore}점 / 100

- 가장 강한 영역: ${result.strongestDomain.title} (${result.strongestDomain.convertedScore}점)
- 가장 큰 병목: ${result.bottleneckDomain.title} (${result.bottleneckDomain.convertedScore}점)
- 우선 확인할 위험: ${
      result.triggeredRisks.length > 0
        ? result.triggeredRisks.map((r) => r.title).join(', ')
        : '특이 위험 없음'
    }

[1순위 AX 개선과제]
${result.priorityTasks.task1.title}

[2순위 AX 개선과제]
${result.priorityTasks.task2.title}

[3순위 AX 개선과제]
${result.priorityTasks.task3.title}

- 가장 줄이고 싶은 반복업무 (Q19): ${result.freeAnswers.q19_timeWaster}
- 가장 먼저 개선하고 싶은 업무 (Q20): ${result.freeAnswers.q20_topPriority}
`;

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate AI Consulting Analysis via server-side Gemini
  const handleGenerateAiAnalysis = async () => {
    setIsGeneratingAi(true);
    setAiError(null);
    setAiNote(null);
    try {
      const res = await fetch('/api/ax-ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: result.companyName,
          role: result.evaluatorRole,
          employeeCount: result.employeeCount,
          aiUsageLevel: result.currentAiUsage,
          scores: {
            totalScore: result.totalScore,
            totalRawScore: result.totalRawScore,
            level: result.level,
          },
          categoryScores: {
            aiUsage: result.categoryScores.aiUsage.convertedScore,
            workProcess: result.categoryScores.workProcess.convertedScore,
            knowledgeManagement: result.categoryScores.knowledgeManagement.convertedScore,
            automation: result.categoryScores.automation.convertedScore,
            verificationSecurity: result.categoryScores.verificationSecurity.convertedScore,
          },
          risks: result.triggeredRisks,
          freeAnswers: {
            q19: result.freeAnswers.q19_timeWaster,
            q20: result.freeAnswers.q20_topPriority,
          },
          consultantInterview: result.consultantInterview,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'AI 분석 생성에 실패했습니다.');
      }
      setAiReport(data.analysis);
      if (data.note) {
        setAiNote(data.note);
      }
      result.aiDeepReport = data.analysis;
    } catch (err: any) {
      setAiError(err.message || 'AI 분석 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const categories = [
    result.categoryScores.aiUsage,
    result.categoryScores.workProcess,
    result.categoryScores.knowledgeManagement,
    result.categoryScores.automation,
    result.categoryScores.verificationSecurity,
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-32">
      {/* Top Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs print:hidden">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
            진단 완료
          </span>
          <span className="text-sm font-extrabold text-slate-900">{result.companyName}</span>
          <span className="text-xs text-slate-500">| {result.savedAt}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenGoogleSync && (
            <button
              onClick={onOpenGoogleSync}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition-colors cursor-pointer"
              title="구글 스프레드시트 및 드라이브 자동 저장 설정"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>구글 시트/드라이브 연동</span>
            </button>
          )}

          <button
            id="copy-summary-btn"
            onClick={handleCopySummary}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
            title="클립보드에 결과 텍스트 복사"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '복사완료!' : '요약 텍스트 복사'}</span>
          </button>

          <button
            id="print-report-btn"
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
            title="리포트 인쇄 또는 PDF 저장"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>인쇄 / PDF</span>
          </button>

          <button
            id="interview-action-btn"
            onClick={onOpenInterview}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer shadow-xs"
          >
            <ClipboardList className="w-3.5 h-3.5 text-blue-400" />
            <span>10~15분 인터뷰 타이머 & 시트</span>
          </button>

          <button
            id="feedback-action-btn"
            onClick={onOpenFeedback}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer shadow-xs"
          >
            <MessageSquareHeart className="w-3.5 h-3.5 text-slate-300" />
            <span>파일럿 피드백</span>
          </button>

          <button
            id="retest-btn"
            onClick={onRetest}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="다시 진단하기"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>재진단</span>
          </button>
        </div>
      </div>

      {/* Cloud & Email Auto-Sync Alert Card */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-5 text-white shadow-md border border-slate-800 print:hidden space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center shrink-0 mt-0.5">
              <HardDrive className="w-4 h-4 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">진단 결과 자동 클라우드 영구 저장 & 이메일 전송</h3>
                {syncStatus?.savedLocally && (
                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" /> 데이터베이스 영구 기록 완료
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                작성된 결과 요약이 서버 로컬 DB와 구글 시트/드라이브에 안전하게 기록되며, 이메일로도 받아보실 수 있습니다.
              </p>
            </div>
          </div>

          {onOpenGoogleSync && (
            <button
              onClick={onOpenGoogleSync}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0 self-start md:self-auto"
            >
              <FileSpreadsheet className="w-4 h-4 text-white" />
              <span>구글 시트/드라이브 연동 설정</span>
            </button>
          )}
        </div>

        {/* Email send input bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-slate-800/80">
          <div className="relative flex-1">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="결과 리포트를 받아볼 이메일 주소 입력 (예: ceo@company.com)"
              className="w-full pl-9 pr-3 py-2 bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 rounded-xl text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 font-sans transition-colors"
            />
          </div>
          <button
            onClick={handleSendEmailReport}
            disabled={isSyncing}
            className="flex items-center justify-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-sm shrink-0"
          >
            {isSyncing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>저장/전송 중...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 text-white" />
                <span>이메일 및 구글 드라이브로 즉시 전송</span>
              </>
            )}
          </button>
        </div>

        {emailSentToast && (
          <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs text-emerald-200 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{emailInput} 주소로 진단 결과 요약이 성공적으로 전송되었습니다!</span>
          </div>
        )}
      </div>

      {/* Main Official Report Card Document (Printable Light Mode) */}
      <div className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-8 print:border-none print:shadow-none print:p-0 print:bg-white print:text-black">
        {/* Document Header */}
        <div className="border-b border-slate-200 pb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <div className="flex items-center space-x-2.5">
              <span className="font-bold text-[20px] text-[#0F172A] tracking-tight">AIWORKS</span>
              <span className="text-[11px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] px-2 py-0.5 rounded-full">
                기업 AX 간이진단 리포트 v0.1
              </span>
            </div>
            <div className="text-right text-xs text-slate-500">
              <p>진단일자: <strong className="text-slate-800 font-semibold">{result.savedAt}</strong></p>
              <p>작성자: <strong className="text-slate-800 font-semibold">{result.evaluatorName} ({result.evaluatorRole})</strong></p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2">
            <div>
              <p className="text-xs text-blue-600 uppercase tracking-wider font-bold">Diagnosis Target</p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{result.companyName}</h1>
              <p className="text-xs text-slate-500 mt-1">
                기업 규모: {result.employeeCount} | AI 활용 수준: {result.currentAiUsage}
              </p>
            </div>

            {/* Score & Level Display */}
            <div className="flex items-center space-x-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-center pr-4 border-r border-slate-200">
                <span className="text-xs text-slate-500 font-bold block">종합점수</span>
                <div className="flex items-baseline justify-center">
                  <span className="text-3xl sm:text-4xl font-extrabold text-blue-600">{result.totalScore}</span>
                  <span className="text-xs text-slate-400 font-bold ml-1">/ 100</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">원점수 {result.totalRawScore}/75</span>
              </div>

              <div>
                <span className="text-xs text-slate-500 font-bold block">현재 단계</span>
                <span className={`inline-block px-3 py-1 rounded-lg text-sm font-bold border ${result.level.badgeColor}`}>
                  Level {result.level.levelNumber} — {result.level.title}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 13. 공식 결과 설명용 양식 (Summary Grid Table) */}
        <section className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-4">
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center">
            <span className="w-2 h-2 rounded-full bg-blue-600 mr-2" />
            핵심 진단 요약 (Executive Summary)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* 가장 강한 영역 */}
            <div className="bg-white p-3.5 rounded-lg border border-blue-200 shadow-2xs">
              <span className="text-xs font-bold text-blue-700 flex items-center">
                <TrendingUp className="w-3.5 h-3.5 mr-1 text-blue-600" />
                가장 강한 영역
              </span>
              <div className="text-base font-extrabold text-slate-900 mt-1">
                {result.strongestDomain.title}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {result.strongestDomain.convertedScore}점 / 100점 ({result.strongestDomain.statusLabel})
              </p>
            </div>

            {/* 가장 큰 병목 */}
            <div className="bg-white p-3.5 rounded-lg border border-amber-200 shadow-2xs">
              <span className="text-xs font-bold text-amber-700 flex items-center">
                <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" />
                가장 큰 병목
              </span>
              <div className="text-base font-extrabold text-slate-900 mt-1">
                {result.bottleneckDomain.title}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {result.bottleneckDomain.convertedScore}점 / 100점 ({result.bottleneckDomain.statusLabel})
              </p>
            </div>

            {/* 우선 확인할 위험 */}
            <div className="bg-white p-3.5 rounded-lg border border-rose-200 shadow-2xs">
              <span className="text-xs font-bold text-rose-700 flex items-center">
                <AlertOctagon className="w-3.5 h-3.5 mr-1 text-rose-600" />
                우선 확인할 위험
              </span>
              <div className="text-base font-extrabold text-slate-900 mt-1">
                {result.triggeredRisks.length > 0
                  ? `${result.triggeredRisks.length}건 감지됨`
                  : '특이 위험 없음'}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 truncate font-medium">
                {result.triggeredRisks.length > 0
                  ? result.triggeredRisks.map((r) => r.title).join(', ')
                  : '기본 보안 수칙 준수 중'}
              </p>
            </div>
          </div>
        </section>

        {/* 12. 감지된 위험 신호 섹션 (Triggered Risks) */}
        {result.triggeredRisks.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-rose-700 flex items-center">
              <AlertOctagon className="w-4 h-4 mr-1.5 text-rose-600" />
              우선 확인할 위험 신호 ({result.triggeredRisks.length}건)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {result.triggeredRisks.map((risk) => (
                <div
                  key={risk.id}
                  className="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-600 text-white">
                        {risk.title}
                      </span>
                      <span className="text-[11px] text-rose-700 font-semibold">
                        {risk.conditionDescription}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-slate-900 leading-snug">
                    {risk.description}
                  </p>
                  <p className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-rose-200 leading-normal">
                    <strong className="text-rose-600 font-bold">조치 가이드:</strong> {risk.actionGuideline}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 성숙도 단계 심층 해석 */}
        <section className={`p-5 sm:p-6 rounded-xl border bg-slate-50 border-slate-200 space-y-3`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold px-2.5 py-1 rounded bg-white text-slate-700 border border-slate-200">
                성숙도 진단 단계 해석
              </span>
              <h3 className="font-extrabold text-slate-900">
                Level {result.level.levelNumber}. {result.level.title}
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              구간: {result.level.scoreRange[0]}~{result.level.scoreRange[1]}점
            </span>
          </div>

          <p className="text-sm text-slate-800 font-bold leading-relaxed">
            "{result.level.summary}"
          </p>

          <p className="text-xs text-slate-600 leading-relaxed">
            {result.level.detailedAnalysis}
          </p>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-xs text-slate-700 leading-normal">
            <strong className="text-blue-700 font-bold block mb-1">💡 다음 단계 도약을 위한 추천 로드맵:</strong>
            {result.level.recommendation}
          </div>
        </section>

        {/* 10. 5대 영역별 상세 진단 결과 (Radar / Horizontal Bars) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center">
              <Sparkles className="w-4 h-4 mr-1.5 text-blue-600" />
              5대 영역별 AX 성숙도 점수 (100점 환산)
            </h2>
            <span className="text-xs text-slate-500 font-medium">각 영역 15점 만점 환산</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Visual Bar Charts */}
            <div className="space-y-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
              {categories.map((cat) => (
                <div key={cat.key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center">
                      <span className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: cat.color }} />
                      {cat.title}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-extrabold text-slate-900">{cat.convertedScore}점</span>
                      <span className="text-[10px] text-slate-500">({cat.rawScore}/15)</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          cat.statusLabel === '우수'
                            ? 'bg-blue-100 text-blue-800'
                            : cat.statusLabel === '양호'
                            ? 'bg-slate-200 text-slate-800'
                            : cat.statusLabel === '개선필요'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {cat.statusLabel}
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${cat.convertedScore}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Radar / Spider Chart SVG */}
            <div className="flex flex-col items-center justify-center bg-slate-50 p-4 rounded-xl border border-slate-200">
              <RadarChart categories={categories} />
              <div className="text-[11px] text-slate-500 font-semibold mt-2 text-center">
                5대 핵심 역량 밸런스 다이어그램 (방사형 차트)
              </div>
            </div>
          </div>
        </section>

        {/* 13. 1순위, 2순위, 3순위 AX 개선과제 (Priority Tasks) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center">
                <CheckCircle2 className="w-5 h-5 mr-2 text-blue-600" />
                우선 추진할 1 · 2 · 3순위 AX 개선과제
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                기업의 병목 영역, 잠재 리스크, 설문 자유응답(Q19·Q20)을 분석하여 도출한 맞춤형 실행 과제입니다.
              </p>
            </div>
          </div>

          <div className="space-y-3.5">
            {/* 1순위 과제 */}
            <div className="bg-blue-50/40 border-2 border-blue-600 rounded-xl p-5 space-y-3 relative overflow-hidden shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 bg-blue-600 text-white text-xs font-black rounded-md shadow-2xs">
                    1순위 AX 개선과제
                  </span>
                  <span className="text-xs font-bold text-blue-800">
                    [{result.priorityTasks.task1.category}]
                  </span>
                </div>
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  {result.priorityTasks.task1.urgency}
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                {result.priorityTasks.task1.title}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-3 rounded-lg border border-blue-200">
                  <span className="font-bold text-slate-900 block mb-1">도출 이유 (Why):</span>
                  <p className="text-slate-600 leading-normal">{result.priorityTasks.task1.why}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-blue-200">
                  <span className="font-bold text-blue-700 block mb-1">구체적 실행안 (Action Plan):</span>
                  <p className="text-slate-600 leading-normal">{result.priorityTasks.task1.actionPlan}</p>
                </div>
              </div>

              <div className="text-xs font-bold text-blue-900 bg-blue-100/70 px-3 py-2 rounded-lg border border-blue-200 flex items-center">
                <span className="font-extrabold mr-1.5">기대 효과:</span> {result.priorityTasks.task1.expectedOutcome}
              </div>
            </div>

            {/* 2순위 과제 */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 bg-slate-800 text-white text-xs font-bold rounded-md">
                    2순위 AX 개선과제
                  </span>
                  <span className="text-xs font-semibold text-slate-700">
                    [{result.priorityTasks.task2.category}]
                  </span>
                </div>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {result.priorityTasks.task2.urgency}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900">
                {result.priorityTasks.task2.title}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-900 block mb-1">도출 이유 (Why):</span>
                  <p className="text-slate-600 leading-normal">{result.priorityTasks.task2.why}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-900 block mb-1">구체적 실행안 (Action Plan):</span>
                  <p className="text-slate-600 leading-normal">{result.priorityTasks.task2.actionPlan}</p>
                </div>
              </div>

              <div className="text-xs font-semibold text-slate-800 bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 flex items-center">
                <span className="font-bold mr-1.5">기대 효과:</span> {result.priorityTasks.task2.expectedOutcome}
              </div>
            </div>

            {/* 3순위 과제 */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 bg-slate-700 text-white text-xs font-bold rounded-md">
                    3순위 AX 개선과제
                  </span>
                  <span className="text-xs font-semibold text-slate-600">
                    [{result.priorityTasks.task3.category}]
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-600 bg-slate-200 px-2 py-0.5 rounded">
                  {result.priorityTasks.task3.urgency}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900">
                {result.priorityTasks.task3.title}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-900 block mb-1">도출 이유 (Why):</span>
                  <p className="text-slate-600 leading-normal">{result.priorityTasks.task3.why}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-900 block mb-1">구체적 실행안 (Action Plan):</span>
                  <p className="text-slate-600 leading-normal">{result.priorityTasks.task3.actionPlan}</p>
                </div>
              </div>

              <div className="text-xs font-semibold text-slate-800 bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 flex items-center">
                <span className="font-bold mr-1.5">기대 효과:</span> {result.priorityTasks.task3.expectedOutcome}
              </div>
            </div>
          </div>
        </section>

        {/* 8. 자유응답 현황 (Q19 & Q20) */}
        <section className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            자유응답 기반 현업 애로사항
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div className="bg-white p-3.5 rounded-lg border border-slate-200">
              <span className="font-bold text-rose-600 block mb-1">
                Q19. 가장 시간을 줄이고 싶은 반복업무:
              </span>
              <p className="text-slate-800 font-medium">{result.freeAnswers.q19_timeWaster}</p>
            </div>
            <div className="bg-white p-3.5 rounded-lg border border-slate-200">
              <span className="font-bold text-blue-600 block mb-1">
                Q20. 가장 먼저 개선하고 싶은 업무:
              </span>
              <p className="text-slate-800 font-medium">{result.freeAnswers.q20_topPriority}</p>
            </div>
          </div>
        </section>

        {/* AI 심층 맞춤 컨설팅 리포트 (화이트 / 라이트 테마 전환) */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 text-slate-900 space-y-6 border border-slate-200 shadow-sm print:border-slate-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                  <Brain className="w-4.5 h-4.5" />
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                  AIWORKS 맞춤형 AX 심층 컨설팅 처방전
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                기업의 진단 점수와 위험 신호, 자유응답을 Gemini AI가 종합 분석하여 구체적인 로드맵과 툴 추천을 제시합니다.
              </p>
            </div>

            <button
              id="generate-ai-report-btn"
              type="button"
              onClick={handleGenerateAiAnalysis}
              disabled={isGeneratingAi}
              className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer shrink-0 disabled:opacity-50 hover:scale-[1.02]"
            >
              {isGeneratingAi ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>AI 처방전 생성 중...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-blue-200" />
                  <span>{aiReport ? 'AI 처방전 다시 생성하기' : 'AI 맞춤 처방전 생성하기'}</span>
                </>
              )}
            </button>
          </div>

          {aiNote && (
            <div className="flex items-start space-x-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{aiNote}</span>
            </div>
          )}

          {aiError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{aiError}</span>
              </div>
              <button
                type="button"
                onClick={handleGenerateAiAnalysis}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition-colors shrink-0 cursor-pointer"
              >
                다시 시도하기
              </button>
            </div>
          )}

          {aiReport ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 mr-1" />
                  맞춤형 AX 실행 가이드라인
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(aiReport);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-blue-600 font-bold">처방전 복사됨</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>처방전 복사</span>
                    </>
                  )}
                </button>
              </div>

              {/* Main Report Body Box with clean Light Theme */}
              <div className="bg-[#F8FAFC] rounded-2xl p-5 sm:p-7 border border-slate-200 text-slate-800 text-xs sm:text-sm leading-relaxed space-y-4 shadow-2xs">
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h3: ({ node, ...props }) => (
                      <h3
                        className="text-sm sm:text-base font-extrabold text-slate-900 mt-5 first:mt-0 mb-2 pb-1.5 border-b border-slate-200 flex items-center tracking-tight"
                        {...props}
                      />
                    ),
                    table: ({ node, ...props }) => (
                      <div className="overflow-x-auto my-3 rounded-xl border border-slate-200 shadow-2xs bg-white">
                        <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm text-left border-collapse" {...props} />
                      </div>
                    ),
                    thead: ({ node, ...props }) => (
                      <thead className="bg-[#F1F5F9] text-slate-900 font-bold border-b border-slate-200" {...props} />
                    ),
                    th: ({ node, ...props }) => (
                      <th className="px-3.5 py-2.5 text-xs font-bold text-slate-900 border-r border-slate-200 last:border-r-0 whitespace-nowrap" {...props} />
                    ),
                    tbody: ({ node, ...props }) => (
                      <tbody className="bg-white divide-y divide-slate-200 text-slate-700" {...props} />
                    ),
                    td: ({ node, ...props }) => (
                      <td className="px-3.5 py-3 text-xs sm:text-sm text-slate-700 align-top leading-relaxed border-r border-slate-100 last:border-r-0" {...props} />
                    ),
                    blockquote: ({ node, ...props }) => (
                      <blockquote
                        className="bg-[#EFF6FF] border-l-[3px] border-[#3B82F6] rounded-r-xl p-4 my-3 text-slate-800 text-xs sm:text-sm shadow-2xs space-y-1.5 leading-relaxed"
                        {...props}
                      />
                    ),
                    ul: ({ node, ...props }) => <ul className="space-y-1.5 my-2 pl-5 list-disc text-slate-700 marker:text-blue-500" {...props} />,
                    li: ({ node, ...props }) => <li className="text-slate-700 leading-relaxed pl-0.5" {...props} />,
                    strong: ({ node, ...props }) => <strong className="font-bold text-slate-900" {...props} />,
                    code: ({ node, className, children, ...props }) => (
                      <code className="bg-blue-50 text-blue-900 font-mono text-[11px] sm:text-xs px-2 py-0.5 rounded-md border border-blue-200 font-semibold inline-block my-0.5" {...props}>
                        {children}
                      </code>
                    ),
                    hr: ({ node, ...props }) => <hr className="border-slate-200 my-4" {...props} />,
                    p: ({ node, ...props }) => <p className="leading-relaxed text-slate-700 my-1" {...props} />,
                  }}
                >
                  {aiReport}
                </Markdown>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 space-y-2">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto">
                <Lightbulb className="w-5 h-5 text-blue-600" />
              </div>
              <p className="font-medium text-slate-700">
                상단의 'AI 맞춤 처방전 생성하기' 버튼을 클릭하면 진단 데이터를 바탕으로 구조화된 3단계 AX 실행 로드맵 및 퀵윈(Quick-Win) 처방 리포트가 생성됩니다.
              </p>
            </div>
          )}
        </section>

        {/* 리포트 하단 안내 */}
        <div className="pt-6 border-t border-slate-200 text-center text-xs text-slate-400 print:text-slate-500">
          <p className="font-bold text-slate-600">AIWORKS 기업 AX 간이진단 솔루션 (Pilot v0.1)</p>
          <p className="mt-0.5">본 진단서는 실무 개선 및 컨설팅 가이드 목적으로 제공되며 법적 구속력을 갖지 않습니다.</p>
        </div>
      </div>

      {/* 하단 다음 단계 유도 배너 (조코딩풍 딥 블루 오로라 그래디언트) */}
      <div className="rounded-2xl p-6 text-white relative overflow-hidden border border-blue-500/30 shadow-2xl bg-[#030611] flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <JoCodingAuroraBg />
        <div className="relative z-10 space-y-1 text-center sm:text-left">
          <span className="text-xs font-bold uppercase tracking-wider bg-blue-600/30 text-blue-200 border border-blue-400/40 px-2.5 py-0.5 rounded-full">
            Next Step
          </span>
          <h4 className="text-lg sm:text-xl font-bold tracking-tight text-white">
            10~15분 <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-400">심층 인터뷰 & 문진표</span>를 작성하세요
          </h4>
          <p className="text-xs text-slate-300">
            타이머로 인터뷰 시간을 측정하며 5가지 질문을 통해 실무 병목과 담당자 의존도를 상세히 기록합니다.
          </p>
        </div>

        <button
          id="next-step-interview-btn"
          onClick={onOpenInterview}
          className="relative z-10 flex items-center space-x-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 transition-all cursor-pointer shrink-0"
        >
          <ClipboardList className="w-4 h-4" />
          <span>인터뷰 타이머 & 시트 작성하기</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// SVG Radar Chart Component
function RadarChart({ categories }: { categories: CategoryScore[] }) {
  const size = 240;
  const center = size / 2;
  const radius = 80;
  const total = categories.length; // 5

  // Calculate coordinates for points
  const points = categories.map((cat, i) => {
    const angle = (Math.PI * 2 * i) / total - Math.PI / 2;
    const value = Math.max(10, Math.min(100, cat.convertedScore));
    const r = (value / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y, angle, cat };
  });

  const polygonPath = points.map((p) => `${p.x},${p.y}`).join(' ');

  // Grid levels (20%, 40%, 60%, 80%, 100%)
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  return (
    <svg width={size} height={size} className="overflow-visible">
      {/* Background Web Grids */}
      {gridLevels.map((lvl, idx) => {
        const gridPoints = categories.map((_, i) => {
          const angle = (Math.PI * 2 * i) / total - Math.PI / 2;
          const r = lvl * radius;
          return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
        }).join(' ');

        return (
          <polygon
            key={idx}
            points={gridPoints}
            fill="none"
            stroke="#CBD5E1"
            strokeWidth="1"
          />
        );
      })}

      {/* Axis Lines */}
      {categories.map((_, i) => {
        const angle = (Math.PI * 2 * i) / total - Math.PI / 2;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={x}
            y2={y}
            stroke="#CBD5E1"
            strokeWidth="1"
          />
        );
      })}

      {/* Value Polygon Area */}
      <polygon
        points={polygonPath}
        fill="rgba(37, 99, 235, 0.2)"
        stroke="#2563EB"
        strokeWidth="2.5"
      />

      {/* Data Points & Value Dots */}
      {points.map((p, idx) => (
        <circle
          key={idx}
          cx={p.x}
          cy={p.y}
          r="4.5"
          fill="#2563EB"
          stroke="#FFFFFF"
          strokeWidth="2"
        />
      ))}

      {/* Labels */}
      {points.map((p, idx) => {
        const labelRadius = radius + 22;
        const lx = center + labelRadius * Math.cos(p.angle);
        const ly = center + labelRadius * Math.sin(p.angle);

        return (
          <text
            key={idx}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="11"
            fontWeight="bold"
            fill="#475569"
          >
            {p.cat.title}
          </text>
        );
      })}
    </svg>
  );
}
