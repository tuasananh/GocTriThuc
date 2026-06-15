import { Label } from '@/components/ui/label';
import { RichTextViewer } from '@/components/rich-text-editor/RichTextViewer';

interface QuestionOptionListProps {
  questionId: string;
  choices: string[];
  isSingleChoice: boolean;
  selectedAnswers: number[];
  onAnswerChange: (newAnswers: number[]) => void;
}

export function QuestionOptionList({
  questionId,
  choices,
  isSingleChoice,
  selectedAnswers,
  onAnswerChange,
}: QuestionOptionListProps) {
  const handleChange = (index: number, checked: boolean) => {
    if (isSingleChoice) {
      if (checked) {
        onAnswerChange([index]);
      }
    } else {
      if (checked) {
        if (!selectedAnswers.includes(index)) {
          onAnswerChange([...selectedAnswers, index].sort());
        }
      } else {
        onAnswerChange(selectedAnswers.filter((i) => i !== index));
      }
    }
  };

  return (
    <div className="space-y-3">
      {choices.map((choice, index) => {
        const isSelected = selectedAnswers.includes(index);

        return (
          <Label
            key={index}
            className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
              isSelected
                ? 'border-primary bg-primary/10 ring-1 ring-primary/50'
                : 'border-border bg-card hover:bg-muted/40 hover:border-muted-foreground/30'
            }`}
          >
            <div className="flex h-5 items-center">
              <input
                type={isSingleChoice ? 'radio' : 'checkbox'}
                name={isSingleChoice ? `question-${questionId}` : `option-${questionId}-${index}`}
                className="w-4 h-4 accent-primary cursor-pointer"
                checked={isSelected}
                onChange={(e) => handleChange(index, e.target.checked)}
              />
            </div>
            <div className="flex-1 min-w-0">
              <RichTextViewer htmlContent={choice} />
            </div>
          </Label>
        );
      })}
    </div>
  );
}
