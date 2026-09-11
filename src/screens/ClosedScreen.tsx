/**
 * 新規受付停止画面
 *
 * ユニーク電話番号ベースの新規リードが上限（src/config/intake.ts の LEAD_LIMIT）へ
 * 到達したとき、TOP画面の代わりに表示する。
 *
 * 「サービス終了」ではなく「応募多数による一時停止」であることが伝わるよう、
 * 既存TOP画面と同じロゴ・配色・角丸・余白のトーンで構成する。
 * 既に診断を開始しているユーザーには表示されない（App.tsx の分岐を参照）。
 */
import { Logo } from '../components/Logo';
import { COLORS, FONT_BASE, FONT_ROUNDED, asset } from '../components/theme';

export function ClosedScreen() {
  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        overflow: 'hidden',
        background: 'linear-gradient(180deg,#F8FAFB 0%,#F8FAFB 72%,#EFF8FE 100%)',
        padding: 'clamp(12px,2.4vh,26px) 22px clamp(28px,5vh,48px)',
        textAlign: 'center',
      }}
    >
      {/* TOP画面と同じ装飾（背景の丸・図形） */}
      <div style={{ position: 'absolute', top: 8, right: -90, width: 230, height: 80, borderRadius: 999, background: '#E4F2FD' }} />
      <div style={{ position: 'absolute', top: 56, right: -30, width: 130, height: 52, borderRadius: 999, background: '#EEF7FE' }} />
      <div style={{ position: 'absolute', top: 14, left: -80, width: 150, height: 58, borderRadius: 999, background: '#EEF7FE' }} />
      <div style={{ position: 'absolute', left: -40, bottom: 26, width: 170, height: 60, borderRadius: 999, background: '#E4F2FD' }} />
      <div style={{ position: 'absolute', right: -46, bottom: 64, width: 150, height: 54, borderRadius: 999, background: '#EAF6FE' }} />

      <div style={{ position: 'relative' }}>
        <Logo width="46%" style={{ minWidth: 158, maxWidth: 210, margin: "0 auto" }} />

        <div
          style={{
            display: 'inline-block',
            marginTop: 'clamp(18px,4vh,40px)',
            padding: '6px 16px',
            borderRadius: 999,
            background: COLORS.yellowDeep,
            fontFamily: FONT_ROUNDED,
            fontWeight: 800,
            fontSize: 'clamp(11.5px,1.7vh,13px)',
            letterSpacing: '.02em',
            color: COLORS.navyDeep,
          }}
        >
          ご好評につき受付を一時停止中
        </div>

        <h1
          style={{
            fontFamily: FONT_ROUNDED,
            fontWeight: 800,
            fontSize: 'clamp(19px,min(5.6vw,4.2vh),28px)',
            lineHeight: 1.45,
            letterSpacing: '-.02em',
            color: COLORS.navy,
            margin: 'clamp(12px,2.6vh,26px) 0 0',
            textWrap: 'pretty',
          }}
        >
          ご好評につき、
          <br />
          現在受付を一時停止しています
        </h1>

        <div
          style={{
            maxWidth: 380,
            margin: 'clamp(18px,3.4vh,32px) auto 0',
            padding: 'clamp(18px,3vh,26px) clamp(18px,5vw,24px)',
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 6px 24px rgba(20,50,110,.07)',
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: FONT_BASE,
              fontSize: 'clamp(13px,1.95vh,15px)',
              lineHeight: 2,
              color: COLORS.textBody,
              textWrap: 'pretty',
            }}
          >
            Career Compassをご覧いただき
            <br />
            ありがとうございます。
          </p>
          <p
            style={{
              margin: 'clamp(12px,2vh,18px) 0 0',
              fontFamily: FONT_BASE,
              fontSize: 'clamp(13px,1.95vh,15px)',
              lineHeight: 2,
              color: COLORS.textBody,
              textWrap: 'pretty',
            }}
          >
            現在、多くの方にお申し込みいただいているため、
            新規の診断受付を一時停止しております。
          </p>
          <p
            style={{
              margin: 'clamp(12px,2vh,18px) 0 0',
              fontFamily: FONT_ROUNDED,
              fontWeight: 700,
              fontSize: 'clamp(13px,1.95vh,15px)',
              lineHeight: 1.9,
              color: COLORS.blueDark,
            }}
          >
            受付再開まで今しばらくお待ちください。
          </p>
        </div>

        <img
          src={asset('compass-hero.png')}
          alt=""
          aria-hidden="true"
          style={{
            display: 'block',
            width: 'clamp(140px,42vw,200px)',
            margin: 'clamp(20px,4vh,36px) auto 0',
            opacity: 0.9,
          }}
        />
      </div>
    </div>
  );
}
