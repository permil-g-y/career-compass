import type { CSSProperties } from 'react';
import { GradeBadge } from '../components/GradeBadge';
import { Logo } from '../components/Logo';
import { PrimaryButton } from '../components/PrimaryButton';
import { COLORS, FONT_ROUNDED } from '../components/theme';
import type { DiagnosisResult } from '../types/diagnosis';

interface Props {
  result: DiagnosisResult;
  onNext: () => void;
}

const COMMENT_STYLE = {
  position: 'relative',
  fontSize: 14,
  lineHeight: 1.95,
  color: COLORS.textSub,
  margin: '18px 0 0',
  textWrap: 'pretty',
} as CSSProperties;

/** 簡易診断結果（要件定義書 19章） */
export function SimpleResultScreen({ result, onNext }: Props) {
  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '30px 22px 40px',
        background: 'linear-gradient(180deg,#EAF3FF,#FFFFFF 46%)',
        animation: 'ccFadeUp .45s ease both',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <Logo width="140px" style={{ margin: '0 auto 18px' }} />
        <div
          style={{
            display: 'inline-block',
            background: '#FFE9F1',
            color: COLORS.pink,
            fontSize: 12,
            fontWeight: 700,
            padding: '7px 14px',
            borderRadius: 999,
          }}
        >
          診断が完了しました！
        </div>
        <div
          style={{
            fontFamily: FONT_ROUNDED,
            fontWeight: 800,
            fontSize: 22,
            color: COLORS.blueDark,
            marginTop: 14,
          }}
        >
          あなたの就活現在地は…
        </div>
      </div>

      <div
        style={{
          marginTop: 22,
          background: '#fff',
          borderRadius: 28,
          padding: '30px 22px',
          boxShadow: '0 14px 34px rgba(20,60,140,.12)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -30,
            left: -30,
            width: 110,
            height: 110,
            borderRadius: '50%',
            background: 'rgba(255,201,60,.18)',
          }}
        />
        <div
          style={{
            position: 'relative',
            fontSize: 12,
            fontWeight: 700,
            color: COLORS.textFaint,
            letterSpacing: '.12em',
          }}
        >
          総合判定
        </div>
        <GradeBadge grade={result.overall.grade} animate />
        <div
          style={{
            position: 'relative',
            display: 'inline-block',
            marginTop: 18,
            background: COLORS.green,
            color: '#fff',
            fontFamily: FONT_ROUNDED,
            fontWeight: 800,
            fontSize: 14,
            padding: '8px 18px',
            borderRadius: 999,
            boxShadow: '0 6px 14px rgba(52,199,123,.35)',
          }}
        >
          {result.overall.label}
        </div>
        <p style={COMMENT_STYLE}>{result.overall.shortComment}</p>
      </div>

      <div
        style={{
          marginTop: 18,
          background: '#F7FAFF',
          borderRadius: 22,
          padding: '18px 18px',
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
        }}
      >
        <span
          style={{
            flex: 'none',
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: COLORS.blue,
            color: '#fff',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
          }}
        >
          !
        </span>
        <div style={{ fontSize: 13, lineHeight: 1.9, color: COLORS.textMuted }}>
          全12問の回答をもとに、7項目の就活準備度・就活タイプ・ロードマップまで分析しました。
        </div>
      </div>

      <PrimaryButton onClick={onNext} variant="yellow" style={{ marginTop: 22 }}>
        詳細結果を見る ›
      </PrimaryButton>
      <div style={{ textAlign: 'center', fontSize: 11.5, color: COLORS.textPale, marginTop: 10 }}>
        ※より詳しい結果を確認できます
      </div>
    </div>
  );
}
