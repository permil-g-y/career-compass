/**
 * 営業担当者マスタ（D1: sales_users）の取得・保持。
 *
 * 担当営業プルダウンの選択肢はすべてここ経由で供給する。
 * 固定配列は廃止済みで、マスタを更新すると各画面へ即時反映される。
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi, toErrorMessage } from '../api/client';
import type { SalesUser } from '../types';

export interface SalesUsersState {
  users: SalesUser[];
  /** 有効な担当者名（プルダウンの選択肢） */
  activeNames: string[];
  loading: boolean;
  error: string;
  reload: () => Promise<void>;
  /** 追加・更新APIのレスポンス（最新の一覧）をそのまま反映する */
  apply: (users: SalesUser[]) => void;
}

export function useSalesUsers(): SalesUsersState {
  const [users, setUsers] = useState<SalesUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.listSalesUsers();
      setUsers(response.sales_users);
      setError('');
    } catch (caught) {
      setError(toErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const activeNames = useMemo(
    () => users.filter((user) => user.is_active === 1).map((user) => user.name),
    [users],
  );

  const apply = useCallback((next: SalesUser[]) => {
    setUsers(next);
    setError('');
  }, []);

  return { users, activeNames, loading, error, reload, apply };
}
