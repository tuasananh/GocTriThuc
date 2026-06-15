import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import type { TestResultDto } from '@/types';
import { PageShell } from '@/components/PageShell';
import { SectionHeader } from '@/components/SectionHeader';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { SkeletonCard } from '@/components/SkeletonCard';
import { BookOpen, CheckCircle2, XCircle, Clock, Award, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { RichTextViewer } from '@/components/rich-text-editor/RichTextViewer';

export function TestResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<TestResultDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<TestResultDto>(`/api/sessions/${sessionId}/result`);
      setData(res.data);
    } catch {
      setError('Không thể tải kết quả bài kiểm tra. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} phút ${secs} giây`;
  };

  const getScoreColor = (pct: number) => {
    if (pct >= 80) return 'text-green-600';
    if (pct >= 50) return 'text-yellow-600';
    return 'text-destructive';
  };

  const percent = data ? Math.round(data.score) : 0;
  const duration = data ? data.timeTakenSeconds : 0;
  const answers = data ? data.questions : [];
  const totalScore = data
    ? Number(
        data.questions.reduce((sum, q) => sum + (q.isCorrect ? (q.point ?? 1) : 0), 0).toFixed(2),
      )
    : 0;
  const maxScore = data
    ? Number(data.questions.reduce((sum, q) => sum + (q.point ?? 1), 0).toFixed(2))
    : 0;

  return (
    <PageShell>
      <SectionHeader
        title="Kết quả bài kiểm tra"
        description="Đánh giá và xem lại các câu trả lời của bạn"
        action={
          <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </Button>
        }
      />

      {loading && (
        <div className="grid gap-6 mt-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {error && <ErrorState message={error} onRetry={fetchData} />}

      {!loading && !error && !data && (
        <EmptyState
          icon={BookOpen}
          title="Không tìm thấy kết quả"
          description="Bài kiểm tra này có thể chưa được nộp hoặc không tồn tại."
        />
      )}

      {!loading && !error && data && (
        <div className="space-y-8 mt-6">
          {/* Score Summary */}
          <Card className="backdrop-blur-md bg-background/80 border border-border/50 shadow-lg overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>
            <CardContent className="p-8 flex flex-col md:flex-row items-center justify-around gap-8 text-center">
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                  <Award className="w-5 h-5" />
                  <span className="font-medium uppercase tracking-wider text-sm">Điểm số</span>
                </div>
                <div className="text-5xl font-bold tracking-tight">
                  <span className={getScoreColor(percent)}>{totalScore}</span>
                  <span className="text-3xl text-muted-foreground">/{maxScore}</span>
                </div>
                <div className="mt-2 text-lg font-medium text-muted-foreground">Đạt {percent}%</div>
              </div>
              <Separator orientation="vertical" className="hidden md:block h-24" />
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                  <Clock className="w-5 h-5" />
                  <span className="font-medium uppercase tracking-wider text-sm">Thời gian</span>
                </div>
                <div className="text-4xl font-semibold tracking-tight">
                  {formatDuration(duration)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Breakdown */}
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold flex items-center gap-2">Chi tiết câu trả lời</h3>
            {answers.map((answer, idx) => (
              <Card
                key={answer.questionId}
                className={cn(
                  'transition-all duration-300 hover:shadow-md border-l-4',
                  answer.isCorrect ? 'border-l-green-500' : 'border-l-destructive',
                )}
              >
                <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                  <div className="flex items-start gap-2 flex-1">
                    <span className="text-muted-foreground mr-2 font-normal shrink-0 mt-0.5">
                      Câu {idx + 1}:
                    </span>
                    <RichTextViewer htmlContent={answer.statement} className="flex-1" />
                  </div>
                  <Badge
                    variant={answer.isCorrect ? 'default' : 'destructive'}
                    className="ml-4 whitespace-nowrap"
                  >
                    {answer.isCorrect ? 'Đúng' : 'Sai'} ({answer.point ?? 1} điểm)
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {answer.choices.map((choice, choiceIdx) => {
                      const isCorrectChoice = answer.correctChoices.includes(choiceIdx);
                      const isStudentChoice = answer.studentAnswer?.includes(choiceIdx);

                      let choiceClass = 'border-border bg-background';
                      let icon = null;

                      if (isCorrectChoice) {
                        choiceClass =
                          'border-green-500 bg-green-500/10 text-green-700 dark:text-green-400';
                        icon = <CheckCircle2 className="w-5 h-5 text-green-500" />;
                      } else if (isStudentChoice && !isCorrectChoice) {
                        choiceClass = 'border-destructive bg-destructive/10 text-destructive';
                        icon = <XCircle className="w-5 h-5 text-destructive" />;
                      } else if (isStudentChoice) {
                        // Should not hit here if logic is sound, but just in case
                        choiceClass = 'border-primary bg-primary/10';
                      }

                      return (
                        <div
                          key={choiceIdx}
                          className={cn(
                            'flex items-center justify-between p-4 rounded-lg border',
                            choiceClass,
                          )}
                        >
                          <div
                            className={cn(
                              'text-sm md:text-base font-medium flex items-start gap-2',
                              isStudentChoice && 'font-semibold',
                            )}
                          >
                            <span className="shrink-0 mt-0.5">
                              {String.fromCharCode(65 + choiceIdx)}.
                            </span>
                            <RichTextViewer htmlContent={choice} className="flex-1 min-w-0" />
                          </div>
                          {icon && <div>{icon}</div>}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </PageShell>
  );
}
