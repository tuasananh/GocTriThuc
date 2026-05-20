import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { Course } from '@/entities/Course';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  Trash2,
  BookOpen,
  Globe,
  Lock,
  ShieldAlert,
  Clock,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { GocTriThuc } from '@/components/GocTriThuc';

const visibilityConfig = {
  Public: { label: 'Công khai', icon: Globe, variant: 'default' as const },
  Restricted: { label: 'Hạn chế', icon: ShieldAlert, variant: 'secondary' as const },
  Private: { label: 'Riêng tư', icon: Lock, variant: 'outline' as const },
};

export function StudioCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await axios.get<Course[]>('/api/courses/own');
        setCourses(res.data);
      } catch (err) {
        console.error('Failed to fetch courses:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, []);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await axios.post<Course>('/api/courses');
      navigate(`/studio/course/${res.data.id}`);
    } catch (err) {
      console.error('Failed to create course:', err);
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/courses/${deleteTarget.id}`);
      setCourses((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error('Failed to delete course:', err);
    } finally {
      setDeleting(false);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  return (
    <div className="min-h-screen bg-[#f7f7fa] font-sans text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-4 w-4" />
              <GocTriThuc className="text-base font-semibold" />
            </Button>
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Studio</h1>
          <div className="w-24" />
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-8 py-8 md:py-12 max-w-5xl">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="space-y-1">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Khóa học của tôi
            </h2>
            <p className="text-muted-foreground">Quản lý và chỉnh sửa các khóa học bạn đã tạo.</p>
          </div>
          <Button
            onClick={handleCreate}
            disabled={creating}
            className="rounded-full h-11 px-6 text-sm shadow-md hover:shadow-lg transition-all gap-2"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Tạo khóa học mới
          </Button>
        </div>

        {/* Course List */}
        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 p-4">
                <Skeleton className="h-24 w-36 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <Card className="border-dashed border-2 border-border/60 bg-white/50 rounded-2xl">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="rounded-full bg-primary/5 p-5">
                <BookOpen className="h-10 w-10 text-primary/40" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-lg font-medium text-foreground">Chưa có khóa học nào</p>
                <p className="text-muted-foreground">Tạo khóa học đầu tiên của bạn để bắt đầu.</p>
              </div>
              <Button
                onClick={handleCreate}
                disabled={creating}
                className="rounded-full mt-2 gap-2"
              >
                <Plus className="h-4 w-4" /> Tạo khóa học mới
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {courses.map((course) => {
              const vis = visibilityConfig[course.visibility];
              const VisIcon = vis.icon;
              return (
                <Card
                  key={course.id}
                  className="group overflow-hidden bg-white border-border/50 shadow-sm hover:shadow-md hover:border-black/10 transition-all rounded-2xl cursor-pointer"
                  onClick={() => navigate(`/studio/course/${course.id}`)}
                >
                  <CardContent className="flex flex-col sm:flex-row gap-4 p-4 md:p-5">
                    {/* Thumbnail */}
                    <div className="relative w-full sm:w-40 h-28 sm:h-24 rounded-xl overflow-hidden bg-muted shrink-0">
                      {course.thumbnailUrl ? (
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors truncate">
                          {course.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {course.description || 'Chưa có mô tả'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 mt-3">
                        <Badge variant={vis.variant} className="gap-1 text-xs">
                          <VisIcon className="h-3 w-3" />
                          {vis.label}
                        </Badge>
                        <Badge
                          variant={course.isPublished ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {course.isPublished ? 'Đã xuất bản' : 'Bản nháp'}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                          <Clock className="h-3 w-3" />
                          {formatDate(course.updatedAt)}
                        </span>
                      </div>
                    </div>

                    {/* Delete Button */}
                    <div className="flex items-center shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive transition-colors h-9 w-9 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(course);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Xóa khóa học</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa khóa học{' '}
              <span className="font-semibold text-foreground">"{deleteTarget?.title}"</span> không?
              Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              className="rounded-full"
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-full gap-2"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Xóa khóa học
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
