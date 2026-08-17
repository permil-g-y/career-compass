/**
 * 設問定義（要件定義書 6〜17章）
 * 文言・選択肢は要件定義書を正とする。
 */
import type { MainQuestionKey, QuestionKey } from '../../types/diagnosis';

export interface AgeQuestion {
  key: 'age';
  type: 'age';
  title: string;
  note?: string;
  min: number;
  max: number;
  defaultValue: number;
}

export interface OptionQuestion {
  key: Exclude<QuestionKey, 'age'>;
  /** choice = 並列選択 / scale = 段階選択（番号バッジ表示） */
  type: 'choice' | 'scale';
  title: string;
  note?: string;
  options: string[];
}

export type Question = AgeQuestion | OptionQuestion;

/** 卒業予定年度の選択肢 */
export const GRADUATION_OPTIONS = [
  '2027年卒',
  '2028年卒',
  '2029年卒',
  '2030年卒以降',
  'その他',
] as const;

/** 全12問（プロフィール2問 → 本診断10問） */
export const QUESTIONS: Question[] = [
  {
    key: 'age',
    type: 'age',
    title: 'あなたの年齢を教えてください',
    min: 18,
    max: 35,
    defaultValue: 22,
  },
  {
    key: 'grad',
    type: 'choice',
    title: '卒業予定年度を教えてください',
    options: [...GRADUATION_OPTIONS],
  },
  {
    key: 'q1',
    type: 'choice',
    title: '学生生活で、最も力を入れた経験は？',
    options: [
      '体育会・部活動',
      'サークル',
      'アルバイト',
      '長期インターン',
      '学生団体',
      '研究・ゼミ',
      '留学',
      '起業・ビジネス',
      'SNS・クリエイティブ活動',
      'ボランティア',
      '資格取得',
      'その他',
      'まだ特にない',
    ],
  },
  {
    key: 'q2',
    type: 'scale',
    title: 'その経験について、どこまで具体的に説明できますか？',
    options: [
      'まだうまく説明できない',
      '何をしたかは説明できる',
      '自分の工夫や行動まで説明できる',
      '成果まで具体的に説明できる',
      '数字・成果・自分の強みまで含めて説明できる',
    ],
  },
  {
    key: 'q3',
    type: 'scale',
    title: '自己分析はどこまで進んでいますか？',
    options: [
      'まだ始めていない',
      '少し考えたことがある',
      '自分の強み・弱みは整理している',
      '過去の経験まで振り返っている',
      '自分の価値観や就活軸まで言語化できている',
    ],
  },
  {
    key: 'q4',
    type: 'scale',
    title: '行きたい業界・職種はどこまで決まっていますか？',
    options: [
      'まだ全く決まっていない',
      'なんとなく興味のある分野はある',
      '複数の候補まで絞れている',
      '志望業界または職種が明確になっている',
      '志望業界・職種ともに明確になっている',
    ],
  },
  {
    key: 'q5',
    type: 'scale',
    title: '行きたい企業はどこまで具体化していますか？',
    options: [
      'まだ具体的な企業はない',
      '気になる企業が数社ある',
      '志望企業を5社以上挙げられる',
      '志望企業を10社以上挙げられる',
      '志望順位まで決まっている',
    ],
  },
  {
    key: 'q6',
    type: 'scale',
    title: 'ES・自己PRの準備はどこまで進んでいますか？',
    options: [
      'まだ作っていない',
      '書き始めている',
      '一通り完成している',
      '友人・先輩などに見てもらった',
      '就活経験者やキャリア支援者から添削を受けた',
    ],
  },
  {
    key: 'q7',
    type: 'scale',
    title: '面接や模擬面接を、これまで何回くらい経験しましたか？',
    note: '本選考・インターン選考・模擬面接を含みます',
    options: ['0回', '1〜2回', '3〜5回', '6〜10回', '11回以上'],
  },
  {
    key: 'q8',
    type: 'scale',
    title: '現在の就活状況で、最も進んでいるものを教えてください。',
    options: [
      'まだ選考を受けていない',
      'エントリー・書類選考',
      '一次面接',
      '二次・中間面接',
      '最終面接',
      '内定あり',
    ],
  },
  {
    key: 'q9',
    type: 'choice',
    title: '就職先を選ぶとき、あなたが最も重視したいものは？',
    note: '最も近いものを1つ選んでください',
    options: [
      '仕事内容',
      '年収',
      '企業の知名度',
      '安定性',
      '成長できる環境',
      '若いうちからの裁量',
      '福利厚生',
      'ワークライフバランス',
      '勤務地',
      '企業理念・社会貢献性',
      '一緒に働く人・カルチャー',
      '転職市場での価値',
      '起業につながる経験',
      'まだ分からない',
    ],
  },
  {
    key: 'q10',
    type: 'choice',
    title: '今、最も興味がある企業・進路タイプは？',
    options: [
      '公務員・団体職員',
      '日系大手企業',
      '外資系企業',
      'メガベンチャー',
      '成長ベンチャー',
      'スタートアップ',
      '中堅・優良企業',
      '地域密着企業',
      'まだ分からない',
    ],
  },
];

export const TOTAL_STEPS = QUESTIONS.length;

const byKey = new Map<QuestionKey, Question>(QUESTIONS.map((q) => [q.key, q]));

export function getQuestion(key: QuestionKey): Question {
  const q = byKey.get(key);
  if (!q) throw new Error(`Unknown question key: ${key}`);
  return q;
}

/** 選択肢を持つ設問の選択肢配列を返す */
export function getOptions(key: Exclude<QuestionKey, 'age'>): string[] {
  const q = getQuestion(key);
  if (q.type === 'age') throw new Error(`Question ${key} has no options`);
  return q.options;
}

/** ラベルから選択肢 index を引く（特殊選択肢の判定に使用） */
export function optionIndexOf(key: Exclude<QuestionKey, 'age'>, label: string): number {
  const index = getOptions(key).indexOf(label);
  if (index < 0) throw new Error(`Option "${label}" not found in ${key}`);
  return index;
}

/** index からラベルを引く（保存用） */
export function optionLabelOf(
  key: Exclude<QuestionKey, 'age'>,
  index: number | null,
): string | null {
  if (index === null) return null;
  return getOptions(key)[index] ?? null;
}

/** 判定で参照する特殊選択肢の index を一元管理する */
export const SPECIAL_OPTION_INDEX = {
  /** Q1「まだ特にない」 */
  q1NoExperience: optionIndexOf('q1', 'まだ特にない'),
  /** Q8「内定あり」 */
  q8OfferReceived: optionIndexOf('q8', '内定あり'),
  /** Q9「まだ分からない」 */
  q9Unknown: optionIndexOf('q9', 'まだ分からない'),
  /** Q10「まだ分からない」 */
  q10Unknown: optionIndexOf('q10', 'まだ分からない'),
} as const;

export const MAIN_QUESTION_KEYS: MainQuestionKey[] = [
  'q1',
  'q2',
  'q3',
  'q4',
  'q5',
  'q6',
  'q7',
  'q8',
  'q9',
  'q10',
];

/** 診断中演出のステップ（要件定義書 18章） */
export const ANALYZE_STEPS = [
  '経験を分析中',
  '就活準備度を分析中',
  'キャリアの方向性を分析中',
  '現在地を判定中',
  '次のアクションを作成中',
] as const;
