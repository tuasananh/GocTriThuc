import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, CheckCircle2 } from 'lucide-react';
import type { QuestionDto } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface TestQuestionItemProps {
  question: QuestionDto & { point?: number; order?: number };
  index: number;
  onRemove: () => void;
  onUpdatePoint?: (point: number) => void;
}

export function TestQuestionItem({
  question,
  index,
  onRemove,
  onUpdatePoint,
}: TestQuestionItemProps) {
  const [localPoint, setLocalPoint] = useState(question.point ?? 1);
  const [prevPropPoint, setPrevPropPoint] = useState(question.point ?? 1);

  // Sync state if props change from outside
  if ((question.point ?? 1) !== prevPropPoint) {
    setLocalPoint(question.point ?? 1);
    setPrevPropPoint(question.point ?? 1);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localPoint !== (question.point ?? 1) && onUpdatePoint) {
        onUpdatePoint(localPoint);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localPoint, question.point, onUpdatePoint]);

  return (
    <Card className="relative group">
      <CardContent className="p-4 sm:p-6">
        <div className="flex justify-between items-start gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="font-semibold">
                Câu {index + 1}
              </Badge>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Điểm</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  className="w-16 h-7 text-sm px-2"
                  value={localPoint}
                  onChange={(e) => setLocalPoint(Number(e.target.value))}
                />
              </div>
              {question.isSingleChoice ? (
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                  Một đáp án
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                  Nhiều đáp án
                </Badge>
              )}
            </div>
            <h4 className="font-medium text-foreground whitespace-pre-wrap">
              {question.statement}
            </h4>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                title="Xóa khỏi đề thi"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xóa câu hỏi này?</AlertDialogTitle>
                <AlertDialogDescription>
                  Hành động này sẽ xóa câu hỏi khỏi bài kiểm tra hiện tại. Bạn có chắc chắn muốn
                  tiếp tục?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onRemove}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Xóa câu hỏi
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="space-y-2 mt-4">
          {question.choices.map((choice, i) => {
            const isCorrect = question.correctChoices?.includes(i);
            return (
              <div
                key={i}
                className={`p-3 rounded-lg border text-sm flex items-start gap-3 transition-colors ${
                  isCorrect
                    ? 'border-green-500/30 bg-green-50/50 text-green-900 dark:bg-green-900/10 dark:text-green-100'
                    : 'border-border/50 bg-muted/30 text-muted-foreground'
                }`}
              >
                <div className="mt-0.5">
                  {isCorrect ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
                  )}
                </div>
                <span>{choice}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
