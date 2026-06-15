import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { CourseDto, ApiError } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ThumbnailUpload } from '@/pages/courses/_components/ThumbnailUpload';

export function EditCourseModal({
  course,
  open,
  onClose,
  onUpdated,
}: {
  course: CourseDto | null;
  open: boolean;
  onClose: () => void;
  onUpdated: (course: CourseDto) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<'public' | 'restricted' | 'private'>('public');
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (course && open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle(course.title);
      setDescription(course.description);
      setThumbnailUrl(course.thumbnailUrl);
      setVisibility(course.visibility);
      setIsPublished(course.isPublished);
      setErrors({});
    }
  }, [course, open]);

  const submit = async () => {
    if (!course) return;
    setLoading(true);
    setErrors({});
    try {
      const res = await api.patch<CourseDto>(`/api/courses/${course.id}`, {
        title,
        description,
        visibility,
        thumbnailUrl,
        isPublished,
      });
      onUpdated(res.data);
      onClose();
      toast.success('Cập nhật khóa học thành công!');
    } catch (err: unknown) {
      const error = err as { response?: { data?: ApiError } };
      if (error?.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        toast.error('Cập nhật khóa học thất bại. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!course) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cài đặt khóa học</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-course-title">Tên khóa học *</Label>
            <Input
              id="edit-course-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Ảnh bìa (Thumbnail)</Label>
            <div className="mt-1">
              <ThumbnailUpload value={thumbnailUrl} onChange={setThumbnailUrl} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-course-desc">Mô tả *</Label>
            <Textarea
              id="edit-course-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-destructive">{errors.description}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-course-visibility">Quyền truy cập</Label>
            <Select
              value={visibility}
              onValueChange={(v) => setVisibility(v as 'public' | 'restricted' | 'private')}
            >
              <SelectTrigger id="edit-course-visibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Công khai — ai cũng có thể đăng ký</SelectItem>
                <SelectItem value="restricted">Giới hạn — cần được duyệt</SelectItem>
                <SelectItem value="private">Riêng tư — chỉ bạn thấy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="edit-course-published" className="text-base font-medium">
                Xuất bản khóa học
              </Label>
              <p className="text-sm text-muted-foreground">
                Khóa học đã xuất bản sẽ hiển thị cho học viên.
              </p>
            </div>
            <Switch
              id="edit-course-published"
              checked={isPublished}
              onCheckedChange={setIsPublished}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button id="btn-submit-edit-course" onClick={submit} disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
