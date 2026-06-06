import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  onReorder: (direction: 'up' | 'down') => void;
}

export function LessonItem({
  lesson,
  isFirst,
  isLast,
  onModulesChange,
  onReorder,
}: LessonItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDeleteConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDeleting(true);
    try {
      await api.delete(`/api/lessons/${lesson.id}`);
      toast.success('Xóa bài học thành công');
      onModulesChange();
      setIsDeleteDialogOpen(false);
    } catch {
      toast.error('Có lỗi xảy ra khi xóa bài học');
    } finally {
      setIsDeleting(false);
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
    <>
      <div className="flex items-center justify-between p-3 bg-background border rounded-md hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="flex flex-col opacity-40 hover:opacity-100 transition-opacity mr-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-5"
              onClick={() => onReorder('up')}
              disabled={isFirst}
            >
              <ArrowUp className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-5"
              onClick={() => onReorder('down')}
              disabled={isLast}
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
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={isDeleting}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa bài học?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Bạn sắp xóa bài học{' '}
                  <span className="font-semibold text-foreground">"{lesson.title}"</span> và toàn bộ
                  nội dung bên trong.
                </p>
                <p className="font-semibold text-destructive">
                  ⚠️ Hành động này không thể hoàn tác.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
