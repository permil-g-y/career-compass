/**
 * リード一覧（スマートフォン表示）
 *
 * 767px 以下では巨大なテーブルを横スクロールさせず、リード1件＝1カードで表示する。
 * 架電しながら使うため、電話発信・ステータス変更・担当変更をカード内で完結させる。
 */
import { SALES_STATUSES, salesPersonOptions } from '../config/sales';
import { formatDateTime, formatPhone, isNewLead, isOverdue } from '../format';
import { ADMIN_COLORS } from '../theme';
import type { LeadSummary } from '../types';
import { Button, CallButton, Field, GradeBadge, NewBadge, Select } from './ui';

function Meta({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div style={{ minWidth: 0 }}>
      <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: ADMIN_COLORS.textMuted }}>
        {label}
      </p>
      <p
        style={{
          margin: '2px 0 0',
          fontSize: 13,
          fontWeight: alert ? 700 : 500,
          color: alert ? ADMIN_COLORS.red : ADMIN_COLORS.text,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </p>
    </div>
  );
}

export function LeadCards({
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
          padding: '40px 16px',
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
    <div style={{ display: 'grid', gap: 10, padding: 12 }}>
      {leads.map((lead) => {
        const busy = updatingId === lead.diagnosis_id;
        return (
          <article
            key={lead.diagnosis_id}
            style={{
              border: `1px solid ${ADMIN_COLORS.line}`,
              borderRadius: 10,
              padding: 14,
              background: ADMIN_COLORS.surface,
            }}
          >
            {/* 氏名・電話番号 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 17, fontWeight: 800, color: ADMIN_COLORS.navy }}>
                {lead.name}
              </span>
              {isNewLead(lead.created_at) ? <NewBadge /> : null}
              <span style={{ marginLeft: 'auto' }}>
                <GradeBadge grade={lead.overall_grade} />
              </span>
            </div>

            <a
              href={`tel:${lead.phone.replace(/[^0-9]/g, '')}`}
              style={{
                display: 'inline-block',
                margin: '6px 0 10px',
                fontSize: 19,
                fontWeight: 800,
                letterSpacing: '.02em',
                color: ADMIN_COLORS.blue,
                textDecoration: 'none',
              }}
            >
              {formatPhone(lead.phone)}
            </a>

            {/* 基本情報 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: 8,
                paddingBottom: 10,
                borderBottom: `1px solid ${ADMIN_COLORS.lineSoft}`,
              }}
            >
              <Meta label="卒業年度" value={lead.graduation_year ?? '—'} />
              <Meta label="就活タイプ" value={lead.career_type ?? '—'} />
              <Meta label="登録日時" value={formatDateTime(lead.created_at)} />
              <Meta
                label="次回対応"
                value={formatDateTime(lead.next_contact_at)}
                alert={isOverdue(lead.next_contact_at)}
              />
            </div>

            {/* 営業操作 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: 10,
                margin: '10px 0',
              }}
            >
              <Field label="営業ステータス">
                <Select
                  value={lead.sales_status}
                  disabled={busy}
                  onChange={(value) => onChangeStatus(lead.diagnosis_id, value)}
                  options={SALES_STATUSES}
                />
              </Field>
              <Field label="担当営業">
                <Select
                  value={lead.assigned_sales}
                  disabled={busy}
                  onChange={(value) => onChangeAssigned(lead.diagnosis_id, value)}
                  options={salesPersonOptions(salesNames, lead.assigned_sales)}
                />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Button onClick={() => onOpen(lead.diagnosis_id)}>詳細</Button>
              <CallButton phone={lead.phone} label="電話する" block />
            </div>
          </article>
        );
      })}
    </div>
  );
}
