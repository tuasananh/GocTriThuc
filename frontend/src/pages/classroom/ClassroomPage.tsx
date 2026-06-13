import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { ROUTES } from '@/lib/routes';
import type { ModuleDto } from '@/types';
import { toast } from 'sonner';
import { PageShell } from '@/components/PageShell';
import { Loader2 } from 'lucide-react';

export function ClassroomPage() {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;

    const redirectToFirstLesson = async () => {
      try {
        const res = await api.get<ModuleDto[]>(`/api/courses/${courseId}/modules`);
        const modules = res.data;

        // Sort modules by order
        const sortedModules = [...modules].sort((a, b) => a.order - b.order);

        // Find the first lesson
        let firstLessonId: string | null = null;
        for (const mod of sortedModules) {
          if (mod.lessons && mod.lessons.length > 0) {
            const sortedLessons = [...mod.lessons].sort((a, b) => a.order - b.order);
            firstLessonId = sortedLessons[0].id;
            break;
          }
        }

        if (firstLessonId) {
          navigate(ROUTES.LESSON(courseId, firstLessonId), { replace: true });
        } else {
          toast.error('Khóa học này chưa có bài học nào.');
          navigate(ROUTES.COURSE_DETAIL(courseId), { replace: true });
        }
      } catch (err) {
        console.error('Failed to load classroom content', err);
        toast.error('Không thể tải nội dung lớp học.');
        navigate(ROUTES.COURSE_DETAIL(courseId), { replace: true });
      } finally {
        setLoading(false);
      }
    };

    redirectToFirstLesson();
  }, [courseId, navigate]);

  return (
    <PageShell>
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Đang tải lớp học...</p>
      </div>
    </PageShell>
  );
}
