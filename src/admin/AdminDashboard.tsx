/**
 * 管理ダッシュボード / リード一覧（管理画面要件定義書 8〜10章）
 *
 * - 10秒ごとの自動更新 + 手動更新ボタン（要件定義書 6章）
 * - 取得したリードはメモリ上にのみ保持し、localStorage へは保存しない
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { adminApi, toErrorMessage } from './api/client';
import { EMPTY_QUERY, FilterBar, isFiltered } from './components/FilterBar';
import { LeadCards } from './components/LeadCards';
import { LeadTable } from './components/LeadTable';
import { SummaryCards } from './components/SummaryCards';
import { Button, Card, ErrorMessage } from './components/ui';
import { formatDateTime } from './format';
import { useIsMobile } from './hooks/useBreakpoint';
import { ADMIN_COLORS } from './theme';
import type { LeadListResponse, LeadQuery, LeadSummary } from './types';

/** 自動更新の間隔（要件定義書 6章：10秒） */
const REFRESH_INTERVAL_MS = 10_000;

/** 検索条件を反映するまでの待ち時間（入力のたびに送信しない） */
const QUERY_DEBOUNCE_MS = 300;

const PAGE_SIZE = 100;

export function AdminDashboard({
  salesNames,
  onOpenLead,
}: {
  /** 有効な営業担当者名（sales_users マスタ由来） */
  salesNames: string[];
  onOpenLead: (diagnosisId: string) => void;
}) {
  const isMobile = useIsMobile();
  const [query, setQuery] = useState<LeadQuery>(EMPTY_QUERY);
  const [appliedQuery, setAppliedQuery] = useState<LeadQuery>(EMPTY_QUERY);
  const [offset, setOffset] = useState(0);

  const [data, setData] = useState<LeadListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  /** 応答の追い越しで古い結果を表示しないための識別子 */
  const requestIdRef = useRef(0);

  // 検索条件の変更をまとめて反映する
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAppliedQuery(query);
      setOffset(0);
    }, QUERY_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  const load = useCallback(
    async (options: { silent?: boolean } = {}) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      if (options.silent) setRefreshing(true);
      else setLoading(true);

      try {
        const response = await adminApi.listLeads(appliedQuery, { limit: PAGE_SIZE, offset });
        if (requestIdRef.current !== requestId) return;
        setData(response);
        setUpdatedAt(new Date());
        setError('');
      } catch (caught) {
        if (requestIdRef.current !== requestId) return;
        setError(toErrorMessage(caught));
      } finally {
        if (requestIdRef.current === requestId) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [appliedQuery, offset],
  );

  useEffect(() => {
    void load();
  }, [load]);

  // 自動更新（非表示タブでは動かさない）
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!document.hidden) void load({ silent: true });
    }, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  /** 一覧上での営業ステータス / 担当営業の変更 */
  const patchLead = useCallback(
    async (diagnosisId: string, input: { sales_status?: string; assigned_sales?: string }) => {
      setUpdatingId(diagnosisId);
      try {
        const response = await adminApi.updateLead(diagnosisId, input);
        const updated = response.lead;
        setData((prev) =>
          prev
            ? {
                ...prev,
                leads: prev.leads.map((lead) =>
                  lead.diagnosis_id === diagnosisId ? toSummary(lead, updated) : lead,
                ),
              }
            : prev,
        );
        setError('');
        // サマリー（未架電数など）も変わるため裏で取り直す
        void load({ silent: true });
      } catch (caught) {
        setError(toErrorMessage(caught));
      } finally {
        setUpdatingId(null);
      }
    },
    [load],
  );

  const leads = data?.leads ?? [];
  const total = data?.total ?? 0;
  const hasPrev = offset > 0;
  const hasNext = offset + PAGE_SIZE < total;

  return (
    // minmax(0, 1fr)：中のテーブルの min-content 幅でページ全体が横に伸びないようにする
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 14 }}>
      <SummaryCards stats={data?.stats ?? null} />

      <FilterBar
        query={query}
        salesNames={salesNames}
        onChange={setQuery}
        onReset={() => setQuery(EMPTY_QUERY)}
      />

      {error ? <ErrorMessage>{error}</ErrorMessage> : null}

      <Card>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
            padding: isMobile ? '10px 12px' : '10px 14px',
            borderBottom: `1px solid ${ADMIN_COLORS.lineSoft}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: ADMIN_COLORS.navy }}>
              リード一覧
            </span>
            <span style={{ fontSize: 12, color: ADMIN_COLORS.textMuted }}>
              {isFiltered(appliedQuery) ? '絞り込み ' : ''}
              {total}件
              {total > PAGE_SIZE ? `（${offset + 1}〜${Math.min(offset + PAGE_SIZE, total)}件目）` : ''}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: ADMIN_COLORS.textMuted }}>
              最終更新 {updatedAt ? formatDateTime(updatedAt.toISOString()) : '—'}
              {refreshing ? '（更新中）' : ''}
            </span>
            <Button onClick={() => void load()} disabled={loading}>
              更新
            </Button>
          </div>
        </div>

        {loading && !data ? (
          <p
            style={{
              margin: 0,
              padding: '40px 0',
              textAlign: 'center',
              fontSize: 13,
              color: ADMIN_COLORS.textMuted,
            }}
          >
            読み込み中…
          </p>
        ) : isMobile ? (
          /* スマホ幅では巨大なテーブルを横スクロールさせず、カード表示へ切り替える */
          <LeadCards
            leads={leads}
            loading={loading}
            updatingId={updatingId}
            salesNames={salesNames}
            onOpen={onOpenLead}
            onChangeStatus={(id, status) => void patchLead(id, { sales_status: status })}
            onChangeAssigned={(id, assigned) => void patchLead(id, { assigned_sales: assigned })}
          />
        ) : (
          <LeadTable
            leads={leads}
            loading={loading}
            updatingId={updatingId}
            salesNames={salesNames}
            onOpen={onOpenLead}
            onChangeStatus={(id, status) => void patchLead(id, { sales_status: status })}
            onChangeAssigned={(id, assigned) => void patchLead(id, { assigned_sales: assigned })}
          />
        )}

        {hasPrev || hasNext ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              padding: '10px 14px',
              borderTop: `1px solid ${ADMIN_COLORS.lineSoft}`,
            }}
          >
            <Button
              disabled={!hasPrev}
              onClick={() => setOffset((prev) => Math.max(0, prev - PAGE_SIZE))}
            >
              前の{PAGE_SIZE}件
            </Button>
            <Button disabled={!hasNext} onClick={() => setOffset((prev) => prev + PAGE_SIZE)}>
              次の{PAGE_SIZE}件
            </Button>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

/** 詳細APIのレスポンスから一覧行へ反映する */
function toSummary(current: LeadSummary, updated: LeadSummary): LeadSummary {
  return {
    ...current,
    sales_status: updated.sales_status,
    assigned_sales: updated.assigned_sales,
    last_contacted_at: updated.last_contacted_at,
    next_contact_at: updated.next_contact_at,
  };
}
