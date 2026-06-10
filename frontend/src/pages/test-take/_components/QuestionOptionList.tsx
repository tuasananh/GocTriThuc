import { Label } from '@/components/ui/label';

interface QuestionOptionListProps {
  choices: string[];
  isSingleChoice: boolean;
  selectedAnswers: number[];
  onAnswerChange: (newAnswers: number[]) => void;
}

export function QuestionOptionList({
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
            className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
              isSelected
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border hover:bg-muted/50'
            }`}
          >
            <div className="flex h-5 items-center">
              <input
                type={isSingleChoice ? 'radio' : 'checkbox'}
                name={isSingleChoice ? 'question-options' : `option-${index}`}
                className={`w-4 h-4 text-primary bg-background border-input ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                  isSingleChoice ? 'rounded-full' : 'rounded-sm'
                }`}
                checked={isSelected}
                onChange={(e) => handleChange(index, e.target.checked)}
              />
            </div>
            <div className="leading-none flex-1 mt-0.5">{choice}</div>
          </Label>
        );
      })}
    </div>
  );
}
