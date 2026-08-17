import { ANALYZE_STEPS } from '../config/diagnosis/questions';
import { FONT_ROUNDED } from '../components/theme';

interface Props {
  /** 完了済みステップ数（0〜5、5でヘッダーが「診断完了」に変わる） */
  step: number;
}

/** 診断完了演出（要件定義書 18章） */
export function AnalyzingScreen({ step }: Props) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(170deg,#1B66F5,#0B3C91)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 26px',
        color: '#fff',
      }}
    >
      <div
        style={{
          width: 84,
          height: 84,
          borderRadius: '50%',
          border: '6px solid rgba(255,255,255,.25)',
          borderTopColor: '#FFC93C',
          animation: 'ccSpin 1s linear infinite',
        }}
      />
      <div
        style={{
          fontFamily: FONT_ROUNDED,
          fontWeight: 800,
          fontSize: 20,
          marginTop: 28,
          textAlign: 'center',
        }}
      >
        {step >= ANALYZE_STEPS.length ? '診断完了' : 'あなたの就活状況を分析しています...'}
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          marginTop: 26,
          width: '100%',
          maxWidth: 280,
        }}
      >
        {ANALYZE_STEPS.map((label, i) => (
          <div
            key={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 14,
              fontWeight: 500,
              transition: 'opacity .3s ease',
              opacity: i < step ? 1 : 0.35,
            }}
          >
            <span
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                color: '#0B3C91',
                background: i < step ? '#FFC93C' : 'rgba(255,255,255,.25)',
              }}
            >
              ✓
            </span>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
