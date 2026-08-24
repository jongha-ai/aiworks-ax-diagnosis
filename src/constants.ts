/**
 * AIWORKS 기업 AX 간이진단 v0.1 글로벌 상수 설정
 */

// 기본 Google Apps Script Webhook URL (구글 시트 누적 + 구글 드라이브 영구 저장 + 이메일 자동 발송)
export const DEFAULT_GOOGLE_SHEET_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycby0qzdlehQQsER8BplqLPiJOZVUzaL4mWEVGIMvaw5jzqAy1iWKM-iF_h32HrmXEZYLlw/exec';

// 유효한 Webhook URL을 가져오는 헬퍼 함수
export function getActiveWebhookUrl(): string {
  try {
    const saved = localStorage.getItem('aiworks_google_sheet_webhook_url');
    if (saved && saved.trim().length > 0) {
      return saved.trim();
    }
  } catch (e) {
    // localStorage 접근 불가 환경 대비
  }
  return DEFAULT_GOOGLE_SHEET_WEBHOOK_URL;
}
