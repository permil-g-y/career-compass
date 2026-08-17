/**
 * 診断エンジン（診断ロジック仕様書の実装）
 *
 * - UI から独立した純粋関数として実装する
 * - 同じ回答内容であれば必ず同じ診断結果を返す
 *   （唯一の外部依存は「卒業年度による補助判定」で使う現在日時。
 *     再現性が必要な場合は runDiagnosis の第2引数で固定できる）
 */
import {
  MAIN_QUESTION_KEYS,
  SPECIAL_OPTION_INDEX,
  getOptions,
} from '../config/diagnosis/questions';
import {
  CAREER_DESIGN_WEIGHTS,
  CLARITY_SCORE,
  GAKUCHIKA_NO_EXPERIENCE_SCORE,
  GRADUATION_DEADLINE,
  GRADUATION_PENALTY,
  GRADUATION_YEAR_MAP,
  MAX_WEAKNESSES,
  OFFER_EXCLUDED_WEAKNESS,
  OFFER_PRIORITY_BOOST,
  OVERALL_GRADE_THRESHOLDS,
  PHASE_BONUS,
  PRIORITY_BASE_MULTIPLIER,
  QUESTION_SCORES,
  READINESS_GRADE_THRESHOLDS,
  READINESS_LABELS,
  READINESS_ORDER,
  READINESS_WEIGHTS,
  RISK_BONUS,
  RISK_FLAGS,
  WEAKNESS_FALLBACK_GRADES,
  WEAKNESS_PRIMARY_GRADES,
  normalizeToPercent,
} from '../config/diagnosis/scoring';
import { GRADE_INFO, formatGradeLabel } from '../config/diagnosis/grades';
import {
  CAREER_TYPES,
  EXPLORE_Q4_MAX,
  EXPLORE_TYPE_ID,
  TYPE_BY_Q10,
  TYPE_BY_Q9,
} from '../config/diagnosis/types';
import { ROADMAP_STEPS, type RoadmapContext } from '../config/diagnosis/roadmap';
import { WEAKNESS_TEXTS } from '../config/diagnosis/weaknesses';
import { ACTIONS, ACTION_BY_CATEGORY } from '../config/diagnosis/actions';
import type {
  ActionResult,
  AnswerState,
  DiagnosisResult,
  Grade,
  ReadinessItemResult,
  ReadinessKey,
  RiskFlagId,
  RoadmapStepResult,
  WeaknessResult,
} from '../types/diagnosis';

/* ------------------------------------------------------------------ *
 * 共通ユーティリティ
 * ------------------------------------------------------------------ */

function round(value: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

/** grade の優先順位（弱点抽出のタイブレークに使用。E が最も優先度が高い） */
const GRADE_RANK: Record<Grade, number> = { E: 0, D: 1, C: 2, B: 3, A: 4 };

export function createEmptyAnswers(): AnswerState {
  return {
    age: null,
    grad: null,
    q1: null,
    q2: null,
    q3: null,
    q4: null,
    q5: null,
    q6: null,
    q7: null,
    q8: null,
    q9: null,
    q10: null,
  };
}

/** 本診断10問がすべて回答済みか */
export function isDiagnosisComplete(answers: AnswerState): boolean {
  return MAIN_QUESTION_KEYS.every((key) => answers[key] !== null);
}

/* ------------------------------------------------------------------ *
 * 1. 設問スコア（仕様書 3章）
 * ------------------------------------------------------------------ */

interface QuestionScores {
  q2: number;
  q3: number;
  q4: number;
  q5: number;
  q6: number;
  q7: number;
  q8: number;
  q1IsNoExperience: boolean;
  q9IsUnknown: boolean;
  q10IsUnknown: boolean;
  hasOffer: boolean;
}

function toQuestionScores(answers: AnswerState): QuestionScores {
  const scoreOf = (key: keyof typeof QUESTION_SCORES): number => {
    const index = answers[key];
    if (index === null) throw new Error(`${key} is unanswered`);
    const score = QUESTION_SCORES[key][index];
    if (score === undefined) throw new Error(`Invalid option index for ${key}: ${index}`);
    return score;
  };

  return {
    q2: scoreOf('q2'),
    q3: scoreOf('q3'),
    q4: scoreOf('q4'),
    q5: scoreOf('q5'),
    q6: scoreOf('q6'),
    q7: scoreOf('q7'),
    q8: scoreOf('q8'),
    q1IsNoExperience: answers.q1 === SPECIAL_OPTION_INDEX.q1NoExperience,
    q9IsUnknown: answers.q9 === SPECIAL_OPTION_INDEX.q9Unknown,
    q10IsUnknown: answers.q10 === SPECIAL_OPTION_INDEX.q10Unknown,
    hasOffer: answers.q8 === SPECIAL_OPTION_INDEX.q8OfferReceived,
  };
}

/* ------------------------------------------------------------------ *
 * 2. 7項目の就活準備度（仕様書 4章）
 * ------------------------------------------------------------------ */

function calcReadinessScores(q: QuestionScores): Record<ReadinessKey, number> {
  const careerDesign =
    q.q4 * CAREER_DESIGN_WEIGHTS.q4 +
    (q.q9IsUnknown ? CLARITY_SCORE.unknown : CLARITY_SCORE.known) *
      CAREER_DESIGN_WEIGHTS.q9Clarity +
    (q.q10IsUnknown ? CLARITY_SCORE.unknown : CLARITY_SCORE.known) *
      CAREER_DESIGN_WEIGHTS.q10Clarity;

  return {
    self_understanding: q.q3,
    gakuchika: q.q1IsNoExperience ? GAKUCHIKA_NO_EXPERIENCE_SCORE : q.q2,
    career_design: round(careerDesign, 2),
    company_selection: q.q5,
    application_preparation: q.q6,
    interview_preparation: q.q7,
    selection_experience: q.q8,
  };
}

/** score（1.0〜5.0）→ A〜E（仕様書 5章） */
export function toReadinessGrade(score: number): Grade {
  for (const t of READINESS_GRADE_THRESHOLDS) {
    if (score >= t.min) return t.grade;
  }
  return 'E';
}

/* ------------------------------------------------------------------ *
 * 3. 総合スコア（仕様書 6章）と卒業年度補正（仕様書 7章）
 * ------------------------------------------------------------------ */

function calcBaseScore(readiness: Record<ReadinessKey, number>): number {
  return READINESS_ORDER.reduce(
    (total, key) => total + normalizeToPercent(readiness[key]) * READINESS_WEIGHTS[key],
    0,
  );
}

/** 対象卒年の3月31日までの残り月数。補正対象外は null。 */
export function monthsUntilGraduation(gradLabel: string | null, now: Date): number | null {
  if (!gradLabel) return null;
  const year = GRADUATION_YEAR_MAP[gradLabel];
  if (year === null || year === undefined) return null;
  const deadline = new Date(year, GRADUATION_DEADLINE.month, GRADUATION_DEADLINE.day, 23, 59, 59);
  const msPerMonth = 1000 * 60 * 60 * 24 * 30.436875;
  return (deadline.getTime() - now.getTime()) / msPerMonth;
}

function calcGraduationPenalty(
  q: QuestionScores,
  gradLabel: string | null,
  now: Date,
): number {
  const months = monthsUntilGraduation(gradLabel, now);
  if (months === null) return 0;

  let penalty = 0;
  if (months <= 12) {
    for (const rule of GRADUATION_PENALTY.within12Months) {
      if (q[rule.question] <= rule.maxScore) penalty += rule.penalty;
    }
  }
  if (months <= 6) {
    for (const rule of GRADUATION_PENALTY.within6Months) {
      if (q[rule.question] <= rule.maxScore) penalty += rule.penalty;
    }
  }
  return Math.min(penalty, GRADUATION_PENALTY.max);
}

/** final_score（0〜100）→ 総合判定（仕様書 8章） */
export function toOverallGrade(finalScore: number): Grade {
  for (const t of OVERALL_GRADE_THRESHOLDS) {
    if (finalScore >= t.min) return t.grade;
  }
  return 'E';
}

/* ------------------------------------------------------------------ *
 * 4. リスクフラグ（仕様書 9章）
 * ------------------------------------------------------------------ */

function calcRiskFlags(q: QuestionScores): {
  ids: RiskFlagId[];
  targets: Set<ReadinessKey>;
} {
  const ctx = {
    q2: q.q2,
    q4: q.q4,
    q5: q.q5,
    q6: q.q6,
    q7: q.q7,
    q8: q.q8,
    q1IsNoExperience: q.q1IsNoExperience,
    q9IsUnknown: q.q9IsUnknown,
    q10IsUnknown: q.q10IsUnknown,
  };
  const ids: RiskFlagId[] = [];
  const targets = new Set<ReadinessKey>();
  for (const flag of RISK_FLAGS) {
    if (flag.match(ctx)) {
      ids.push(flag.id);
      targets.add(flag.target);
    }
  }
  return { ids, targets };
}

/* ------------------------------------------------------------------ *
 * 5. 就活タイプ（仕様書 10章）
 * ------------------------------------------------------------------ */

function calcCareerType(answers: AnswerState, q: QuestionScores) {
  const q9Label = answers.q9 === null ? null : getOptions('q9')[answers.q9];
  const q10Label = answers.q10 === null ? null : getOptions('q10')[answers.q10];

  // Q4 <= 2 かつ Q9・Q10 ともに「まだ分からない」→ キャリア探索型
  if (q.q4 <= EXPLORE_Q4_MAX && q.q9IsUnknown && q.q10IsUnknown) {
    return CAREER_TYPES[EXPLORE_TYPE_ID];
  }
  // Q9 を第一優先
  if (q9Label && TYPE_BY_Q9[q9Label]) {
    return CAREER_TYPES[TYPE_BY_Q9[q9Label]];
  }
  // Q9 が「まだ分からない」の場合は Q10 で判定
  if (q10Label && TYPE_BY_Q10[q10Label]) {
    return CAREER_TYPES[TYPE_BY_Q10[q10Label]];
  }
  return CAREER_TYPES[EXPLORE_TYPE_ID];
}

/* ------------------------------------------------------------------ *
 * 6. ロードマップ現在地（仕様書 11章）
 * ------------------------------------------------------------------ */

function calcRoadmap(ctx: RoadmapContext): DiagnosisResult['roadmap'] {
  const doneFlags = ROADMAP_STEPS.map((step) => step.isDone(ctx));
  // 前工程から順に見て、最初に未完成となる工程を現在地とする
  let currentIndex = doneFlags.findIndex((done) => !done);
  const allDone = currentIndex < 0;
  if (allDone) currentIndex = ROADMAP_STEPS.length - 1;

  const steps: RoadmapStepResult[] = ROADMAP_STEPS.map((step, i) => ({
    index: i,
    no: i + 1,
    label: step.label,
    done: allDone ? true : i < currentIndex,
    here: !allDone && i === currentIndex,
  }));

  return {
    currentStep: currentIndex + 1,
    currentLabel: ROADMAP_STEPS[currentIndex].label,
    steps,
  };
}

/* ------------------------------------------------------------------ *
 * 7. 弱点抽出（仕様書 12章・14章）
 * ------------------------------------------------------------------ */

function phaseBonusFor(q8: number): Record<ReadinessKey, number> {
  const table = PHASE_BONUS.find((t) => t.match(q8));
  if (table) return table.bonus;
  return {
    self_understanding: 0,
    gakuchika: 0,
    career_design: 0,
    company_selection: 0,
    application_preparation: 0,
    interview_preparation: 0,
    selection_experience: 0,
  };
}

interface WeaknessCandidate {
  key: ReadinessKey;
  score: number;
  grade: Grade;
  priorityScore: number;
}

function calcWeaknessCandidates(
  readiness: Record<ReadinessKey, ReadinessItemResult>,
  q: QuestionScores,
  riskTargets: Set<ReadinessKey>,
): WeaknessCandidate[] {
  const phaseBonus = phaseBonusFor(q.q8);

  return READINESS_ORDER.filter(
    // 内定ありの場合、選考経験は弱点候補から除外する（仕様書 14章）
    (key) => !(q.hasOffer && OFFER_EXCLUDED_WEAKNESS.includes(key)),
  ).map((key) => {
    const item = readiness[key];
    const base = (5 - item.score) * PRIORITY_BASE_MULTIPLIER;
    const risk = riskTargets.has(key) ? RISK_BONUS : 0;
    // 内定ありの場合は内定先比較に関係する項目を優先する（仕様書 14章）
    const offerBoost = q.hasOffer ? (OFFER_PRIORITY_BOOST[key] ?? 0) : 0;
    return {
      key,
      score: item.score,
      grade: item.grade,
      priorityScore: round(base + phaseBonus[key] + risk + offerBoost, 2),
    };
  });
}

/**
 * 弱点を最大3つ抽出する。
 *
 * 候補プールは grade E / D / C（A は原則対象外）。
 * 3項目に満たない場合のみ B を追加する（仕様書 12章）。
 * プール内の並びは priority_score の降順とし、
 * 同点時は grade（E が先）→ 表示順で決定するため結果は常に一意になる。
 */
function selectWeaknesses(candidates: WeaknessCandidate[]): WeaknessCandidate[] {
  const sort = (list: WeaknessCandidate[]) =>
    [...list].sort(
      (a, b) =>
        b.priorityScore - a.priorityScore ||
        GRADE_RANK[a.grade] - GRADE_RANK[b.grade] ||
        READINESS_ORDER.indexOf(a.key) - READINESS_ORDER.indexOf(b.key),
    );

  const pool = candidates.filter((c) => WEAKNESS_PRIMARY_GRADES.includes(c.grade));
  if (pool.length < MAX_WEAKNESSES) {
    pool.push(...candidates.filter((c) => WEAKNESS_FALLBACK_GRADES.includes(c.grade)));
  }
  return sort(pool).slice(0, MAX_WEAKNESSES);
}

/* ------------------------------------------------------------------ *
 * 8. 今やるべき3つ（仕様書 13章）
 * ------------------------------------------------------------------ */

/**
 * 弱点上位3項目に対応するアクションを返す。
 * 3項目に満たない場合（全項目がA相当のケース）のみ、
 * スコアの低い項目から補完して常に3件を提示する。
 */
function selectActions(
  weaknesses: WeaknessCandidate[],
  candidates: WeaknessCandidate[],
): ActionResult[] {
  const picked: WeaknessCandidate[] = [...weaknesses];
  if (picked.length < MAX_WEAKNESSES) {
    const rest = candidates
      .filter((c) => !picked.some((p) => p.key === c.key))
      .sort(
        (a, b) =>
          a.score - b.score ||
          b.priorityScore - a.priorityScore ||
          READINESS_ORDER.indexOf(a.key) - READINESS_ORDER.indexOf(b.key),
      );
    picked.push(...rest.slice(0, MAX_WEAKNESSES - picked.length));
  }

  return picked.map((w) => {
    const actionId = ACTION_BY_CATEGORY[w.key][w.grade];
    const action = ACTIONS[actionId];
    return {
      id: action.id,
      category: w.key,
      title: action.title,
      text: action.text,
    };
  });
}

/* ------------------------------------------------------------------ *
 * エントリーポイント
 * ------------------------------------------------------------------ */

export function runDiagnosis(answers: AnswerState, now: Date = new Date()): DiagnosisResult {
  if (!isDiagnosisComplete(answers)) {
    throw new Error('診断に必要な回答が揃っていません');
  }

  const q = toQuestionScores(answers);
  const readinessScores = calcReadinessScores(q);

  const readiness = READINESS_ORDER.reduce(
    (acc, key) => {
      const score = readinessScores[key];
      acc[key] = {
        key,
        score,
        grade: toReadinessGrade(score),
        percent: round(normalizeToPercent(score), 1),
      };
      return acc;
    },
    {} as Record<ReadinessKey, ReadinessItemResult>,
  );

  const gradLabel = answers.grad === null ? null : getOptions('grad')[answers.grad];
  const baseScore = calcBaseScore(readinessScores);
  const penalty = calcGraduationPenalty(q, gradLabel, now);
  const finalScore = Math.max(0, baseScore - penalty);
  const overallGrade = toOverallGrade(finalScore);

  const { ids: riskFlags, targets: riskTargets } = calcRiskFlags(q);

  const candidates = calcWeaknessCandidates(readiness, q, riskTargets);
  const selected = selectWeaknesses(candidates);
  const weaknesses: WeaknessResult[] = selected.map((w) => ({
    key: w.key,
    label: READINESS_LABELS[w.key],
    text: WEAKNESS_TEXTS[w.key],
    grade: w.grade,
    priorityScore: w.priorityScore,
  }));

  const roadmap = calcRoadmap({
    q3: q.q3,
    q4: q.q4,
    q5: q.q5,
    q6: q.q6,
    q7: q.q7,
    q8: q.q8,
    readiness: readinessScores,
    hasOffer: q.hasOffer,
  });

  const type = calcCareerType(answers, q);
  const info = GRADE_INFO[overallGrade];

  return {
    overall: {
      score: round(finalScore, 1),
      baseScore: round(baseScore, 1),
      graduationPenalty: penalty,
      grade: overallGrade,
      label: formatGradeLabel(overallGrade),
      shortComment: info.short,
      longComment: info.long,
    },
    type: {
      id: type.id,
      label: type.label,
      description: type.description,
    },
    readiness,
    roadmap,
    riskFlags,
    weaknesses,
    actions: selectActions(selected, candidates),
  };
}
