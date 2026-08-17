/**
 * 弱点コメント（要件定義書 27章）
 * 「今のあなたに不足していること」で表示する本文。
 */
import type { ReadinessKey } from '../../types/diagnosis';

export const WEAKNESS_TEXTS: Record<ReadinessKey, string> = {
  self_understanding:
    '自分の強み・価値観の整理がまだ途中です。過去の経験を振り返り、何を大切にしたいのかを言語化する必要があります。',
  gakuchika:
    '経験そのものはありますが、選考で伝わる形まで磨き切れていません。行動と成果まで具体的に語れる状態を目指しましょう。',
  career_design:
    '目指したい方向性がまだ定まりきっていません。業界・職種の候補を絞ることで、以降の準備の効率が大きく変わります。',
  company_selection:
    '興味のある業界は見えてきていますが、具体的な志望企業がまだ少ない状態です。',
  application_preparation:
    'ES・自己PRは作成途中です。まず選考に提出できる状態まで完成させる必要があります。',
  interview_preparation:
    '実際の面接・模擬面接の経験が少なく、本番での受け答えを改善する機会が不足しています。',
  selection_experience:
    '選考の実践経験がまだ少ない状態です。実際に受けてみることで、不足している準備が明確になります。',
};
