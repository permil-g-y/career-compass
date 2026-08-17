/**
 * 就活タイプ判定（診断ロジック仕様書 10章）
 *
 * Q9 を第一優先、Q10 を第二優先とする。
 * Q9・Q10 は総合スコアへ一切反映させない（仕様書 1.3 / 17章）。
 */
import type { CareerTypeId } from '../../types/diagnosis';

export interface CareerTypeInfo {
  id: CareerTypeId;
  label: string;
  description: string;
}

export const CAREER_TYPES: Record<CareerTypeId, CareerTypeInfo> = {
  growth: {
    id: 'growth',
    label: '成長環境重視型',
    description:
      'あなたは会社の知名度や安定性だけでなく、「自分がどれだけ成長できるか」を重視する傾向があります。若いうちから経験を積める環境や、変化のある企業に魅力を感じやすいタイプです。',
  },
  stable: {
    id: 'stable',
    label: '安定キャリア型',
    description:
      '長く働き続けられる環境や、腰を据えてキャリアを築ける基盤を重視するタイプです。制度・事業基盤の安定性を軸に企業を比較すると、納得感のある選択ができます。',
  },
  high: {
    id: 'high',
    label: 'ハイキャリア志向型',
    description:
      '早い段階から市場価値を高め、実力に応じた評価・報酬を得たいタイプです。成果が明確に評価される環境や、専門性が積み上がる仕事と相性が良いでしょう。',
  },
  wlb: {
    id: 'wlb',
    label: 'ワークライフ重視型',
    description:
      '仕事だけでなく、自分の生活や大切にしたい時間も含めてキャリアを考えるタイプです。働き方・制度・勤務地といった条件面を早めに整理すると企業選びが進みます。',
  },
  challenge: {
    id: 'challenge',
    label: '挑戦・起業志向型',
    description:
      '裁量を持って自分で動かせる環境に惹かれるタイプです。事業づくりの経験を積める環境や、任される範囲の広い組織を見てみましょう。',
  },
  culture: {
    id: 'culture',
    label: 'カルチャー重視型',
    description:
      '一緒に働く人や企業の価値観との相性を大切にするタイプです。社員との接点を多く持つほど、納得感のある意思決定ができます。',
  },
  specialty: {
    id: 'specialty',
    label: '専門性重視型',
    description:
      '「どの会社か」よりも「どんな仕事をするか」を大切にするタイプです。職種で企業を横断的に比較すると、自分に合う環境が見つけやすくなります。',
  },
  explore: {
    id: 'explore',
    label: 'キャリア探索型',
    description:
      '今はまだ方向性を探している段階です。それ自体は問題ではありません。まずは選択肢を知り、比較材料を増やすことから始めましょう。',
  },
};

/** Q9（企業選びの価値観）→ 基本タイプ（仕様書 10章） */
export const TYPE_BY_Q9: Record<string, CareerTypeId> = {
  仕事内容: 'specialty',
  年収: 'high',
  企業の知名度: 'stable',
  安定性: 'stable',
  成長できる環境: 'growth',
  若いうちからの裁量: 'challenge',
  福利厚生: 'wlb',
  ワークライフバランス: 'wlb',
  勤務地: 'wlb',
  '企業理念・社会貢献性': 'culture',
  '一緒に働く人・カルチャー': 'culture',
  転職市場での価値: 'high',
  起業につながる経験: 'challenge',
};

/** Q10（希望企業タイプ）→ 補助タイプ（仕様書 10章） */
export const TYPE_BY_Q10: Record<string, CareerTypeId> = {
  '公務員・団体職員': 'stable',
  日系大手企業: 'stable',
  外資系企業: 'high',
  メガベンチャー: 'growth',
  成長ベンチャー: 'growth',
  スタートアップ: 'challenge',
  '中堅・優良企業': 'stable',
  地域密着企業: 'stable',
  まだ分からない: 'explore',
};

/** Q4 <= 2 かつ Q9・Q10 ともに「まだ分からない」の場合のタイプ */
export const EXPLORE_TYPE_ID: CareerTypeId = 'explore';

/** キャリア探索型に落とす Q4 スコアの上限 */
export const EXPLORE_Q4_MAX = 2;
