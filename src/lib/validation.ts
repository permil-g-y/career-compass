/**
 * フォームバリデーション（要件定義書 33章）
 */

/** 電話番号を保存用に正規化する（全角数字・ハイフン・空白を除去した数字列） */
export function normalizePhone(input: string): string {
  return input
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[-‐‑–—ー－\s()（）]/g, '')
    .trim();
}

export interface LeadFormErrors {
  name: string;
  phone: string;
}

export const EMPTY_LEAD_ERRORS: LeadFormErrors = { name: '', phone: '' };

export function validateLeadForm(name: string, phone: string): LeadFormErrors {
  const trimmedName = name.trim();
  const digits = normalizePhone(phone);

  const nameError = !trimmedName
    ? 'お名前を入力してください。'
    : trimmedName.length < 2
      ? '入力内容を確認してください。'
      : '';

  const phoneError = !digits
    ? '電話番号を入力してください。'
    : !/^0\d{9,10}$/.test(digits)
      ? '正しい電話番号を入力してください。'
      : '';

  return { name: nameError, phone: phoneError };
}

export function hasLeadFormError(errors: LeadFormErrors): boolean {
  return Boolean(errors.name || errors.phone);
}
