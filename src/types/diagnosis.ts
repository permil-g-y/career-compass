/**
 * Career Compass｜診断ドメインの型定義
 * UI からは独立した純粋なデータ型のみを置く。
 */

export type Grade = 'A' | 'B' | 'C' | 'D' | 'E';

/** 設問キー（プロフィール2問 + 本診断10問 = 全12問） */
export type QuestionKey =
  | 'age'
  | 'grad'
  | 'q1'
  | 'q2'
  | 'q3'
  | 'q4'
  | 'q5'
  | 'q6'
  | 'q7'
  | 'q8'
  | 'q9'
  | 'q10';

/** 本診断（Q1〜Q10）の設問キー */
export type MainQuestionKey = Exclude<QuestionKey, 'age' | 'grad'>;

/** 7項目の就活準備度キー */
export type ReadinessKey =
  | 'self_understanding'
  | 'gakuchika'
  | 'career_design'
  | 'company_selection'
  | 'application_preparation'
  | 'interview_preparation'
  | 'selection_experience';

/** リスクフラグID */
export type RiskFlagId =
  | 'interview_gap'
  | 'direction_undecided'
  | 'company_selection_gap'
  | 'application_gap'
  | 'gakuchika_gap';

/** 就活タイプID */
export type CareerTypeId =
  | 'growth'
  | 'stable'
  | 'high'
  | 'wlb'
  | 'challenge'
  | 'culture'
  | 'specialty'
  | 'explore';

/** アクションID（診断ロジック仕様書 13章） */
export type ActionId =
  | 'ACTION_SELF_ANALYSIS_BASIC'
  | 'ACTION_SELF_ANALYSIS_AXIS'
  | 'ACTION_GAKUCHIKA_FIND'
  | 'ACTION_GAKUCHIKA_WRITE'
  | 'ACTION_GAKUCHIKA_REVIEW'
  | 'ACTION_CAREER_EXPLORE'
  | 'ACTION_CAREER_NARROW'
  | 'ACTION_COMPANY_LIST_10'
  | 'ACTION_COMPANY_COMPARE'
  | 'ACTION_ES_COMPLETE'
  | 'ACTION_ES_REVIEW'
  | 'ACTION_INTERVIEW_3'
  | 'ACTION_INTERVIEW_IMPROVE'
  | 'ACTION_APPLY'
  | 'ACTION_SELECTION_EXPAND';

/**
 * 回答状態。
 * age は実年齢（数値）、それ以外は選択肢の index を保持する。
 * 未回答は null。
 */
export type AnswerState = {
  age: number | null;
  grad: number | null;
} & { [K in MainQuestionKey]: number | null };

export interface ReadinessItemResult {
  key: ReadinessKey;
  /** 1.0〜5.0 */
  score: number;
  grade: Grade;
  /** 0〜100 に正規化した値（バー表示用） */
  percent: number;
}

export interface WeaknessResult {
  key: ReadinessKey;
  label: string;
  text: string;
  grade: Grade;
  priorityScore: number;
}

export interface ActionResult {
  id: ActionId;
  /** 由来となった準備度項目 */
  category: ReadinessKey;
  title: string;
  text: string;
}

export interface RoadmapStepResult {
  index: number;
  /** 1始まりのステップ番号 */
  no: number;
  label: string;
  done: boolean;
  here: boolean;
}

export interface DiagnosisResult {
  overall: {
    /** 0〜100 */
    score: number;
    baseScore: number;
    graduationPenalty: number;
    grade: Grade;
    label: string;
    /** 簡易結果用コメント */
    shortComment: string;
    /** 詳細結果用コメント */
    longComment: string;
  };
  type: {
    id: CareerTypeId;
    label: string;
    description: string;
  };
  readiness: Record<ReadinessKey, ReadinessItemResult>;
  roadmap: {
    currentStep: number;
    currentLabel: string;
    steps: RoadmapStepResult[];
  };
  riskFlags: RiskFlagId[];
  weaknesses: WeaknessResult[];
  actions: ActionResult[];
}

/** 保存用リード情報 */
export interface LeadInfo {
  name: string;
  /** 正規化済み（数字のみ） */
  phone: string;
  /** ユーザー入力そのまま */
  phoneRaw: string;
}

/** 保存レコード（diagnosis_id に全情報を紐付ける） */
export interface DiagnosisRecord {
  diagnosis_id: string;
  diagnosed_at: string;
  profile: {
    age: number | null;
    graduation_year: string | null;
  };
  answers: {
    [K in MainQuestionKey]: { index: number | null; label: string | null };
  };
  lead: LeadInfo | null;
  result: {
    overall_score: number;
    overall_grade: Grade;
    overall_label: string;
    overall_comment: string;
    career_type: string;
    readiness: Record<ReadinessKey, { score: number; grade: Grade }>;
    roadmap_current_step: number;
    roadmap_current_label: string;
    risk_flags: RiskFlagId[];
    weakness_1: string | null;
    weakness_2: string | null;
    weakness_3: string | null;
    action_1: ActionId | null;
    action_2: ActionId | null;
    action_3: ActionId | null;
  } | null;
}
