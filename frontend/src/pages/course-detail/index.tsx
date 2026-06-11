import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { ROUTES } from '@/lib/routes';
import type { CourseDto, AccessStatusResponse, AccessStatus } from '@/types';
import { PageShell } from '@/components/PageShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BookOpen, UserPlus, LogIn, Lock, PlayCircle, Loader2, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { ErrorState } from '@/components/ErrorState';
import { useIsAdmin } from '@/lib/permissions';
import { isAxiosError } from 'axios';
import { ModuleSidebar } from './_components/ModuleSidebar';
import { RestrictedAccessBanner } from './_components/RestrictedAccessBanner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AnnouncementsFeed } from './_components/AnnouncementsFeed';
export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const auth = useAuth();
  const isAdmin = useIsAdmin();

  const [course, setCourse] = useState<CourseDto | null>(null);
  const [accessStatus, setAccessStatus] = useState<AccessStatus>('none');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<{ type: 'not_found' | 'network'; message: string } | null>(
    null,
  );

  const isAuthenticated = auth?.isAuthenticated ?? false;
  const user = auth?.isAuthenticated ? auth.user : null;

  const fetchData = useCallback(async () => {
    if (!id) {
      setError({ type: 'not_found', message: 'Không tìm thấy khóa học.' });
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [courseRes, statusRes] = await Promise.all([
        api.get<CourseDto>(`/api/courses/${id}`),
        isAuthenticated
          ? api.get<AccessStatusResponse>(`/api/courses/${id}/access-status`).catch((err) => {
              console.warn('Failed to fetch access status, falling back to none:', err);
              return { data: { status: 'none' as AccessStatus } };
            })
          : Promise.resolve({ data: { status: 'none' as AccessStatus } }),
      ]);

      setCourse(courseRes.data);
      setAccessStatus(statusRes.data?.status || 'none');
    } catch (err: unknown) {
      console.error('Failed to load course details', err);
      const status = isAxiosError(err) ? err.response?.status : null;
      if (status === 404) {
        setError({
          type: 'not_found',
          message: 'Khóa học không tồn tại hoặc đã bị xóa.',
        });
      } else {
        setError({
          type: 'network',
          message: 'Không thể tải thông tin khóa học. Vui lòng kiểm tra kết nối mạng.',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [id, isAuthenticated]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(t);
  }, [fetchData]);

  const handleEnrollAction = async () => {
    if (!isAuthenticated) {
      toast.info('Bạn cần đăng nhập để tham gia khóa học');
      const redirectUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      navigate(`${ROUTES.LOGIN}?redirect=${encodeURIComponent(redirectUrl)}`);
      return;
    }

    if (!course || !id) return;

    if (accessStatus === 'enrolled') {
      navigate(ROUTES.CLASSROOM(id));
      return;
    }

    setActionLoading(true);
    try {
      if (course.visibility === 'public') {
        await api.post(`/api/courses/${id}/enroll`);
        setAccessStatus('enrolled');
        toast.success('Đăng ký khóa học thành công!');
        navigate(ROUTES.CLASSROOM(id));
      } else if (course.visibility === 'restricted') {
        await api.post(`/api/courses/${id}/access-requests`);
        setAccessStatus('requested');
        toast.success('Đã gửi yêu cầu tham gia khóa học. Vui lòng chờ phê duyệt.');
      }
    } catch (err) {
      console.error('Action failed', err);
      toast.error('Có lỗi xảy ra, vui lòng thử lại sau.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex flex-col lg:flex-row gap-8 mt-8 animate-in fade-in duration-500">
          <Skeleton className="w-full lg:w-1/3 aspect-video rounded-2xl" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-24 w-full" />
            <div className="flex gap-4 pt-4">
              <Skeleton className="h-12 w-40 rounded-xl" />
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  if (error || !course) {
    if (error?.type === 'network') {
      return (
        <PageShell>
          <div className="mt-20 max-w-lg mx-auto">
            <ErrorState message={error.message} onRetry={fetchData} />
          </div>
        </PageShell>
      );
    }

    return (
      <PageShell>
        <div className="mt-20 text-center flex flex-col items-center">
          <BookOpen size={48} className="text-muted-foreground mb-4 opacity-50" />
          <h2 className="text-2xl font-semibold mb-2">Không tìm thấy khóa học</h2>
          <p className="text-muted-foreground">{error?.message || 'Khóa học không tồn tại.'}</p>
          <Button className="mt-6" onClick={() => navigate(ROUTES.COURSES)}>
            Quay lại danh sách
          </Button>
        </div>
      </PageShell>
    );
  }

  const visibilityConfig = {
    public: { label: 'Công khai', variant: 'secondary' as const },
    restricted: { label: 'Giới hạn', variant: 'outline' as const },
    private: { label: 'Riêng tư', variant: 'destructive' as const },
  }[course.visibility] ?? { label: course.visibility, variant: 'outline' as const };

  const isAuthor = Boolean(user?.id && course?.author?.id && user.id === course.author.id);

  return (
    <PageShell>
      {/* Course Header Hero Section */}
      <div className="relative mt-4 lg:mt-8 bg-card rounded-3xl border border-border/50 overflow-hidden shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Left: Course Info */}
          <div className="p-8 lg:p-12 lg:col-span-7 flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Badge variant={visibilityConfig.variant} className="px-3 py-1 text-sm font-medium">
                {visibilityConfig.label}
              </Badge>
              {!course.isPublished && (
                <Badge variant="outline" className="text-amber-600 border-amber-600/30 bg-amber-50">
                  Bản nháp
                </Badge>
              )}
            </div>

            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground mb-4">
              {course.title}
            </h1>

            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              {course.description || 'Chưa có mô tả cho khóa học này.'}
            </p>

            <div className="flex items-center gap-4 mb-10">
              <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                <AvatarImage src={course.author.avatarUrl ?? undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {(course.author.displayName || course.author.username || 'U')
                    .charAt(0)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-foreground">Giảng viên</p>
                <p className="text-base font-semibold">
                  {course.author.displayName || course.author.username}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              {!isAuthenticated ? (
                <Button size="lg" className="rounded-xl px-8" onClick={handleEnrollAction}>
                  <LogIn className="mr-2 h-5 w-5" />
                  Đăng nhập để học
                </Button>
              ) : accessStatus === 'enrolled' || isAdmin || isAuthor ? (
                <div className="flex flex-wrap gap-4">
                  <Button
                    size="lg"
                    className="rounded-xl px-8"
                    onClick={() => navigate(ROUTES.CLASSROOM(id!))}
                  >
                    <PlayCircle className="mr-2 h-5 w-5" />
                    Vào lớp học
                  </Button>
                  {isAuthor && (
                    <Button
                      size="lg"
                      variant="outline"
                      className="rounded-xl px-8 border-primary text-primary hover:bg-primary/5"
                      onClick={() => navigate(ROUTES.INSTRUCTOR_COURSE_EDITOR(id!))}
                    >
                      <Settings className="mr-2 h-5 w-5" />
                      Chỉnh sửa
                    </Button>
                  )}
                </div>
              ) : accessStatus === 'requested' ? (
                <Button size="lg" variant="secondary" className="rounded-xl px-8" disabled>
                  <Lock className="mr-2 h-5 w-5" />
                  Đang chờ phê duyệt
                </Button>
              ) : course.visibility === 'public' ? (
                <Button
                  size="lg"
                  className="rounded-xl px-8"
                  onClick={handleEnrollAction}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <PlayCircle className="mr-2 h-5 w-5" />
                  )}
                  Tham gia khóa học
                </Button>
              ) : course.visibility === 'restricted' ? (
                <Button
                  size="lg"
                  className="rounded-xl px-8"
                  onClick={handleEnrollAction}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <UserPlus className="mr-2 h-5 w-5" />
                  )}
                  Yêu cầu truy cập
                </Button>
              ) : (
                <Button size="lg" variant="secondary" className="rounded-xl px-8" disabled>
                  <Lock className="mr-2 h-5 w-5" />
                  Khóa học riêng tư
                </Button>
              )}
            </div>
          </div>

          {/* Right: Thumbnail */}
          <div className="lg:col-span-5 relative min-h-[300px] lg:min-h-full bg-muted">
            <img
              src={course.thumbnailUrl || `https://picsum.photos/seed/${course.id}/800/800`}
              alt={course.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Gradient overlay for smooth transition on desktop */}
            <div className="absolute inset-0 bg-gradient-to-r from-card to-transparent hidden lg:block w-32" />
            <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent lg:hidden h-32 bottom-0 top-auto" />
          </div>
        </div>
      </div>

      <RestrictedAccessBanner
        visibility={course.visibility}
        accessStatus={accessStatus}
        isAuthor={isAuthor}
        isAdmin={isAdmin}
      />

      {/* Course Content — Modules & Announcements */}
      <div className="mt-8">
        <Tabs defaultValue="modules" className="w-full">
          <TabsList className="mb-6 h-auto p-1 bg-muted/50 w-full sm:w-auto flex flex-col sm:flex-row justify-start">
            <TabsTrigger value="modules" className="w-full sm:w-auto px-6 py-2.5 text-base">
              Nội dung bài học
            </TabsTrigger>
            <TabsTrigger value="announcements" className="w-full sm:w-auto px-6 py-2.5 text-base">
              Thông báo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="modules" className="mt-0">
            <ModuleSidebar
              courseId={id!}
              visible={accessStatus === 'enrolled' || isAuthor || isAdmin}
            />
          </TabsContent>

          <TabsContent value="announcements" className="mt-0">
            <AnnouncementsFeed courseId={id!} isAuthor={isAuthor} />
          </TabsContent>
        </Tabs>
      </div>
    </PageShell>
  );
}
