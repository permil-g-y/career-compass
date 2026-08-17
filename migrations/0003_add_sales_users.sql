-- Career Compass 管理画面｜営業担当者マスタ
--
-- 方針:
-- - 0001 / 0002 は一切変更しない（追加のみ）。
-- - 担当営業は diagnoses.assigned_sales / sales_activities.sales_person へ
--   「名前」で保存されている。既存データを壊さないため、その方式は維持し、
--   本テーブルは「選択できる担当者の一覧」を管理する役割に徹する。
-- - 「未設定」は担当者ではなく“未割り当て”を表す予約語のため、本テーブルには登録しない。
-- - 退職者は物理削除せず is_active = 0 で無効化する（過去の営業履歴に名前が残るため）。
--
-- 適用: npx wrangler d1 migrations apply career-compass-db --remote

CREATE TABLE IF NOT EXISTS sales_users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,                 -- 表示名。diagnoses.assigned_sales と対応する
  email       TEXT,
  is_active   INTEGER NOT NULL DEFAULT 1,    -- 1=有効 / 0=無効
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 名前は担当者の識別キーになるため一意にする
CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_users_name ON sales_users (name);
CREATE INDEX IF NOT EXISTS idx_sales_users_is_active ON sales_users (is_active);

-- ------------------------------------------------------------------
-- 初期データ（従来 src/admin/config/sales.ts の固定配列にあった担当者）
-- ------------------------------------------------------------------
INSERT OR IGNORE INTO sales_users (name) VALUES ('山田');
INSERT OR IGNORE INTO sales_users (name) VALUES ('佐藤');
INSERT OR IGNORE INTO sales_users (name) VALUES ('鈴木');

-- 既にリード・営業履歴へ登録済みの担当者名も取り込み、
-- マスタに存在しない担当者が残らないようにする（既存データとの整合性の担保）。
INSERT OR IGNORE INTO sales_users (name)
  SELECT DISTINCT assigned_sales FROM diagnoses
  WHERE assigned_sales IS NOT NULL AND TRIM(assigned_sales) <> '' AND assigned_sales <> '未設定';

INSERT OR IGNORE INTO sales_users (name)
  SELECT DISTINCT sales_person FROM sales_activities
  WHERE sales_person IS NOT NULL AND TRIM(sales_person) <> '' AND sales_person <> '未設定';
