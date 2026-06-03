import { useState } from 'react';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import type { ModuleDto } from '@/types';
import { ArrowDown, ArrowUp, Edit, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { LessonList } from './LessonList';

import { CreateLessonDialog } from './CreateLessonDialog';

interface ModuleItemProps {
  module: ModuleDto;
  isFirst: boolean;
  isLast: boolean;
  onModulesChange: () => void;
}

export function ModuleItem({ module, isFirst, isLast, onModulesChange }: ModuleItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [isAddLessonOpen, setIsAddLessonOpen] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Bạn có chắc muốn xóa học phần "${module.title}"?`)) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/modules/${module.id}`);
      toast.success('Xóa học phần thành công');
      onModulesChange();
    } catch {
      toast.error('Có lỗi xảy ra khi xóa học phần');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReorder = async (e: React.MouseEvent, direction: 'up' | 'down') => {
    e.stopPropagation();
    if ((isFirst && direction === 'up') || (isLast && direction === 'down')) return;

    setIsReordering(true);
    try {
      await api.patch(`/api/modules/${module.id}/order`, { direction });
      onModulesChange();
    } catch {
      toast.error('Có lỗi xảy ra khi sắp xếp');
    } finally {
      setIsReordering(false);
    }
  };

  return (
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
            onClick={(e) => handleReorder(e, 'up')}
            disabled={isFirst || isReordering}
          >
            <ArrowUp className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => handleReorder(e, 'down')}
            disabled={isLast || isReordering}
          >
            <ArrowDown className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Open Edit Module Dialog
              toast.info('Tính năng đang phát triển');
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
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
        <LessonList lessons={module.lessons} onModulesChange={onModulesChange} />
      </AccordionContent>

      <CreateLessonDialog
        moduleId={module.id}
        open={isAddLessonOpen}
        onOpenChange={setIsAddLessonOpen}
        onSuccess={onModulesChange}
      />
    </AccordionItem>
  );
}
