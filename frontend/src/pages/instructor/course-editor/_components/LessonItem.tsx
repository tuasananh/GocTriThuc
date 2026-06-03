import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import type { LessonDto } from '@/types';
import { ArrowDown, ArrowUp, Edit, Trash2, Video, FileText, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';

interface LessonItemProps {
  lesson: LessonDto;
  isFirst: boolean;
  isLast: boolean;
  onModulesChange: () => void;
}

export function LessonItem({ lesson, isFirst, isLast, onModulesChange }: LessonItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Bạn có chắc muốn xóa bài học "${lesson.title}"?`)) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/lessons/${lesson.id}`);
      toast.success('Xóa bài học thành công');
      onModulesChange();
    } catch {
      toast.error('Có lỗi xảy ra khi xóa bài học');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReorder = async (direction: 'up' | 'down') => {
    if ((isFirst && direction === 'up') || (isLast && direction === 'down')) return;

    setIsReordering(true);
    try {
      await api.patch(`/api/lessons/${lesson.id}/order`, { direction });
      onModulesChange();
    } catch {
      toast.error('Có lỗi xảy ra khi sắp xếp');
    } finally {
      setIsReordering(false);
    }
  };

  const getLessonIcon = () => {
    switch (lesson.lessonType) {
      case 'video':
        return <Video className="w-4 h-4 text-blue-500" />;
      case 'blog':
        return <FileText className="w-4 h-4 text-emerald-500" />;
      case 'test':
        return <CheckSquare className="w-4 h-4 text-amber-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-background border rounded-md hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="flex flex-col opacity-40 hover:opacity-100 transition-opacity mr-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-5"
            onClick={() => handleReorder('up')}
            disabled={isFirst || isReordering}
          >
            <ArrowUp className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-5"
            onClick={() => handleReorder('down')}
            disabled={isLast || isReordering}
          >
            <ArrowDown className="w-3 h-3" />
          </Button>
        </div>
        {getLessonIcon()}
        <span className="font-medium text-sm">{lesson.title}</span>
      </div>

      <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link to={ROUTES.INSTRUCTOR_LESSON_EDITOR(lesson.id)}>
            <Edit className="w-4 h-4" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
