import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';
import { api } from '@/lib/api';
import type { PageResponse, CourseDto, CourseProgressDto } from '@/types';
import { PageShell } from '@/components/PageShell';
import { SectionHeader } from '@/components/SectionHeader';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { SkeletonCard } from '@/components/SkeletonCard';
import { BookOpen, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

type EnrolledCourse = CourseDto & {
  progress?: CourseProgressDto;
};

export const Dashboard = () => {
  const auth = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<PageResponse<CourseDto>>('/api/courses?enrolled=true');
      const coursesData = res.data.content;

      // Fetch progress for each course concurrently
      const progressPromises = coursesData.map(async (course) => {
        try {
          const progressRes = await api.get<CourseProgressDto>(
            `/api/courses/${course.id}/progress`,
          );
          return { ...course, progress: progressRes.data };
        } catch {
          // If progress fetch fails, return course without progress
          return course;
        }
      });

      const coursesWithProgress = await Promise.all(progressPromises);
      setCourses(coursesWithProgress);
    } catch {
      setError('Không thể tải danh sách khóa học của bạn.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (auth?.isAuthenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchData();
    }
  }, [auth?.isAuthenticated, fetchData]);

  if (auth === null) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (auth.isAuthenticated === false) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  const { user } = auth;

  return (
    <PageShell>
      {/* Profile Overview Banner */}
      <div className="mb-8 rounded-xl bg-muted/50 p-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Avatar className="h-20 w-20 border-4 border-background shadow-md">
            <AvatarImage
              src={user.avatarUrl ?? undefined}
              alt={user.displayName || user.username}
            />
            <AvatarFallback className="text-2xl">
              {(user.displayName || user.username || 'U').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Chào mừng trở lại, {user.displayName}!
            </h1>
            <p className="text-muted-foreground mt-1">Tiếp tục hành trình học tập của bạn.</p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link to={ROUTES.PROFILE} className="flex items-center gap-2">
            <User size={16} />
            Hồ sơ của tôi
          </Link>
        </Button>
      </div>

      <SectionHeader
        title="Khóa học đang học"
        description="Danh sách các khóa học bạn đã đăng ký."
        action={
          <Button asChild>
            <Link to={ROUTES.COURSES}>Khám phá thêm khóa học</Link>
          </Button>
        }
      />

      {loading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {error && <ErrorState message={error} onRetry={fetchData} />}

      {!loading && !error && courses.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title="Chưa có khóa học nào"
          description="Bạn chưa đăng ký khóa học nào. Hãy khám phá và bắt đầu học ngay!"
          action={
            <Button asChild>
              <Link to={ROUTES.COURSES}>Khám phá khóa học</Link>
            </Button>
          }
        />
      )}

      {!loading && !error && courses.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card
              key={course.id}
              className="flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              <div className="aspect-video overflow-hidden bg-muted relative">
                {course.thumbnailUrl ? (
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <BookOpen size={32} className="text-muted-foreground" />
                  </div>
                )}
              </div>
              <CardContent className="p-5 flex-1 flex flex-col">
                <h3 className="font-semibold text-lg line-clamp-2 mb-2 flex-1 text-foreground">
                  {course.title}
                </h3>

                {course.progress && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        Hoàn thành {course.progress.completedLessons}/{course.progress.totalLessons}{' '}
                        bài
                      </span>
                      <span className="font-medium text-primary">
                        {Math.round(course.progress.percent)}%
                      </span>
                    </div>
                    <Progress value={course.progress.percent} className="h-2" />
                  </div>
                )}

                <Button
                  className="w-full mt-6"
                  onClick={() => navigate(ROUTES.CLASSROOM(course.id))}
                >
                  {course.progress && course.progress.percent > 0 ? 'Tiếp tục học' : 'Bắt đầu học'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
};
