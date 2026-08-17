/**
 * 就活ロードマップ（診断ロジック仕様書 11章 / 要件定義書 26章）
 *
 * 「最も進んだ項目」ではなく、前工程から順に見て
 * 最初に未完成となる工程を現在地（YOU ARE HERE）とする。
 */
import type { ReadinessKey } from '../../types/diagnosis';

/** 完了条件の判定に使うコンテキスト */
export interface RoadmapContext {
  /** 設問スコア（1〜5） */
  q3: number;
  q4: number;
  q5: number;
  q6: number;
  q7: number;
  q8: number;
  /** 7項目の準備度スコア */
  readiness: Record<ReadinessKey, number>;
  /** Q8 が「内定あり」か */
  hasOffer: boolean;
}

export interface RoadmapStepDefinition {
  label: string;
  isDone: (ctx: RoadmapContext) => boolean;
}

export const ROADMAP_STEPS: RoadmapStepDefinition[] = [
  { label: '自己分析', isDone: (c) => c.q3 >= 3 },
  { label: 'キャリアの方向性を決める', isDone: (c) => c.readiness.career_design >= 2.5 },
  { label: '志望業界・職種を決める', isDone: (c) => c.q4 >= 3 },
  { label: '志望企業を具体化する', isDone: (c) => c.q5 >= 3 },
  { label: 'ガクチカ・自己PRを完成させる', isDone: (c) => c.readiness.gakuchika >= 3 },
  { label: 'ES・応募準備', isDone: (c) => c.q6 >= 3 },
  { label: '面接対策', isDone: (c) => c.q7 >= 3 },
  { label: '選考経験を積む', isDone: (c) => c.q8 >= 3 },
  { label: '最終選考', isDone: (c) => c.q8 >= 5 },
  { label: '内定・比較検討', isDone: (c) => c.hasOffer },
];
