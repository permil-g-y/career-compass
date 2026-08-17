/**
 * 管理画面のルート（/admin）
 *
 * 既存の診断アプリ（src/App.tsx）とは完全に独立したエントリで、
 * 診断アプリ側のコンポーネント・状態には一切関与しない。
 *
 * 画面の切り替えはメモリ上の状態のみで行い、
 * 氏名・電話番号・診断IDを URL へ載せない（セキュリティ要件 25章）。
 */
import { useState } from 'react';
import { AdminDashboard } from './AdminDashboard';
import { LeadDetail } from './LeadDetail';
import { ADMIN_COLORS, ADMIN_MAX_WIDTH } from './theme';

export function AdminApp() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div style={{ minHeight: '100vh', background: ADMIN_COLORS.bg }}>
      <header
        style={{
          background: ADMIN_COLORS.navy,
          color: '#FFFFFF',
          borderBottom: `1px solid ${ADMIN_COLORS.navySoft}`,
        }}
      >
        <div
          style={{
            maxWidth: ADMIN_MAX_WIDTH,
            margin: '0 auto',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '.02em' }}>
            Career Compass Admin
          </span>
          <span style={{ fontSize: 11, opacity: 0.7 }}>就活現在地診断｜リード管理</span>
        </div>
      </header>

      <main style={{ maxWidth: ADMIN_MAX_WIDTH, margin: '0 auto', padding: '16px 20px 48px' }}>
        {selectedId ? (
          <LeadDetail diagnosisId={selectedId} onBack={() => setSelectedId(null)} />
        ) : (
          <AdminDashboard onOpenLead={setSelectedId} />
        )}
      </main>
    </div>
  );
}
