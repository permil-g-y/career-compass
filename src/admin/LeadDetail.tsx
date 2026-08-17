/**
 * リード詳細（管理画面要件定義書 13〜20章）
 *
 * 左側：診断原本（読み取り専用）
 * 右側：営業対応エリア（営業管理カラムの更新 / 営業履歴の追加）
 *
 * 診断内容は一切編集できない。編集できるのは営業管理データのみ。
 */
import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ACTIONS } from '../config/diagnosis/actions';
import { GRADE_INFO } from '../config/diagnosis/grades';
import { MAIN_QUESTION_KEYS, QUESTIONS } from '../config/diagnosis/questions';
import { ROADMAP_STEPS } from '../config/diagnosis/roadmap';
import { READINESS_LABELS, READINESS_ORDER } from '../config/diagnosis/scoring';
import { toReadinessGrade } from '../lib/diagnosis';
import type { ActionId, Grade, MainQuestionKey, ReadinessKey } from '../types/diagnosis';
import { adminApi, toErrorMessage } from './api/client';
import { SALES_PERSONS, SALES_STATUSES, MAX_NOTE_LENGTH } from './config/sales';
import {
  Button,
  Card,
  CardTitle,
  ErrorMessage,
  Field,
  GradeBadge,
  Select,
  StatusBadge,
  controlStyle,
} from './components/ui';
import {
  formatDateTimeFull,
  formatPhone,
  formatScore,
  fromDateTimeLocalValue,
  toDateTimeLocalValue,
} from './format';
import { ADMIN_COLORS } from './theme';
import type { LeadDetailData } from './types';

const QUESTION_TITLES = new Map(QUESTIONS.map((question) => [question.key, question.title]));

export function LeadDetail({
  diagnosisId,
  onBack,
}: {
  diagnosisId: string;
  onBack: () => void;
}) {
  const [lead, setLead] = useState<LeadDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.getLead(diagnosisId);
      setLead(response.lead);
      setError('');
    } catch (caught) {
      setError(toErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, [diagnosisId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button onClick={onBack}>← 一覧へ戻る</Button>
        {loading ? (
          <span style={{ fontSize: 12, color: ADMIN_COLORS.textMuted }}>読み込み中…</span>
        ) : null}
      </div>

      {error ? <ErrorMessage>{error}</ErrorMessage> : null}

      {lead ? (
        <>
          <LeadHeader lead={lead} />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.55fr) minmax(320px, 1fr)',
              gap: 14,
              alignItems: 'start',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 14 }}>
              <DiagnosisSummary lead={lead} />
              <ReadinessTable lead={lead} />
              <AnswerList lead={lead} />
              <WeaknessAndActions lead={lead} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 14 }}>
              <SalesPanel lead={lead} onUpdated={setLead} onError={setError} />
              <ActivityForm lead={lead} onUpdated={setLead} onError={setError} />
              <ActivityTimeline lead={lead} />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

/* ---------------- 基本情報（13章） ---------------- */

function LeadHeader({ lead }: { lead: LeadDetailData }) {
  return (
    <Card style={{ padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: ADMIN_COLORS.navy }}>
            {lead.name}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: ADMIN_COLORS.textMuted }}>
            {lead.graduation_year ?? '卒業年度未設定'}
            {lead.age !== null ? ` ／ ${lead.age}歳` : ''}
          </p>
        </div>

        <a
          href={`tel:${lead.phone}`}
          style={{
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: '.02em',
            color: ADMIN_COLORS.blue,
            textDecoration: 'none',
          }}
        >
          {formatPhone(lead.phone)}
        </a>

        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: 12, color: ADMIN_COLORS.textSub }}>
            登録日時 {formatDateTimeFull(lead.created_at)}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 10, color: ADMIN_COLORS.textMuted }}>
            {lead.diagnosis_id}
          </p>
        </div>
      </div>
    </Card>
  );
}

/* ---------------- 診断サマリー（14章） ---------------- */

function DiagnosisSummary({ lead }: { lead: LeadDetailData }) {
  const grade = lead.overall_grade;
  const gradeInfo = grade ? GRADE_INFO[grade as Grade] : null;
  const step = lead.roadmap_current_step;
  const roadmapLabel =
    step !== null && step >= 1 && step <= ROADMAP_STEPS.length
      ? ROADMAP_STEPS[step - 1].label
      : '—';

  return (
    <Card>
      <CardTitle>診断サマリー</CardTitle>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 12,
          padding: '14px 18px',
        }}
      >
        <SummaryItem label="総合スコア" value={formatScore(lead.overall_score, 1)} />
        <SummaryItem
          label="総合判定"
          value={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <GradeBadge grade={grade} />
              <span style={{ fontSize: 14 }}>{gradeInfo ? gradeInfo.label : '—'}</span>
            </span>
          }
        />
        <SummaryItem label="就活タイプ" value={lead.career_type ?? '—'} />
        <SummaryItem label="ロードマップ現在地" value={roadmapLabel} />
      </div>
    </Card>
  );
}

function SummaryItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: ADMIN_COLORS.textMuted }}>
        {label}
      </p>
      <div style={{ marginTop: 4, fontSize: 18, fontWeight: 700, color: ADMIN_COLORS.navy }}>
        {value}
      </div>
    </div>
  );
}

/* ---------------- 7項目の就活準備度（15章） ---------------- */

function ReadinessTable({ lead }: { lead: LeadDetailData }) {
  return (
    <Card>
      <CardTitle>7項目の就活準備度</CardTitle>
      <div style={{ padding: '6px 18px 14px' }}>
        {READINESS_ORDER.map((key: ReadinessKey) => {
          const score = lead[key];
          const grade = typeof score === 'number' ? toReadinessGrade(score) : null;
          const percent = typeof score === 'number' ? ((score - 1) / 4) * 100 : 0;
          return (
            <div
              key={key}
              style={{
                display: 'grid',
                gridTemplateColumns: '110px 1fr 46px 28px',
                alignItems: 'center',
                gap: 10,
                padding: '7px 0',
              }}
            >
              <span style={{ fontSize: 13, color: ADMIN_COLORS.textSub }}>
                {READINESS_LABELS[key]}
              </span>
              <span
                style={{
                  height: 6,
                  borderRadius: 3,
                  background: ADMIN_COLORS.lineSoft,
                  overflow: 'hidden',
                }}
              >
                <span
                  style={{
                    display: 'block',
                    width: `${Math.max(0, Math.min(100, percent))}%`,
                    height: '100%',
                    background: ADMIN_COLORS.blue,
                  }}
                />
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, textAlign: 'right' }}>
                {formatScore(score, 1)}
              </span>
              <GradeBadge grade={grade} />
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ---------------- 診断回答 Q1〜Q10（16章） ---------------- */

function AnswerList({ lead }: { lead: LeadDetailData }) {
  return (
    <Card>
      <CardTitle>診断回答（Q1〜Q10）</CardTitle>
      <div style={{ padding: '4px 18px 14px' }}>
        {MAIN_QUESTION_KEYS.map((key: MainQuestionKey, index) => (
          <div
            key={key}
            style={{
              display: 'grid',
              gridTemplateColumns: '38px minmax(0, 1fr)',
              gap: 10,
              padding: '9px 0',
              borderBottom:
                index === MAIN_QUESTION_KEYS.length - 1
                  ? 'none'
                  : `1px solid ${ADMIN_COLORS.lineSoft}`,
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: ADMIN_COLORS.blue,
                paddingTop: 2,
              }}
            >
              {key.toUpperCase()}
            </span>
            <div>
              <p style={{ margin: 0, fontSize: 12, color: ADMIN_COLORS.textMuted }}>
                {QUESTION_TITLES.get(key) ?? ''}
              </p>
              <p
                style={{
                  margin: '3px 0 0',
                  fontSize: 14,
                  fontWeight: 700,
                  color: ADMIN_COLORS.text,
                }}
              >
                {lead[key] ?? '—'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ---------------- 弱点・今やるべき3つ（17〜18章） ---------------- */

function WeaknessAndActions({ lead }: { lead: LeadDetailData }) {
  const weaknesses = [lead.weakness_1, lead.weakness_2, lead.weakness_3].filter(
    (value): value is string => Boolean(value),
  );
  const actions = [lead.action_1, lead.action_2, lead.action_3].filter(
    (value): value is ActionId => Boolean(value),
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
      <Card>
        <CardTitle>現在の弱点</CardTitle>
        <ol style={{ margin: 0, padding: '12px 18px 16px 34px' }}>
          {weaknesses.length ? (
            weaknesses.map((weakness) => (
              <li key={weakness} style={{ fontSize: 14, padding: '3px 0' }}>
                {weakness}
              </li>
            ))
          ) : (
            <span style={{ fontSize: 13, color: ADMIN_COLORS.textMuted }}>—</span>
          )}
        </ol>
      </Card>

      <Card>
        <CardTitle>今やるべき3つ</CardTitle>
        <ol style={{ margin: 0, padding: '12px 18px 16px 34px' }}>
          {actions.length ? (
            actions.map((actionId) => (
              <li key={actionId} style={{ fontSize: 14, padding: '3px 0' }}>
                {ACTIONS[actionId]?.title ?? actionId}
              </li>
            ))
          ) : (
            <span style={{ fontSize: 13, color: ADMIN_COLORS.textMuted }}>—</span>
          )}
        </ol>
      </Card>
    </div>
  );
}

/* ---------------- 営業対応エリア（19章） ---------------- */

function SalesPanel({
  lead,
  onUpdated,
  onError,
}: {
  lead: LeadDetailData;
  onUpdated: (lead: LeadDetailData) => void;
  onError: (message: string) => void;
}) {
  const [status, setStatus] = useState(lead.sales_status);
  const [assigned, setAssigned] = useState(lead.assigned_sales);
  const [nextContact, setNextContact] = useState(toDateTimeLocalValue(lead.next_contact_at));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setStatus(lead.sales_status);
    setAssigned(lead.assigned_sales);
    setNextContact(toDateTimeLocalValue(lead.next_contact_at));
  }, [lead]);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const response = await adminApi.updateLead(lead.diagnosis_id, {
        sales_status: status,
        assigned_sales: assigned,
        next_contact_at: fromDateTimeLocalValue(nextContact),
      });
      onUpdated(response.lead);
      onError('');
      setSaved(true);
    } catch (caught) {
      onError(toErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardTitle>営業対応</CardTitle>
      <div style={{ display: 'grid', gap: 10, padding: '14px 18px 16px' }}>
        <Field label="営業ステータス">
          <Select value={status} onChange={(value) => setStatus(value as typeof status)} options={SALES_STATUSES} />
        </Field>
        <Field label="担当営業">
          <Select
            value={assigned}
            onChange={(value) => setAssigned(value as typeof assigned)}
            options={SALES_PERSONS}
          />
        </Field>
        <Field label="次回対応日時">
          <input
            className="cc-admin-control"
            type="datetime-local"
            value={nextContact}
            onChange={(event) => setNextContact(event.target.value)}
            style={controlStyle}
          />
        </Field>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Button variant="primary" onClick={() => void save()} disabled={saving}>
            {saving ? '保存中…' : '営業情報を保存'}
          </Button>
          {saved && !saving ? (
            <span style={{ fontSize: 12, color: ADMIN_COLORS.green }}>保存しました</span>
          ) : null}
        </div>

        <p style={{ margin: 0, fontSize: 11, color: ADMIN_COLORS.textMuted, lineHeight: 1.7 }}>
          最終対応 {formatDateTimeFull(lead.last_contacted_at)}
          <br />
          更新 {formatDateTimeFull(lead.updated_at)}
        </p>
      </div>
    </Card>
  );
}

/* ---------------- 営業履歴の追加（20章） ---------------- */

function ActivityForm({
  lead,
  onUpdated,
  onError,
}: {
  lead: LeadDetailData;
  onUpdated: (lead: LeadDetailData) => void;
  onError: (message: string) => void;
}) {
  const [person, setPerson] = useState<string>(lead.assigned_sales);
  const [status, setStatus] = useState<string>(lead.sales_status);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPerson(lead.assigned_sales);
    setStatus(lead.sales_status);
  }, [lead.assigned_sales, lead.sales_status]);

  const submit = async () => {
    setSaving(true);
    try {
      const response = await adminApi.addActivity(lead.diagnosis_id, {
        sales_person: person,
        status,
        note,
      });
      onUpdated(response.lead);
      onError('');
      // メモはブラウザ上に残さない
      setNote('');
    } catch (caught) {
      onError(toErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardTitle>対応を記録する</CardTitle>
      <div style={{ display: 'grid', gap: 10, padding: '14px 18px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="担当営業">
            <Select value={person} onChange={setPerson} options={SALES_PERSONS} />
          </Field>
          <Field label="営業ステータス">
            <Select value={status} onChange={setStatus} options={SALES_STATUSES} />
          </Field>
        </div>

        <Field label={`営業メモ（${note.length}/${MAX_NOTE_LENGTH}）`}>
          <textarea
            className="cc-admin-control"
            value={note}
            rows={4}
            maxLength={MAX_NOTE_LENGTH}
            placeholder="例）架電。AI就活に興味あり。火曜19時以降なら面談可能。"
            onChange={(event) => setNote(event.target.value)}
            style={{ ...controlStyle, height: 'auto', padding: '8px 9px', lineHeight: 1.7 }}
          />
        </Field>

        <Button variant="primary" onClick={() => void submit()} disabled={saving}>
          {saving ? '記録中…' : '対応履歴を追加'}
        </Button>
        <p style={{ margin: 0, fontSize: 11, color: ADMIN_COLORS.textMuted, lineHeight: 1.7 }}>
          記録すると最終対応日時・営業ステータス・担当営業も同時に更新されます。
        </p>
      </div>
    </Card>
  );
}

function ActivityTimeline({ lead }: { lead: LeadDetailData }) {
  return (
    <Card>
      <CardTitle>営業履歴</CardTitle>
      <div style={{ padding: '10px 18px 16px' }}>
        {lead.activities.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: ADMIN_COLORS.textMuted }}>
            まだ対応履歴がありません。
          </p>
        ) : (
          lead.activities.map((activity) => (
            <div
              key={activity.id}
              style={{
                padding: '10px 0',
                borderBottom: `1px solid ${ADMIN_COLORS.lineSoft}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: ADMIN_COLORS.textSub }}>
                  {formatDateTimeFull(activity.contacted_at)}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: ADMIN_COLORS.navy }}>
                  {activity.sales_person}
                </span>
                <StatusBadge status={activity.status} />
              </div>
              {activity.note ? (
                <p
                  style={{
                    margin: '6px 0 0',
                    fontSize: 13,
                    lineHeight: 1.7,
                    color: ADMIN_COLORS.text,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {activity.note}
                </p>
              ) : null}
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
