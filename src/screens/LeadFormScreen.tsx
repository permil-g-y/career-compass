import type { CSSProperties } from 'react';
import { BackButton } from '../components/BackButton';
import { Logo } from '../components/Logo';
import { PrimaryButton } from '../components/PrimaryButton';
import { COLORS, FONT_ROUNDED } from '../components/theme';
import type { LeadFormErrors } from '../lib/validation';

interface Props {
  name: string;
  phone: string;
  errors: LeadFormErrors;
  submitting: boolean;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
}

const TAGS = ['就活準備度', 'あなたの就活タイプ', '目標までのロードマップ', '不足している準備'];

const HEADING_STYLE = {
  fontFamily: FONT_ROUNDED,
  fontWeight: 800,
  fontSize: 23,
  lineHeight: 1.5,
  color: COLORS.blueDark,
  marginTop: 18,
  textWrap: 'pretty',
} as CSSProperties;

const inputStyle = (hasError: boolean): CSSProperties => ({
  width: '100%',
  marginTop: 8,
  border: `2px solid ${hasError ? COLORS.error : COLORS.lineInput}`,
  borderRadius: 14,
  padding: '15px 14px',
  fontSize: 16,
  outline: 'none',
  background: '#FBFCFF',
});

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 700,
  color: COLORS.textSub,
};

/** 詳細結果アンロック（氏名・電話番号の取得／要件定義書 21章） */
export function LeadFormScreen({
  name,
  phone,
  errors,
  submitting,
  onNameChange,
  onPhoneChange,
  onSubmit,
  onBack,
}: Props) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg,#EAF3FF,#FFFFFF 40%)',
        padding: '26px 22px 40px',
        animation: 'ccFadeUp .4s ease both',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <BackButton onClick={onBack} size={34} />
        <Logo width="126px" />
      </div>

      <div style={HEADING_STYLE}>
        あなた専用の
        <br />
        詳細診断が完成しました
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 14 }}>
        {TAGS.map((tag) => (
          <span
            key={tag}
            style={{
              background: '#fff',
              color: '#2C5BA6',
              fontSize: 11.5,
              fontWeight: 700,
              padding: '7px 12px',
              borderRadius: 999,
              boxShadow: '0 2px 8px rgba(20,60,140,.07)',
            }}
          >
            {tag}
          </span>
        ))}
        <span
          style={{
            background: COLORS.yellow,
            color: '#5C4200',
            fontSize: 11.5,
            fontWeight: 800,
            padding: '7px 12px',
            borderRadius: 999,
          }}
        >
          今すぐやるべき3つ
        </span>
      </div>

      <div
        style={{
          background: '#fff',
          borderRadius: 26,
          padding: '22px 20px',
          marginTop: 22,
          boxShadow: '0 12px 30px rgba(20,60,140,.10)',
        }}
      >
        <label style={labelStyle} htmlFor="lead-name">
          お名前
          <span style={{ color: COLORS.error, marginLeft: 4 }}>必須</span>
        </label>
        <input
          id="lead-name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="山田 太郎"
          autoComplete="name"
          style={inputStyle(Boolean(errors.name))}
        />
        {errors.name ? (
          <div style={{ fontSize: 12, color: COLORS.error, marginTop: 7, fontWeight: 700 }}>
            {errors.name}
          </div>
        ) : null}

        <label style={{ ...labelStyle, marginTop: 18 }} htmlFor="lead-phone">
          電話番号
          <span style={{ color: COLORS.error, marginLeft: 4 }}>必須</span>
        </label>
        <input
          id="lead-phone"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          inputMode="tel"
          placeholder="09012345678"
          autoComplete="tel"
          style={inputStyle(Boolean(errors.phone))}
        />
        {errors.phone ? (
          <div style={{ fontSize: 12, color: COLORS.error, marginTop: 7, fontWeight: 700 }}>
            {errors.phone}
          </div>
        ) : null}

        <div style={{ fontSize: 11.5, lineHeight: 1.85, color: '#8296B2', marginTop: 16 }}>
          ご入力いただいた情報は、診断結果の提供および就活支援のご案内にのみ利用します。
          プライバシーポリシーに同意の上、ご登録ください。
        </div>

        <PrimaryButton onClick={onSubmit} variant="yellow" disabled={submitting} style={{ marginTop: 18 }}>
          {submitting ? '結果を作成しています…' : '無料で詳細結果を見る ›'}
        </PrimaryButton>
        <div style={{ textAlign: 'center', fontSize: 11, color: COLORS.textPale, marginTop: 10 }}>
          登録後すぐに結果を確認できます
        </div>
      </div>
    </div>
  );
}
