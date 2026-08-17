/**
 * 検索・絞り込み・並び替え（管理画面要件定義書 9〜10章）
 *
 * 氏名・電話番号のフリーワード検索は POST で送信されるため、
 * 検索語が URL へ残ることはない（api/client.ts 参照）。
 *
 * スマートフォン幅では検索と並び替えのみを常時表示し、
 * それ以外の絞り込みは「絞り込み」トグルの中へ格納して画面を圧迫させない。
 */
import { useState } from 'react';
import { CAREER_TYPES } from '../../config/diagnosis/types';
import { GRADUATION_OPTIONS } from '../../config/diagnosis/questions';
import { SALES_STATUSES, UNASSIGNED_SALES } from '../config/sales';
import { useIsMobile } from '../hooks/useBreakpoint';
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

/** 検索語以外の絞り込みが指定されている数（スマホのトグル表示用） */
function activeFilterCount(query: LeadQuery): number {
  return [
    query.status,
    query.assigned,
    query.graduation_year,
    query.grade,
    query.career_type,
    query.date_from,
    query.date_to,
  ].filter((value) => value !== '').length;
}

export function FilterBar({
  query,
  salesNames,
  onChange,
  onReset,
}: {
  query: LeadQuery;
  /** 有効な営業担当者名（sales_users マスタ由来） */
  salesNames: string[];
  onChange: (next: LeadQuery) => void;
  onReset: () => void;
}) {
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState(false);
  const showDetails = !isMobile || expanded;
  const count = activeFilterCount(query);

  const update = <K extends keyof LeadQuery>(key: K, value: LeadQuery[K]) => {
    onChange({ ...query, [key]: value });
  };

  const assignedOptions = [UNASSIGNED_SALES, ...salesNames];

  return (
    <div
      style={{
        display: 'grid',
        // 画面幅に応じて折り返す（PCファーストだが、狭い画面でも横スクロールさせない）
        gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 10,
        alignItems: 'end',
        background: ADMIN_COLORS.surface,
        border: `1px solid ${ADMIN_COLORS.line}`,
        borderRadius: 10,
        padding: isMobile ? 12 : '12px 14px',
      }}
    >
      <div style={{ gridColumn: isMobile ? 'auto' : 'span 2', minWidth: 0 }}>
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
      </div>

      {isMobile ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'end' }}>
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
          <Button onClick={() => setExpanded((prev) => !prev)}>
            絞り込み{count ? `（${count}）` : ''}
            {expanded ? ' ▲' : ' ▼'}
          </Button>
        </div>
      ) : null}

      {showDetails ? (
        <>
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
              options={assignedOptions}
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

          {isMobile ? null : (
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
          )}

          <Button onClick={onReset} style={{ justifySelf: isMobile ? 'stretch' : 'start' }}>
            条件クリア
          </Button>
        </>
      ) : null}
    </div>
  );
}
