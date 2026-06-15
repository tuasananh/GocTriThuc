import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { ROUTES } from '@/lib/routes';
import type { LessonDetailDto, LessonDto, ModuleDto, CommentDto, PageResponse, MyTestSessionDto } from '@/types';
import { PageShell } from '@/components/PageShell';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, PlayCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ErrorState } from '@/components/ErrorState';
import { VideoLessonViewer } from './_components/VideoLessonViewer';
import { BlogLessonViewer } from './_components/BlogLessonViewer';
import { LessonResourceList } from './_components/LessonResourceList';
import { CommentThread } from '@/components/CommentThread';
import { useAuth } from '@/contexts/AuthContext';

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
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null);

  const [comments, setComments] = useState<CommentDto[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const auth = useAuth();
  const currentUserId = auth && auth.isAuthenticated ? auth.user.id : undefined;

  const fetchLesson = useCallback(async () => {
    if (!courseId || !lessonId) return;
    setLoading(true);
    setError(null);
    setCompletedSessionId(null);
    try {
      const res = await api.get<LessonDetailDto>(`/api/lessons/${lessonId}`);
      setLesson(res.data);

      if (res.data.type === 'test' && res.data.completed) {
        try {
          const sessionsRes =
            await api.get<PageResponse<MyTestSessionDto>>('/api/tests/sessions/my');
          const matchingSession = sessionsRes.data.content.find((s) => s.testId === res.data.id);
          if (matchingSession) {
            setCompletedSessionId(matchingSession.sessionId);
          }
        } catch (err) {
          console.error('Failed to load completed test sessions', err);
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
            <div className="p-8 bg-muted/10 rounded-lg border flex flex-col items-center justify-center text-center space-y-6">
              <div className="max-w-md space-y-2">
                <h3 className="text-xl font-semibold">Bài kiểm tra</h3>
                {lesson.test?.statement && (
                  <p className="text-muted-foreground">{lesson.test.statement}</p>
                )}
                {lesson.test?.timeLimit && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-4">
                    <Clock className="w-4 h-4" />
                    <span>Thời gian làm bài: {Math.floor(lesson.test.timeLimit / 60)} phút</span>
                  </div>
                )}
              </div>
              {completedSessionId ? (
                <Button size="lg" asChild className="gap-2 mt-4" variant="outline">
                  <Link to={ROUTES.TEST_RESULT(completedSessionId)}>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    Xem kết quả bài làm
                  </Link>
                </Button>
              ) : lesson.test ? (
                <Button size="lg" asChild className="gap-2 mt-4">
                  <Link to={ROUTES.TEST_TAKE(lesson.id)}>
                    <PlayCircle className="w-5 h-5" />
                    Bắt đầu làm bài
                  </Link>
                </Button>
              ) : (
                <Button size="lg" disabled className="gap-2 mt-4">
                  <PlayCircle className="w-5 h-5" />
                  Bắt đầu làm bài (Chưa cấu hình)
                </Button>
              )}
            </div>
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
