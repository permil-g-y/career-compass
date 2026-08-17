import { COLORS } from './theme';

interface Props {
  onClick: () => void;
  /** ボタン径（px） */
  size?: number;
}

/** 戻るボタン。位置・サイズ調整はこのコンポーネント側で管理する。 */
export function BackButton({ onClick, size = 32 }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="戻る"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: 'none',
        padding: 0,
        background: '#fff',
        color: '#43618F',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow:
          size >= 34 ? '0 3px 10px rgba(20,60,140,.10)' : '0 2px 8px rgba(20,60,140,.08)',
        flex: 'none',
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ display: 'block', color: COLORS.textSub }}
      >
        <path d="M15 18 9 12l6-6" />
      </svg>
    </button>
  );
}
