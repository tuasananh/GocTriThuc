import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/PageShell';
import { SectionHeader } from '@/components/SectionHeader';
import { ErrorState } from '@/components/ErrorState';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { ROUTES } from '@/lib/routes';
import { Plus, ArrowLeft } from 'lucide-react';
import type { CourseDto, ModuleDto } from '@/types';
import { ModuleList } from './_components/ModuleList';
import { CreateModuleDialog } from './_components/CreateModuleDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';

export function CourseEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const auth = useAuth();

  const [course, setCourse] = useState<CourseDto | null>(null);
  const [modules, setModules] = useState<ModuleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [courseRes, modulesRes] = await Promise.all([
        api.get<CourseDto>(`/api/courses/${id}`),
        api.get<ModuleDto[]>(`/api/courses/${id}/modules`),
      ]);
      setCourse(courseRes.data);

      // Sort modules by order
      const sortedModules = modulesRes.data.sort((a, b) => a.order - b.order);
      // Sort lessons inside modules by order
      sortedModules.forEach((m) => m.lessons.sort((a, b) => a.order - b.order));
      setModules(sortedModules);
    } catch {
      setError('Lỗi khi tải thông tin khóa học');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(t);
  }, [fetchData]);

  if (loading) {
    return (
      <PageShell>
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      </PageShell>
    );
  }

  if (error || !course) {
    return (
      <PageShell>
        <ErrorState
          title="Không tìm thấy khóa học"
          message={error || 'Đã có lỗi xảy ra'}
          action={{
            label: 'Quay lại dashboard',
            onClick: () => navigate(ROUTES.INSTRUCTOR_DASHBOARD),
          }}
        />
      </PageShell>
    );
  }

  if (auth && auth.isAuthenticated && course.author.id !== auth.user.id) {
    return (
      <PageShell>
        <ErrorState
          title="Từ chối truy cập"
          message="Bạn không có quyền chỉnh sửa khóa học này"
          action={{
            label: 'Quay lại dashboard',
            onClick: () => navigate(ROUTES.INSTRUCTOR_DASHBOARD),
          }}
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate(ROUTES.COURSES)} className="mb-4 -ml-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại danh sách khóa học
        </Button>
        <SectionHeader
          title={`Chỉnh sửa: ${course.title}`}
          description={course.description}
          action={
            <Button onClick={() => setIsAddModuleOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Thêm học phần
            </Button>
          }
        />
      </div>

      <ModuleList modules={modules} onModulesChange={fetchData} />

      <CreateModuleDialog
        courseId={course.id}
        open={isAddModuleOpen}
        onOpenChange={setIsAddModuleOpen}
        onSuccess={fetchData}
      />
    </PageShell>
  );
}
