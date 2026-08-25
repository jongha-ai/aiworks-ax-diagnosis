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
import {
  createDiagnosisId,
  restoreDiagnosticDraft,
  STORAGE_KEY_DRAFT,
  STORAGE_KEY_HISTORY,
} from './utils/diagnosticDraft';
import { DiagnosticResult, ConsultantInterviewData, PilotFeedbackData } from './types';
import { getActiveWebhookUrl } from './constants';

export default function App() {
  const [currentView, setCurrentView] = useState<'form' | 'report' | 'interview' | 'feedback' | 'history'>('form');
  const [companyName, setCompanyName] = useState<string>('');
  const [evaluatorName, setEvaluatorName] = useState<string>('');
  const [targetEmail, setTargetEmail] = useState<string>('');
  const [isGoogleSyncOpen, setIsGoogleSyncOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [diagnosisId, setDiagnosisId] = useState(createDiagnosisId);
  const [isDraftActive, setIsDraftActive] = useState(true);
  const [isDraftReady, setIsDraftReady] = useState(false);

  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const [history, setHistory] = useState<DiagnosticResult[]>([]);

  // Load history and restore only an active, uncompleted draft on mount.
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(STORAGE_KEY_HISTORY);
      let parsedHistory: DiagnosticResult[] = [];
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed)) {
          parsedHistory = parsed;
          setHistory(parsedHistory);
        }
      }

      const savedDraft = localStorage.getItem(STORAGE_KEY_DRAFT);
      const restoredDraft = restoreDiagnosticDraft(savedDraft, parsedHistory);
      if (restoredDraft) {
        setDiagnosisId(restoredDraft.diagnosisId);
        setAnswers(restoredDraft.answers);
        setCompanyName(restoredDraft.companyName);
        setEvaluatorName(restoredDraft.evaluatorName);
        setTargetEmail(restoredDraft.targetEmail);
      } else if (savedDraft) {
        // Completed or malformed legacy drafts must not reopen as a new form.
        localStorage.removeItem(STORAGE_KEY_DRAFT);
      }
    } catch (e) {
      console.error('Failed to load local storage draft/history', e);
    } finally {
      setIsDraftReady(true);
    }
  }, []);

  // Save only the active in-progress draft. A completed diagnosis never recreates it.
  useEffect(() => {
    if (!isDraftReady) return;

    try {
      if (!isDraftActive) {
        localStorage.removeItem(STORAGE_KEY_DRAFT);
        return;
      }

      localStorage.setItem(
        STORAGE_KEY_DRAFT,
        JSON.stringify({
          schemaVersion: 1,
          diagnosisId,
          answers,
          companyName,
          evaluatorName,
          targetEmail,
        })
      );
    } catch (e) {
      console.error('Failed to save draft', e);
    }
  }, [answers, companyName, diagnosisId, evaluatorName, isDraftActive, isDraftReady, targetEmail]);

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

    const res = calculateDiagnosticResult(answers, finalCompanyName, finalEvaluatorName, diagnosisId);
    res.targetEmail = targetEmail.trim();
    setDiagnosticResult(res);
    setCurrentView('report');

    // Save to history list
    const updatedHistory = [res, ...history.filter((h) => h.id !== res.id)];
    setHistory(updatedHistory);
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updatedHistory));
      localStorage.removeItem(STORAGE_KEY_DRAFT);
    } catch (e) {
      console.error('Failed to save history', e);
    }

    // The completed answers remain in the result/history only, never as the next person's draft.
    setIsDraftActive(false);
    setAnswers({});
    setCompanyName('');
    setEvaluatorName('');
    setTargetEmail('');

    // Auto sync to Google Sheets Webhook (with response verification) & optional local server
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
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(webhookPayload),
          redirect: 'follow',
        })
          .then((r) => {
            if (!r.ok) console.warn('Direct Google Webhook submit failed with status:', r.status);
          })
          .catch((err) => console.warn('Direct Google Webhook submit warning:', err));
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

  // Start a distinct diagnostic session without touching completed history or external records.
  const handleStartNewDiagnosis = () => {
    const hasCurrentDraftData = Object.keys(answers).length > 0 || companyName || evaluatorName || targetEmail;
    if (isDraftActive && hasCurrentDraftData && !window.confirm('작성 중인 진단을 초기화하고 새 진단을 시작하시겠습니까?')) {
      return;
    }

    try {
      localStorage.removeItem(STORAGE_KEY_DRAFT);
    } catch (e) {
      console.error('Failed to clear previous draft', e);
    }

    setDiagnosisId(createDiagnosisId());
    setAnswers({});
    setCompanyName('');
    setEvaluatorName('');
    setTargetEmail('');
    setDiagnosticResult(null);
    setIsDraftActive(true);
    setCurrentView('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        hasActiveDraft={isDraftActive}
        onReset={handleStartNewDiagnosis}
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
            onRetest={handleStartNewDiagnosis}
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
