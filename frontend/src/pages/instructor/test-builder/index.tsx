import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Plus, ArrowLeft, Eye } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { SkeletonCard } from '@/components/SkeletonCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';
import type { LessonDetailDto, TestQuestionDto, TestSessionSummaryDto } from '@/types';
import { PageShell } from '@/components/PageShell';
import { SectionHeader } from '@/components/SectionHeader';
import { Button } from '@/components/ui/button';
import { TestQuestionItem } from './_components/TestQuestionItem';
import { QuestionPickerModal } from './_components/QuestionPickerModal';
import { TestSettingsForm } from './_components/TestSettingsForm';

export function TestBuilderPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();

  const [testId, setTestId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<TestQuestionDto[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [statement, setStatement] = useState('');
  const [timeLimit, setTimeLimit] = useState(1800); // 30 min default
  const [maxAttempts, setMaxAttempts] = useState<number>(1);
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sessions, setSessions] = useState<TestSessionSummaryDto[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const fetchData = useCallback(async () => {
    if (!lessonId) return;
    setLoading(true);
    setError(null);
    try {
      const r = await api.get<LessonDetailDto>(`/api/lessons/${lessonId}`);
      if (r.data.test) {
        setTestId(r.data.id);
        setStatement(r.data.test.statement || '');
        setTimeLimit(r.data.test.timeLimit || 1800);

        const testSettings = r.data.test.settings || {};
        setSettings(testSettings);
        const attempts =
          typeof testSettings.maxAttempts === 'number' ? testSettings.maxAttempts : 1;
        setMaxAttempts(attempts);

        const qr = await api.get<TestQuestionDto[]>(`/api/tests/${r.data.id}/questions`);
        setQuestions(qr.data);
      }
    } catch {
      setError('Không thể tải dữ liệu bài kiểm tra. Vui lòng kiểm tra kết nối.');
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const fetchSessions = useCallback(async () => {
    if (!testId) return;
    setLoadingSessions(true);
    try {
      const res = await api.get<TestSessionSummaryDto[]>(`/api/tests/${testId}/sessions`);
      setSessions(res.data);
    } catch {
      toast.error('Không thể tải danh sách kết quả học sinh');
    } finally {
      setLoadingSessions(false);
    }
  }, [testId]);

  useEffect(() => {
    if (testId) {
      const t = setTimeout(() => {
        fetchSessions();
      }, 0);
      return () => clearTimeout(t);
    }
  }, [testId, fetchSessions]);

  const saveSettings = async () => {
    const minutes = Math.floor(timeLimit / 60);
    if (isNaN(minutes) || minutes < 1 || minutes > 180) {
      toast.error('Thời gian làm bài phải là số nguyên dương từ 1 đến 180 phút');
      return;
    }
    setSaving(true);
    try {
      await api.put(`/api/lessons/${lessonId}/test`, {
        statement,
        timeLimit,
        settings: {
          ...settings,
          maxAttempts,
        },
      });
      setSettings((prev) => ({ ...prev, maxAttempts }));
      toast.success('Đã lưu cài đặt bài kiểm tra');
    } catch {
      toast.error('Không thể lưu cài đặt');
    } finally {
      setSaving(false);
    }
  };

  const removeQuestion = async (questionId: string) => {
    if (!testId) return;

    try {
      await api.delete(`/api/tests/${testId}/questions/${questionId}`);
      setQuestions((q) => q.filter((x) => x.id !== questionId));
      toast.success('Đã xóa câu hỏi khỏi bài kiểm tra');
    } catch {
      toast.error('Không thể xóa câu hỏi');
    }
  };

  const updateQuestionPoint = async (questionId: string, point: number) => {
    if (!testId) return;
    try {
      await api.patch(`/api/tests/${testId}/questions/${questionId}`, { point });
      setQuestions((q) => q.map((x) => (x.id === questionId ? { ...x, point } : x)));
      toast.success('Đã cập nhật điểm');
    } catch {
      toast.error('Không thể cập nhật điểm');
    }
  };

  const moveQuestion = async (questionId: string, direction: 'up' | 'down') => {
    if (!testId) return;

    // Cập nhật giao diện trước (Optimistic UI) bằng functional update để tránh stale closure
    setQuestions((prev) => {
      const idx = prev.findIndex((q) => q.id === questionId);
      if (idx === -1) return prev;
      if (direction === 'up' && idx === 0) return prev;
      if (direction === 'down' && idx === prev.length - 1) return prev;

      const newQuestions = [...prev];
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      [newQuestions[idx], newQuestions[swapIdx]] = [newQuestions[swapIdx], newQuestions[idx]];
      return newQuestions;
    });

    try {
      await api.patch(`/api/tests/${testId}/questions/${questionId}/order`, { direction });
      // Không cần hiện toast vì có thể làm rối người dùng khi họ bấm nhiều lần liên tiếp
    } catch {
      toast.error('Không thể cập nhật thứ tự');
      // Nếu lỗi thì revert lại swap cũ để UI phản hồi ngay lập tức
      setQuestions((prev) => {
        const idx = prev.findIndex((q) => q.id === questionId);
        if (idx === -1) return prev;
        const revDir = direction === 'up' ? 'down' : 'up';
        if (revDir === 'up' && idx === 0) return prev;
        if (revDir === 'down' && idx === prev.length - 1) return prev;

        const newQuestions = [...prev];
        const swapIdx = revDir === 'up' ? idx - 1 : idx + 1;
        [newQuestions[idx], newQuestions[swapIdx]] = [newQuestions[swapIdx], newQuestions[idx]];
        return newQuestions;
      });

      // Lấy lại dữ liệu ngầm (Silently Refetch) để đảm bảo đồng bộ tuyệt đối với Server
      try {
        const res = await api.get<TestQuestionDto[]>(`/api/tests/${testId}/questions`);
        setQuestions(res.data);
      } catch (err) {
        console.error('Failed to silently refetch questions', err);
      }
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="mb-6">
          <Button variant="ghost" disabled className="mb-4 -ml-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          <div className="h-8 w-64 bg-muted animate-pulse rounded mb-2"></div>
          <div className="h-4 w-96 bg-muted animate-pulse rounded"></div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <div className="space-y-4">
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

  return (
    <PageShell>
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 -ml-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
        <SectionHeader title="Thiết lập bài kiểm tra" />
      </div>

      <Tabs defaultValue="builder" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="builder">Soạn đề & Cài đặt</TabsTrigger>
          <TabsTrigger value="results">Kết quả học sinh</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Settings panel */}
            <TestSettingsForm
              statement={statement}
              onStatementChange={setStatement}
              timeLimit={timeLimit}
              onTimeLimitChange={setTimeLimit}
              maxAttempts={maxAttempts}
              onMaxAttemptsChange={setMaxAttempts}
              onSave={saveSettings}
              saving={saving}
            />

            {/* Question list */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold tracking-tight">
                  Danh sách câu hỏi ({questions.length})
                </h3>
                <Button onClick={() => setShowPicker(true)}>
                  <Plus size={16} className="mr-2" /> Thêm câu hỏi
                </Button>
              </div>

              {questions.length === 0 ? (
                <div className="mt-8">
                  <EmptyState
                    title="Chưa có câu hỏi nào"
                    description="Hãy thêm câu hỏi từ Ngân hàng đề để bắt đầu xây dựng bài kiểm tra."
                    action={<Button onClick={() => setShowPicker(true)}>Thêm câu hỏi ngay</Button>}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((q, i) => (
                    <TestQuestionItem
                      key={q.id}
                      question={q}
                      index={i}
                      onRemove={() => removeQuestion(q.id)}
                      onUpdatePoint={(p) => updateQuestionPoint(q.id, p)}
                      isFirst={i === 0}
                      isLast={i === questions.length - 1}
                      onMoveUp={() => moveQuestion(q.id, 'up')}
                      onMoveDown={() => moveQuestion(q.id, 'down')}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="results">
          <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-muted/50 flex items-center justify-between">
              <h3 className="font-semibold text-lg">Danh sách học sinh làm bài</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchSessions}
                disabled={loadingSessions}
              >
                Làm mới
              </Button>
            </div>

            {loadingSessions ? (
              <div className="p-8 text-center text-muted-foreground">Đang tải dữ liệu...</div>
            ) : sessions.length === 0 ? (
              <div className="p-12 text-center">
                <EmptyState
                  title="Chưa có kết quả"
                  description="Chưa có học sinh nào làm bài kiểm tra này."
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Học viên</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Điểm số</TableHead>
                    <TableHead>Bắt đầu lúc</TableHead>
                    <TableHead>Nộp bài lúc</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.sessionId}>
                      <TableCell className="font-medium">{session.displayName}</TableCell>
                      <TableCell>
                        {session.isDone ? (
                          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                            Đã nộp
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Đang làm</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {session.isDone &&
                        typeof session.score === 'number' &&
                        typeof session.correctCount === 'number' &&
                        typeof session.totalQuestions === 'number' ? (
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {session.correctCount}/{session.totalQuestions} (
                            {Math.round(session.score)}%)
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{new Date(session.startedAt).toLocaleString('vi-VN')}</TableCell>
                      <TableCell>
                        {session.submittedAt
                          ? new Date(session.submittedAt).toLocaleString('vi-VN')
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {session.isDone && (
                          <Button size="sm" variant="ghost" asChild>
                            <Link
                              to={ROUTES.TEST_RESULT(session.sessionId)}
                              target="_blank"
                              className="flex items-center gap-2"
                            >
                              <Eye size={16} /> Chi tiết
                            </Link>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {testId && (
        <QuestionPickerModal
          open={showPicker}
          onClose={() => setShowPicker(false)}
          testId={testId}
          onAdded={(q) => {
            // Prevent duplicate adding in UI
            if (!questions.find((existing) => existing.id === q.id)) {
              setQuestions((prev) => [...prev, q]);
            } else {
              toast.info('Câu hỏi này đã có trong đề thi');
            }
          }}
        />
      )}
    </PageShell>
  );
}
