import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import type { Course, CourseVisibility } from '@/entities/Course';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Save, Trash2, Loader2, CheckCircle2 } from 'lucide-react';
import { GocTriThuc } from '@/components/GocTriThuc';

/**
 * Sanitizes a user-provided URL string.
 * Returns the normalized URL if it uses http/https, or empty string otherwise.
 * This breaks the CodeQL taint chain by returning a newly constructed string.
 */
function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
    return '';
  } catch {
    return '';
  }
}

export function StudioCourseEditorPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [visibility, setVisibility] = useState<CourseVisibility>('Private');
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    async function fetchCourse() {
      try {
        const res = await axios.get<Course>(`/api/courses/${courseId}`);
        const data = res.data;
        setCourse(data);
        setTitle(data.title);
        setDescription(data.description);
        setThumbnailUrl(data.thumbnailUrl || '');
        setVisibility(data.visibility);
        setIsPublished(data.isPublished);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    fetchCourse();
  }, [courseId]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await axios.put<Course>(`/api/courses/${courseId}`, {
        title,
        description,
        thumbnailUrl: thumbnailUrl || null,
        visibility,
        isPublished,
      });
      setCourse(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Failed to save course:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await axios.delete(`/api/courses/${courseId}`);
      navigate('/studio/courses', { replace: true });
    } catch (err) {
      console.error('Failed to delete course:', err);
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f7fa]">
        <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
          <div className="container mx-auto flex h-16 items-center px-4 md:px-8">
            <Skeleton className="h-5 w-32" />
          </div>
        </header>
        <main className="container mx-auto px-4 md:px-8 py-8 max-w-3xl space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-48" />
        </main>
      </div>
    );
  }

  if (notFound || !course) {
    return (
      <div className="min-h-screen bg-[#f7f7fa] flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">404</h1>
          <p className="text-muted-foreground text-lg">Không tìm thấy khóa học.</p>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => navigate('/studio/courses')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại
          </Button>
        </div>
      </div>
    );
  }

  const hasChanges =
    title !== course.title ||
    description !== course.description ||
    (thumbnailUrl || '') !== (course.thumbnailUrl || '') ||
    visibility !== course.visibility ||
    isPublished !== course.isPublished;

  return (
    <div className="min-h-screen bg-[#f7f7fa] font-sans text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground"
            onClick={() => navigate('/studio/courses')}
          >
            <ArrowLeft className="h-4 w-4" />
            <GocTriThuc className="text-base font-semibold" />
          </Button>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Xóa</span>
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="rounded-full h-9 px-5 text-sm shadow-sm gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : saved ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saved ? 'Đã lưu' : 'Lưu thay đổi'}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-8 py-8 md:py-12 max-w-3xl">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Chỉnh sửa khóa học
          </h2>
          <p className="text-muted-foreground mt-1">Cập nhật thông tin cho khóa học của bạn.</p>
        </div>

        <div className="space-y-6">
          {/* Title */}
          <Card className="bg-white border-border/50 rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">
                  Tiêu đề khóa học
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nhập tiêu đề khóa học..."
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Mô tả
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả ngắn gọn về khóa học..."
                  rows={4}
                  className="rounded-xl resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="thumbnail" className="text-sm font-medium">
                  URL ảnh bìa
                </Label>
                <Input
                  id="thumbnail"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="h-11 rounded-xl"
                />
                {(() => {
                  const safeSrc = sanitizeUrl(thumbnailUrl);
                  if (!safeSrc) return null;
                  return (
                    <div className="mt-3 rounded-xl overflow-hidden border border-border/50 aspect-video max-w-sm">
                      <img
                        src={safeSrc}
                        alt="Preview"
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Visibility & Publish */}
          <Card className="bg-white border-border/50 rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Hiển thị & Xuất bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="visibility" className="text-sm font-medium">
                  Chế độ hiển thị
                </Label>
                <Select
                  value={visibility}
                  onValueChange={(v) => setVisibility(v as CourseVisibility)}
                >
                  <SelectTrigger id="visibility" className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Public">🌐 Công khai</SelectItem>
                    <SelectItem value="Restricted">🔒 Hạn chế</SelectItem>
                    <SelectItem value="Private">🔐 Riêng tư</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {visibility === 'Public' && 'Mọi người đều có thể xem khóa học này.'}
                  {visibility === 'Restricted' && 'Chỉ người được phê duyệt mới xem được.'}
                  {visibility === 'Private' && 'Chỉ bạn mới xem được khóa học này.'}
                </p>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border/50 p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="published" className="text-sm font-medium cursor-pointer">
                    Xuất bản khóa học
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Khi xuất bản, khóa học sẽ hiển thị theo chế độ hiển thị đã chọn.
                  </p>
                </div>
                <Switch id="published" checked={isPublished} onCheckedChange={setIsPublished} />
              </div>
            </CardContent>
          </Card>

          {/* Save Button (mobile-friendly) */}
          <div className="flex justify-end pt-2 pb-8">
            <Button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="rounded-full h-12 px-8 text-base shadow-md hover:shadow-lg transition-all gap-2"
            >
              {saving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : saved ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              {saved ? 'Đã lưu thành công!' : 'Lưu thay đổi'}
            </Button>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Xóa khóa học</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa khóa học{' '}
              <span className="font-semibold text-foreground">"{course.title}"</span> không? Tất cả
              nội dung sẽ bị mất và không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
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
              Xóa vĩnh viễn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
