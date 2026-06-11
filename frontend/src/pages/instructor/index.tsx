import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { PageResponse, CourseDto, AccessRequestDto } from '@/types';
import { PageShell } from '@/components/PageShell';
import { SectionHeader } from '@/components/SectionHeader';
import { SkeletonCard } from '@/components/SkeletonCard';
import { ErrorState } from '@/components/ErrorState';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Database, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const InstructorDashboardPage = () => {
  const [courses, setCourses] = useState<CourseDto[]>([]);
  const [accessRequests, setAccessRequests] = useState<
    (AccessRequestDto & { courseTitle: string })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch authored courses
      const res = await api.get<PageResponse<CourseDto>>('/api/courses?own=true');
      const coursesData = res.data.content;
      setCourses(coursesData);

      // 2. Fetch access requests for all restricted courses
      const restrictedCourses = coursesData.filter((c) => c.visibility === 'restricted');

      const requestsPromises = restrictedCourses.map(async (course) => {
        try {
          const reqRes = await api.get<AccessRequestDto[]>(
            `/api/courses/${course.id}/access-requests`,
          );
          return reqRes.data.map((req) => ({ ...req, courseTitle: course.title }));
        } catch {
          return [];
        }
      });

      const allRequestsArrays = await Promise.all(requestsPromises);
      const allRequests = allRequestsArrays.flat();

      setAccessRequests(allRequests);
    } catch {
      setError('Không thể tải dữ liệu bảng điều khiển giảng viên.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const handleApprove = async (courseId: string, userId: string) => {
    try {
      await api.post(`/api/courses/${courseId}/access-requests/${userId}/approve`);
      toast.success('Đã phê duyệt yêu cầu.');
      setAccessRequests((prev) =>
        prev.filter((r) => !(r.courseId === courseId && r.userId === userId)),
      );
    } catch {
      toast.error('Lỗi khi phê duyệt.');
    }
  };

  const handleReject = async (courseId: string, userId: string) => {
    try {
      await api.delete(`/api/courses/${courseId}/access-requests/${userId}`);
      toast.success('Đã từ chối yêu cầu.');
      setAccessRequests((prev) =>
        prev.filter((r) => !(r.courseId === courseId && r.userId === userId)),
      );
    } catch {
      toast.error('Lỗi khi từ chối.');
    }
  };

  return (
    <PageShell>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bảng điều khiển Giảng viên</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý khóa học, bài kiểm tra và yêu cầu tham gia.
          </p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" asChild>
            <Link to={ROUTES.QUESTION_BANK} className="flex items-center gap-2">
              <Database size={16} />
              Ngân hàng câu hỏi
            </Link>
          </Button>
          <Button asChild>
            <Link to={ROUTES.COURSES} className="flex items-center gap-2">
              Tạo khóa học mới
            </Link>
          </Button>
        </div>
      </div>

      {loading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {error && <ErrorState message={error} onRetry={fetchData} />}

      {!loading && !error && (
        <div className="space-y-12">
          {/* Yêu cầu truy cập (chỉ hiện nếu có) */}
          {accessRequests.length > 0 && (
            <section>
              <SectionHeader
                title="Yêu cầu tham gia cần duyệt"
                description={`Bạn có ${accessRequests.length} yêu cầu đang chờ xử lý.`}
              />
              <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Học viên</TableHead>
                      <TableHead>Khóa học</TableHead>
                      <TableHead>Ngày yêu cầu</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accessRequests.map((req) => (
                      <TableRow key={`${req.courseId}-${req.userId}`}>
                        <TableCell className="font-medium">{req.userDisplayName}</TableCell>
                        <TableCell>{req.courseTitle}</TableCell>
                        <TableCell>
                          {new Date(req.requestedAt).toLocaleDateString('vi-VN')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                              onClick={() => handleApprove(req.courseId, req.userId)}
                            >
                              <Check size={16} className="mr-1" /> Duyệt
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive border-destructive/30 hover:bg-destructive/10"
                              onClick={() => handleReject(req.courseId, req.userId)}
                            >
                              <X size={16} className="mr-1" /> Từ chối
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>
          )}

          {/* Danh sách khóa học */}
          <section>
            <SectionHeader
              title="Khóa học của tôi"
              description="Quản lý các khóa học bạn đã tạo."
            />

            {courses.length === 0 ? (
              <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                <BookOpen size={48} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Bạn chưa tạo khóa học nào</h3>
                <p className="text-muted-foreground mt-1 mb-4">
                  Hãy bắt đầu chia sẻ kiến thức của bạn ngay hôm nay.
                </p>
              </div>
            ) : (
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
                      {!course.isPublished && (
                        <Badge
                          variant="secondary"
                          className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm"
                        >
                          Bản nháp
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-5 flex-1 flex flex-col">
                      <h3 className="font-semibold text-lg line-clamp-2 mb-2 text-foreground flex-1">
                        {course.title}
                      </h3>

                      <div className="flex items-center gap-2 mt-4 text-xs">
                        <Badge variant="outline">
                          {course.visibility === 'public'
                            ? 'Công khai'
                            : course.visibility === 'restricted'
                              ? 'Giới hạn'
                              : 'Riêng tư'}
                        </Badge>
                      </div>

                      <Button className="w-full mt-4" variant="secondary" asChild>
                        <Link to={ROUTES.INSTRUCTOR_COURSE_EDITOR(course.id)}>
                          Chỉnh sửa nội dung
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </PageShell>
  );
};
