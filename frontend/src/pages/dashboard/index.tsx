import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';
import { api } from '@/lib/api';
import type { PageResponse, CourseDto, CourseProgressDto, MyTestSessionDto } from '@/types';
import { PageShell } from '@/components/PageShell';
import { SectionHeader } from '@/components/SectionHeader';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { SkeletonCard } from '@/components/SkeletonCard';
import { BookOpen, User, Clock } from 'lucide-react';
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

  const [sessions, setSessions] = useState<MyTestSessionDto[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLoadingSessions(true);
    setSessionsError(null);

    const fetchCourses = async () => {
      try {
        const res = await api.get<PageResponse<CourseDto>>('/api/courses?enrolled=true');
        const coursesData = res.data.content;

        const progressPromises = coursesData.map(async (course) => {
          try {
            const progressRes = await api.get<CourseProgressDto>(
              `/api/courses/${course.id}/progress`,
            );
            return { ...course, progress: progressRes.data };
          } catch {
            return course;
          }
        });

        const coursesWithProgress = await Promise.all(progressPromises);
        setCourses(coursesWithProgress);
      } catch (err) {
        console.error('Failed to load courses', err);
        setError('Không thể tải danh sách khóa học của bạn.');
      } finally {
        setLoading(false);
      }
    };

    const fetchSessions = async () => {
      try {
        const res = await api.get<PageResponse<MyTestSessionDto>>('/api/tests/sessions/my');
        setSessions(res.data.content);
      } catch (err) {
        console.error('Failed to load test sessions', err);
        setSessionsError('Không thể tải lịch sử làm bài kiểm tra.');
      } finally {
        setLoadingSessions(false);
      }
    };

    await Promise.all([fetchCourses(), fetchSessions()]);
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

      {/* Lịch sử làm bài kiểm tra */}
      <div className="mt-12 pt-6 border-t">
        <SectionHeader
          title="Lịch sử kiểm tra trắc nghiệm"
          description="Kết quả các bài kiểm tra trắc nghiệm bạn đã tham gia làm bài."
        />

        {loadingSessions && (
          <div className="space-y-3 mt-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 w-full bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        )}

        {sessionsError && (
          <div className="mt-6">
            <ErrorState message={sessionsError} onRetry={fetchData} />
          </div>
        )}

        {!loadingSessions && !sessionsError && sessions.length === 0 && (
          <div className="mt-6">
            <EmptyState
              icon={Clock}
              title="Chưa có lượt thi nào"
              description="Lịch sử thi của bạn hiện tại đang trống."
            />
          </div>
        )}

        {!loadingSessions && !sessionsError && sessions.length > 0 && (
          <div className="mt-6 bg-card border rounded-xl overflow-hidden shadow-sm">
            <div className="divide-y">
              {sessions.map((session) => {
                const scorePercent = Math.round(session.score);
                const scoreColor =
                  scorePercent >= 80
                    ? 'text-green-600 dark:text-green-400'
                    : scorePercent >= 50
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-destructive';

                const formattedDate = new Date(session.submittedAt).toLocaleDateString('vi-VN', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={session.sessionId}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 hover:bg-muted/30 transition-colors gap-4"
                  >
                    <div className="space-y-1">
                      <h4 className="font-semibold text-base text-foreground leading-snug">
                        {session.testTitle}
                      </h4>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <span>{session.courseTitle}</span>
                        <span className="text-muted-foreground/30">•</span>
                        <span>{formattedDate}</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6">
                      <div className="text-left sm:text-right">
                        <div className="text-lg font-bold">
                          <span className={scoreColor}>{session.correctCount}</span>
                          <span className="text-sm text-muted-foreground font-normal">
                            /{session.totalQuestions} câu đúng
                          </span>
                        </div>
                        <div className={`text-xs font-semibold ${scoreColor}`}>
                          Đạt {scorePercent}%
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="shadow-sm hover:bg-accent"
                        onClick={() => navigate(ROUTES.TEST_RESULT(session.sessionId))}
                      >
                        Xem chi tiết
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
};
