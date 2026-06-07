import { useState } from 'react';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
import type { ModuleDto } from '@/types';
import { ArrowDown, ArrowUp, Edit, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { LessonList } from './LessonList';
import { CreateLessonDialog } from './CreateLessonDialog';
import { EditModuleDialog } from './EditModuleDialog';

interface ModuleItemProps {
  module: ModuleDto;
  isFirst: boolean;
  isLast: boolean;
  onModulesChange: () => void;
  onModuleReorder: (direction: 'up' | 'down') => void;
  onLessonReorder: (lessonId: string, direction: 'up' | 'down') => void;
}

export function ModuleItem({
  module,
  isFirst,
  isLast,
  onModulesChange,
  onModuleReorder,
  onLessonReorder,
}: ModuleItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddLessonOpen, setIsAddLessonOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditModuleOpen, setIsEditModuleOpen] = useState(false);

  const handleDeleteConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDeleting(true);
    try {
      await api.delete(`/api/modules/${module.id}`);
      toast.success('Xóa học phần thành công');
      onModulesChange();
      setIsDeleteDialogOpen(false);
    } catch {
      toast.error('Có lỗi xảy ra khi xóa học phần');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <AccordionItem value={module.id} className="border bg-card rounded-lg px-4 shadow-sm">
        <div className="flex items-center justify-between">
          <AccordionTrigger className="hover:no-underline flex-1">
            <div className="flex items-center gap-2 text-left">
              <span className="font-semibold text-lg">{module.title}</span>
              <span className="text-sm text-muted-foreground font-normal ml-2">
                ({module.lessons.length} bài học)
              </span>
            </div>
          </AccordionTrigger>

          <div className="flex items-center gap-1 ml-4 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onModuleReorder('up');
              }}
              disabled={isFirst}
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onModuleReorder('down');
              }}
              disabled={isLast}
            >
              <ArrowDown className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditModuleOpen(true);
              }}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                setIsDeleteDialogOpen(true);
              }}
              disabled={isDeleting}
            >
              <Trash2 className="w-4 h-4" />
            </Button>

            <div className="w-px h-6 bg-border mx-2" />

            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsAddLessonOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Bài học
            </Button>
          </div>
        </div>

        <AccordionContent className="pt-2 pb-4">
          <LessonList
            lessons={module.lessons}
            onModulesChange={onModulesChange}
            onLessonReorder={onLessonReorder}
          />
        </AccordionContent>

        <CreateLessonDialog
          moduleId={module.id}
          open={isAddLessonOpen}
          onOpenChange={setIsAddLessonOpen}
          onSuccess={onModulesChange}
        />

        <EditModuleDialog
          key={isEditModuleOpen && module ? module.id : 'closed'}
          module={module}
          open={isEditModuleOpen}
          onOpenChange={setIsEditModuleOpen}
          onSuccess={onModulesChange}
        />
      </AccordionItem>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa học phần?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Bạn sắp xóa học phần{' '}
                  <span className="font-semibold text-foreground">"{module.title}"</span> và tất cả{' '}
                  {module.lessons.length} bài học bên trong.
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
