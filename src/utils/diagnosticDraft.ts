export const STORAGE_KEY_HISTORY = 'aiworks_ax_diagnostic_history_v01';
export const STORAGE_KEY_DRAFT = 'aiworks_ax_diagnostic_draft_v01';

export interface DiagnosticDraft {
  schemaVersion: 1;
  diagnosisId: string;
  answers: Record<string, any>;
  companyName: string;
  evaluatorName: string;
  targetEmail: string;
}

export interface DiagnosticHistoryIdentity {
  id: string;
  companyName: string;
  evaluatorName: string;
  rawAnswers: Record<string, any>;
}

export function createDiagnosisId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return `ax-${globalThis.crypto.randomUUID()}`;
  }

  return `ax-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createDiagnosticDraft(diagnosisId = createDiagnosisId()): DiagnosticDraft {
  return {
    schemaVersion: 1,
    diagnosisId,
    answers: {},
    companyName: '',
    evaluatorName: '',
    targetEmail: '',
  };
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasSameAnswers(left: Record<string, any>, right: Record<string, any>): boolean {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  return leftKeys.length === rightKeys.length && leftKeys.every((key) => left[key] === right[key]);
}

/**
 * Restores only an active draft. Legacy drafts that match a completed history
 * record are discarded so a completed diagnosis cannot reopen as a new form.
 */
export function restoreDiagnosticDraft(
  rawDraft: string | null,
  history: DiagnosticHistoryIdentity[]
): DiagnosticDraft | null {
  if (!rawDraft) return null;

  try {
    const stored = JSON.parse(rawDraft);
    if (!isRecord(stored) || !isRecord(stored.answers)) return null;

    const hasStoredId = typeof stored.diagnosisId === 'string' && stored.diagnosisId.length > 0;
    const draft: DiagnosticDraft = {
      schemaVersion: 1,
      diagnosisId: hasStoredId ? stored.diagnosisId : createDiagnosisId(),
      answers: stored.answers,
      companyName: typeof stored.companyName === 'string' ? stored.companyName : '',
      evaluatorName: typeof stored.evaluatorName === 'string' ? stored.evaluatorName : '',
      targetEmail: typeof stored.targetEmail === 'string' ? stored.targetEmail : '',
    };

    if (history.some((item) => item.id === draft.diagnosisId)) return null;

    const isLegacyCompletedDraft = !hasStoredId && history.some((item) =>
      item.companyName === draft.companyName &&
      item.evaluatorName === draft.evaluatorName &&
      hasSameAnswers(item.rawAnswers || {}, draft.answers)
    );

    return isLegacyCompletedDraft ? null : draft;
  } catch {
    return null;
  }
}
