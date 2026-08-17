import { COLORS } from './theme';
import type { RoadmapStepResult } from '../types/diagnosis';

interface Props {
  steps: RoadmapStepResult[];
}

/** 内定までのロードマップ。完了 ✓ / 現在地 ★ / これから 番号 で表現する。 */
export function Roadmap({ steps }: Props) {
  return (
    <div
      style={{
        background: '#fff',
        border: `2px solid ${COLORS.line}`,
        borderRadius: 22,
        padding: '18px 16px',
        marginTop: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      {steps.map((step) => {
        const mark = step.done ? '✓' : step.here ? '★' : String(step.no);
        const markBg = step.done ? COLORS.green : step.here ? COLORS.yellow : COLORS.bgTrack;
        const markFg = step.done ? '#fff' : step.here ? '#5C4200' : COLORS.textPale;
        const fg = step.here ? '#8A5A00' : step.done ? COLORS.textBody : COLORS.textPale;

        return (
          <div
            key={step.index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '9px 10px',
              borderRadius: 14,
              background: step.here ? '#FFF7E2' : 'transparent',
            }}
          >
            <span
              style={{
                flex: 'none',
                boxSizing: 'border-box',
                width: 26,
                height: 26,
                minWidth: 26,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                margin: 0,
                fontSize: 11.5,
                fontWeight: 700,
                lineHeight: 1,
                textAlign: 'center',
                fontVariantNumeric: 'tabular-nums',
                color: markFg,
                background: markBg,
              }}
            >
              <span style={{ display: 'block', lineHeight: 1, margin: 0, padding: 0 }}>{mark}</span>
            </span>
            <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700, color: fg }}>
              {step.label}
            </span>
            {step.here ? (
              <span
                style={{
                  flex: 'none',
                  background: COLORS.yellow,
                  color: '#5C4200',
                  fontSize: 10.5,
                  fontWeight: 800,
                  padding: '5px 9px',
                  borderRadius: 999,
                }}
              >
                YOU ARE HERE
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
