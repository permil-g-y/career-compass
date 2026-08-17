import type { CSSProperties } from 'react';
import { ActionCard } from '../components/ActionCard';
import { GradeBadge } from '../components/GradeBadge';
import { Logo } from '../components/Logo';
import { PrimaryButton } from '../components/PrimaryButton';
import { ReadinessItem } from '../components/ReadinessItem';
import { Roadmap } from '../components/Roadmap';
import { SectionHeading } from '../components/SectionHeading';
import { WeaknessCard } from '../components/WeaknessCard';
import { COLORS, FONT_ROUNDED } from '../components/theme';
import { READINESS_LABELS, READINESS_ORDER } from '../config/diagnosis/scoring';
import type { DiagnosisResult } from '../types/diagnosis';

interface Props {
  result: DiagnosisResult;
  /** 登録された氏名（挨拶に使用） */
  name: string;
  ctaLabel: string;
  onCta: () => void;
  onRestart: () => void;
}

const LONG_COMMENT_STYLE = {
  fontSize: 14,
  lineHeight: 2,
  color: COLORS.textBody,
  margin: '14px 0 0',
  textWrap: 'pretty',
} as CSSProperties;

const TYPE_DESC_STYLE = {
  fontSize: 13.5,
  lineHeight: 1.95,
  color: COLORS.textSub,
  margin: '10px 0 0',
  textWrap: 'pretty',
} as CSSProperties;

const CTA_TITLE_STYLE = {
  fontFamily: FONT_ROUNDED,
  fontWeight: 800,
  fontSize: 20,
  lineHeight: 1.6,
  textWrap: 'pretty',
} as CSSProperties;

const CTA_TEXT_STYLE = {
  fontSize: 13,
  lineHeight: 1.95,
  opacity: 0.85,
  margin: '12px 0 0',
  textWrap: 'pretty',
} as CSSProperties;

/** 詳細診断結果（要件定義書 22〜29章） */
export function DetailResultScreen({ result, name, ctaLabel, onCta, onRestart }: Props) {
  const greeting = `${name.trim() ? `${name.trim()}さんの` : ''}詳細結果をお届けします！`;

  return (
    <div style={{ paddingBottom: 40, animation: 'ccFadeUp .4s ease both' }}>
      <div style={{ background: '#fff', padding: '14px 20px 12px' }}>
        <Logo width="132px" />
      </div>

      {/* RESULT 01｜総合判定 */}
      <div
        style={{
          background: 'linear-gradient(170deg,#2FBE7E,#34C77B)',
          padding: '24px 22px 34px',
          textAlign: 'center',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -40,
            right: -30,
            width: 130,
            height: 130,
            borderRadius: '50%',
            background: 'rgba(255,255,255,.14)',
          }}
        />
        <div style={{ position: 'relative', fontFamily: FONT_ROUNDED, fontWeight: 800, fontSize: 19 }}>
          {greeting}
        </div>
        <div style={{ position: 'relative', fontSize: 12.5, opacity: 0.9, marginTop: 6 }}>
          あなたの就活現在地は…
        </div>
        <GradeBadge
          grade={result.overall.grade}
          size={132}
          innerSize={104}
          fontSize={56}
          shadow="0 10px 26px rgba(0,60,30,.18)"
        />
        <div
          style={{
            position: 'relative',
            display: 'inline-block',
            marginTop: 18,
            background: '#fff',
            color: '#1E8A56',
            fontFamily: FONT_ROUNDED,
            fontWeight: 800,
            fontSize: 14,
            padding: '8px 18px',
            borderRadius: 999,
          }}
        >
          {result.overall.label}
        </div>
      </div>

      <div style={{ padding: '0 20px', marginTop: 28 }}>
        <div
          style={{
            background: '#fff',
            borderRadius: 24,
            padding: '24px 20px',
            boxShadow: '0 10px 26px rgba(20,60,140,.10)',
          }}
        >
          <div
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              color: COLORS.textFaint,
              letterSpacing: '.12em',
            }}
          >
            総合判定コメント
          </div>
          <p style={LONG_COMMENT_STYLE}>{result.overall.longComment}</p>
        </div>

        {/* RESULT 02｜就活タイプ */}
        <div style={{ marginTop: 26 }}>
          <SectionHeading no="02" title="あなたの就活タイプ" />
          <div style={{ background: '#EDF4FF', borderRadius: 22, padding: 20, marginTop: 12 }}>
            <div
              style={{
                fontFamily: FONT_ROUNDED,
                fontWeight: 800,
                fontSize: 25,
                color: COLORS.blue,
              }}
            >
              {result.type.label}
            </div>
            <p style={TYPE_DESC_STYLE}>{result.type.description}</p>
          </div>
        </div>

        {/* RESULT 03｜就活準備度 */}
        <div style={{ marginTop: 28 }}>
          <SectionHeading no="03" title="あなたの就活準備度" />
          <div
            style={{
              background: '#fff',
              border: `2px solid ${COLORS.line}`,
              borderRadius: 22,
              padding: 18,
              marginTop: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            {READINESS_ORDER.map((key) => (
              <ReadinessItem
                key={key}
                label={READINESS_LABELS[key]}
                percent={result.readiness[key].percent}
                score={result.readiness[key].score}
                grade={result.readiness[key].grade}
              />
            ))}
          </div>
        </div>

        {/* RESULT 04｜就活ロードマップ */}
        <div style={{ marginTop: 28 }}>
          <SectionHeading no="04" title="内定までのロードマップ" />
          <Roadmap steps={result.roadmap.steps} />
        </div>

        {/* RESULT 05｜現在の弱点 */}
        {result.weaknesses.length > 0 ? (
          <div style={{ marginTop: 28 }}>
            <SectionHeading no="05" title="今のあなたに不足していること" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
              {result.weaknesses.map((w) => (
                <WeaknessCard key={w.key} label={w.label} text={w.text} />
              ))}
            </div>
          </div>
        ) : null}

        {/* RESULT 06｜今やるべき3つ */}
        <div
          style={{
            marginTop: 34,
            background: 'linear-gradient(170deg,#FFF3D0,#FFFBF0)',
            borderRadius: 28,
            padding: '22px 18px',
            boxShadow: '0 12px 30px rgba(190,140,20,.16)',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <span
              style={{
                display: 'inline-block',
                background: '#FF7BA9',
                color: '#fff',
                fontSize: 11.5,
                fontWeight: 800,
                padding: '6px 14px',
                borderRadius: 999,
              }}
            >
              MOST IMPORTANT
            </span>
            <div
              style={{
                fontFamily: FONT_ROUNDED,
                fontWeight: 800,
                fontSize: 24,
                color: '#8A5A00',
                marginTop: 12,
              }}
            >
              今のあなたがやるべき3つ
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.9, color: '#8A6F3E', margin: '8px 0 0' }}>
              全部を一気にやる必要はありません。まずは、この3つから始めましょう。
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 18 }}>
            {result.actions.map((action, i) => (
              <ActionCard key={action.id} no={`0${i + 1}`} title={action.title} text={action.text} />
            ))}
          </div>
        </div>

        {/* 最終CTA */}
        <div
          style={{
            marginTop: 30,
            background: COLORS.blueDark,
            borderRadius: 28,
            padding: '26px 20px',
            color: '#fff',
            textAlign: 'center',
          }}
        >
          <div style={CTA_TITLE_STYLE}>
            一人で進めるのが不安なら、
            <br />
            プロと一緒に整理しませんか？
          </div>
          <p style={CTA_TEXT_STYLE}>
            診断結果をもとに、あなたの現在地や目標に合わせて、今後の就活の進め方を整理できます。
          </p>
          <PrimaryButton
            onClick={onCta}
            variant="yellow"
            style={{ marginTop: 18, fontSize: 17, padding: 17, boxShadow: 'none' }}
          >
            {ctaLabel}
          </PrimaryButton>
        </div>

        <PrimaryButton onClick={onRestart} variant="ghost" style={{ marginTop: 16 }}>
          最初から診断しなおす
        </PrimaryButton>
      </div>
    </div>
  );
}
