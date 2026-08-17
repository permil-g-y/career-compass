/**
 * ダッシュボード上部のサマリーカード（管理画面要件定義書 8.2）
 * 値は絞り込み条件に依存しない全体集計。
 */
import { ADMIN_COLORS } from '../theme';
import type { LeadStats } from '../types';

const ITEMS: { key: keyof LeadStats; label: string; color: string }[] = [
  { key: 'today_new', label: '今日の新規', color: ADMIN_COLORS.blue },
  { key: 'not_called', label: '未架電', color: ADMIN_COLORS.navy },
  { key: 'recall', label: '再架電', color: ADMIN_COLORS.purple },
  { key: 'appointment', label: '面談予約', color: ADMIN_COLORS.green },
];

export function SummaryCards({ stats }: { stats: LeadStats | null }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: 12,
      }}
    >
      {ITEMS.map((item) => (
        <div
          key={item.key}
          style={{
            background: ADMIN_COLORS.surface,
            border: `1px solid ${ADMIN_COLORS.line}`,
            borderRadius: 10,
            padding: '14px 16px',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 700,
              color: ADMIN_COLORS.textMuted,
            }}
          >
            {item.label}
          </p>
          <p
            style={{
              margin: '4px 0 0',
              fontSize: 26,
              fontWeight: 800,
              lineHeight: 1.2,
              color: item.color,
            }}
          >
            {stats ? stats[item.key] : '—'}
          </p>
        </div>
      ))}
    </div>
  );
}
