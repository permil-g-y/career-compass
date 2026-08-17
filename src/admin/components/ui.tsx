/**
 * 管理画面の共通UIパーツ。
 * 診断アプリ側のコンポーネント（src/components/）とは完全に分離している。
 */
import type { CSSProperties, ReactNode } from 'react';
import { ADMIN_COLORS, GRADE_COLORS, STATUS_COLORS } from '../theme';

/* ---------------- Card ---------------- */

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <section
      style={{
        background: ADMIN_COLORS.surface,
        border: `1px solid ${ADMIN_COLORS.line}`,
        borderRadius: 10,
        ...style,
      }}
    >
      {children}
    </section>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return (
    <h2
      style={{
        margin: 0,
        padding: '14px 18px',
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: '.04em',
        color: ADMIN_COLORS.navy,
        borderBottom: `1px solid ${ADMIN_COLORS.lineSoft}`,
      }}
    >
      {children}
    </h2>
  );
}

/* ---------------- Badge ---------------- */

export function StatusBadge({ status }: { status: string | null }) {
  const palette = (status && STATUS_COLORS[status]) || {
    bg: ADMIN_COLORS.grayBg,
    fg: ADMIN_COLORS.textSub,
  };
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 9px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: 'nowrap',
        background: palette.bg,
        color: palette.fg,
      }}
    >
      {status ?? '—'}
    </span>
  );
}

export function GradeBadge({ grade }: { grade: string | null }) {
  if (!grade) return <span style={{ color: ADMIN_COLORS.textMuted }}>—</span>;
  const palette = GRADE_COLORS[grade] ?? {
    bg: ADMIN_COLORS.grayBg,
    fg: ADMIN_COLORS.textSub,
  };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 24,
        height: 24,
        borderRadius: 6,
        fontSize: 13,
        fontWeight: 800,
        background: palette.bg,
        color: palette.fg,
      }}
    >
      {grade}
    </span>
  );
}

export function NewBadge() {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 6px',
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: '.06em',
        background: ADMIN_COLORS.blue,
        color: '#FFFFFF',
      }}
    >
      NEW
    </span>
  );
}

/* ---------------- Form ---------------- */

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <span
        style={{
          display: 'block',
          marginBottom: 4,
          fontSize: 11,
          fontWeight: 700,
          color: ADMIN_COLORS.textMuted,
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

/**
 * フォーム部品の共通スタイル。
 * 高さ・文字サイズは admin/index.html の .cc-admin-control に持たせており、
 * スマートフォン幅では 44px / 16px へ自動的に拡大する。
 */
export const controlStyle: CSSProperties = {
  width: '100%',
  padding: '0 9px',
  color: ADMIN_COLORS.text,
  background: ADMIN_COLORS.surface,
  border: `1px solid ${ADMIN_COLORS.line}`,
  borderRadius: 6,
  outline: 'none',
};

export function Select({
  value,
  onChange,
  options,
  placeholder,
  style,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  /** 空値のときに表示するラベル（絞り込み用） */
  placeholder?: string;
  style?: CSSProperties;
  disabled?: boolean;
}) {
  return (
    <select
      className="cc-admin-control"
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      style={{ ...controlStyle, ...style }}
    >
      {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

/* ---------------- Button ---------------- */

type ButtonVariant = 'primary' | 'ghost';

export function Button({
  children,
  onClick,
  variant = 'ghost',
  disabled,
  type = 'button',
  style,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  type?: 'button' | 'submit';
  style?: CSSProperties;
}) {
  const base: CSSProperties = {
    padding: '0 14px',
    fontWeight: 700,
    borderRadius: 6,
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.55 : 1,
    transition: 'background .12s ease, border-color .12s ease',
    ...style,
  };
  const variantStyle: CSSProperties =
    variant === 'primary'
      ? { background: ADMIN_COLORS.blue, color: '#FFFFFF', border: `1px solid ${ADMIN_COLORS.blue}` }
      : {
          background: ADMIN_COLORS.surface,
          color: ADMIN_COLORS.navy,
          border: `1px solid ${ADMIN_COLORS.line}`,
        };

  return (
    <button
      type={type}
      className="cc-admin-btn"
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...variantStyle }}
    >
      {children}
    </button>
  );
}

/** 電話発信ボタン（発信は数字のみ・表示は整形済みの番号） */
export function CallButton({
  phone,
  label,
  block,
}: {
  /** 数字のみの電話番号 */
  phone: string;
  label: string;
  block?: boolean;
}) {
  return (
    <a
      className="cc-admin-btn"
      href={`tel:${phone.replace(/[^0-9]/g, '')}`}
      style={{
        display: block ? 'flex' : 'inline-flex',
        width: block ? '100%' : undefined,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: '0 14px',
        fontWeight: 700,
        borderRadius: 6,
        textDecoration: 'none',
        background: ADMIN_COLORS.green,
        color: '#FFFFFF',
        border: `1px solid ${ADMIN_COLORS.green}`,
      }}
    >
      <span aria-hidden="true">📞</span>
      {label}
    </a>
  );
}

/* ---------------- Message ---------------- */

export function ErrorMessage({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      style={{
        margin: 0,
        padding: '10px 14px',
        fontSize: 13,
        color: ADMIN_COLORS.red,
        background: ADMIN_COLORS.redBg,
        border: `1px solid ${ADMIN_COLORS.redBg}`,
        borderRadius: 6,
      }}
    >
      {children}
    </p>
  );
}
