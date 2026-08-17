/**
 * 「今やるべき3つ」のアクション定義（診断ロジック仕様書 13章）
 *
 * 弱点上位3項目に対応するアクションIDを、項目の grade に応じて返す。
 * AI生成は行わず、すべてこのカタログから選択する。
 */
import type { ActionId, Grade, ReadinessKey } from '../../types/diagnosis';

export interface ActionDefinition {
  id: ActionId;
  title: string;
  text: string;
}

export const ACTIONS: Record<ActionId, ActionDefinition> = {
  ACTION_SELF_ANALYSIS_BASIC: {
    id: 'ACTION_SELF_ANALYSIS_BASIC',
    title: '自己分析を「強み・弱み」から書き出す',
    text: '難しく考えず、これまでの経験を10個書き出すところから始めましょう。そのうえで「なぜ頑張れたか」「何が得意だったか」を一言ずつ添えると、強みの輪郭が見えてきます。',
  },
  ACTION_SELF_ANALYSIS_AXIS: {
    id: 'ACTION_SELF_ANALYSIS_AXIS',
    title: '自己分析を「就活軸」まで言語化する',
    text: '強み・弱みの整理で止めず、「どんな環境で力を発揮できるか」まで3行で書き出しましょう。面接の一貫性が一気に上がります。',
  },
  ACTION_GAKUCHIKA_FIND: {
    id: 'ACTION_GAKUCHIKA_FIND',
    title: 'ガクチカにできる経験を洗い出す',
    text: '特別な実績である必要はありません。アルバイト・ゼミ・サークルなど、半年以上続けたことを3つ挙げ、その中で工夫した場面を思い出しましょう。',
  },
  ACTION_GAKUCHIKA_WRITE: {
    id: 'ACTION_GAKUCHIKA_WRITE',
    title: 'ガクチカを400字で書き切る',
    text: '「状況 → 課題 → 自分の行動 → 結果」の順で、まず400字にまとめましょう。頭の中にある状態と、書ける状態はまったく別物です。',
  },
  ACTION_GAKUCHIKA_REVIEW: {
    id: 'ACTION_GAKUCHIKA_REVIEW',
    title: 'ガクチカを第三者に見てもらう',
    text: '一度文章化し、友人・先輩・就活経験者などからフィードバックを受けましょう。伝わらない部分が必ず見つかります。',
  },
  ACTION_CAREER_EXPLORE: {
    id: 'ACTION_CAREER_EXPLORE',
    title: '業界・職種を5つ調べて比較する',
    text: 'まずは知らない選択肢を減らすことが先決です。興味の有無を問わず5つの業界・職種を調べ、仕事内容と働き方をメモしましょう。',
  },
  ACTION_CAREER_NARROW: {
    id: 'ACTION_CAREER_NARROW',
    title: '志望業界・職種を3つまで絞る',
    text: '興味のある分野を書き出し、仕事内容・働き方の観点で比較して候補を3つに絞りましょう。',
  },
  ACTION_COMPANY_LIST_10: {
    id: 'ACTION_COMPANY_LIST_10',
    title: '志望企業を10社まで具体化する',
    text: 'まずは気になる企業を10社程度まで増やし、仕事内容・事業・カルチャー・選考時期などを比較しましょう。',
  },
  ACTION_COMPANY_COMPARE: {
    id: 'ACTION_COMPANY_COMPARE',
    title: '志望企業を軸ごとに比較して順位をつける',
    text: '挙げた企業を、仕事内容・成長環境・働き方などの軸で並べ直しましょう。順位が付くと、志望動機の説得力が大きく変わります。',
  },
  ACTION_ES_COMPLETE: {
    id: 'ACTION_ES_COMPLETE',
    title: 'ESを1本、提出できる状態まで完成させる',
    text: '完璧を目指さず、まず1本を最後まで書き切りましょう。そこから使い回せる型ができます。',
  },
  ACTION_ES_REVIEW: {
    id: 'ACTION_ES_REVIEW',
    title: 'ESの添削を受けて完成度を上げる',
    text: '一通り書けているなら、次は他人の目を通す段階です。就活経験者やキャリア支援者に見てもらい、伝わり方を検証しましょう。',
  },
  ACTION_INTERVIEW_3: {
    id: 'ACTION_INTERVIEW_3',
    title: '模擬面接を3回行う',
    text: '本選考を練習の場にせず、事前に最低3回程度は模擬面接を経験しましょう。',
  },
  ACTION_INTERVIEW_IMPROVE: {
    id: 'ACTION_INTERVIEW_IMPROVE',
    title: '面接の受け答えを振り返って改善する',
    text: '経験は積めています。答えに詰まった質問を書き出し、想定問答として整理しておきましょう。次の面接から手応えが変わります。',
  },
  ACTION_APPLY: {
    id: 'ACTION_APPLY',
    title: '今月中に3社エントリーする',
    text: '選考は最大の実践練習です。志望度の高すぎない企業から受け始め、経験値を積みましょう。',
  },
  ACTION_SELECTION_EXPAND: {
    id: 'ACTION_SELECTION_EXPAND',
    title: '選考中の企業を増やして比較材料をつくる',
    text: '選考が1社だけだと判断材料が足りません。並行して受ける企業を増やし、比較しながら意思決定できる状態をつくりましょう。',
  },
};

/**
 * 準備度項目 × grade → アクションID（仕様書 13章）
 * A は原則弱点にならないが、フォールバックとして C〜B 相当を返す。
 */
export const ACTION_BY_CATEGORY: Record<ReadinessKey, Record<Grade, ActionId>> = {
  self_understanding: {
    E: 'ACTION_SELF_ANALYSIS_BASIC',
    D: 'ACTION_SELF_ANALYSIS_BASIC',
    C: 'ACTION_SELF_ANALYSIS_AXIS',
    B: 'ACTION_SELF_ANALYSIS_AXIS',
    A: 'ACTION_SELF_ANALYSIS_AXIS',
  },
  gakuchika: {
    E: 'ACTION_GAKUCHIKA_FIND',
    D: 'ACTION_GAKUCHIKA_WRITE',
    C: 'ACTION_GAKUCHIKA_WRITE',
    B: 'ACTION_GAKUCHIKA_REVIEW',
    A: 'ACTION_GAKUCHIKA_REVIEW',
  },
  career_design: {
    E: 'ACTION_CAREER_EXPLORE',
    D: 'ACTION_CAREER_EXPLORE',
    C: 'ACTION_CAREER_NARROW',
    B: 'ACTION_CAREER_NARROW',
    A: 'ACTION_CAREER_NARROW',
  },
  company_selection: {
    E: 'ACTION_COMPANY_LIST_10',
    D: 'ACTION_COMPANY_LIST_10',
    C: 'ACTION_COMPANY_COMPARE',
    B: 'ACTION_COMPANY_COMPARE',
    A: 'ACTION_COMPANY_COMPARE',
  },
  application_preparation: {
    E: 'ACTION_ES_COMPLETE',
    D: 'ACTION_ES_COMPLETE',
    C: 'ACTION_ES_REVIEW',
    B: 'ACTION_ES_REVIEW',
    A: 'ACTION_ES_REVIEW',
  },
  interview_preparation: {
    E: 'ACTION_INTERVIEW_3',
    D: 'ACTION_INTERVIEW_3',
    C: 'ACTION_INTERVIEW_IMPROVE',
    B: 'ACTION_INTERVIEW_IMPROVE',
    A: 'ACTION_INTERVIEW_IMPROVE',
  },
  selection_experience: {
    E: 'ACTION_APPLY',
    D: 'ACTION_APPLY',
    C: 'ACTION_SELECTION_EXPAND',
    B: 'ACTION_SELECTION_EXPAND',
    A: 'ACTION_SELECTION_EXPAND',
  },
};
