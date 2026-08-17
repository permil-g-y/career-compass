-- Career Compass｜診断結果・リード情報の保存テーブル
-- 1件の診断が diagnosis_id で一意に紐付く（要件定義書 32章・34章）。
--
-- 適用: npx wrangler d1 migrations apply career-compass-db --remote

CREATE TABLE IF NOT EXISTS diagnoses (
  -- 基本情報
  diagnosis_id            TEXT PRIMARY KEY,
  created_at              TEXT NOT NULL,               -- 診断日時（ISO8601 / クライアント側の診断実行時刻）
  age                     INTEGER,
  graduation_year         TEXT,

  -- 診断回答（選択された選択肢のラベルを保存する）
  q1                      TEXT,                        -- 学生時代の経験
  q2                      TEXT,                        -- ガクチカ完成度
  q3                      TEXT,                        -- 自己分析
  q4                      TEXT,                        -- 志望業界・職種
  q5                      TEXT,                        -- 志望企業
  q6                      TEXT,                        -- ES・自己PR
  q7                      TEXT,                        -- 面接経験
  q8                      TEXT,                        -- 現在の選考状況
  q9                      TEXT,                        -- 企業選びの価値観
  q10                     TEXT,                        -- 希望する企業タイプ

  -- リード情報
  name                    TEXT NOT NULL,
  phone                   TEXT NOT NULL,               -- 数字のみに正規化して保存

  -- 診断結果
  overall_score           REAL,                        -- 0〜100
  overall_grade           TEXT,                        -- A〜E
  career_type             TEXT,                        -- 就活タイプ

  -- 7項目の就活準備度（1.0〜5.0）
  self_understanding      REAL,
  gakuchika               REAL,
  career_design           REAL,
  company_selection       REAL,
  application_preparation REAL,
  interview_preparation   REAL,
  selection_experience    REAL,

  -- ロードマップ現在地（1〜10）
  roadmap_current_step    INTEGER,

  -- 弱点（最大3つ）
  weakness_1              TEXT,
  weakness_2              TEXT,
  weakness_3              TEXT,

  -- 推奨アクション（最大3つ / ACTION_ID）
  action_1                TEXT,
  action_2                TEXT,
  action_3                TEXT,

  -- サーバー側の受信時刻
  saved_at                TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 新着順の一覧取得用
CREATE INDEX IF NOT EXISTS idx_diagnoses_created_at ON diagnoses (created_at DESC);

-- 判定別の集計用（A判定が多すぎないか等の運用チェック／要件定義書 18章）
CREATE INDEX IF NOT EXISTS idx_diagnoses_overall_grade ON diagnoses (overall_grade);
