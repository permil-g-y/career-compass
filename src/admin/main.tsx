/**
 * 管理画面（/admin）のエントリポイント。
 * 診断アプリ（src/main.tsx）とは別バンドルとしてビルドされる。
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AdminApp } from './AdminApp';

const container = document.getElementById('admin-root');
if (!container) throw new Error('#admin-root not found');

createRoot(container).render(
  <StrictMode>
    <AdminApp />
  </StrictMode>,
);
