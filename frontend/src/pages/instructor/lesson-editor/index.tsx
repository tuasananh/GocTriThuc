import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
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
import { Input } from '@/components/ui/input';

export function LessonEditorPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState<LessonDetailDto | null>(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const videoDataRef = useRef<string>('');
  const blogDataRef = useRef<string>('');

  const fetchLesson = useCallback(async () => {
    if (!lessonId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<LessonDetailDto>(`/api/lessons/${lessonId}`);
      setLesson(res.data);
      setTitle(res.data.title);
      videoDataRef.current = res.data.video?.providerValue || '';
      blogDataRef.current = res.data.blog?.content || '';
    } catch {
      setError('Không thể tải thông tin bài học.');
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchLesson();
    }, 0);
    return () => clearTimeout(t);
  }, [fetchLesson]);

  const handleSave = async () => {
    if (!lesson || !title.trim()) return;
    setIsSaving(true);
    try {
      await api.put(`/api/lessons/${lesson.id}`, { title: title.trim() });
      
      if (lesson.type === 'video') {
        await api.put(`/api/lessons/${lesson.id}/video`, {
          provider: 'youtube', // Mặc định youtube cho demo
          providerValue: videoDataRef.current,
        });
      } else if (lesson.type === 'blog') {
        await api.put(`/api/lessons/${lesson.id}/blog`, {
          content: blogDataRef.current,
        });
      }
      toast.success('Đã lưu các thay đổi của bài học!');
      setLesson((prev) => (prev ? { ...prev, title: title.trim() } : null));
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
            <div className="space-y-2 max-w-xl">
              <h1 className="text-3xl font-bold tracking-tight">Chỉnh sửa bài học</h1>
              <div className="space-y-1.5">
                <label htmlFor="lesson-title" className="text-sm font-medium text-muted-foreground">
                  Tiêu đề bài học
                </label>
                <Input
                  id="lesson-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nhập tên bài học..."
                  className="font-semibold text-lg"
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Loại bài học:{' '}
              <span className="font-semibold text-foreground uppercase">{lesson.type}</span>
            </p>
          </div>

          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            <Save className="w-4 h-4" />
            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>

        {/* Content Form */}
        <div className="bg-card border rounded-xl shadow-sm p-6">
          {lesson.type === 'blog' && (
            <BlogLessonForm
              lesson={lesson}
              onChange={(html) => {
                blogDataRef.current = html;
              }}
            />
          )}
          {lesson.type === 'video' && (
            <VideoLessonForm
              lesson={lesson}
              onChange={(val) => {
                videoDataRef.current = val;
              }}
            />
          )}
          {lesson.type === 'test' && <TestLessonForm lesson={lesson} />}
        </div>
      </div>
    </PageShell>
  );
}
