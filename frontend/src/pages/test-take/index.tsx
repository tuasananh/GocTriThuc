import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { ROUTES } from '@/lib/routes';
import type { QuestionStudentDto, TestSessionDto, TestDto, LessonDetailDto } from '@/types';
import { PageShell } from '@/components/PageShell';
import { ErrorState } from '@/components/ErrorState';
import { SkeletonCard } from '@/components/SkeletonCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { TestCountdown } from './_components/TestCountdown';
import { QuestionOptionList } from './_components/QuestionOptionList';
import { RichTextViewer } from '@/components/rich-text-editor/RichTextViewer';

export function TestTakePage() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();

  const [testInfo, setTestInfo] = useState<TestDto | null>(null);
  const [session, setSession] = useState<TestSessionDto | null>(null);
  const [questions, setQuestions] = useState<QuestionStudentDto[]>([]);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!testId) return;
    setLoading(true);
    setError(null);
    try {
      // Gọi 3 API đồng thời như trong tài liệu thiết kế Day 9
      const [lessonRes, sessionRes, qRes] = await Promise.all([
        api.get<LessonDetailDto>(`/api/lessons/${testId}`),
        api.post<TestSessionDto>(`/api/tests/${testId}/sessions`),
        api.get<QuestionStudentDto[]>(`/api/tests/${testId}/questions`),
      ]);

      const lessonData = lessonRes.data;
      if (lessonData.test) {
        setTestInfo({
          id: lessonData.id,
          statement: lessonData.test.statement,
          timeLimit: lessonData.test.timeLimit,
        });
      } else {
        setTestInfo({
          id: lessonData.id,
          statement: lessonData.title,
          timeLimit: 1800,
        });
      }
      setSession(sessionRes.data);
      setQuestions(qRes.data);

      // Khôi phục câu trả lời nếu refresh trang
      try {
        const ansRes = await api.get<{ answers: Record<string, number[]> }>(
          `/api/sessions/${sessionRes.data.id}/answers`,
        );
        if (ansRes.data?.answers) {
          setAnswers(ansRes.data.answers);
        }
      } catch (e) {
        console.warn('Could not restore answers', e);
      }
    } catch (err) {
      const e = err as { response?: { status: number } };
      if (e.response?.status === 409) {
        toast.error('Bài kiểm tra này đã được nộp.');
        // Giả sử ta không có sessionId ở lỗi 409, đành quay về khóa học
        navigate(ROUTES.DASHBOARD, { replace: true });
        return;
      }
      setError('Không thể khởi tạo phiên làm bài. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [testId, navigate]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const handleAnswerChange = async (questionId: string, newAnswers: number[]) => {
    if (!session) return;

    const prevAnswers = answers[questionId];

    // Optimistic UI update
    setAnswers((prev) => ({ ...prev, [questionId]: newAnswers }));

    try {
      await api.put(`/api/sessions/${session.id}/answers`, {
        questionId: questionId,
        selectedChoices: newAnswers,
      });
    } catch {
      toast.error('Có lỗi xảy ra khi lưu câu trả lời. Vui lòng kiểm tra mạng!');
      // Rollback optimistic update
      setAnswers((prev) => {
        const updated = { ...prev };
        if (prevAnswers === undefined) {
          delete updated[questionId];
        } else {
          updated[questionId] = prevAnswers;
        }
        return updated;
      });
    }
  };

  const handleSubmit = async (isAutoSubmit = false) => {
    if (!session) return;

    if (!isAutoSubmit) {
      const isConfirmed = window.confirm('Bạn có chắc chắn muốn nộp bài ngay bây giờ?');
      if (!isConfirmed) return;
    } else {
      toast.info('Đã hết thời gian làm bài. Đang tự động nộp bài...');
    }

    setSubmitting(true);
    try {
      await api.post(`/api/sessions/${session.id}/submit`);
      toast.success('Nộp bài thành công!');
      navigate(ROUTES.TEST_RESULT(session.id), { replace: true });
    } catch {
      toast.error('Lỗi nộp bài! Vui lòng liên hệ hỗ trợ.');
      setSubmitting(false); // Only allow re-submit if it failed
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="mb-8 mt-4">
          <div className="h-8 w-64 bg-muted animate-pulse rounded mb-2"></div>
          <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
        </div>
        <div className="grid gap-8 lg:grid-cols-4 items-start">
          <div className="lg:col-span-3 space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <div className="hidden lg:block lg:col-span-1">
            <SkeletonCard />
          </div>
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <ErrorState message={error} onRetry={fetchData} />
      </PageShell>
    );
  }

  if (!testInfo || !session || questions.length === 0) {
    return (
      <PageShell>
        <ErrorState message="Dữ liệu bài thi không hợp lệ." onRetry={fetchData} />
      </PageShell>
    );
  }

  // NOTE: Ngoại lệ Layout - Không sử dụng <PageShell> ở màn hình này
  // do đặc thù UX/UI của trang làm bài thi cần không gian rộng và header dính (sticky) độc lập.
  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-sm">
        <div className="container flex items-center justify-between h-16 max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold tracking-tight leading-none mb-1">
                {testInfo.statement}
              </h1>
              <p className="text-sm text-muted-foreground leading-none">
                {questions.length} câu hỏi
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <TestCountdown
              initialSeconds={session.remainingTime}
              onTimeout={() => handleSubmit(true)}
            />
            <Button onClick={() => handleSubmit(false)} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Nộp bài ngay'}
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-4 items-start">
          {/* Cột trái: Danh sách câu hỏi */}
          <div className="lg:col-span-3 space-y-8">
            {questions.map((q, index) => (
              <Card key={q.id} id={`question-${q.id}`} className="scroll-mt-24 shadow-sm">
                <CardHeader className="bg-muted/30 border-b pb-4">
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-primary shrink-0 mt-1">Câu {index + 1}:</span>
                    <RichTextViewer htmlContent={q.statement} className="flex-1" />
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <QuestionOptionList
                    questionId={q.id}
                    choices={q.choices}
                    isSingleChoice={q.isSingleChoice}
                    selectedAnswers={answers[q.id] || []}
                    onAnswerChange={(ans) => handleAnswerChange(q.id, ans)}
                  />
                </CardContent>
              </Card>
            ))}

            <div className="flex justify-end mt-8">
              <Button size="lg" onClick={() => handleSubmit(false)} disabled={submitting}>
                Hoàn thành & Nộp bài <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Cột phải: Bảng điều khiển (Navigation) */}
          <div className="hidden lg:block lg:col-span-1 sticky top-24">
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Mục lục câu hỏi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, index) => {
                    const isAnswered = answers[q.id] && answers[q.id].length > 0;
                    return (
                      <Button
                        key={q.id}
                        variant={isAnswered ? 'default' : 'outline'}
                        className={`h-10 w-full p-0 font-medium ${isAnswered ? '' : 'text-muted-foreground'}`}
                        onClick={() => {
                          const el = document.getElementById(`question-${q.id}`);
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                      >
                        {index + 1}
                      </Button>
                    );
                  })}
                </div>
                <div className="mt-6 flex flex-col gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-primary" /> Đã trả lời
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded border border-input" /> Chưa trả lời
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
