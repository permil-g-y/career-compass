/**
 * 営業担当者管理（/admin#/settings/sales）
 *
 * D1 の sales_users を管理画面から追加・編集する。
 * - 退職者は物理削除せず「無効」にする（過去の営業履歴に名前が残るため）
 * - 名前を変更すると、既存リード・営業履歴の担当者名もサーバー側で追従する
 */
import { useState } from 'react';
import { adminApi, toErrorMessage } from './api/client';
import {
  MAX_SALES_USER_EMAIL_LENGTH,
  MAX_SALES_USER_NAME_LENGTH,
  UNASSIGNED_SALES,
} from './config/sales';
import { Button, Card, CardTitle, ErrorMessage, Field, controlStyle } from './components/ui';
import { formatDateTimeFull } from './format';
import { useIsMobile } from './hooks/useBreakpoint';
import type { SalesUsersState } from './hooks/useSalesUsers';
import { ADMIN_COLORS } from './theme';
import type { SalesUser } from './types';

export function SalesUsersScreen({ state }: { state: SalesUsersState }) {
  const isMobile = useIsMobile();
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<number | 'new' | null>(null);

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const create = async () => {
    if (!newName.trim()) {
      setError('担当者名を入力してください。');
      return;
    }
    setSavingId('new');
    try {
      const response = await adminApi.createSalesUser({
        name: newName.trim(),
        email: newEmail.trim() || null,
      });
      state.apply(response.sales_users);
      setNewName('');
      setNewEmail('');
      setError('');
    } catch (caught) {
      setError(toErrorMessage(caught));
    } finally {
      setSavingId(null);
    }
  };

  const update = async (
    user: SalesUser,
    input: { name?: string; email?: string | null; is_active?: boolean },
  ) => {
    setSavingId(user.id);
    try {
      const response = await adminApi.updateSalesUser(user.id, input);
      state.apply(response.sales_users);
      setError('');
    } catch (caught) {
      setError(toErrorMessage(caught));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 14 }}>
      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      {state.error ? <ErrorMessage>{state.error}</ErrorMessage> : null}

      <Card>
        <CardTitle>営業担当者を追加</CardTitle>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : 'minmax(0, 1fr) minmax(0, 1.4fr) auto',
            gap: 10,
            alignItems: 'end',
            padding: '14px 18px 16px',
          }}
        >
          <Field label={`担当者名（必須 / ${MAX_SALES_USER_NAME_LENGTH}文字まで）`}>
            <input
              className="cc-admin-control"
              value={newName}
              maxLength={MAX_SALES_USER_NAME_LENGTH}
              placeholder="例）田中"
              onChange={(event) => setNewName(event.target.value)}
              style={controlStyle}
            />
          </Field>
          <Field label="メールアドレス（任意）">
            <input
              className="cc-admin-control"
              type="email"
              value={newEmail}
              maxLength={MAX_SALES_USER_EMAIL_LENGTH}
              placeholder="例）tanaka@example.com"
              onChange={(event) => setNewEmail(event.target.value)}
              style={controlStyle}
            />
          </Field>
          <Button variant="primary" onClick={() => void create()} disabled={savingId === 'new'}>
            {savingId === 'new' ? '追加中…' : '追加する'}
          </Button>
        </div>
        <p
          style={{
            margin: 0,
            padding: '0 18px 14px',
            fontSize: 11,
            lineHeight: 1.7,
            color: ADMIN_COLORS.textMuted,
          }}
        >
          「{UNASSIGNED_SALES}」は担当者が未割り当てであることを表す予約語のため、担当者名には使えません。
        </p>
      </Card>

      <Card>
        <CardTitle>営業担当者一覧（{state.users.length}名）</CardTitle>
        {state.loading && state.users.length === 0 ? (
          <p
            style={{
              margin: 0,
              padding: '32px 0',
              textAlign: 'center',
              fontSize: 13,
              color: ADMIN_COLORS.textMuted,
            }}
          >
            読み込み中…
          </p>
        ) : (
          <div style={{ display: 'grid', gap: 12, padding: isMobile ? 12 : '14px 18px 18px' }}>
            {state.users.map((user) => (
              <SalesUserRow
                key={user.id}
                user={user}
                isMobile={isMobile}
                saving={savingId === user.id}
                onSave={(input) => void update(user, input)}
              />
            ))}
            {state.users.length === 0 ? (
              <p style={{ margin: 0, fontSize: 13, color: ADMIN_COLORS.textMuted }}>
                営業担当者が登録されていません。上のフォームから追加してください。
              </p>
            ) : null}
          </div>
        )}
      </Card>

      <p style={{ margin: 0, fontSize: 11, lineHeight: 1.8, color: ADMIN_COLORS.textMuted }}>
        ・無効にした担当者は新しい割り当て候補に出ませんが、過去のリード・営業履歴の担当者名はそのまま残ります。
        <br />
        ・名前を変更すると、既に割り当て済みのリードと営業履歴の担当者名も同時に更新されます。
      </p>
    </div>
  );
}

function SalesUserRow({
  user,
  isMobile,
  saving,
  onSave,
}: {
  user: SalesUser;
  isMobile: boolean;
  saving: boolean;
  onSave: (input: { name?: string; email?: string | null; is_active?: boolean }) => void;
}) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email ?? '');
  const active = user.is_active === 1;

  const dirty = name.trim() !== user.name || email.trim() !== (user.email ?? '');

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: isMobile
          ? 'minmax(0, 1fr)'
          : 'minmax(0, 1fr) minmax(0, 1.4fr) auto auto',
        gap: 10,
        alignItems: 'end',
        padding: isMobile ? 12 : '12px 0',
        border: isMobile ? `1px solid ${ADMIN_COLORS.line}` : 'none',
        borderRadius: isMobile ? 10 : 0,
        borderBottom: isMobile ? undefined : `1px solid ${ADMIN_COLORS.lineSoft}`,
        opacity: active ? 1 : 0.6,
      }}
    >
      <Field label={`担当者名${active ? '' : '（無効）'}`}>
        <input
          className="cc-admin-control"
          value={name}
          maxLength={MAX_SALES_USER_NAME_LENGTH}
          onChange={(event) => setName(event.target.value)}
          style={controlStyle}
        />
      </Field>

      <Field label="メールアドレス">
        <input
          className="cc-admin-control"
          type="email"
          value={email}
          maxLength={MAX_SALES_USER_EMAIL_LENGTH}
          placeholder="未設定"
          onChange={(event) => setEmail(event.target.value)}
          style={controlStyle}
        />
      </Field>

      <Button
        variant="primary"
        disabled={saving || !dirty || !name.trim()}
        onClick={() => onSave({ name: name.trim(), email: email.trim() || null })}
      >
        {saving ? '保存中…' : '保存'}
      </Button>

      <Button disabled={saving} onClick={() => onSave({ is_active: !active })}>
        {active ? '無効にする' : '有効にする'}
      </Button>

      <p
        style={{
          margin: 0,
          gridColumn: isMobile ? 'auto' : '1 / -1',
          fontSize: 10,
          color: ADMIN_COLORS.textMuted,
        }}
      >
        更新 {formatDateTimeFull(user.updated_at)}
      </p>
    </div>
  );
}
