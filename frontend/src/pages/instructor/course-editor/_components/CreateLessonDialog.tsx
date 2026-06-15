import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { LessonType } from '@/types';

interface CreateLessonDialogProps {
  moduleId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateLessonDialog({
  moduleId,
  open,
  onOpenChange,
  onSuccess,
}: CreateLessonDialogProps) {
  const [title, setTitle] = useState('');
  const [lessonType, setLessonType] = useState<LessonType>('video');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !moduleId) return;

    setIsSubmitting(true);
    try {
      await api.post(`/api/modules/${moduleId}/lessons`, {
        title: title.trim(),
        type: lessonType,
      });
      toast.success('Thêm bài học thành công');
      onSuccess();
      onOpenChange(false);
      setTitle('');
      setLessonType('video');
    } catch {
      toast.error('Có lỗi xảy ra khi thêm bài học');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm bài học mới</DialogTitle>
          <DialogDescription>
            Tạo một bài học mới trong học phần này. Bạn có thể chọn loại bài học.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Tên bài học</Label>
            <Input
              id="title"
              placeholder="VD: Components và Props..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label>Loại bài học</Label>
            <Select
              value={lessonType}
              onValueChange={(val) => setLessonType(val as LessonType)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn loại bài học" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="blog">Bài viết (Blog)</SelectItem>
                <SelectItem value="test">Bài kiểm tra (Test)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={!title.trim() || isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : 'Thêm bài học'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
