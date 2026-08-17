import { Logo } from '../components/Logo';
import { PrimaryButton } from '../components/PrimaryButton';
import { ReadinessItem } from '../components/ReadinessItem';
import { COLORS, FONT_ROUNDED } from '../components/theme';
import { READINESS_LABELS } from '../config/diagnosis/scoring';
import type { DiagnosisResult, ReadinessKey } from '../types/diagnosis';

interface Props {
  result: DiagnosisResult;
  onNext: () => void;
}

/** ティザーで実値を見せる3項目 */
const VISIBLE_KEYS: ReadinessKey[] = ['self_understanding', 'gakuchika', 'career_design'];
/** ロックしたまま存在だけ見せる4項目 */
const LOCKED_KEYS: ReadinessKey[] = [
  'company_selection',
  'application_preparation',
  'interview_preparation',
  'selection_experience',
];

/** 詳細結果ティザー（要件定義書 20章） */
export function TeaserScreen({ result, onNext }: Props) {
  return (
    <div style={{ minHeight: '100vh', padding: '24px 22px 40px', animation: 'ccFadeUp .4s ease both' }}>
      <Logo width="132px" style={{ margin: '0 0 18px' }} />

      <div
        style={{
          background: '#FFF4DA',
          borderRadius: 20,
          padding: '16px 18px',
          display: 'flex',
          gap: 10,
          alignItems: 'center',
        }}
      >
        <span
          style={{
            flex: 'none',
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: COLORS.yellow,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
          }}
        >
          🔒
        </span>
        <div>
          <div style={{ fontFamily: FONT_ROUNDED, fontWeight: 800, fontSize: 15, color: '#8A6410' }}>
            詳細結果を一部公開！
          </div>
          <div style={{ fontSize: 11.5, color: '#A08040', marginTop: 2 }}>
            すべての結果を見るには登録が必要です
          </div>
        </div>
      </div>

      <div
        style={{
          fontFamily: FONT_ROUNDED,
          fontWeight: 800,
          fontSize: 18,
          color: COLORS.blueDark,
          margin: '26px 0 12px',
        }}
      >
        さらに詳しく分析しました
      </div>

      <div style={{ border: `2px solid ${COLORS.line}`, borderRadius: 22, padding: 18, background: '#fff' }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: COLORS.textFaint, letterSpacing: '.1em' }}>
          あなたの就活タイプ
        </div>
        <div
          style={{
            fontFamily: FONT_ROUNDED,
            fontWeight: 800,
            fontSize: 24,
            color: COLORS.blue,
            marginTop: 8,
          }}
        >
          {result.type.label}
        </div>
        <div
          aria-hidden
          style={{
            marginTop: 10,
            filter: 'blur(4px)',
            userSelect: 'none',
            fontSize: 13.5,
            lineHeight: 1.9,
            color: COLORS.textFaint,
          }}
        >
          {result.type.description}
        </div>
      </div>

      <div
        style={{
          border: `2px solid ${COLORS.line}`,
          borderRadius: 22,
          padding: 18,
          background: '#fff',
          marginTop: 14,
        }}
      >
        <div style={{ fontSize: 11.5, fontWeight: 700, color: COLORS.textFaint, letterSpacing: '.1em' }}>
          就活準備度（7項目のうち一部）
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
          {VISIBLE_KEYS.map((key) => (
            <ReadinessItem
              key={key}
              label={READINESS_LABELS[key]}
              percent={result.readiness[key].percent}
              score={result.readiness[key].score}
              labelWidth={74}
            />
          ))}
        </div>

        <div style={{ position: 'relative', marginTop: 14, paddingTop: 14, borderTop: '1px dashed #DDE7F5' }}>
          <div
            aria-hidden
            style={{ filter: 'blur(5px)', userSelect: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            {LOCKED_KEYS.map((key) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 74, fontSize: 12.5, fontWeight: 700, color: COLORS.textSub }}>
                  {READINESS_LABELS[key]}
                </span>
                <span style={{ flex: 1, height: 9, borderRadius: 999, background: COLORS.bgTrack }} />
              </div>
            ))}
          </div>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <span
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: COLORS.blueDark,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
              }}
            >
              🔒
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.blueDark }}>
              この先は登録後にご覧いただけます
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          border: '2px solid #FFD9E6',
          borderRadius: 22,
          padding: 18,
          background: '#FFF7FA',
          marginTop: 14,
        }}
      >
        <div style={{ fontFamily: FONT_ROUNDED, fontWeight: 800, fontSize: 17, color: COLORS.pink }}>
          今のあなたがやるべきこと
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.85, color: '#8A5E72', marginTop: 6 }}>
          あなた専用の「次にやるべき3つ」を作成しました。
        </div>
        <div style={{ position: 'relative', marginTop: 14 }}>
          <div
            aria-hidden
            style={{ filter: 'blur(5px)', userSelect: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            {result.actions.map((action, i) => (
              <div
                key={action.id}
                style={{ background: '#fff', borderRadius: 14, padding: 14, fontSize: 14, fontWeight: 700 }}
              >
                {`0${i + 1}｜${action.title}`}
              </div>
            ))}
          </div>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                background: COLORS.pink,
                color: '#fff',
                fontSize: 12.5,
                fontWeight: 700,
                padding: '10px 16px',
                borderRadius: 999,
              }}
            >
              登録後にすべて公開
            </span>
          </div>
        </div>
      </div>

      <PrimaryButton onClick={onNext} style={{ marginTop: 24 }}>
        詳細結果をすべて見る ›
      </PrimaryButton>
    </div>
  );
}
