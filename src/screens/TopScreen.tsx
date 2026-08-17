import type { CSSProperties, ReactNode } from 'react';
import { Logo } from '../components/Logo';
import { PrimaryButton } from '../components/PrimaryButton';
import { COLORS, FONT_BASE, FONT_ROUNDED, asset } from '../components/theme';

interface Props {
  onStart: () => void;
}

const H1_STYLE = {
  position: 'relative',
  fontFamily: FONT_ROUNDED,
  fontWeight: 800,
  fontSize: 'clamp(19px,min(6.1vw,4.6vh),32px)',
  lineHeight: 1.3,
  letterSpacing: '-.03em',
  color: COLORS.navy,
  margin: 'clamp(12px,3.2vh,34px) 0 0',
  whiteSpace: 'nowrap',
} as CSSProperties;

const H2_STYLE = {
  position: 'relative',
  fontFamily: FONT_ROUNDED,
  fontWeight: 800,
  fontSize: 'clamp(15.5px,2.3vh,20px)',
  lineHeight: 1.5,
  color: COLORS.blueDark,
  margin: 'clamp(12px,3vh,32px) 0 0',
  textWrap: 'pretty',
} as CSSProperties;

function Bullet({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        background: '#fff',
        borderRadius: 14,
        padding: 'clamp(8px,1.3vh,12px) 20px clamp(8px,1.3vh,12px) 15px',
        boxShadow: '0 5px 14px rgba(20,60,140,.10)',
      }}
    >
      {icon}
      <span
        style={{
          fontFamily: FONT_ROUNDED,
          fontWeight: 800,
          fontSize: 'clamp(13px,1.85vh,14.5px)',
          color: COLORS.navyDeep,
        }}
      >
        {label}
      </span>
    </div>
  );
}

const iconProps = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: COLORS.blue,
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
};

/** PAGE 01｜トップページ */
export function TopScreen({ onStart }: Props) {
  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(180deg,#F8FAFB 0%,#F8FAFB 72%,#EFF8FE 100%)',
        padding: 'clamp(12px,2.4vh,26px) 22px clamp(10px,2.4vh,28px)',
        minHeight: '100dvh',
        display: 'block',
        animation: 'ccFadeUp .4s ease both',
      }}
    >
      {/* 背景装飾 */}
      <div style={{ position: 'absolute', left: -40, bottom: 26, width: 170, height: 60, borderRadius: 999, background: '#E4F2FD' }} />
      <div style={{ position: 'absolute', right: -46, bottom: 64, width: 150, height: 54, borderRadius: 999, background: '#EAF6FE' }} />
      <div style={{ position: 'absolute', right: 26, bottom: 24, width: 11, height: 11, borderRadius: 3, background: '#BFE3FA', transform: 'rotate(24deg)' }} />
      <div style={{ position: 'absolute', top: 8, right: -90, width: 230, height: 80, borderRadius: 999, background: '#E4F2FD' }} />
      <div style={{ position: 'absolute', top: 56, right: -30, width: 130, height: 52, borderRadius: 999, background: '#EEF7FE' }} />
      <div style={{ position: 'absolute', top: 14, left: -80, width: 150, height: 58, borderRadius: 999, background: '#EEF7FE' }} />
      <div style={{ position: 'absolute', top: 26, right: 22, width: 13, height: 13, background: '#F0407A', transform: 'rotate(45deg)' }} />
      <div style={{ position: 'absolute', top: 58, right: 54, width: 42, height: 12, borderRadius: 999, background: COLORS.yellowDeep, transform: 'rotate(-38deg)' }} />

      <div style={{ position: 'relative' }}>
        <Logo width="46%" style={{ minWidth: 158, maxWidth: 210 }} />
      </div>

      <h1 style={H1_STYLE}>あなたの就活、今どの位置？</h1>

      <p
        style={{
          position: 'relative',
          fontFamily: FONT_BASE,
          fontWeight: 500,
          fontSize: 'clamp(13px,min(3.9vw,1.95vh),16px)',
          lineHeight: 'clamp(1.58,2.3vh,1.95)',
          color: '#37486A',
          margin: 'clamp(10px,2vh,18px) 0 0',
        }}
      >
        質問に答えるだけで、
        <br />
        志望先への現在地と、
        <br />
        内定に近づくために
        <br />
        次にやるべきことが分かります。
      </p>

      <h2 style={H2_STYLE}>
        就活版の「模試」で、
        <br />
        ゴールまでの距離を見える化。
      </h2>

      <p
        style={{
          position: 'relative',
          fontSize: 'clamp(12.5px,1.7vh,13.5px)',
          lineHeight: 'clamp(1.6,2.1vh,1.95)',
          color: COLORS.textMuted,
          margin: 'clamp(9px,1.6vh,14px) 0 0',
          zIndex: 1,
        }}
      >
        Career
        Compassは、「あなたは○○タイプ」と診断して終わるサービスではありません。あなたの経験や現在の就活状況、目指しているキャリアから分析します。
      </p>

      <div
        style={{
          position: 'relative',
          marginTop: 'clamp(12px,2.4vh,28px)',
          height: 'clamp(124px,25vh,250px)',
          flex: 'none',
        }}
      >
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: -22, right: -22, overflow: 'hidden', zIndex: 0 }}>
          <div style={{ position: 'absolute', left: -16, right: -16, top: '34%', bottom: 0, borderRadius: '55% 65% 0 0 / 42px 52px 0 0', background: '#8FD2F7' }} />
          <div style={{ position: 'absolute', left: -46, bottom: '18%', width: 190, height: '36%', borderRadius: 999, background: '#BFE3FA' }} />
          <div style={{ position: 'absolute', right: -34, bottom: '52%', width: 160, height: '28%', borderRadius: 999, background: '#C9EAFB' }} />
          <div style={{ position: 'absolute', left: '16%', bottom: -2, width: 120, height: '22%', borderRadius: 999, background: '#D3EEFC' }} />
          <div style={{ position: 'absolute', left: 2, bottom: '12%', width: 30, height: 11, borderRadius: 999, background: '#F0554B', transform: 'rotate(-42deg)' }} />
          <div style={{ position: 'absolute', left: '46%', bottom: '5%', width: 13, height: 13, background: '#6FD08C', transform: 'rotate(45deg)' }} />
          <div style={{ position: 'absolute', right: '28%', bottom: '40%', width: 12, height: 12, borderRadius: 3, background: '#2F7BF5', transform: 'rotate(24deg)' }} />
        </div>

        <img
          src={asset('compass-hero.png')}
          alt=""
          style={{
            position: 'absolute',
            zIndex: 1,
            right: -8,
            bottom: 2,
            width: '50%',
            maxWidth: 'clamp(146px,22.5vh,214px)',
            height: 'auto',
            filter: 'drop-shadow(0 12px 22px rgba(10,40,90,.22))',
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 'clamp(6px,1.1vh,12px)',
            paddingTop: 'clamp(8px,2.6vh,34px)',
          }}
        >
          <Bullet
            label="所要時間：約2分"
            icon={
              <svg {...iconProps}>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3.5 2" />
              </svg>
            }
          />
          <Bullet
            label="無料で利用可能"
            icon={
              <svg {...iconProps}>
                <rect x="3" y="9" width="18" height="12" rx="2" />
                <path d="M3 13h18M12 9v12" />
                <path d="M12 9C10 5 6 5 6 7.5S9.5 9 12 9s6 .5 6-1.5S14 5 12 9z" />
              </svg>
            }
          />
          <Bullet
            label="あなた専用の結果をお届け"
            icon={
              <svg {...iconProps}>
                <circle cx="12" cy="8" r="4" />
                <path d="M5 21c0-4 3.5-6 7-6s7 2 7 6" />
              </svg>
            }
          />
        </div>
      </div>

      <PrimaryButton
        onClick={onStart}
        variant="cta"
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
          margin: '28px 0 0',
          zIndex: 1,
        }}
      >
        無料で診断をはじめる<span style={{ fontSize: '.8em', fontWeight: 700 }}>›</span>
      </PrimaryButton>
      <div
        style={{
          position: 'relative',
          textAlign: 'center',
          fontSize: 11.5,
          color: COLORS.textPale,
          marginTop: 'clamp(6px,1vh,12px)',
          marginBottom: 20,
          zIndex: 1,
        }}
      >
        登録なしで診断をはじめられます
      </div>
    </div>
  );
}
