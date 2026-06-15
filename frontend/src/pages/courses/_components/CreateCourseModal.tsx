import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { CourseDto, ApiError } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { ThumbnailUpload } from './ThumbnailUpload';

export function CreateCourseModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (course: CourseDto) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<'public' | 'restricted' | 'private'>('private');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setThumbnailUrl(null);
    setVisibility('private');
    setLoading(false);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const submit = async () => {
    // Client-side validation
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Tên khóa học không được để trống';
    if (title.length > 200) newErrors.title = 'Tên khóa học tối đa 200 ký tự';
    if (description.length > 10000) newErrors.description = 'Mô tả tối đa 10.000 ký tự';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      const res = await api.post<CourseDto>('/api/courses', {
        title: title.trim(),
        description: description.trim() || undefined,
        visibility,
        thumbnailUrl,
      });
      resetForm();
      onCreated(res.data);
      toast.success('Tạo khóa học thành công!');
    } catch (err: unknown) {
      const error = err as { response?: { data?: ApiError } };
      if (error?.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        toast.error('Tạo khóa học thất bại. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo khóa học mới</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="course-title">Tên khóa học *</Label>
            <Input id="course-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Ảnh bìa (Thumbnail)</Label>
            <div className="mt-1">
              <ThumbnailUpload value={thumbnailUrl} onChange={setThumbnailUrl} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="course-desc">Mô tả</Label>
            <Textarea
              id="course-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-destructive">{errors.description}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="course-visibility">Chế độ hiển thị</Label>
            <Select
              value={visibility}
              onValueChange={(v) => setVisibility(v as 'public' | 'restricted' | 'private')}
            >
              <SelectTrigger id="course-visibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Công khai — ai cũng có thể đăng ký</SelectItem>
                <SelectItem value="restricted">Giới hạn — cần được duyệt</SelectItem>
                <SelectItem value="private">Riêng tư — chỉ bạn thấy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={handleClose}>
            Hủy
          </Button>
          <Button
            id="btn-submit-create-course"
            onClick={submit}
            disabled={loading || !title.trim()}
          >
            {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
            Tạo khóa học
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
