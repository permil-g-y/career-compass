import { AgePicker } from '../components/AgePicker';
import { AnswerOption } from '../components/AnswerOption';
import { BackButton } from '../components/BackButton';
import { Logo } from '../components/Logo';
import { PrimaryButton } from '../components/PrimaryButton';
import { ProgressBar } from '../components/ProgressBar';
import { QuestionCard } from '../components/QuestionCard';
import type { Question } from '../config/diagnosis/questions';

interface Props {
  question: Question;
  stepNo: number;
  totalSteps: number;
  progressPercent: number;
  /** 選択肢設問の選択中 index */
  selectedIndex: number | null;
  /** 年齢設問の現在値 */
  age: number;
  answered: boolean;
  isLast: boolean;
  onSelect: (index: number) => void;
  onAgeChange: (age: number) => void;
  onBack: () => void;
  onNext: () => void;
}

/** 基本プロフィール2問 + 本診断10問の共通画面 */
export function QuestionScreen({
  question,
  stepNo,
  totalSteps,
  progressPercent,
  selectedIndex,
  age,
  answered,
  isLast,
  onSelect,
  onAgeChange,
  onBack,
  onNext,
}: Props) {
  return (
    <div
      style={{
        padding: '14px 20px 24px',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#F7FAFF',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <BackButton onClick={onBack} />
        <Logo width="126px" />
      </div>

      <ProgressBar step={stepNo} total={totalSteps} percent={progressPercent} />

      <QuestionCard title={question.title} note={question.note}>
        {question.type === 'age' ? (
          <AgePicker value={age} min={question.min} max={question.max} onChange={onAgeChange} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
            {question.options.map((label, index) => (
              <AnswerOption
                key={label}
                label={label}
                index={index}
                selected={selectedIndex === index}
                variant={question.type}
                onSelect={() => onSelect(index)}
              />
            ))}
          </div>
        )}
      </QuestionCard>

      <div
        style={{
          position: 'sticky',
          bottom: 0,
          background: 'linear-gradient(180deg,rgba(247,250,255,0),#F7FAFF 34%)',
          padding: '14px 0 6px',
        }}
      >
        <PrimaryButton
          onClick={onNext}
          disabled={!answered}
          style={{
            fontSize: 17,
            padding: 17,
            boxShadow: answered ? '0 8px 20px rgba(27,102,245,.32)' : 'none',
          }}
        >
          {isLast ? '診断を完了する ›' : '次へ ›'}
        </PrimaryButton>
      </div>
    </div>
  );
}
