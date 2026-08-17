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

Cloudflare Pages にそのまま載る。外部API通信は無い。

| 項目 | 値 |
|---|---|
| Framework preset | None（または Vite） |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | （空欄＝リポジトリ直下） |
| Node.js バージョン | `.node-version` で 22 を指定済み |

2ページ構成（マルチページ）で、ページ内ルーターは使っていない。

| URL | エントリ | 出力 |
|---|---|---|
| `/` | `index.html` → `src/main.tsx` | `dist/index.html` |
| `/admin` | `admin/index.html` → `src/admin/main.tsx` | `dist/admin/index.html` |

`vite.config.ts` の `base: './'` により、アセットは相対パスで解決される
（`/admin` からは `../assets/...` として解決される）。SPAフォールバック（`_redirects`）は不要。

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
- **一般公開APIは `POST /api/diagnoses` の1本のみ**（読み出しAPIは無い）。
  同じ `diagnosis_id` の再送信は上書き（重複しない）。
  保存済みリードの閲覧・更新は、認証必須の管理API `/api/admin/*` からのみ行う（下記「管理画面」参照）
- 保存に失敗しても診断回答・結果は失われず、詳細結果の表示も止まらない。
  失敗したレコードは localStorage 側に `synced_to_d1: false` として残る

localStorage は診断途中の回答保持用として併用する。

### セキュリティ方針

個人情報（氏名・電話番号）を扱うため、以下を設計上の制約とする。

- **D1 へ触れるのは Pages Functions のサーバー側のみ。** ブラウザから D1 へは到達できない
- **一般公開の読み出しAPIは提供しない。** `diagnosis_id` を知っているだけで
  第三者の診断結果・氏名・電話番号を取得できる経路を作らない。
  読み出しは Cloudflare Access で保護された `/api/admin/*` のみ
- 一般公開APIのレスポンスに氏名・電話番号を含めない（成功時の応答は `{"ok":true}` のみ）
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

## 管理画面（/admin）

Career Compass で取得した診断リードを、営業担当者が確認・架電・追客するための簡易CRM。
既存の診断アプリ（`/`）とはコード・URL・APIをすべて分離しており、診断側の挙動には影響しない。

| レイヤー | ファイル |
|---|---|
| 画面 | `admin/index.html` / `src/admin/`（`AdminApp` / `AdminDashboard` / `LeadDetail` / `components/`） |
| 管理API | `functions/api/admin/`（`_middleware.ts` / `leads/index.ts` / `leads/[id].ts` / `leads/[id]/activities.ts`） |
| 認証 | `functions/lib/adminAuth.ts`（Cloudflare Access JWT の検証） |
| 共通処理 | `functions/lib/http.ts` / `functions/lib/leads.ts` |
| 営業マスタ | `src/admin/config/sales.ts`（営業ステータス・担当営業の唯一の定義） |
| スキーマ | `migrations/0002_add_sales_management.sql` |

### 管理API

| メソッド | パス | 用途 |
|---|---|---|
| GET | `/api/admin/leads` | リード一覧（絞り込み・並び替え・ページング）＋サマリー |
| POST | `/api/admin/leads` | 同上。氏名・電話番号のフリーワード検索を**ボディで**受け取る |
| GET | `/api/admin/leads/:id` | リード詳細（診断原本 + 営業管理情報 + 営業履歴） |
| PATCH | `/api/admin/leads/:id` | 営業ステータス / 担当営業 / 次回対応日時の更新 |
| POST | `/api/admin/leads/:id/activities` | 営業履歴の追加（最終対応日時なども同期更新） |

一覧取得に GET と POST の2種類があるのは、検索語（氏名・電話番号）を
URLのクエリ文字列へ載せないため。GET は `q` を受け付けない。

### 認証（Cloudflare Access）

管理画面は一般公開しない。Cloudflare Access で `/admin*` と `/api/admin/*` を保護し、
Pages Functions 側でも Access が発行した JWT を**毎リクエスト検証する**（多重防御）。

Cloudflare ダッシュボードでの設定：

1. Zero Trust → Access → Applications → Add an application（Self-hosted）
2. Application domain に Pages のドメイン、Path に `admin` を設定（`api/admin` も同様に追加）
3. Policy で許可するメールアドレス／グループを指定
4. 発行された **Application Audience (AUD) Tag** を控える
5. Pages プロジェクト → Settings → Environment variables に以下を追加（Production / Preview 両方）

| 変数名 | 値 |
|---|---|
| `ADMIN_ACCESS_TEAM_DOMAIN` | Zero Trust のチーム名（例: `your-team` または `your-team.cloudflareaccess.com`） |
| `ADMIN_ACCESS_AUD` | 手順4の AUD Tag |

**この2つが未設定の場合、管理画面・管理APIは常に 403 を返す（fail-closed）。**
設定漏れで個人情報が露出することはない。

ローカル開発時のみ、`.dev.vars`（gitignore 済み）に `ADMIN_DEV_BYPASS=true` を置くと
localhost からのアクセスに限り認証を迂回できる。本番・Preview には絶対に設定しない。

```bash
npx wrangler pages dev dist --d1 DB=career-compass-db
```

### 管理画面のセキュリティ方針

- 管理APIは `/api/admin/*` として一般公開APIと**ディレクトリごと分離**し、
  `functions/api/admin/_middleware.ts` を必ず通す。認証できない場合は D1 へ問い合わせない
- Access JWT は署名（JWKS）・`iss`・`aud`・`exp`/`nbf` をすべて検証する
- SQL は prepared statement + bind のみ。並び替えは固定候補からの選択で、
  ユーザー入力を SQL 文字列へ連結する箇所は存在しない
- 営業ステータス・担当営業は簡易マスタの値以外を受け付けない。
  **診断原本のカラム（Q1〜Q10・氏名・判定など）は管理APIから更新できない**
- 管理画面のデータは localStorage / sessionStorage へ保存しない（メモリ上のみ）
- 氏名・電話番号を URL・console・ログへ出さない。エラーは固定文言のみ
- CORS は開放せず、クロスオリジンからの管理APIアクセスは 403
- `public/_headers` で `/admin` 配下を `no-store` / `noindex, nofollow` にする

### 営業管理データ

`diagnoses` は**ユーザーが診断時に入力した原本**として維持し、
営業活動は別テーブル `sales_activities` へ履歴として積む。

| テーブル | 役割 |
|---|---|
| `diagnoses` | 診断原本 + 現在の営業状態（`sales_status` / `assigned_sales` / `last_contacted_at` / `next_contact_at` / `updated_at`） |
| `sales_activities` | 営業履歴（`diagnosis_id` / `sales_person` / `status` / `note` / `contacted_at` / `created_at`） |

migration の適用：

```bash
npx wrangler d1 migrations apply career-compass-db --remote
```

担当営業・営業ステータスの追加や変更は `src/admin/config/sales.ts` の配列のみを編集する
（フロントとサーバーの両方がこの定義を参照する）。

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
  components/                 共通UI（Logo / BackButton / ProgressBar / QuestionCard /
                              AnswerOption / PrimaryButton / GradeBadge / ReadinessItem /
                              Roadmap / ActionCard / WeaknessCard / SectionHeading / theme）
  screens/                    画面（Top / Question / Analyzing / SimpleResult /
                              Teaser / LeadForm / DetailResult）
  types/diagnosis.ts          ドメイン型定義
  admin/                      ── 管理画面（診断アプリからは独立）──
    main.tsx                  /admin のエントリ
    AdminApp.tsx              ヘッダー + 一覧⇄詳細の切り替え
    AdminDashboard.tsx        サマリー・検索・一覧・自動更新
    LeadDetail.tsx            診断原本の表示 + 営業対応エリア + 営業履歴
    api/client.ts             管理APIクライアント
    config/sales.ts           営業ステータス・担当営業マスタ（サーバーと共用）
    types.ts                  管理API の型（サーバーと共用）
    theme.ts / format.ts      管理画面のデザイントークン・表示整形
    components/               SummaryCards / FilterBar / LeadTable / ui
admin/index.html              /admin のHTML
index.html                    / のHTML
functions/
  api/diagnoses.ts            保存API（一般公開 / POSTのみ）
  api/admin/                  管理API（Cloudflare Access 認証必須）
    _middleware.ts            認証・同一オリジン確認
    leads/index.ts            一覧（GET / 検索はPOST）
    leads/[id].ts             詳細（GET）・営業情報更新（PATCH）
    leads/[id]/activities.ts  営業履歴の追加（POST）
  admin/_middleware.ts        管理画面HTMLの多重防御
  lib/adminAuth.ts            Cloudflare Access JWT の検証
  lib/http.ts                 レスポンス・入力検証の共通処理
  lib/leads.ts                リード検索条件の組み立て・詳細取得
  types.ts                    D1 / Pages Functions の最小型定義
public/_headers               レスポンスヘッダー（セキュリティ）
public/assets/                正式画像素材（ロゴ・コンパス）
migrations/
  0001_create_diagnoses.sql   D1スキーマ（診断原本）
  0002_add_sales_management.sql 営業管理カラム + sales_activities
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
- リード情報：**保存しない**（氏名・電話番号は localStorage へ書き込まず、D1 のみに保存する）
- 診断結果：総合スコア / 総合判定 / 就活タイプ / 7項目の準備度 / ロードマップ現在地 /
  リスクフラグ / 弱点1〜3 / 推奨アクション1〜3

保存は回答完了時（リードなし）と、リード登録時（リードあり）の2回。同一 `diagnosis_id` で上書きされる。

Supabase等へ移行する場合は `DiagnosisRepository` を実装したクラスを用意し、
`setRepository()` で差し替えるだけでよい。UI・診断ロジック側の変更は不要。

## MVPで実装していないもの

要件定義書36章の通り、AI判定・AIガクチカ分析・企業別内定確率・求人レコメンド・
マイページ・再診断履歴・企業DB連携・39問版診断は対象外。
