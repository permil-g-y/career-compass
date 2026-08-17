import type { CSSProperties, ReactNode } from 'react';
import { COLORS, FONT_ROUNDED } from './theme';

type Variant = 'blue' | 'yellow' | 'cta' | 'ghost';

interface Props {
  children: ReactNode;
  onClick: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: CSSProperties;
}

const VARIANT_STYLE: Record<Variant, CSSProperties> = {
  blue: {
    background: COLORS.blue,
    color: '#fff',
    fontFamily: FONT_ROUNDED,
    fontWeight: 800,
    fontSize: 18,
    padding: 18,
    boxShadow: '0 10px 24px rgba(27,102,245,.34)',
  },
  yellow: {
    background: COLORS.yellow,
    color: COLORS.text,
    fontFamily: FONT_ROUNDED,
    fontWeight: 800,
    fontSize: 18,
    padding: 18,
    boxShadow: '0 10px 24px rgba(255,178,20,.4)',
  },
  cta: {
    background: 'linear-gradient(180deg,#FFDF3C 0%,#FFC800 100%)',
    color: COLORS.navyDeep,
    fontFamily: FONT_ROUNDED,
    fontWeight: 800,
    fontSize: 'clamp(17px,4.6vw,20px)',
    padding: 'clamp(14px,2.1vh,18px) 20px',
    boxShadow: '0 6px 0 #EEA900,0 12px 20px rgba(120,80,0,.16)',
  },
  ghost: {
    background: '#fff',
    color: '#5C7599',
    fontSize: 13.5,
    fontWeight: 700,
    padding: 14,
    border: `2px solid ${COLORS.lineInput}`,
  },
};

/** 画面下部の主要アクションボタン */
export function PrimaryButton({
  children,
  onClick,
  variant = 'blue',
  disabled = false,
  style,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={variant === 'cta' ? 'cc-cta' : 'cc-press'}
      style={{
        width: '100%',
        border: 'none',
        borderRadius: 999,
        transition: 'background .2s ease,transform .12s ease,box-shadow .12s ease',
        ...VARIANT_STYLE[variant],
        ...(disabled ? { background: '#C3D5EC', boxShadow: 'none' } : null),
        ...style,
      }}
    >
      {children}
    </button>
  );
}
