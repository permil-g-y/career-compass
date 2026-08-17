import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * マルチページ構成:
 *   /       診断アプリ（index.html → src/main.tsx）
 *   /admin  管理画面（admin/index.html → src/admin/main.tsx）
 *
 * base: './' は既存のままとし、診断アプリのアセット解決を変更しない。
 * 入力パスは root（プロジェクト直下）からの相対パスで指定する。
 */
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        admin: 'admin/index.html',
      },
    },
  },
});
