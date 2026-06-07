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
  const [visibility, setVisibility] = useState<'public' | 'restricted' | 'private'>('public');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = async () => {
    setLoading(true);
    setErrors({});
    try {
      const res = await api.post<CourseDto>('/api/courses', {
        title,
        description,
        visibility,
      });
      onCreated(res.data);
      onClose();
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
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo khóa học mới</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="course-title">Tên khóa học *</Label>
            <Input id="course-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title}</p>}
          </div>
          <div>
            <Label htmlFor="course-desc">Mô tả *</Label>
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
          <div>
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
          <Button variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button id="btn-submit-create-course" onClick={submit} disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
            Tạo khóa học
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
