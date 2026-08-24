/**
 * AIWORKS 기업 AX 간이진단 v0.1 글로벌 상수 설정
 */

// 기본 Google Apps Script Webhook URL (구글 시트 누적 + 구글 드라이브 영구 저장 + 이메일 자동 발송)
export const DEFAULT_GOOGLE_SHEET_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbzQRaOmsfwyIyfoLZqZYYYdV1rPETRn1DElToBUSdTK8w76bQMmg3yO-4JuNnSOk0a6JA/exec';

// 더 이상 유효하지 않은(배포 삭제된) 구 Webhook URL 목록
// localStorage에 이 값이 저장되어 있으면 무시하고 기본 URL로 마이그레이션한다.
const DEPRECATED_WEBHOOK_URLS = [
  'https://script.google.com/macros/s/AKfycby0qzdlehQQsER8BplqLPiJOZVUzaL4mWEVGIMvaw5jzqAy1iWKM-iF_h32HrmXEZYLlw/exec',
];

const WEBHOOK_STORAGE_KEY = 'aiworks_google_sheet_webhook_url';

// 유효한 Webhook URL을 가져오는 헬퍼 함수
export function getActiveWebhookUrl(): string {
  try {
    const saved = localStorage.getItem(WEBHOOK_STORAGE_KEY);
    if (saved && saved.trim().length > 0) {
      const trimmed = saved.trim();
      // 폐기된 구 배포 URL이면 무시하고 기본값 사용 (마이그레이션)
      if (!DEPRECATED_WEBHOOK_URLS.includes(trimmed)) {
        return trimmed;
      }
      localStorage.removeItem(WEBHOOK_STORAGE_KEY);
    }
  } catch (e) {
    // localStorage 접근 불가 환경 대비
  }
  return DEFAULT_GOOGLE_SHEET_WEBHOOK_URL;
}

export interface WebhookPostResult {
  ok: boolean;
  detail: string;
}

// Apps Script Webhook으로 진단 데이터를 전송하고 실제 응답을 검증하는 공통 함수.
// Content-Type을 text/plain으로 보내면 CORS preflight 없이 doPost의 JSON 응답을 읽을 수 있다.
export async function postDiagnosticToWebhook(
  webhookUrl: string,
  payload: Record<string, any>
): Promise<WebhookPostResult> {
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });

    if (!res.ok) {
      return { ok: false, detail: `Webhook 응답 코드 ${res.status}` };
    }

    let parsed: any = null;
    try {
      parsed = await res.json();
    } catch {
      parsed = null;
    }

    if (parsed && parsed.status === 'error') {
      return {
        ok: false,
        detail: parsed.message || '구글 시트 처리 중 오류가 발생했습니다.',
      };
    }
    if (parsed && parsed.status === 'success') {
      return { ok: true, detail: parsed.message || '' };
    }

    // 200 OK지만 JSON이 아닌 응답 (구버전 배포 등) -> 도달은 성공으로 간주
    return { ok: true, detail: '' };
  } catch (err: any) {
    return {
      ok: false,
      detail: err?.message || '네트워크 오류로 Webhook에 연결하지 못했습니다.',
    };
  }
}
