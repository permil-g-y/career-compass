/**
 * 診断データの保存インターフェース。
 *
 * - 端末内の保持は localStorage 実装（LocalStorageDiagnosisRepository）
 * - 永続保存は Cloudflare D1 実装（D1DiagnosisRepository）
 *
 * UI・診断ロジック側はこのインターフェースにしか依存しない。
 * 保存先を差し替える場合も、このインターフェースを実装した別クラスを用意すればよい。
 */
import { optionLabelOf } from '../config/diagnosis/questions';
import { MAIN_QUESTION_KEYS } from '../config/diagnosis/questions';
import { READINESS_ORDER } from '../config/diagnosis/scoring';
import type {
  AnswerState,
  DiagnosisPayload,
  DiagnosisRecord,
  DiagnosisResult,
  Grade,
  LeadInfo,
  MainQuestionKey,
  ReadinessKey,
} from '../types/diagnosis';
import { GRADUATION_OPTIONS } from '../config/diagnosis/questions';

export interface DiagnosisRepository {
  /** 診断結果とリード情報を保存する */
  save(record: DiagnosisRecord): Promise<void>;
}

/** 診断ID を採番する */
export function createDiagnosisId(): string {
  const cryptoObj = globalThis.crypto;
  if (cryptoObj && 'randomUUID' in cryptoObj) {
    return `cc_${cryptoObj.randomUUID()}`;
  }
  return `cc_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * 回答・結果・リード情報を1つのレコードへ組み立てる。
 * すべて同一の diagnosis_id に紐付く（要件定義書 32章・34章）。
 */
export function buildDiagnosisRecord(params: {
  diagnosisId: string;
  diagnosedAt: Date;
  answers: AnswerState;
  result: DiagnosisResult | null;
  lead: LeadInfo | null;
}): DiagnosisRecord {
  const { diagnosisId, diagnosedAt, answers, result, lead } = params;

  const answerRecord = MAIN_QUESTION_KEYS.reduce(
    (acc, key) => {
      acc[key] = { index: answers[key], label: optionLabelOf(key, answers[key]) };
      return acc;
    },
    {} as DiagnosisRecord['answers'],
  );

  const readiness = READINESS_ORDER.reduce(
    (acc, key) => {
      acc[key] = result
        ? { score: result.readiness[key].score, grade: result.readiness[key].grade }
        : { score: 0, grade: 'E' as Grade };
      return acc;
    },
    {} as Record<ReadinessKey, { score: number; grade: Grade }>,
  );

  return {
    diagnosis_id: diagnosisId,
    diagnosed_at: diagnosedAt.toISOString(),
    profile: {
      age: answers.age,
      graduation_year: answers.grad === null ? null : (GRADUATION_OPTIONS[answers.grad] ?? null),
    },
    answers: answerRecord,
    lead,
    result: result
      ? {
          overall_score: result.overall.score,
          overall_grade: result.overall.grade,
          overall_label: result.overall.label,
          overall_comment: result.overall.longComment,
          career_type: result.type.label,
          readiness,
          roadmap_current_step: result.roadmap.currentStep,
          roadmap_current_label: result.roadmap.currentLabel,
          risk_flags: result.riskFlags,
          weakness_1: result.weaknesses[0]?.label ?? null,
          weakness_2: result.weaknesses[1]?.label ?? null,
          weakness_3: result.weaknesses[2]?.label ?? null,
          action_1: result.actions[0]?.id ?? null,
          action_2: result.actions[1]?.id ?? null,
          action_3: result.actions[2]?.id ?? null,
        }
      : null,
  };
}

/**
 * 保存レコードを D1 用のフラットなペイロードへ変換する。
 * カラム構成は migrations/0001_create_diagnoses.sql と対応する。
 *
 * リード情報が未取得（診断のみ完了）のレコードは D1 保存の対象外とし null を返す。
 */
export function buildDiagnosisPayload(record: DiagnosisRecord): DiagnosisPayload | null {
  if (!record.lead || !record.result) return null;

  const answerLabel = (key: MainQuestionKey): string | null => record.answers[key].label;
  const readiness = record.result.readiness;

  return {
    diagnosis_id: record.diagnosis_id,
    created_at: record.diagnosed_at,
    age: record.profile.age,
    graduation_year: record.profile.graduation_year,
    q1: answerLabel('q1'),
    q2: answerLabel('q2'),
    q3: answerLabel('q3'),
    q4: answerLabel('q4'),
    q5: answerLabel('q5'),
    q6: answerLabel('q6'),
    q7: answerLabel('q7'),
    q8: answerLabel('q8'),
    q9: answerLabel('q9'),
    q10: answerLabel('q10'),
    name: record.lead.name,
    phone: record.lead.phone,
    overall_score: record.result.overall_score,
    overall_grade: record.result.overall_grade,
    career_type: record.result.career_type,
    self_understanding: readiness.self_understanding.score,
    gakuchika: readiness.gakuchika.score,
    career_design: readiness.career_design.score,
    company_selection: readiness.company_selection.score,
    application_preparation: readiness.application_preparation.score,
    interview_preparation: readiness.interview_preparation.score,
    selection_experience: readiness.selection_experience.score,
    roadmap_current_step: record.result.roadmap_current_step,
    weakness_1: record.result.weakness_1,
    weakness_2: record.result.weakness_2,
    weakness_3: record.result.weakness_3,
    action_1: record.result.action_1,
    action_2: record.result.action_2,
    action_3: record.result.action_3,
  };
}
