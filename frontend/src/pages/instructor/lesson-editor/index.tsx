import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { ROUTES } from '@/lib/routes';
import type { LessonDetailDto } from '@/types';
import { PageShell } from '@/components/PageShell';
import { ErrorState } from '@/components/ErrorState';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { BlogLessonForm } from './_components/BlogLessonForm';
import { VideoLessonForm } from './_components/VideoLessonForm';
import { TestLessonForm } from './_components/TestLessonForm';

export function LessonEditorPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState<LessonDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchLesson = useCallback(async () => {
    if (!lessonId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<LessonDetailDto>(`/api/lessons/${lessonId}`);
      setLesson(res.data);
    } catch {
      setError('Không thể tải thông tin bài học.');
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    fetchLesson();
  }, [fetchLesson]);

  const handleSave = async () => {
    // In Day 6, we mainly update the title. The content update is separate for Day 7.
    // However, if we need to save the content, we can call the respective APIs here.
    if (!lesson) return;
    setIsSaving(true);
    try {
      // For now, just a placeholder success since content saving is Day 7
      toast.success('Đã lưu các thay đổi của bài học!');
      // Example of Day 7's request:
      // await api.put(`/api/lessons/${lesson.id}`, { title: lesson.title });
    } catch {
      toast.error('Lỗi khi lưu bài học.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="space-y-6">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-[500px] w-full rounded-xl" />
        </div>
      </PageShell>
    );
  }

  if (error || !lesson) {
    return (
      <PageShell>
        <ErrorState message={error || 'Không tìm thấy bài học.'} onRetry={fetchLesson} />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="pl-0 gap-2 text-muted-foreground hover:text-foreground"
              onClick={() => navigate(-1)} // Navigate back to Course Editor
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại quản lý học phần
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Chỉnh sửa: {lesson.title}</h1>
            <p className="text-sm text-muted-foreground">
              Loại bài học:{' '}
              <span className="font-semibold text-foreground uppercase">{lesson.lessonType}</span>
            </p>
          </div>

          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            <Save className="w-4 h-4" />
            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>

        {/* Content Form */}
        <div className="bg-card border rounded-xl shadow-sm p-6">
          {lesson.lessonType === 'blog' && <BlogLessonForm lesson={lesson} />}
          {lesson.lessonType === 'video' && <VideoLessonForm lesson={lesson} />}
          {lesson.lessonType === 'test' && <TestLessonForm lesson={lesson} />}
        </div>
      </div>
    </PageShell>
  );
}
