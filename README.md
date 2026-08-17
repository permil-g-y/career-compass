# Career Compass｜就活現在地診断（MVP）

大学生向け就活診断Webアプリ。基本プロフィール2問＋本診断10問（全12問）に回答すると、
7項目の就活準備度・A〜E総合判定・就活タイプ・ロードマップ現在地・弱点・「今やるべき3つ」を返す。

- UIは Claude Design 確定版を正とする
- 診断ロジックは診断ロジック仕様書を正とする
- 画面仕様・設問文言はMVP確定版要件定義書を正とする
- AI APIは使用しない。完全なルールベース診断で、同じ回答なら必ず同じ結果になる

> 上記の元資料（要件定義書・診断ロジック仕様書・Claude Design成果物・画像素材の原本）は
> 社内資料のためリポジトリには含めていない。ローカルの作業フォルダにのみ保持する。

## 起動

```bash
npm install
```

```bash
npm run dev
```

ビルド／型チェック：

```bash
npm run build
```

## デプロイ（Cloudflare Pages）

静的SPAのため Cloudflare Pages にそのまま載る。サーバー処理・環境変数・外部API通信は無い。

| 項目 | 値 |
|---|---|
| Framework preset | None（または Vite） |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | （空欄＝リポジトリ直下） |
| Node.js バージョン | `.node-version` で 22 を指定済み |

クライアントサイドルーターを使っていない（URLは `/` のみ）ため、SPAフォールバック（`_redirects`）は不要。
`vite.config.ts` の `base: './'` により、アセットは相対パスで解決される。

## データ保存（Cloudflare D1）

氏名・電話番号の登録が完了した時点で、診断回答・リード情報・診断結果を
Cloudflare D1 へ1レコードとして保存する。すべて同一の `diagnosis_id` に紐付く。

| レイヤー | ファイル |
|---|---|
| スキーマ | `migrations/0001_create_diagnoses.sql` |
| 保存API | `functions/api/diagnoses.ts`（Pages Functions） |
| 送信側 | `src/storage/d1Repository.ts` |
| ペイロード変換 | `src/storage/repository.ts` の `buildDiagnosisPayload()` |

- D1 binding 名は `DB`（`context.env.DB`）
- 公開APIは `POST /api/diagnoses` の**1本のみ**。同じ `diagnosis_id` の再送信は上書き（重複しない）
- 保存に失敗しても診断回答・結果は失われず、詳細結果の表示も止まらない。
  失敗したレコードは localStorage 側に `synced_to_d1: false` として残る

localStorage は診断途中の回答保持用として併用する。

### セキュリティ方針

個人情報（氏名・電話番号）を扱うため、以下を設計上の制約とする。

- **D1 へ触れるのは Pages Functions のサーバー側のみ。** ブラウザから D1 へは到達できない
- **保存データを読み出すAPIは提供しない。** `diagnosis_id` 等を指定して
  第三者の診断結果・氏名・電話番号を取得できる経路を作らない。
  保存内容の閲覧は Cloudflare ダッシュボードの D1 コンソールから行う
- APIレスポンスに氏名・電話番号を含めない（成功時の応答は `{"ok":true}` のみ）
- 氏名・電話番号を console／ログへ出力しない。エラーログはエラー種別のみ
- エラーレスポンスは固定文言のみ。内部構造・SQL・binding の有無を推測させない
- SQL は prepared statement + bind のみ。カラム名は静的定数由来で、値は必ず bind
- すべての入力値をサーバー側で型・範囲・長さまで検証する
- CORS ヘッダーは付与せず、クロスオリジンからの POST は 403
- **氏名・電話番号を localStorage へ保存しない。** 保存境界（`localStorageRepository`）で
  必ず除去する。旧バージョンが保存した値は起動時に自動削除する
- 送信完了後、電話番号はブラウザ上に保持しない
- レスポンスヘッダーは `public/_headers` で設定（nosniff / Referrer-Policy / X-Frame-Options 等）

### ローカルでの動作

`npm run dev` / `npm run preview` には Pages Functions が無いため、保存APIは404になる
（診断そのものは最後まで動作する）。D1込みで確認する場合は `wrangler pages dev` を使う。

## ディレクトリ構成

```
src/
  config/
    app.ts                    最終CTAの文言・遷移先、演出時間
    diagnosis/
      questions.ts            全12問の設問・選択肢・診断中演出のステップ
      scoring.ts              スコア表・weight・閾値・卒業年度補正・リスクフラグ・phase bonus
      grades.ts               A〜E総合判定の名称と総評コメント
      types.ts                就活タイプ（Q9→タイプ / Q10→タイプ）
      roadmap.ts              ロードマップ10工程と完了条件
      weaknesses.ts           弱点コメント
      actions.ts              アクションカタログと 項目×grade → ACTION_ID の対応
  lib/
    diagnosis.ts              診断エンジン（純粋関数 runDiagnosis）
    validation.ts             氏名・電話番号のバリデーションと正規化
  storage/
    repository.ts             保存インターフェース・レコード組み立て・D1ペイロード変換
    localStorageRepository.ts localStorage実装（端末内の保持）
    d1Repository.ts           Cloudflare D1実装（保存APIの呼び出し）
functions/
  api/diagnoses.ts            保存API（POSTのみ / 読み出しAPIは提供しない）
  types.ts                    D1 / Pages Functions の最小型定義
public/_headers               レスポンスヘッダー（セキュリティ）
migrations/
  0001_create_diagnoses.sql   D1スキーマ
  components/                 共通UI（Logo / BackButton / ProgressBar / QuestionCard /
                              AnswerOption / PrimaryButton / GradeBadge / ReadinessItem /
                              Roadmap / ActionCard / WeaknessCard / SectionHeading / theme）
  screens/                    画面（Top / Question / Analyzing / SimpleResult /
                              Teaser / LeadForm / DetailResult）
  types/diagnosis.ts          ドメイン型定義
public/assets/                正式画像素材（ロゴ・コンパス）
```

診断ロジックはUIコンポーネントへ一切ベタ書きしていない。
結果画面は判定ごとに分けず、共通コンポーネントに診断結果オブジェクトを流し込む構造。

## よくある変更

| やりたいこと | 変更箇所 |
|---|---|
| A〜E総合判定の閾値を変える | `src/config/diagnosis/scoring.ts` の `OVERALL_GRADE_THRESHOLDS` |
| 7項目の重みを変える | 同 `READINESS_WEIGHTS` |
| 各項目のA〜E閾値を変える | 同 `READINESS_GRADE_THRESHOLDS` |
| 卒業年度の減点ルールを変える | 同 `GRADUATION_PENALTY` / `GRADUATION_YEAR_MAP` |
| 弱点の優先度（phase bonus / risk bonus）を変える | 同 `PHASE_BONUS` / `RISK_BONUS` |
| 設問・選択肢を変える | `src/config/diagnosis/questions.ts`（スコアは `scoring.ts` の `QUESTION_SCORES`） |
| 推奨アクションの文言を変える | `src/config/diagnosis/actions.ts` |
| 最終CTAの文言・遷移先 | `src/config/app.ts` の `FINAL_CTA_LABEL` / `FINAL_CTA_URL` |

## データ保存

MVPでは `localStorage`（キー: `career_compass_diagnoses`）に保存する。
1件のレコードに、`diagnosis_id` で以下がすべて紐付く。

- 基本情報：diagnosis_id / 診断日時 / 年齢 / 卒業年度
- 診断回答：Q1〜Q10（index と選択肢ラベル）
- リード情報：氏名 / 電話番号（正規化済み・生値の両方）
- 診断結果：総合スコア / 総合判定 / 就活タイプ / 7項目の準備度 / ロードマップ現在地 /
  リスクフラグ / 弱点1〜3 / 推奨アクション1〜3

保存は回答完了時（リードなし）と、リード登録時（リードあり）の2回。同一 `diagnosis_id` で上書きされる。

Supabase等へ移行する場合は `DiagnosisRepository` を実装したクラスを用意し、
`setRepository()` で差し替えるだけでよい。UI・診断ロジック側の変更は不要。

## MVPで実装していないもの

要件定義書36章の通り、AI判定・AIガクチカ分析・企業別内定確率・求人レコメンド・
マイページ・再診断履歴・企業DB連携・39問版診断は対象外。
