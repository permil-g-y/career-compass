-- Career Compass 管理画面｜営業管理データの追加（管理画面要件定義書 21〜23章）
--
-- 方針:
-- - 既存 diagnoses テーブルは「ユーザーが診断時に入力した原本」として維持する。
--   0001 で作成したカラムは一切変更・削除しない（追加のみ）。
-- - 営業活動（架電履歴・メモ）は sales_activities へ分離して保存する。
--
-- 適用: npx wrangler d1 migrations apply career-compass-db --remote

-- ------------------------------------------------------------------
-- 1. diagnoses への営業管理カラム追加（追加のみ / 既存データは既定値で埋まる）
-- ------------------------------------------------------------------

-- 営業ステータス（未架電 / 架電済み / 不通 / 再架電 / 面談予約 / 失注 / 成約）
ALTER TABLE diagnoses ADD COLUMN sales_status TEXT NOT NULL DEFAULT '未架電';

-- 担当営業（未設定 + 簡易マスタ）
ALTER TABLE diagnoses ADD COLUMN assigned_sales TEXT NOT NULL DEFAULT '未設定';

-- 最終対応日時（営業履歴の追加時に更新する / ISO8601）
ALTER TABLE diagnoses ADD COLUMN last_contacted_at TEXT;

-- 次回対応日時（ISO8601）
ALTER TABLE diagnoses ADD COLUMN next_contact_at TEXT;

-- 営業情報の更新日時（ISO8601）
ALTER TABLE diagnoses ADD COLUMN updated_at TEXT;

-- 一覧の絞り込み・並び替え用
CREATE INDEX IF NOT EXISTS idx_diagnoses_sales_status ON diagnoses (sales_status);
CREATE INDEX IF NOT EXISTS idx_diagnoses_assigned_sales ON diagnoses (assigned_sales);
CREATE INDEX IF NOT EXISTS idx_diagnoses_next_contact_at ON diagnoses (next_contact_at);

-- ------------------------------------------------------------------
-- 2. 営業履歴テーブル（新規）
-- ------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS sales_activities (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  diagnosis_id  TEXT NOT NULL,               -- diagnoses.diagnosis_id と紐付く
  sales_person  TEXT NOT NULL,               -- 対応した担当営業
  status        TEXT,                        -- その時点の営業ステータス
  note          TEXT,                        -- 営業メモ（自由記述）
  contacted_at  TEXT NOT NULL,               -- 対応日時（ISO8601）
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (diagnosis_id) REFERENCES diagnoses (diagnosis_id)
);

-- リード詳細での履歴取得（新しい順）
CREATE INDEX IF NOT EXISTS idx_sales_activities_diagnosis_id
  ON sales_activities (diagnosis_id, contacted_at DESC);
