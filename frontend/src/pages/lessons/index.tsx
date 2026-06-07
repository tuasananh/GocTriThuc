import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { ROUTES } from '@/lib/routes';
import type { LessonDetailDto } from '@/types';
import { PageShell } from '@/components/PageShell';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { ErrorState } from '@/components/ErrorState';
import { VideoLessonViewer } from './_components/VideoLessonViewer';
import { BlogLessonViewer } from './_components/BlogLessonViewer';
import { LessonResourceList } from './_components/LessonResourceList';

export function LessonPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();

  const [lesson, setLesson] = useState<LessonDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ type: 'not_found' | 'network'; message: string } | null>(
    null,
  );
  const [completing, setCompleting] = useState(false);

  const fetchLesson = useCallback(async () => {
    if (!courseId || !lessonId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<LessonDetailDto>(`/api/lessons/${lessonId}`);
      setLesson(res.data);
    } catch (err) {
      console.error('Failed to load lesson details', err);
      setError({
        type: 'network',
        message: 'Không thể tải nội dung bài học. Vui lòng thử lại.',
      });
    } finally {
      setLoading(false);
    }
  }, [courseId, lessonId]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchLesson();
    }, 0);
    return () => clearTimeout(t);
  }, [fetchLesson]);

  const markAsCompleted = async () => {
    if (!lessonId) return;
    setCompleting(true);
    try {
      await api.post(`/api/lessons/${lessonId}/complete`);
      toast.success('Đã đánh dấu hoàn thành bài học!');
      // Update local state
      setLesson((prev) => (prev ? { ...prev, isCompleted: true } : prev));
    } catch (err) {
      toast.error('Có lỗi xảy ra, không thể đánh dấu hoàn thành.');
      console.error(err);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="space-y-6 max-w-4xl mx-auto py-8">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </PageShell>
    );
  }

  if (error || !lesson) {
    return (
      <PageShell>
        <div className="py-12">
          <ErrorState
            title="Lỗi tải bài học"
            message={error?.message || 'Không tìm thấy nội dung bài học.'}
            onRetry={fetchLesson}
          />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="max-w-4xl mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" asChild className="gap-2">
            <Link to={ROUTES.COURSE_DETAIL(courseId!)}>
              <ArrowLeft className="w-4 h-4" />
              Quay lại khóa học
            </Link>
          </Button>

          {lesson.isCompleted ? (
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 font-medium">
              <CheckCircle2 className="w-5 h-5" />
              <span>Đã hoàn thành</span>
            </div>
          ) : (
            <Button onClick={markAsCompleted} disabled={completing} className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {completing ? 'Đang xử lý...' : 'Đánh dấu hoàn thành'}
            </Button>
          )}
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">{lesson.title}</h1>
          <p className="text-muted-foreground">
            {lesson.lessonType === 'video'
              ? 'Bài học Video'
              : lesson.lessonType === 'blog'
                ? 'Bài học Bài viết'
                : 'Bài học Trắc nghiệm'}
          </p>
        </div>

        <div className="bg-card rounded-xl border p-4 shadow-sm">
          {lesson.lessonType === 'video' && lesson.video ? (
            <VideoLessonViewer video={lesson.video} />
          ) : lesson.lessonType === 'blog' ? (
            <BlogLessonViewer blog={lesson.blog ?? { content: '' }} />
          ) : lesson.lessonType === 'test' ? (
            <div className="p-8 text-center text-muted-foreground bg-muted/20 rounded-lg">
              <p>Giao diện bài kiểm tra sẽ hiển thị tại đây.</p>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground bg-muted/20 rounded-lg">
              <p>Nội dung bài học chưa được cập nhật.</p>
            </div>
          )}
        </div>

        {lesson.resources && <LessonResourceList resources={lesson.resources} />}
      </div>
    </PageShell>
  );
}
