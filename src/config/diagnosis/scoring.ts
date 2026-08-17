/**
 * スコアリング設定（診断ロジック仕様書 3〜9章・12章）
 *
 * 閾値・weight・ボーナス値はすべてこのファイルで一元管理する。
 * 運用中の調整はここだけを書き換えれば済むようにする。
 */
import type { Grade, ReadinessKey, RiskFlagId } from '../../types/diagnosis';

/* ------------------------------------------------------------------ *
 * 3. 各設問のスコア
 * ------------------------------------------------------------------ */

/**
 * 選択肢 index → score のテーブル。
 * Q8 のみ「最終面接」「内定あり」がともに 5 点（仕様書 3章 Q8）。
 */
export const QUESTION_SCORES: Record<'q2' | 'q3' | 'q4' | 'q5' | 'q6' | 'q7' | 'q8', number[]> = {
  q2: [1, 2, 3, 4, 5],
  q3: [1, 2, 3, 4, 5],
  q4: [1, 2, 3, 4, 5],
  q5: [1, 2, 3, 4, 5],
  q6: [1, 2, 3, 4, 5],
  q7: [1, 2, 3, 4, 5],
  q8: [1, 2, 3, 4, 5, 5],
};

/** Q1「まだ特にない」のときのガクチカ準備度（仕様書 3章 Q1 / 4.2） */
export const GAKUCHIKA_NO_EXPERIENCE_SCORE = 1;

/* ------------------------------------------------------------------ *
 * 4.3 キャリア設計
 * ------------------------------------------------------------------ */

/** Q9 / Q10 の clarity 値（「まだ分からない」= 1、それ以外 = 5） */
export const CLARITY_SCORE = {
  unknown: 1,
  known: 5,
} as const;

/** career_design = Q4×0.70 + Q9_clarity×0.15 + Q10_clarity×0.15 */
export const CAREER_DESIGN_WEIGHTS = {
  q4: 0.7,
  q9Clarity: 0.15,
  q10Clarity: 0.15,
} as const;

/* ------------------------------------------------------------------ *
 * 5. 7項目のA〜E変換
 * ------------------------------------------------------------------ */

/** score（1.0〜5.0）→ grade。上から順に評価する。 */
export const READINESS_GRADE_THRESHOLDS: { min: number; grade: Grade }[] = [
  { min: 4.5, grade: 'A' },
  { min: 3.5, grade: 'B' },
  { min: 2.5, grade: 'C' },
  { min: 1.5, grade: 'D' },
  { min: 1.0, grade: 'E' },
];

/* ------------------------------------------------------------------ *
 * 6. 総合スコア
 * ------------------------------------------------------------------ */

/** 7項目の重み（合計 1.00） */
export const READINESS_WEIGHTS: Record<ReadinessKey, number> = {
  self_understanding: 0.15,
  gakuchika: 0.15,
  career_design: 0.2,
  company_selection: 0.15,
  application_preparation: 0.15,
  interview_preparation: 0.1,
  selection_experience: 0.1,
};

/** 7項目の表示ラベル */
export const READINESS_LABELS: Record<ReadinessKey, string> = {
  self_understanding: '自己理解',
  gakuchika: 'ガクチカ',
  career_design: 'キャリア設計',
  company_selection: '企業選定',
  application_preparation: '応募準備',
  interview_preparation: '面接準備',
  selection_experience: '選考経験',
};

/** 表示順（要件定義書 25章） */
export const READINESS_ORDER: ReadinessKey[] = [
  'self_understanding',
  'gakuchika',
  'career_design',
  'company_selection',
  'application_preparation',
  'interview_preparation',
  'selection_experience',
];

/** 1〜5 のスコアを 0〜100 に正規化する（仕様書 6.2） */
export function normalizeToPercent(score: number): number {
  return ((score - 1) / 4) * 100;
}

/* ------------------------------------------------------------------ *
 * 7. 卒業年度による補助判定
 * ------------------------------------------------------------------ */

/** 卒業予定年度ラベル → 対象年（補正対象外は null） */
export const GRADUATION_YEAR_MAP: Record<string, number | null> = {
  '2027年卒': 2027,
  '2028年卒': 2028,
  '2029年卒': 2029,
  '2030年卒以降': null,
  その他: null,
};

/** 卒業年度の基準日（対象年の 3月31日）。month は 0 始まり。 */
export const GRADUATION_DEADLINE = { month: 2, day: 31 } as const;

export const GRADUATION_PENALTY = {
  /** 卒業まで12ヶ月以内 */
  within12Months: [
    { question: 'q4' as const, maxScore: 2, penalty: 5 },
    { question: 'q5' as const, maxScore: 2, penalty: 5 },
  ],
  /** 卒業まで6ヶ月以内 */
  within6Months: [{ question: 'q8' as const, maxScore: 2, penalty: 10 }],
  /** 減点の上限 */
  max: 15,
} as const;

/* ------------------------------------------------------------------ *
 * 8. 総合A〜E判定
 * ------------------------------------------------------------------ */

/** final_score（0〜100）→ 総合判定。上から順に評価する。 */
export const OVERALL_GRADE_THRESHOLDS: { min: number; grade: Grade }[] = [
  { min: 80, grade: 'A' },
  { min: 65, grade: 'B' },
  { min: 50, grade: 'C' },
  { min: 30, grade: 'D' },
  { min: 0, grade: 'E' },
];

/* ------------------------------------------------------------------ *
 * 9. リスクフラグ
 * ------------------------------------------------------------------ */

export interface RiskFlagDefinition {
  id: RiskFlagId;
  /** 優先度を上げる対象項目 */
  target: ReadinessKey;
  /** 条件（設問スコア・特殊選択肢の判定結果を受け取る） */
  match: (ctx: RiskFlagContext) => boolean;
}

export interface RiskFlagContext {
  q2: number;
  q4: number;
  q5: number;
  q6: number;
  q7: number;
  q8: number;
  q1IsNoExperience: boolean;
  q9IsUnknown: boolean;
  q10IsUnknown: boolean;
}

export const RISK_FLAGS: RiskFlagDefinition[] = [
  {
    // FLAG 01｜選考先行・面接準備不足
    id: 'interview_gap',
    target: 'interview_preparation',
    match: (c) => c.q8 >= 4 && c.q7 <= 2,
  },
  {
    // FLAG 02｜方向性未確定
    id: 'direction_undecided',
    target: 'career_design',
    match: (c) => c.q4 <= 2 && (c.q9IsUnknown || c.q10IsUnknown),
  },
  {
    // FLAG 03｜企業選定不足
    id: 'company_selection_gap',
    target: 'company_selection',
    match: (c) => c.q4 >= 3 && c.q5 <= 2,
  },
  {
    // FLAG 04｜応募準備不足
    id: 'application_gap',
    target: 'application_preparation',
    match: (c) => c.q8 >= 2 && c.q6 <= 2,
  },
  {
    // FLAG 05｜ガクチカ未整備
    id: 'gakuchika_gap',
    target: 'gakuchika',
    match: (c) => c.q2 <= 2 || c.q1IsNoExperience,
  },
];

/* ------------------------------------------------------------------ *
 * 12. 弱点抽出
 * ------------------------------------------------------------------ */

/** priority_score = (5 - preparation_score) × 10 + phase_bonus + risk_bonus */
export const PRIORITY_BASE_MULTIPLIER = 10;

/** リスクフラグ対象項目への加点（複数該当しても上限は +10） */
export const RISK_BONUS = 10;

/** Q8 のスコア帯ごとの phase_bonus */
export const PHASE_BONUS: { match: (q8: number) => boolean; bonus: Record<ReadinessKey, number> }[] =
  [
    {
      match: (q8) => q8 === 1,
      bonus: {
        self_understanding: 3,
        career_design: 5,
        company_selection: 4,
        gakuchika: 3,
        application_preparation: 2,
        interview_preparation: 1,
        selection_experience: 0,
      },
    },
    {
      match: (q8) => q8 === 2,
      bonus: {
        application_preparation: 5,
        company_selection: 4,
        gakuchika: 4,
        self_understanding: 2,
        career_design: 2,
        interview_preparation: 2,
        selection_experience: 1,
      },
    },
    {
      match: (q8) => q8 === 3,
      bonus: {
        interview_preparation: 5,
        application_preparation: 3,
        gakuchika: 3,
        company_selection: 2,
        self_understanding: 2,
        career_design: 2,
        selection_experience: 2,
      },
    },
    {
      match: (q8) => q8 >= 4,
      bonus: {
        interview_preparation: 6,
        self_understanding: 3,
        gakuchika: 3,
        company_selection: 3,
        application_preparation: 2,
        career_design: 2,
        selection_experience: 1,
      },
    },
  ];

/** 弱点として抽出する最大件数 */
export const MAX_WEAKNESSES = 3;

/** 弱点候補にする grade（優先順位順）。A は原則対象外。 */
export const WEAKNESS_PRIMARY_GRADES: Grade[] = ['E', 'D', 'C'];

/** 3項目に満たない場合に追加で候補にする grade */
export const WEAKNESS_FALLBACK_GRADES: Grade[] = ['B'];

/* ------------------------------------------------------------------ *
 * 14. 内定ありの場合
 * ------------------------------------------------------------------ */

/** 内定ありのとき弱点候補から除外する項目 */
export const OFFER_EXCLUDED_WEAKNESS: ReadinessKey[] = ['selection_experience'];

/** 内定ありのとき優先度を上げる項目（内定先比較に関係する項目） */
export const OFFER_PRIORITY_BOOST: Partial<Record<ReadinessKey, number>> = {
  self_understanding: 3,
  career_design: 3,
  company_selection: 3,
};
