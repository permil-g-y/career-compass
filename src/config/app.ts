/**
 * アプリ全体の可変設定。
 * 文言・遷移先は別途差し替え可能とする（要件定義書 29章）。
 */

/** 最終CTAのラベル */
export const FINAL_CTA_LABEL = 'キャリア相談について見る';

/** 最終CTAの遷移先。未設定（null）の場合は遷移しない。 */
export const FINAL_CTA_URL: string | null = null;

/** 診断完了演出の1ステップあたりの表示時間（ms） */
export const ANALYZE_STEP_DURATION = 620;

/** 詳細結果アンロック時の演出時間（ms） */
export const SUBMIT_DELAY = 750;
