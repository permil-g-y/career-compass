/**
 * リード一覧テーブル（管理画面要件定義書 8.3）
 *
 * 架電しながら使うことを優先し、営業ステータスと担当営業は
 * 一覧のまま変更できるようにしている（変更は PATCH /api/admin/leads/:id）。
 */
import type { CSSProperties } from 'react';
import { SALES_STATUSES, salesPersonOptions } from '../config/sales';
import { formatDateTime, formatPhone, isNewLead, isOverdue } from '../format';
import { ADMIN_COLORS } from '../theme';
import type { LeadSummary } from '../types';
import { Button, GradeBadge, NewBadge, Select } from './ui';

const HEADERS = [
  '登録日時',
  '氏名',
  '電話番号',
  '卒業年度',
  '判定',
  '就活タイプ',
  '営業ステータス',
  '担当営業',
  '最終対応',
  '次回対応',
  '',
];

const thStyle: CSSProperties = {
  padding: '9px 10px',
  textAlign: 'left',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '.03em',
  color: ADMIN_COLORS.textMuted,
  borderBottom: `1px solid ${ADMIN_COLORS.line}`,
  whiteSpace: 'nowrap',
  background: ADMIN_COLORS.surface,
  position: 'sticky',
  top: 0,
  zIndex: 1,
};

const tdStyle: CSSProperties = {
  padding: '8px 10px',
  fontSize: 13,
  color: ADMIN_COLORS.text,
  borderBottom: `1px solid ${ADMIN_COLORS.lineSoft}`,
  whiteSpace: 'nowrap',
  verticalAlign: 'middle',
};

export function LeadTable({
  leads,
  loading,
  updatingId,
  salesNames,
  onOpen,
  onChangeStatus,
  onChangeAssigned,
}: {
  leads: LeadSummary[];
  loading: boolean;
  /** 更新中のリード（多重送信防止） */
  updatingId: string | null;
  /** 有効な営業担当者名（sales_users マスタ由来） */
  salesNames: string[];
  onOpen: (diagnosisId: string) => void;
  onChangeStatus: (diagnosisId: string, status: string) => void;
  onChangeAssigned: (diagnosisId: string, assigned: string) => void;
}) {
  if (!loading && leads.length === 0) {
    return (
      <p
        style={{
          margin: 0,
          padding: '40px 0',
          textAlign: 'center',
          fontSize: 13,
          color: ADMIN_COLORS.textMuted,
        }}
      >
        条件に一致するリードがありません。
      </p>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {HEADERS.map((header, index) => (
              <th key={`${header}-${index}`} style={thStyle} scope="col">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => {
            const busy = updatingId === lead.diagnosis_id;
            return (
              <tr key={lead.diagnosis_id} className="cc-admin-row">
                <td style={tdStyle}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    {formatDateTime(lead.created_at)}
                    {isNewLead(lead.created_at) ? <NewBadge /> : null}
                  </span>
                </td>
                <td style={{ ...tdStyle, fontWeight: 700 }}>{lead.name}</td>
                <td style={tdStyle}>
                  <a
                    href={`tel:${lead.phone}`}
                    style={{ color: ADMIN_COLORS.blue, textDecoration: 'none' }}
                  >
                    {formatPhone(lead.phone)}
                  </a>
                </td>
                <td style={tdStyle}>{lead.graduation_year ?? '—'}</td>
                <td style={tdStyle}>
                  <GradeBadge grade={lead.overall_grade} />
                </td>
                <td style={{ ...tdStyle, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {lead.career_type ?? '—'}
                </td>
                <td style={tdStyle}>
                  <Select
                    value={lead.sales_status}
                    disabled={busy}
                    onChange={(value) => onChangeStatus(lead.diagnosis_id, value)}
                    options={SALES_STATUSES}
                    style={{ width: 108, height: 30, fontSize: 12 }}
                  />
                </td>
                <td style={tdStyle}>
                  <Select
                    value={lead.assigned_sales}
                    disabled={busy}
                    onChange={(value) => onChangeAssigned(lead.diagnosis_id, value)}
                    options={salesPersonOptions(salesNames, lead.assigned_sales)}
                    style={{ width: 96, height: 30, fontSize: 12 }}
                  />
                </td>
                <td style={{ ...tdStyle, color: ADMIN_COLORS.textSub }}>
                  {formatDateTime(lead.last_contacted_at)}
                </td>
                <td
                  style={{
                    ...tdStyle,
                    color: isOverdue(lead.next_contact_at) ? ADMIN_COLORS.red : ADMIN_COLORS.textSub,
                    fontWeight: isOverdue(lead.next_contact_at) ? 700 : 400,
                  }}
                >
                  {formatDateTime(lead.next_contact_at)}
                </td>
                <td style={tdStyle}>
                  <Button onClick={() => onOpen(lead.diagnosis_id)} style={{ height: 30 }}>
                    詳細
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
