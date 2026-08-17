import { useCallback, useEffect, useRef, useState } from 'react';
import { QUESTIONS, TOTAL_STEPS, ANALYZE_STEPS } from './config/diagnosis/questions';
import {
  ANALYZE_STEP_DURATION,
  FINAL_CTA_LABEL,
  FINAL_CTA_URL,
  SUBMIT_DELAY,
} from './config/app';
import { createEmptyAnswers, runDiagnosis } from './lib/diagnosis';
import { EMPTY_LEAD_ERRORS, hasLeadFormError, normalizePhone, validateLeadForm } from './lib/validation';
import { buildDiagnosisRecord, createDiagnosisId } from './storage/repository';
import { getRepository } from './storage/localStorageRepository';
import { getRemoteRepository } from './storage/d1Repository';
import { AnalyzingScreen } from './screens/AnalyzingScreen';
import { DetailResultScreen } from './screens/DetailResultScreen';
import { LeadFormScreen } from './screens/LeadFormScreen';
import { QuestionScreen } from './screens/QuestionScreen';
import { SimpleResultScreen } from './screens/SimpleResultScreen';
import { TeaserScreen } from './screens/TeaserScreen';
import { TopScreen } from './screens/TopScreen';
import type { AnswerState, DiagnosisResult, QuestionKey } from './types/diagnosis';
import type { LeadFormErrors } from './lib/validation';

type Screen = 'top' | 'question' | 'analyzing' | 'simple' | 'teaser' | 'form' | 'detail';

const AGE_QUESTION = QUESTIONS[0];
const DEFAULT_AGE = AGE_QUESTION.type === 'age' ? AGE_QUESTION.defaultValue : 22;

function createInitialAnswers(): AnswerState {
  return { ...createEmptyAnswers(), age: DEFAULT_AGE };
}

export function App() {
  const [screen, setScreen] = useState<Screen>('top');
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerState>(createInitialAnswers);
  const [analyzeStep, setAnalyzeStep] = useState(0);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [diagnosisId, setDiagnosisId] = useState<string>('');
  const [diagnosedAt, setDiagnosedAt] = useState<Date | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<LeadFormErrors>(EMPTY_LEAD_ERRORS);
  const [submitting, setSubmitting] = useState(false);

  const timerRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const goTo = useCallback((next: Screen) => {
    setScreen(next);
    window.scrollTo(0, 0);
  }, []);

  // 診断中演出：一定間隔でステップを進め、最後まで到達したら簡易結果へ
  useEffect(() => {
    if (screen !== 'analyzing') return;
    const id = window.setInterval(
      () => setAnalyzeStep((prev) => prev + 1),
      ANALYZE_STEP_DURATION,
    );
    return () => window.clearInterval(id);
  }, [screen]);

  useEffect(() => {
    if (screen === 'analyzing' && analyzeStep > ANALYZE_STEPS.length) goTo('simple');
  }, [analyzeStep, screen, goTo]);

  /* ---------------- 診断フロー ---------------- */

  const handleStart = useCallback(() => {
    setDiagnosisId(createDiagnosisId());
    setStepIndex(0);
    goTo('question');
  }, [goTo]);

  const question = QUESTIONS[stepIndex];
  const answerKey: QuestionKey = question.key;
  const isAgeStep = question.type === 'age';
  const selectedIndex = isAgeStep ? null : answers[answerKey as Exclude<QuestionKey, 'age'>];
  const answered = isAgeStep || selectedIndex !== null;
  const isLastStep = stepIndex === TOTAL_STEPS - 1;

  const handleSelect = useCallback(
    (index: number) => {
      setAnswers((prev) => ({ ...prev, [answerKey]: index }));
    },
    [answerKey],
  );

  const handleAgeChange = useCallback((age: number) => {
    setAnswers((prev) => ({ ...prev, age }));
  }, []);

  const startAnalyzing = useCallback(
    (finalAnswers: AnswerState) => {
      const now = new Date();
      const diagnosis = runDiagnosis(finalAnswers, now);
      setDiagnosedAt(now);
      setResult(diagnosis);
      setAnalyzeStep(0);
      goTo('analyzing');

      // 回答完了時点で診断レコードを保存する（リード情報は登録後に追記）
      const id = diagnosisId || createDiagnosisId();
      if (!diagnosisId) setDiagnosisId(id);
      void getRepository().save(
        buildDiagnosisRecord({
          diagnosisId: id,
          diagnosedAt: now,
          answers: finalAnswers,
          result: diagnosis,
          lead: null,
        }),
      );
    },
    [diagnosisId, goTo],
  );

  const handleNext = useCallback(() => {
    if (!answered) return;
    if (isLastStep) {
      startAnalyzing(answers);
      return;
    }
    setStepIndex((prev) => prev + 1);
    window.scrollTo(0, 0);
  }, [answered, answers, isLastStep, startAnalyzing]);

  const handleBack = useCallback(() => {
    if (stepIndex === 0) {
      goTo('top');
      return;
    }
    setStepIndex((prev) => prev - 1);
    window.scrollTo(0, 0);
  }, [goTo, stepIndex]);

  /* ---------------- リード登録 ---------------- */

  const handleSubmit = useCallback(() => {
    if (submitting) return;
    const nextErrors = validateLeadForm(name, phone);
    setErrors(nextErrors);
    // 入力エラーが発生しても診断回答は保持する
    if (hasLeadFormError(nextErrors)) return;
    if (!result || !diagnosedAt) return;

    setSubmitting(true);
    clearTimers();

    const record = buildDiagnosisRecord({
      diagnosisId,
      diagnosedAt,
      answers,
      result,
      lead: { name: name.trim(), phone: normalizePhone(phone), phoneRaw: phone },
    });

    // Cloudflare D1 への保存と、既存の演出時間（SUBMIT_DELAY）を並行して待つ。
    // 保存に失敗しても回答・結果は手元に残し、詳細結果の表示自体は止めない。
    const saveToD1 = getRemoteRepository()
      .save(record)
      .then(() => true)
      .catch(() => false);
    const minimumDelay = new Promise<void>((resolve) => {
      timerRef.current = window.setTimeout(resolve, SUBMIT_DELAY);
    });

    void Promise.all([saveToD1, minimumDelay]).then(([synced]) => {
      void getRepository().save({ ...record, synced_to_d1: synced });
      setSubmitting(false);
      goTo('detail');
    });
  }, [answers, clearTimers, diagnosedAt, diagnosisId, goTo, name, phone, result, submitting]);

  const handleRestart = useCallback(() => {
    clearTimers();
    setAnswers(createInitialAnswers());
    setStepIndex(0);
    setResult(null);
    setDiagnosisId('');
    setDiagnosedAt(null);
    setName('');
    setPhone('');
    setErrors(EMPTY_LEAD_ERRORS);
    setSubmitting(false);
    setAnalyzeStep(0);
    goTo('top');
  }, [clearTimers, goTo]);

  const handleCta = useCallback(() => {
    if (FINAL_CTA_URL) window.location.href = FINAL_CTA_URL;
  }, []);

  /* ---------------- 描画 ---------------- */

  const progressPercent = Math.round(((stepIndex + (answered ? 1 : 0)) / TOTAL_STEPS) * 100);

  return (
    <div
      style={{
        maxWidth: 460,
        margin: '0 auto',
        minHeight: '100vh',
        background: '#FFFFFF',
        boxShadow: '0 0 60px rgba(20,50,110,.10)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {screen === 'top' ? <TopScreen onStart={handleStart} /> : null}

      {screen === 'question' ? (
        <QuestionScreen
          question={question}
          stepNo={stepIndex + 1}
          totalSteps={TOTAL_STEPS}
          progressPercent={progressPercent}
          selectedIndex={selectedIndex}
          age={answers.age ?? DEFAULT_AGE}
          answered={answered}
          isLast={isLastStep}
          onSelect={handleSelect}
          onAgeChange={handleAgeChange}
          onBack={handleBack}
          onNext={handleNext}
        />
      ) : null}

      {screen === 'analyzing' ? <AnalyzingScreen step={analyzeStep} /> : null}

      {screen === 'simple' && result ? (
        <SimpleResultScreen result={result} onNext={() => goTo('teaser')} />
      ) : null}

      {screen === 'teaser' && result ? (
        <TeaserScreen result={result} onNext={() => goTo('form')} />
      ) : null}

      {screen === 'form' ? (
        <LeadFormScreen
          name={name}
          phone={phone}
          errors={errors}
          submitting={submitting}
          onNameChange={(value) => {
            setName(value);
            setErrors((prev) => ({ ...prev, name: '' }));
          }}
          onPhoneChange={(value) => {
            setPhone(value);
            setErrors((prev) => ({ ...prev, phone: '' }));
          }}
          onSubmit={handleSubmit}
          onBack={() => goTo('teaser')}
        />
      ) : null}

      {screen === 'detail' && result ? (
        <DetailResultScreen
          result={result}
          name={name}
          ctaLabel={FINAL_CTA_LABEL}
          onCta={handleCta}
          onRestart={handleRestart}
        />
      ) : null}
    </div>
  );
}
