import { cn } from '@/lib/utils';
import { CheckSquare, Circle, CheckCircle2, Square } from 'lucide-react';

interface MultipleChoiceQuestionProps {
  /** ID câu hỏi — dùng để nhóm radio & accessibility */
  questionId: string;
  /** Danh sách lựa chọn */
  choices: string[];
  /** true = chọn 1 (radio), false = chọn nhiều (checkbox) */
  isSingleChoice: boolean;
  /** Mảng index đang được chọn */
  selectedAnswers: number[];
  /** Callback khi thay đổi lựa chọn — kích hoạt autosave */
  onAnswerChange: (newAnswers: number[]) => void;
  /** Khoá lựa chọn (sau khi nộp bài) */
  disabled?: boolean;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

/**
 * MultipleChoiceQuestion
 * Hiển thị danh sách lựa chọn của câu hỏi trắc nghiệm.
 * - isSingleChoice = true  → radio (chọn 1)
 * - isSingleChoice = false → checkbox (chọn nhiều)
 * Mỗi khi người dùng chọn, gọi onAnswerChange để autosave.
 */
export function MultipleChoiceQuestion({
  questionId,
  choices,
  isSingleChoice,
  selectedAnswers,
  onAnswerChange,
  disabled = false,
}: MultipleChoiceQuestionProps) {
  const handleSelect = (index: number) => {
    if (disabled) return;

    if (isSingleChoice) {
      // Radio: chỉ giữ lại index vừa chọn
      onAnswerChange([index]);
    } else {
      // Checkbox: toggle index
      if (selectedAnswers.includes(index)) {
        onAnswerChange(selectedAnswers.filter((i) => i !== index));
      } else {
        onAnswerChange([...selectedAnswers, index].sort((a, b) => a - b));
      }
    }
  };

  return (
    <div
      className="space-y-3"
      role={isSingleChoice ? 'radiogroup' : 'group'}
      aria-label={`Lựa chọn cho câu hỏi ${questionId}`}
    >
      {/* Gợi ý loại câu hỏi */}
      <p className="text-xs text-muted-foreground font-medium mb-4">
        {isSingleChoice ? (
          <span className="inline-flex items-center gap-1.5">
            <Circle className="w-3.5 h-3.5" />
            Chọn một đáp án đúng
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5" />
            Chọn tất cả đáp án đúng
          </span>
        )}
      </p>

      {choices.map((choice, index) => {
        const isSelected = selectedAnswers.includes(index);
        const label = OPTION_LABELS[index] ?? String(index + 1);
        const inputId = `q-${questionId}-opt-${index}`;

        return (
          <label
            key={index}
            htmlFor={inputId}
            className={cn(
              // Base
              'group flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer',
              'transition-all duration-200 select-none',
              // Selected state
              isSelected
                ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10'
                : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30',
              // Disabled
              disabled && 'cursor-not-allowed opacity-60',
            )}
          >
            {/* Hidden native input for a11y + form semantics */}
            <input
              id={inputId}
              type={isSingleChoice ? 'radio' : 'checkbox'}
              name={`question-${questionId}`}
              value={index}
              checked={isSelected}
              disabled={disabled}
              onChange={() => handleSelect(index)}
              className="sr-only"
            />

            {/* Custom indicator */}
            <span
              className={cn(
                'flex items-center justify-center shrink-0 mt-0.5',
                'w-8 h-8 rounded-lg text-sm font-bold transition-all duration-200',
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary',
              )}
              aria-hidden="true"
            >
              {label}
            </span>

            {/* Choice text */}
            <span
              className={cn(
                'flex-1 text-sm leading-relaxed pt-1 transition-colors duration-200',
                isSelected ? 'text-foreground font-medium' : 'text-foreground',
              )}
            >
              {choice}
            </span>

            {/* Check icon */}
            <span
              className={cn(
                'shrink-0 mt-0.5 transition-all duration-200',
                isSelected ? 'opacity-100 text-primary' : 'opacity-0',
              )}
              aria-hidden="true"
            >
              {isSingleChoice ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <CheckSquare className="w-5 h-5" />
              )}
            </span>
          </label>
        );
      })}

      {/* Multi-choice counter */}
      {!isSingleChoice && selectedAnswers.length > 0 && (
        <p className="text-xs text-primary font-medium pt-1 flex items-center gap-1.5">
          <Square className="w-3.5 h-3.5 fill-primary" />
          Đã chọn {selectedAnswers.length} đáp án
        </p>
      )}
    </div>
  );
}
