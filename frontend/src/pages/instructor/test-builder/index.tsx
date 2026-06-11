import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { LessonDetailDto, TestQuestionDto } from '@/types';
import { PageShell } from '@/components/PageShell';
import { SectionHeader } from '@/components/SectionHeader';
import { Button } from '@/components/ui/button';

import { Plus, ArrowLeft } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { SkeletonCard } from '@/components/SkeletonCard';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!lessonId) return;
    setLoading(true);
    setError(null);
    try {
      const r = await api.get<LessonDetailDto>(`/api/lessons/${lessonId}`);
      if (r.data.test) {
        setTestId(r.data.test.testId);
        setStatement(r.data.test.statement || '');
        setTimeLimit(r.data.test.timeLimit || 1800);
        const qr = await api.get<TestQuestionDto[]>(`/api/tests/${r.data.test.testId}/questions`);
        setQuestions(qr.data);
      }
    } catch (err) {
      console.error('Failed to load test details', err);
      setError('Không thể tải dữ liệu bài kiểm tra. Vui lòng kiểm tra kết nối.');
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      await api.put(`/api/lessons/${lessonId}/test`, { statement, timeLimit });
      toast.success('Đã lưu cài đặt bài kiểm tra');
    } catch (err) {
      console.error('Save failed', err);
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
    } catch (err) {
      console.error('Remove failed', err);
      toast.error('Không thể xóa câu hỏi');
    }
  };

  const updateQuestionPoint = async (questionId: string, point: number) => {
    if (!testId) return;
    try {
      await api.patch(`/api/tests/${testId}/questions/${questionId}`, { point });
      setQuestions((q) => q.map((x) => (x.id === questionId ? { ...x, point } : x)));
      toast.success('Đã cập nhật điểm');
    } catch (err) {
      console.error('Update point failed', err);
      toast.error('Không thể cập nhật điểm');
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Settings panel */}
        <TestSettingsForm
          statement={statement}
          onStatementChange={setStatement}
          timeLimit={timeLimit}
          onTimeLimitChange={setTimeLimit}
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
                />
              ))}
            </div>
          )}
        </div>
      </div>

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
