import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { ROUTES } from '@/lib/routes';
import type {
  LessonDetailDto,
  LessonDto,
  ModuleDto,
  CommentDto,
  PageResponse,
  MyTestSessionDto,
  TestSessionDto,
  TestSessionSummaryDto,
  TestResultDto,
  CourseDto,
} from '@/types';
import { PageShell } from '@/components/PageShell';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  PlayCircle,
  Loader2,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { VideoLessonViewer } from './_components/VideoLessonViewer';
import { BlogLessonViewer } from './_components/BlogLessonViewer';
import { LessonResourceList } from './_components/LessonResourceList';
import { CommentThread } from '@/components/CommentThread';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/lib/permissions';

export function LessonPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();

  const [lesson, setLesson] = useState<LessonDetailDto | null>(null);
  const [prevLesson, setPrevLesson] = useState<LessonDto | null>(null);
  const [nextLesson, setNextLesson] = useState<LessonDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ type: 'not_found' | 'network'; message: string } | null>(
    null,
  );
  const [completing, setCompleting] = useState(false);
  const [pastAttempts, setPastAttempts] = useState<MyTestSessionDto[]>([]);
  const [activeSession, setActiveSession] = useState<TestSessionDto | null>(null);

  const [comments, setComments] = useState<CommentDto[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const auth = useAuth();
  const currentUserId = auth && auth.isAuthenticated ? auth.user.id : undefined;

  const isAdmin = useIsAdmin();
  const [course, setCourse] = useState<CourseDto | null>(null);
  const [sessions, setSessions] = useState<TestSessionSummaryDto[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionScores, setSessionScores] = useState<
    Record<string, { score: number; correctCount: number; totalQuestions: number }>
  >({});

  const isAuthor = Boolean(
    currentUserId && course?.author?.id && currentUserId === course.author.id,
  );
  const canViewResults = isAdmin || isAuthor;

  const maxAttempts =
    lesson?.test?.settings && typeof lesson.test.settings.maxAttempts === 'number'
      ? lesson.test.settings.maxAttempts
      : 1;

  const hasReachedLimit = maxAttempts > 0 && pastAttempts.length >= maxAttempts;

  const fetchLesson = useCallback(async () => {
    if (!courseId || !lessonId) return;
    setLoading(true);
    setError(null);
    setPastAttempts([]);
    setActiveSession(null);
    try {
      const res = await api.get<LessonDetailDto>(`/api/lessons/${lessonId}`);
      setLesson(res.data);

      try {
        const courseRes = await api.get<CourseDto>(`/api/courses/${courseId}`);
        setCourse(courseRes.data);
      } catch (err) {
        console.error('Failed to load course details', err);
      }

      if (res.data.type === 'test' && res.data.test) {
        try {
          const attemptsRes = await api.get<MyTestSessionDto[]>(
            `/api/tests/${res.data.id}/sessions/my`,
          );
          setPastAttempts(attemptsRes.data);
        } catch (err) {
          console.error('[LessonPage] Failed to load test attempts', err);
        }

        try {
          const activeRes = await api.get<TestSessionDto>(
            `/api/tests/${res.data.id}/sessions/active`,
          );
          setActiveSession(activeRes.data);
        } catch (err) {
          console.log('Failed to load active test session', err);
          setActiveSession(null);
        }
      }

      // Fetch all modules of this course to determine next/prev lessons
      const modulesRes = await api.get<ModuleDto[]>(`/api/courses/${courseId}/modules`);
      const sortedModules = modulesRes.data.sort((a, b) => a.order - b.order);
      sortedModules.forEach((m) => m.lessons.sort((a, b) => a.order - b.order));
      const allLessons = sortedModules.flatMap((m) => m.lessons);
      const currentIndex = allLessons.findIndex((l) => l.id === lessonId);

      if (currentIndex !== -1) {
        setPrevLesson(currentIndex > 0 ? allLessons[currentIndex - 1] : null);
        setNextLesson(currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null);
      } else {
        setPrevLesson(null);
        setNextLesson(null);
      }
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

  const fetchComments = useCallback(async () => {
    if (!lessonId) return;
    setLoadingComments(true);
    try {
      const res = await api.get<PageResponse<CommentDto>>(`/api/lessons/${lessonId}/comments`);
      setComments(res.data.content);
    } catch (err) {
      console.error('Failed to load comments', err);
    } finally {
      setLoadingComments(false);
    }
  }, [lessonId]);

  const fetchSessions = useCallback(async () => {
    if (!lessonId) return;
    setLoadingSessions(true);
    try {
      const res = await api.get<TestSessionSummaryDto[]>(`/api/tests/${lessonId}/sessions`);
      setSessions(res.data);

      // Fetch scores for completed sessions in parallel
      const doneSessions = res.data.filter((s) => s.isDone);
      const scorePromises = doneSessions.map(async (session) => {
        try {
          const detailRes = await api.get<TestResultDto>(
            `/api/sessions/${session.sessionId}/result`,
          );
          return {
            sessionId: session.sessionId,
            score: detailRes.data.score,
            correctCount: detailRes.data.correctCount,
            totalQuestions: detailRes.data.totalQuestions,
          };
        } catch (err) {
          console.error(`Failed to fetch score for session ${session.sessionId}`, err);
          return null;
        }
      });

      const results = await Promise.all(scorePromises);
      const scoresMap: Record<
        string,
        { score: number; correctCount: number; totalQuestions: number }
      > = {};
      results.forEach((r) => {
        if (r) {
          scoresMap[r.sessionId] = {
            score: r.score,
            correctCount: r.correctCount,
            totalQuestions: r.totalQuestions,
          };
        }
      });
      setSessionScores(scoresMap);
    } catch {
      toast.error('Không thể tải danh sách kết quả học sinh');
    } finally {
      setLoadingSessions(false);
    }
  }, [lessonId]);

  useEffect(() => {
    if (canViewResults && lesson?.type === 'test') {
      fetchSessions();
    }
  }, [canViewResults, lesson?.type, fetchSessions]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchLesson();
      fetchComments();
    }, 0);
    return () => clearTimeout(t);
  }, [fetchLesson, fetchComments]);

  const markAsCompleted = async () => {
    if (!lessonId) return;
    setCompleting(true);
    try {
      await api.post(`/api/lessons/${lessonId}/complete`);
      toast.success('Đã đánh dấu hoàn thành bài học!');
      // Update local state
      setLesson((prev) => (prev ? { ...prev, completed: true } : prev));
    } catch (err) {
      toast.error('Có lỗi xảy ra, không thể đánh dấu hoàn thành.');
      console.error(err);
    } finally {
      setCompleting(false);
    }
  };

  const handlePostComment = async (content: string) => {
    if (!lessonId) return;
    try {
      const res = await api.post<CommentDto>(`/api/lessons/${lessonId}/comments`, {
        content,
      });
      setComments((prev) => [res.data, ...prev]);
      toast.success('Đã gửi bình luận');
    } catch {
      toast.error('Không thể gửi bình luận. Vui lòng thử lại.');
    }
  };

  const handleReply = async (content: string, parentId: string) => {
    if (!lessonId) return;
    try {
      const res = await api.post<CommentDto>(`/api/lessons/${lessonId}/comments`, {
        content,
        parentId,
      });
      const addReply = (nodes: CommentDto[]): CommentDto[] => {
        return nodes.map((n) => {
          if (n.id === parentId) {
            return { ...n, replies: [res.data, ...(n.replies || [])] };
          }
          if (n.replies) {
            return { ...n, replies: addReply(n.replies) };
          }
          return n;
        });
      };
      setComments((prev) => addReply(prev));
      toast.success('Đã gửi phản hồi');
    } catch {
      toast.error('Không thể gửi phản hồi. Vui lòng thử lại.');
    }
  };

  const handleEdit = async (id: string, newContent: string) => {
    try {
      const res = await api.patch<CommentDto>(`/api/lessons/comments/${id}`, {
        content: newContent,
      });
      const updateNode = (nodes: CommentDto[]): CommentDto[] => {
        return nodes.map((n) => {
          if (n.id === id) {
            return {
              ...n,
              content: res.data.content,
              editedAt: res.data.editedAt,
              updatedAt: res.data.updatedAt,
            };
          }
          if (n.replies) {
            return { ...n, replies: updateNode(n.replies) };
          }
          return n;
        });
      };
      setComments((prev) => updateNode(prev));
      toast.success('Đã sửa bình luận');
    } catch {
      toast.error('Không thể cập nhật bình luận. Vui lòng thử lại.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/lessons/comments/${id}`);
      const removeNode = (nodes: CommentDto[]): CommentDto[] => {
        return nodes
          .filter((n) => n.id !== id)
          .map((n) => ({
            ...n,
            replies: n.replies ? removeNode(n.replies) : [],
          }));
      };
      setComments((prev) => removeNode(prev));
      toast.success('Đã xóa bình luận');
    } catch {
      toast.error('Không thể xóa bình luận. Vui lòng thử lại.');
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

          {lesson.completed ? (
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
            {lesson.type === 'video'
              ? 'Bài học Video'
              : lesson.type === 'blog'
                ? 'Bài học Bài viết'
                : 'Bài học Trắc nghiệm'}
          </p>
        </div>

        <div className="bg-card rounded-xl border p-4 shadow-sm">
          {lesson.type === 'video' && lesson.video ? (
            <VideoLessonViewer video={lesson.video} />
          ) : lesson.type === 'blog' ? (
            <BlogLessonViewer blog={lesson.blog ?? { content: '' }} />
          ) : lesson.type === 'test' ? (
            canViewResults ? (
              <Tabs defaultValue="results" className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="results">Kết quả học sinh</TabsTrigger>
                  <TabsTrigger value="preview">Xem trước & Làm thử</TabsTrigger>
                </TabsList>

                <TabsContent value="results">
                  <div className="bg-card rounded-lg border shadow-sm overflow-hidden text-left">
                    <div className="p-4 border-b bg-muted/50 flex items-center justify-between">
                      <h3 className="font-semibold text-lg">Danh sách học sinh làm bài</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchSessions}
                        disabled={loadingSessions}
                      >
                        Làm mới
                      </Button>
                    </div>

                    {loadingSessions ? (
                      <div className="p-8 text-center text-muted-foreground">
                        Đang tải dữ liệu...
                      </div>
                    ) : sessions.length === 0 ? (
                      <div className="p-12 text-center">
                        <EmptyState
                          title="Chưa có kết quả"
                          description="Chưa có học sinh nào làm bài kiểm tra này."
                        />
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Học viên</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead>Điểm số</TableHead>
                            <TableHead>Bắt đầu lúc</TableHead>
                            <TableHead>Nộp bài lúc</TableHead>
                            <TableHead className="text-right">Thao tác</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sessions.map((session) => (
                            <TableRow key={session.sessionId}>
                              <TableCell className="font-medium">{session.displayName}</TableCell>
                              <TableCell>
                                {session.isDone ? (
                                  <Badge
                                    variant="default"
                                    className="bg-green-500 hover:bg-green-600 text-white"
                                  >
                                    Đã nộp
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">Đang làm</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {session.isDone ? (
                                  sessionScores[session.sessionId] ? (
                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                      {sessionScores[session.sessionId].correctCount}/
                                      {sessionScores[session.sessionId].totalQuestions} (
                                      {Math.round(sessionScores[session.sessionId].score)}%)
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground animate-pulse">
                                      Đang tải...
                                    </span>
                                  )
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {new Date(session.startedAt).toLocaleString('vi-VN')}
                              </TableCell>
                              <TableCell>
                                {session.submittedAt
                                  ? new Date(session.submittedAt).toLocaleString('vi-VN')
                                  : '-'}
                              </TableCell>
                              <TableCell className="text-right">
                                {session.isDone && (
                                  <Button size="sm" variant="ghost" asChild>
                                    <Link
                                      to={ROUTES.TEST_RESULT(session.sessionId)}
                                      target="_blank"
                                      className="flex items-center gap-2"
                                    >
                                      <Eye size={16} /> Chi tiết
                                    </Link>
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="space-y-6">
                  <div className="p-8 bg-muted/10 rounded-lg border flex flex-col items-center justify-center text-center space-y-6">
                    <div className="max-w-md space-y-2">
                      <h3 className="text-xl font-semibold">Bài kiểm tra (Chế độ giảng viên)</h3>
                      {lesson.test?.statement && (
                        <p className="text-muted-foreground">{lesson.test.statement}</p>
                      )}
                      {lesson.test?.timeLimit && (
                        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground mt-4">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>
                              Thời gian làm bài: {Math.floor(lesson.test.timeLimit / 60)} phút
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <PlayCircle className="w-4 h-4" />
                            <span>
                              Lượt làm bài:{' '}
                              {maxAttempts === 0
                                ? 'Không giới hạn'
                                : `${pastAttempts.length} / ${maxAttempts}`}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="w-full max-w-lg space-y-6">
                      {/* Active Session Display */}
                      {activeSession && (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-5 text-left space-y-4 shadow-sm">
                          <div className="flex items-start gap-3">
                            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <h4 className="font-semibold text-amber-900 dark:text-amber-400 text-sm">
                                Bạn đang có một phiên làm bài chưa hoàn thành
                              </h4>
                              <p className="text-xs text-amber-700 dark:text-amber-500">
                                Bắt đầu lúc:{' '}
                                {new Date(activeSession.startedAt).toLocaleDateString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            className="w-full bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white gap-2 font-medium"
                            asChild
                          >
                            <Link to={ROUTES.TEST_TAKE(lesson.id)}>
                              <PlayCircle className="w-4 h-4" />
                              Tiếp tục làm bài
                            </Link>
                          </Button>
                        </div>
                      )}

                      {/* Show start/retry button or limit message if there is no active session */}
                      {!activeSession && (
                        <>
                          {hasReachedLimit ? (
                            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 flex items-center gap-3 justify-center">
                              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                              <span className="text-emerald-700 dark:text-emerald-400 font-medium text-sm">
                                Bạn đã sử dụng hết số lượt làm bài cho phép ({pastAttempts.length}/
                                {maxAttempts} lượt)
                              </span>
                            </div>
                          ) : lesson.test ? (
                            <Button size="lg" asChild className="gap-2 mt-4">
                              <Link to={ROUTES.TEST_TAKE(lesson.id)}>
                                <PlayCircle className="w-5 h-5" />
                                {pastAttempts.length > 0 ? 'Làm bài lại' : 'Bắt đầu làm bài'}
                              </Link>
                            </Button>
                          ) : (
                            <Button size="lg" disabled className="gap-2 mt-4">
                              <PlayCircle className="w-5 h-5" />
                              Bắt đầu làm bài (Chưa cấu hình)
                            </Button>
                          )}
                        </>
                      )}

                      {/* Past Attempts History */}
                      {pastAttempts.length > 0 && (
                        <div className="text-left space-y-2">
                          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            Lịch sử làm bài của bạn ({pastAttempts.length} lần)
                          </p>
                          <div className="space-y-2">
                            {pastAttempts.map((attempt, idx) => {
                              const pct = Math.round(attempt.score);
                              const scoreColor =
                                pct >= 80
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : pct >= 50
                                    ? 'text-yellow-600 dark:text-yellow-400'
                                    : 'text-destructive';
                              const submittedDate = new Date(
                                attempt.submittedAt,
                              ).toLocaleDateString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              });
                              return (
                                <div
                                  key={attempt.sessionId}
                                  className="flex items-center justify-between p-3 rounded-lg border bg-background hover:bg-muted/30 transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs text-muted-foreground w-6 text-center font-mono">
                                      #{idx + 1}
                                    </span>
                                    <div className="text-left">
                                      <div className={`font-semibold text-sm ${scoreColor}`}>
                                        {attempt.correctCount}/{attempt.totalQuestions} câu đúng
                                        <span className="ml-1 font-normal text-xs">({pct}%)</span>
                                      </div>
                                      <div className="text-xs text-muted-foreground mt-0.5">
                                        {submittedDate}
                                      </div>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    asChild
                                    className="gap-1.5 text-xs"
                                  >
                                    <Link to={ROUTES.TEST_RESULT(attempt.sessionId)}>
                                      <ExternalLink className="w-3.5 h-3.5" />
                                      Xem kết quả
                                    </Link>
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="p-8 bg-muted/10 rounded-lg border flex flex-col items-center justify-center text-center space-y-6">
                <div className="max-w-md space-y-2">
                  <h3 className="text-xl font-semibold">Bài kiểm tra</h3>
                  {lesson.test?.statement && (
                    <p className="text-muted-foreground">{lesson.test.statement}</p>
                  )}
                  {lesson.test?.timeLimit && (
                    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground mt-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          Thời gian làm bài: {Math.floor(lesson.test.timeLimit / 60)} phút
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <PlayCircle className="w-4 h-4" />
                        <span>
                          Lượt làm bài:{' '}
                          {maxAttempts === 0
                            ? 'Không giới hạn'
                            : `${pastAttempts.length} / ${maxAttempts}`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="w-full max-w-lg space-y-6">
                  {/* Active Session Display */}
                  {activeSession && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-5 text-left space-y-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <h4 className="font-semibold text-amber-900 dark:text-amber-400 text-sm">
                            Bạn đang có một phiên làm bài chưa hoàn thành
                          </h4>
                          <p className="text-xs text-amber-700 dark:text-amber-500">
                            Bắt đầu lúc:{' '}
                            {new Date(activeSession.startedAt).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="w-full bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white gap-2 font-medium"
                        asChild
                      >
                        <Link to={ROUTES.TEST_TAKE(lesson.id)}>
                          <PlayCircle className="w-4 h-4" />
                          Tiếp tục làm bài
                        </Link>
                      </Button>
                    </div>
                  )}

                  {/* Show start/retry button or limit message if there is no active session */}
                  {!activeSession && (
                    <>
                      {hasReachedLimit ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 flex items-center gap-3 justify-center">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                          <span className="text-emerald-700 dark:text-emerald-400 font-medium text-sm">
                            Bạn đã sử dụng hết số lượt làm bài cho phép ({pastAttempts.length}/
                            {maxAttempts} lượt)
                          </span>
                        </div>
                      ) : lesson.test ? (
                        <Button size="lg" asChild className="gap-2 mt-4">
                          <Link to={ROUTES.TEST_TAKE(lesson.id)}>
                            <PlayCircle className="w-5 h-5" />
                            {pastAttempts.length > 0 ? 'Làm bài lại' : 'Bắt đầu làm bài'}
                          </Link>
                        </Button>
                      ) : (
                        <Button size="lg" disabled className="gap-2 mt-4">
                          <PlayCircle className="w-5 h-5" />
                          Bắt đầu làm bài (Chưa cấu hình)
                        </Button>
                      )}
                    </>
                  )}

                  {/* Past Attempts History */}
                  {pastAttempts.length > 0 && (
                    <div className="text-left space-y-2">
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Lịch sử làm bài ({pastAttempts.length} lần)
                      </p>
                      <div className="space-y-2">
                        {pastAttempts.map((attempt, idx) => {
                          const pct = Math.round(attempt.score);
                          const scoreColor =
                            pct >= 80
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : pct >= 50
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-destructive';
                          const submittedDate = new Date(attempt.submittedAt).toLocaleDateString(
                            'vi-VN',
                            {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            },
                          );
                          return (
                            <div
                              key={attempt.sessionId}
                              className="flex items-center justify-between p-3 rounded-lg border bg-background hover:bg-muted/30 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-muted-foreground w-6 text-center font-mono">
                                  #{idx + 1}
                                </span>
                                <div className="text-left">
                                  <div className={`font-semibold text-sm ${scoreColor}`}>
                                    {attempt.correctCount}/{attempt.totalQuestions} câu đúng
                                    <span className="ml-1 font-normal text-xs">({pct}%)</span>
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    {submittedDate}
                                  </div>
                                </div>
                              </div>
                              <Button size="sm" variant="ghost" asChild className="gap-1.5 text-xs">
                                <Link to={ROUTES.TEST_RESULT(attempt.sessionId)}>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  Xem kết quả
                                </Link>
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          ) : (
            <div className="p-8 text-center text-muted-foreground bg-muted/20 rounded-lg">
              <p>Nội dung bài học chưa được cập nhật.</p>
            </div>
          )}
        </div>

        {lesson.resources && <LessonResourceList resources={lesson.resources} />}

        {/* Navigation Buttons */}
        {(prevLesson || nextLesson) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-border mt-8">
            {prevLesson ? (
              <Button
                variant="outline"
                asChild
                className="h-auto p-4 flex flex-col items-start gap-1.5 text-left rounded-xl transition-all hover:bg-muted/50 hover:border-primary/50 group w-full"
              >
                <Link to={ROUTES.LESSON(courseId!, prevLesson.id)}>
                  <span className="text-xs text-muted-foreground flex items-center gap-1 group-hover:text-primary transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Bài trước
                  </span>
                  <span className="font-semibold text-sm line-clamp-1 text-foreground">
                    {prevLesson.title}
                  </span>
                </Link>
              </Button>
            ) : (
              <div className="hidden sm:block" />
            )}

            {nextLesson && (
              <Button
                variant="outline"
                asChild
                className="h-auto p-4 flex flex-col items-end gap-1.5 text-right rounded-xl transition-all hover:bg-muted/50 hover:border-primary/50 group w-full sm:col-start-2"
              >
                <Link to={ROUTES.LESSON(courseId!, nextLesson.id)}>
                  <span className="text-xs text-muted-foreground flex items-center gap-1 group-hover:text-primary transition-colors">
                    Bài tiếp theo
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                  <span className="font-semibold text-sm line-clamp-1 text-foreground">
                    {nextLesson.title}
                  </span>
                </Link>
              </Button>
            )}
          </div>
        )}

        {/* Comments Section */}
        <div className="bg-card rounded-xl border p-6 shadow-sm mt-8">
          <h3 className="text-xl font-bold mb-6">Thảo luận bài học</h3>
          {loadingComments ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <CommentThread
              comments={comments}
              currentUserId={currentUserId}
              contextType="lesson"
              contextId={lessonId!}
              onPostComment={handlePostComment}
              onReply={handleReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>
    </PageShell>
  );
}
