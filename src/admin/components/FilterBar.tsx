/**
 * 検索・絞り込み・並び替え（管理画面要件定義書 9〜10章）
 *
 * 氏名・電話番号のフリーワード検索は POST で送信されるため、
 * 検索語が URL へ残ることはない（api/client.ts 参照）。
 */
import { CAREER_TYPES } from '../../config/diagnosis/types';
import { GRADUATION_OPTIONS } from '../../config/diagnosis/questions';
import { SALES_PERSONS, SALES_STATUSES } from '../config/sales';
import { ADMIN_COLORS } from '../theme';
import type { LeadQuery, LeadSort } from '../types';
import { Button, Field, Select, controlStyle } from './ui';

const GRADES = ['A', 'B', 'C', 'D', 'E'] as const;

const CAREER_TYPE_LABELS = Object.values(CAREER_TYPES).map((type) => type.label);

const SORT_LABELS: Record<LeadSort, string> = {
  newest: '新着順',
  oldest: '古い順',
  next_contact: '次回対応が近い順',
};

const SORT_OPTIONS = Object.keys(SORT_LABELS) as LeadSort[];

export const EMPTY_QUERY: LeadQuery = {
  q: '',
  status: '',
  assigned: '',
  graduation_year: '',
  grade: '',
  career_type: '',
  date_from: '',
  date_to: '',
  sort: 'newest',
};

export function isFiltered(query: LeadQuery): boolean {
  return (
    query.q.trim() !== '' ||
    query.status !== '' ||
    query.assigned !== '' ||
    query.graduation_year !== '' ||
    query.grade !== '' ||
    query.career_type !== '' ||
    query.date_from !== '' ||
    query.date_to !== ''
  );
}

export function FilterBar({
  query,
  onChange,
  onReset,
}: {
  query: LeadQuery;
  onChange: (next: LeadQuery) => void;
  onReset: () => void;
}) {
  const update = <K extends keyof LeadQuery>(key: K, value: LeadQuery[K]) => {
    onChange({ ...query, [key]: value });
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(200px, 1.6fr) repeat(5, minmax(110px, 1fr)) auto',
        gap: 10,
        alignItems: 'end',
        background: ADMIN_COLORS.surface,
        border: `1px solid ${ADMIN_COLORS.line}`,
        borderRadius: 10,
        padding: '12px 14px',
      }}
    >
      <Field label="氏名・電話番号で検索">
        <input
          className="cc-admin-control"
          type="search"
          value={query.q}
          placeholder="例）山田 / 08012345678"
          autoComplete="off"
          onChange={(event) => update('q', event.target.value)}
          style={controlStyle}
        />
      </Field>

      <Field label="営業ステータス">
        <Select
          value={query.status}
          onChange={(value) => update('status', value)}
          options={SALES_STATUSES}
          placeholder="すべて"
        />
      </Field>

      <Field label="担当営業">
        <Select
          value={query.assigned}
          onChange={(value) => update('assigned', value)}
          options={SALES_PERSONS}
          placeholder="すべて"
        />
      </Field>

      <Field label="卒業年度">
        <Select
          value={query.graduation_year}
          onChange={(value) => update('graduation_year', value)}
          options={GRADUATION_OPTIONS}
          placeholder="すべて"
        />
      </Field>

      <Field label="総合判定">
        <Select
          value={query.grade}
          onChange={(value) => update('grade', value)}
          options={GRADES}
          placeholder="すべて"
        />
      </Field>

      <Field label="就活タイプ">
        <Select
          value={query.career_type}
          onChange={(value) => update('career_type', value)}
          options={CAREER_TYPE_LABELS}
          placeholder="すべて"
        />
      </Field>

      <Button onClick={onReset} style={{ justifySelf: 'start' }}>
        条件クリア
      </Button>

      <Field label="登録日（開始）">
        <input
          className="cc-admin-control"
          type="date"
          value={query.date_from}
          onChange={(event) => update('date_from', event.target.value)}
          style={controlStyle}
        />
      </Field>

      <Field label="登録日（終了）">
        <input
          className="cc-admin-control"
          type="date"
          value={query.date_to}
          onChange={(event) => update('date_to', event.target.value)}
          style={controlStyle}
        />
      </Field>

      <Field label="並び替え">
        <select
          className="cc-admin-control"
          value={query.sort}
          onChange={(event) => update('sort', event.target.value as LeadSort)}
          style={controlStyle}
        >
          {SORT_OPTIONS.map((sort) => (
            <option key={sort} value={sort}>
              {SORT_LABELS[sort]}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}
