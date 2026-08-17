/**
 * 管理画面のルート（/admin）
 *
 * 既存の診断アプリ（src/App.tsx）とは完全に独立したエントリで、
 * 診断アプリ側のコンポーネント・状態には一切関与しない。
 *
 * 画面の切り替えはメモリ上の状態と URL ハッシュのみで行い、
 * 氏名・電話番号・診断IDを URL へ載せない（セキュリティ要件 25章）。
 *
 *   /admin                       リード一覧
 *   /admin#/settings/sales       営業担当者管理
 */
import { useCallback, useEffect, useState } from 'react';
import { AdminDashboard } from './AdminDashboard';
import { LeadDetail } from './LeadDetail';
import { SalesUsersScreen } from './SalesUsersScreen';
import { useIsMobile } from './hooks/useBreakpoint';
import { useSalesUsers } from './hooks/useSalesUsers';
import { ADMIN_COLORS, ADMIN_MAX_WIDTH } from './theme';

const SETTINGS_HASH = '#/settings/sales';

export function AdminApp() {
  const isMobile = useIsMobile();
  const salesUsers = useSalesUsers();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [onSettings, setOnSettings] = useState(
    () => typeof window !== 'undefined' && window.location.hash === SETTINGS_HASH,
  );

  // ブラウザの戻る／進むにも追従させる
  useEffect(() => {
    const sync = () => setOnSettings(window.location.hash === SETTINGS_HASH);
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  const goToSettings = useCallback(() => {
    window.location.hash = SETTINGS_HASH;
    setOnSettings(true);
    setSelectedId(null);
    window.scrollTo(0, 0);
  }, []);

  const goToLeads = useCallback(() => {
    if (window.location.hash) window.location.hash = '';
    setOnSettings(false);
    window.scrollTo(0, 0);
  }, []);

  const openLead = useCallback((diagnosisId: string) => {
    setSelectedId(diagnosisId);
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: ADMIN_COLORS.bg }}>
      <header
        style={{
          background: ADMIN_COLORS.navy,
          color: '#FFFFFF',
          borderBottom: `1px solid ${ADMIN_COLORS.navySoft}`,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: ADMIN_MAX_WIDTH,
            margin: '0 auto',
            padding: isMobile ? '10px 12px' : '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ fontSize: isMobile ? 14 : 15, fontWeight: 800, letterSpacing: '.02em' }}>
            Career Compass Admin
          </span>
          {isMobile ? null : (
            <span style={{ fontSize: 11, opacity: 0.7 }}>就活現在地診断｜リード管理</span>
          )}

          <nav style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <NavButton label="リード一覧" active={!onSettings} onClick={goToLeads} />
            <NavButton label="営業担当者管理" active={onSettings} onClick={goToSettings} />
          </nav>
        </div>
      </header>

      <main
        style={{
          maxWidth: ADMIN_MAX_WIDTH,
          margin: '0 auto',
          padding: isMobile ? '12px 12px 32px' : '16px 20px 48px',
        }}
      >
        {onSettings ? (
          <SalesUsersScreen state={salesUsers} />
        ) : selectedId ? (
          <LeadDetail
            diagnosisId={selectedId}
            salesNames={salesUsers.activeNames}
            onBack={() => setSelectedId(null)}
          />
        ) : (
          <AdminDashboard salesNames={salesUsers.activeNames} onOpenLead={openLead} />
        )}
      </main>
    </div>
  );
}

function NavButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="cc-admin-btn"
      onClick={onClick}
      style={{
        padding: '0 12px',
        fontSize: 12,
        fontWeight: 700,
        borderRadius: 6,
        cursor: 'pointer',
        color: '#FFFFFF',
        background: active ? ADMIN_COLORS.blue : 'transparent',
        border: `1px solid ${active ? ADMIN_COLORS.blue : ADMIN_COLORS.navySoft}`,
      }}
    >
      {label}
    </button>
  );
}
