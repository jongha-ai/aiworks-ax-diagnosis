/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { DiagnosticForm } from './components/DiagnosticForm';
import { ReportView } from './components/ReportView';
import { ConsultantInterviewModal } from './components/ConsultantInterviewModal';
import { PilotFeedbackModal } from './components/PilotFeedbackModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { GoogleSyncModal } from './components/GoogleSyncModal';
import { calculateDiagnosticResult, SAMPLE_PRESETS } from './utils/axCalculator';
import { DiagnosticResult, ConsultantInterviewData, PilotFeedbackData } from './types';
import { getActiveWebhookUrl } from './constants';

const STORAGE_KEY_HISTORY = 'aiworks_ax_diagnostic_history_v01';
const STORAGE_KEY_DRAFT = 'aiworks_ax_diagnostic_draft_v01';

export default function App() {
  const [currentView, setCurrentView] = useState<'form' | 'report' | 'interview' | 'feedback' | 'history'>('form');
  const [companyName, setCompanyName] = useState<string>('');
  const [evaluatorName, setEvaluatorName] = useState<string>('');
  const [targetEmail, setTargetEmail] = useState<string>('');
  const [isGoogleSyncOpen, setIsGoogleSyncOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({
    q1: '대표·임원',
    q2: '2~5명',
    q3: '글쓰기·요약 등 일부 업무에 사용한다',
  });

  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const [history, setHistory] = useState<DiagnosticResult[]>([]);

  // Load history & draft on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }

      const savedDraft = localStorage.getItem(STORAGE_KEY_DRAFT);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.answers) setAnswers(parsed.answers);
        if (parsed.companyName) setCompanyName(parsed.companyName);
        if (parsed.evaluatorName) setEvaluatorName(parsed.evaluatorName);
        if (parsed.targetEmail) setTargetEmail(parsed.targetEmail);
      }
    } catch (e) {
      console.error('Failed to load local storage draft/history', e);
    }
  }, []);

  // Save draft whenever answers change
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY_DRAFT,
        JSON.stringify({ answers, companyName, evaluatorName, targetEmail })
      );
    } catch (e) {
      console.error('Failed to save draft', e);
    }
  }, [answers, companyName, evaluatorName, targetEmail]);

  // Answer change handler
  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  // Submit and calculate result & auto sync to local DB / Google Sheets
  const handleSubmitDiagnosis = () => {
    const finalCompanyName = companyName.trim() || '미지정 기업';
    const finalEvaluatorName = evaluatorName.trim() || '대표/담당자';

    const res = calculateDiagnosticResult(answers, finalCompanyName, finalEvaluatorName);
    res.targetEmail = targetEmail.trim();
    setDiagnosticResult(res);
    setCurrentView('report');

    // Save to history list
    const updatedHistory = [res, ...history.filter((h) => h.id !== res.id)];
    setHistory(updatedHistory);
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updatedHistory));
    } catch (e) {
      console.error('Failed to save history', e);
    }

    // Auto sync to Google Sheets Webhook (Direct no-cors) & optional local server
    try {
      const activeWebhook = getActiveWebhookUrl();
      if (activeWebhook) {
        const textSummary = `[AIWORKS 기업 AX 간이진단 결과]
회사명: ${res.companyName}
진단일: ${res.savedAt}
작성자: ${res.evaluatorName} (${res.evaluatorRole})
이메일: ${targetEmail.trim()}
총점: ${res.totalScore}점 / 100 (Level ${res.level.levelNumber}. ${res.level.title})
1순위 과제: ${res.priorityTasks.task1.title}
2순위 과제: ${res.priorityTasks.task2.title}
3순위 과제: ${res.priorityTasks.task3.title}
`;
        const webhookPayload = {
          eventType: 'ax_diagnosis_submitted',
          id: res.id,
          timestamp: res.savedAt || new Date().toISOString(),
          companyName: res.companyName,
          evaluatorName: res.evaluatorName,
          evaluatorRole: res.evaluatorRole,
          targetEmail: targetEmail.trim(),
          employeeCount: res.employeeCount,
          currentAiUsage: res.currentAiUsage,
          levelNumber: res.level?.levelNumber,
          levelTitle: res.level?.title,
          totalScore: res.totalScore,
          totalRawScore: res.totalRawScore,
          score_aiUsage: res.categoryScores?.aiUsage?.convertedScore,
          score_workProcess: res.categoryScores?.workProcess?.convertedScore,
          score_knowledge: res.categoryScores?.knowledgeManagement?.convertedScore,
          score_automation: res.categoryScores?.automation?.convertedScore,
          score_security: res.categoryScores?.verificationSecurity?.convertedScore,
          strongestDomain: res.strongestDomain?.title,
          bottleneckDomain: res.bottleneckDomain?.title,
          task1_title: res.priorityTasks?.task1?.title,
          task2_title: res.priorityTasks?.task2?.title,
          task3_title: res.priorityTasks?.task3?.title,
          q19_timeWaster: res.freeAnswers?.q19_timeWaster,
          q20_topPriority: res.freeAnswers?.q20_topPriority,
          triggeredRisks: (res.triggeredRisks || []).map((r: any) => r.title).join(', '),
          textSummary,
          fullJsonData: JSON.stringify(res),
        };

        fetch(activeWebhook, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookPayload),
        }).catch((err) => console.warn('Direct Google Webhook submit warning:', err));
      }

      // Optional local backend DB sync
      fetch('/api/sync-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          result: res,
          targetEmail: targetEmail.trim(),
          webhookUrl: activeWebhook,
        }),
      }).catch(() => {});
    } catch (e) {
      // ignore
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }
  };

  // Load sample presets
  const handleLoadPreset = (index: number) => {
    const preset = SAMPLE_PRESETS[index];
    if (!preset) return;

    setCompanyName(preset.companyName);
    setEvaluatorName(preset.evaluatorName);
    setAnswers(preset.data);

    const res = calculateDiagnosticResult(
      preset.data,
      preset.companyName,
      preset.evaluatorName
    );
    setDiagnosticResult(res);
    setCurrentView('report');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset form
  const handleReset = () => {
    if (window.confirm('설문 응답을 초기화하시겠습니까?')) {
      setAnswers({
        q1: '대표·임원',
        q2: '2~5명',
        q3: '글쓰기·요약 등 일부 업무에 사용한다',
      });
      setCompanyName('');
      setEvaluatorName('');
      setDiagnosticResult(null);
      setCurrentView('form');
      localStorage.removeItem(STORAGE_KEY_DRAFT);
    }
  };

  // Save Consultant Interview
  const handleSaveInterview = (interviewData: ConsultantInterviewData) => {
    if (!diagnosticResult) return;
    const updatedResult: DiagnosticResult = {
      ...diagnosticResult,
      consultantInterview: interviewData,
    };
    setDiagnosticResult(updatedResult);

    const updatedHistory = history.map((h) =>
      h.id === updatedResult.id ? updatedResult : h
    );
    setHistory(updatedHistory);
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updatedHistory));
    } catch (e) {
      console.error('Failed to update interview history', e);
    }
  };

  // Save Pilot Feedback
  const handleSaveFeedback = (feedbackData: PilotFeedbackData) => {
    if (!diagnosticResult) return;
    const updatedResult: DiagnosticResult = {
      ...diagnosticResult,
      pilotFeedback: feedbackData,
    };
    setDiagnosticResult(updatedResult);

    const updatedHistory = history.map((h) =>
      h.id === updatedResult.id ? updatedResult : h
    );
    setHistory(updatedHistory);
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updatedHistory));
    } catch (e) {
      console.error('Failed to update feedback history', e);
    }
  };

  // Select historical report
  const handleSelectHistoryItem = (item: DiagnosticResult) => {
    setDiagnosticResult(item);
    setCompanyName(item.companyName);
    setEvaluatorName(item.evaluatorName);
    setAnswers(item.rawAnswers || {});
    setCurrentView('report');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete history item
  const handleDeleteHistoryItem = (id: string) => {
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to delete history item', e);
    }
  };

  // Clear all history
  const handleClearAllHistory = () => {
    if (window.confirm('모든 진단 이력을 삭제하시겠습니까?')) {
      setHistory([]);
      try {
        localStorage.removeItem(STORAGE_KEY_HISTORY);
      } catch (e) {
        console.error('Failed to clear history', e);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <Header
        currentView={currentView}
        setCurrentView={setCurrentView}
        hasResult={diagnosticResult !== null}
        onReset={handleReset}
        onLoadPreset={handleLoadPreset}
        historyCount={history.length}
        onOpenGoogleSync={() => setIsGoogleSyncOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentView === 'form' && (
          <DiagnosticForm
            answers={answers}
            onAnswerChange={handleAnswerChange}
            companyName={companyName}
            setCompanyName={setCompanyName}
            evaluatorName={evaluatorName}
            setEvaluatorName={setEvaluatorName}
            targetEmail={targetEmail}
            setTargetEmail={setTargetEmail}
            onSubmit={handleSubmitDiagnosis}
            onLoadPreset={handleLoadPreset}
            onOpenGoogleSync={() => setIsGoogleSyncOpen(true)}
          />
        )}

        {currentView === 'report' && diagnosticResult && (
          <ReportView
            result={diagnosticResult}
            onOpenInterview={() => setCurrentView('interview')}
            onOpenFeedback={() => setCurrentView('feedback')}
            onRetest={() => setCurrentView('form')}
            onOpenGoogleSync={() => setIsGoogleSyncOpen(true)}
          />
        )}

        {currentView === 'interview' && (
          <ConsultantInterviewModal
            companyName={diagnosticResult?.companyName || companyName || '우리 회사'}
            interviewData={diagnosticResult?.consultantInterview}
            onSaveInterview={handleSaveInterview}
            onClose={() => setCurrentView(diagnosticResult ? 'report' : 'form')}
          />
        )}

        {currentView === 'feedback' && (
          <PilotFeedbackModal
            companyName={diagnosticResult?.companyName || companyName || '우리 회사'}
            feedbackData={diagnosticResult?.pilotFeedback}
            onSaveFeedback={handleSaveFeedback}
            onClose={() => setCurrentView(diagnosticResult ? 'report' : 'form')}
          />
        )}

        {currentView === 'history' && (
          <HistoryDrawer
            history={history}
            onSelectResult={handleSelectHistoryItem}
            onDeleteResult={handleDeleteHistoryItem}
            onClearAll={handleClearAllHistory}
            onClose={() => setCurrentView(diagnosticResult ? 'report' : 'form')}
          />
        )}
      </main>

      {/* Google Sheets & Drive Auto-Sync Modal */}
      <GoogleSyncModal
        isOpen={isGoogleSyncOpen}
        onClose={() => setIsGoogleSyncOpen(false)}
      />
    </div>
  );
}
