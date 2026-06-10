import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import type { TestResultDto } from '@/types';
import { ROUTES } from '@/lib/routes';
import { PageShell } from '@/components/PageShell';
import { ErrorState } from '@/components/ErrorState';
import { SkeletonCard } from '@/components/SkeletonCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Trophy,
  BarChart3,
  ArrowLeft,
  CheckSquare,
  Circle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s} giây`;
  return `${m} phút ${s} giây`;
}

export function TestResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [result, setResult] = useState<TestResultDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResult = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<TestResultDto>(`/api/tests/sessions/${sessionId}/result`);
      setResult(res.data);
    } catch {
      setError('Không thể tải kết quả bài thi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchResult();
  }, [fetchResult]);

  if (loading) {
    return (
      <PageShell>
        <div className="space-y-6 max-w-3xl mx-auto">
          <SkeletonCard />
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <ErrorState message={error} onRetry={fetchResult} />
      </PageShell>
    );
  }

  if (!result) return null;

  const isPassed = result.percent >= 50;

  return (
    <PageShell>
      <div className="max-w-3xl mx-auto space-y-8 pb-12">
        {/* Back */}
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground -ml-2"
          onClick={() => navigate(ROUTES.DASHBOARD)}
        >
          <ArrowLeft className="w-4 h-4" />
          Về trang chủ
        </Button>

        {/* Score Summary Card */}
        <Card
          className={cn(
            'border-2 overflow-hidden',
            isPassed ? 'border-green-500/30' : 'border-destructive/30',
          )}
        >
          <div
            className={cn(
              'p-6 text-center',
              isPassed
                ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/5'
                : 'bg-gradient-to-br from-destructive/10 to-red-500/5',
            )}
          >
            {/* Trophy or X */}
            <div className="flex justify-center mb-4">
              <div
                className={cn(
                  'w-20 h-20 rounded-full flex items-center justify-center',
                  isPassed ? 'bg-green-500/10' : 'bg-destructive/10',
                )}
              >
                {isPassed ? (
                  <Trophy className="w-10 h-10 text-green-500" />
                ) : (
                  <XCircle className="w-10 h-10 text-destructive" />
                )}
              </div>
            </div>

            <h1 className="text-2xl font-bold mb-1">
              {isPassed ? '🎉 Chúc mừng! Bạn đã vượt qua!' : 'Chưa đạt — Cố gắng lần sau!'}
            </h1>
            <p className="text-muted-foreground text-sm mb-6">Kết quả bài kiểm tra của bạn</p>

            {/* Big percent */}
            <div
              className={cn(
                'text-6xl font-black mb-2',
                isPassed ? 'text-green-500' : 'text-destructive',
              )}
            >
              {result.percent}%
            </div>
            <p className="text-muted-foreground">
              {result.totalScore}/{result.maxScore} điểm
            </p>

            {/* Progress bar */}
            <div className="mt-6 px-4">
              <Progress
                value={result.percent}
                className={cn('h-3 rounded-full', isPassed ? '' : '[&>div]:bg-destructive')}
              />
            </div>
          </div>

          {/* Stats row */}
          <CardContent className="border-t bg-muted/20 py-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-xs mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  Đúng
                </div>
                <div className="text-xl font-bold text-green-500">
                  {result.answers.filter((a) => a.isCorrect).length}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-xs mb-1">
                  <XCircle className="w-3.5 h-3.5 text-destructive" />
                  Sai
                </div>
                <div className="text-xl font-bold text-destructive">
                  {result.answers.filter((a) => !a.isCorrect).length}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-xs mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  Thời gian
                </div>
                <div className="text-base font-bold">{formatDuration(result.duration)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question Review */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Xem lại từng câu hỏi</h2>
          </div>

          <div className="space-y-4">
            {result.answers.map((item, index) => {
              const isMulti = item.correctChoices.length > 1;
              return (
                <Card
                  key={item.questionId}
                  className={cn(
                    'border-2 transition-colors',
                    item.isCorrect ? 'border-green-500/20' : 'border-destructive/20',
                  )}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      {/* Status icon */}
                      <div className="shrink-0 mt-0.5">
                        {item.isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-destructive" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <CardTitle className="text-sm font-semibold text-muted-foreground">
                            Câu {index + 1}
                          </CardTitle>
                          <Badge variant="outline" className="text-xs gap-1">
                            {isMulti ? (
                              <>
                                <CheckSquare className="w-3 h-3" />
                                Nhiều đáp án
                              </>
                            ) : (
                              <>
                                <Circle className="w-3 h-3" />
                                Một đáp án
                              </>
                            )}
                          </Badge>
                          <Badge
                            className={cn(
                              'text-xs ml-auto',
                              item.isCorrect
                                ? 'bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20'
                                : 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20',
                            )}
                            variant="outline"
                          >
                            {item.isCorrect ? `+${item.point} điểm` : '0 điểm'}
                          </Badge>
                        </div>
                        <CardDescription className="text-foreground font-medium leading-relaxed">
                          {item.statement}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <Separator className="mb-4" />
                    <div className="space-y-2">
                      {item.choices.map((choice, i) => {
                        const label = OPTION_LABELS[i] ?? String(i + 1);
                        const isCorrectChoice = item.correctChoices.includes(i);
                        const isStudentChoice = item.studentAnswer?.includes(i) ?? false;
                        const isWrongChoice = isStudentChoice && !isCorrectChoice;

                        return (
                          <div
                            key={i}
                            className={cn(
                              'flex items-center gap-3 p-3 rounded-lg border text-sm',
                              isCorrectChoice
                                ? 'bg-green-500/5 border-green-500/30 text-foreground'
                                : isWrongChoice
                                  ? 'bg-destructive/5 border-destructive/30 text-foreground'
                                  : 'bg-muted/20 border-border text-muted-foreground',
                            )}
                          >
                            <span
                              className={cn(
                                'flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold shrink-0',
                                isCorrectChoice
                                  ? 'bg-green-500 text-white'
                                  : isWrongChoice
                                    ? 'bg-destructive text-white'
                                    : 'bg-muted text-muted-foreground',
                              )}
                            >
                              {label}
                            </span>
                            <span className="flex-1">{choice}</span>
                            <span className="shrink-0">
                              {isCorrectChoice && (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              )}
                              {isWrongChoice && <XCircle className="w-4 h-4 text-destructive" />}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Annotations */}
                    {!item.isCorrect && (
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {item.studentAnswer && item.studentAnswer.length > 0 && (
                          <span className="px-2 py-1 rounded bg-destructive/10 text-destructive">
                            Bạn chọn:{' '}
                            {item.studentAnswer.map((i) => OPTION_LABELS[i] ?? i).join(', ')}
                          </span>
                        )}
                        <span className="px-2 py-1 rounded bg-green-500/10 text-green-600">
                          Đáp án đúng:{' '}
                          {item.correctChoices.map((i) => OPTION_LABELS[i] ?? i).join(', ')}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center">
          <Button size="lg" onClick={() => navigate(ROUTES.DASHBOARD)} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Về trang chủ
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
