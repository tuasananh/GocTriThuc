import { useState, useCallback, useEffect } from 'react';
import { Plus, Search, BookOpen } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { SectionHeader } from '@/components/SectionHeader';
import { SkeletonCard } from '@/components/SkeletonCard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { PERMISSION } from '@/lib/permissions';
import { usePermission } from '@/lib/permissions';
import type { PageResponse, CourseDto } from '@/types';
import { CourseCard } from './_components/CourseCard';

export function CourseListPage() {
  const [courses, setCourses] = useState<PageResponse<CourseDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [visibility, setVisibility] = useState<'Public' | 'Restricted'>('Public');

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<PageResponse<CourseDto>>('/api/courses', {
        params: { search: search || undefined, page, size: 12, visibility },
      });
      setCourses(res.data);
    } catch {
      setError('Không thể tải danh sách khóa học. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [search, page, visibility]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(fetchCourses, 300);
    return () => clearTimeout(t);
  }, [fetchCourses]);

  const canCreateCourse = usePermission(PERMISSION.MANAGE_OWN_COURSES);

  return (
    <PageShell>
      <SectionHeader
        title="Khám phá khóa học"
        description="Tìm kiếm và đăng ký các khóa học phù hợp với bạn"
        action={
          canCreateCourse && (
            // TODO(Tuấn): onClick={() => setShowCreate(true)} sau khi thêm state
            <Button id="btn-create-course">
              <Plus size={16} className="mr-1" /> Tạo khóa học
            </Button>
          )
        }
      />

      {/* Search + Filter */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="input-course-search"
            placeholder="Tìm kiếm khóa học..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <Tabs value={visibility} onValueChange={(v) => { setVisibility(v as 'Public' | 'Restricted'); setPage(0); }}>
          <TabsList>
            <TabsTrigger value="Public">Công khai</TabsTrigger>
            <TabsTrigger value="Restricted">Giới hạn</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Grid */}
      {error ? (
        <ErrorState message={error} onRetry={fetchCourses} />
      ) : loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : courses?.content.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Chưa có khóa học nào"
          description="Hãy thử tìm kiếm với từ khóa khác"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {courses?.content.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {courses && courses.totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          <Button variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            ←
          </Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            Trang {page + 1} / {courses.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page >= courses.totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            →
          </Button>
        </div>
      )}
    </PageShell>
  );
}
