import { useState, useCallback } from 'react';
import { Accordion } from '@/components/ui/accordion';
import type { ModuleDto } from '@/types';
import { ModuleItem } from './ModuleItem';
import { EmptyState } from '@/components/EmptyState';
import { Book } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface ModuleListProps {
  modules: ModuleDto[];
  onModulesChange: () => void;
}

/**
 * Optimistic reorder state — stores pending swap overrides keyed by
 * a stringified swap descriptor. When empty, the component renders
 * modules exactly as received from props.
 */
interface OptimisticSwap {
  type: 'module' | 'lesson';
  modules: ModuleDto[];
}

export function ModuleList({ modules: propModules, onModulesChange }: ModuleListProps) {
  const [optimistic, setOptimistic] = useState<OptimisticSwap | null>(null);

  // Use optimistic state while a swap is in-flight, otherwise use props
  const modules = optimistic?.modules ?? propModules;

  const handleModuleReorder = useCallback(
    async (moduleId: string, direction: 'up' | 'down') => {
      const source = propModules;
      const currentIndex = source.findIndex((m) => m.id === moduleId);
      if (currentIndex === -1) return;

      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= source.length) return;

      // ── Optimistic swap ──
      const swapped = [...source];
      const tempOrder = swapped[currentIndex].order;
      swapped[currentIndex] = { ...swapped[currentIndex], order: swapped[targetIndex].order };
      swapped[targetIndex] = { ...swapped[targetIndex], order: tempOrder };
      [swapped[currentIndex], swapped[targetIndex]] = [swapped[targetIndex], swapped[currentIndex]];
      setOptimistic({ type: 'module', modules: swapped });

      try {
        await api.patch(`/api/modules/${moduleId}/order`, { direction });
        onModulesChange(); // Refetch from server to get canonical order
      } catch {
        toast.error('Sắp xếp thất bại. Đã khôi phục vị trí cũ.');
      } finally {
        setOptimistic(null);
      }
    },
    [propModules, onModulesChange],
  );

  const handleLessonReorder = useCallback(
    async (moduleId: string, lessonId: string, direction: 'up' | 'down') => {
      const source = propModules;
      const moduleIndex = source.findIndex((m) => m.id === moduleId);
      if (moduleIndex === -1) return;

      const lessons = source[moduleIndex].lessons;
      const lessonIndex = lessons.findIndex((l) => l.id === lessonId);
      if (lessonIndex === -1) return;

      const targetIndex = direction === 'up' ? lessonIndex - 1 : lessonIndex + 1;
      if (targetIndex < 0 || targetIndex >= lessons.length) return;

      // ── Optimistic swap ──
      const newModules = source.map((m) => ({ ...m, lessons: [...m.lessons] }));
      const newLessons = newModules[moduleIndex].lessons;
      const tempOrder = newLessons[lessonIndex].order;
      newLessons[lessonIndex] = {
        ...newLessons[lessonIndex],
        order: newLessons[targetIndex].order,
      };
      newLessons[targetIndex] = { ...newLessons[targetIndex], order: tempOrder };
      [newLessons[lessonIndex], newLessons[targetIndex]] = [
        newLessons[targetIndex],
        newLessons[lessonIndex],
      ];
      setOptimistic({ type: 'lesson', modules: newModules });

      try {
        await api.patch(`/api/lessons/${lessonId}/order`, { direction });
        onModulesChange(); // Refetch
      } catch {
        toast.error('Sắp xếp thất bại. Đã khôi phục vị trí cũ.');
      } finally {
        setOptimistic(null);
      }
    },
    [propModules, onModulesChange],
  );

  if (modules.length === 0) {
    return (
      <EmptyState
        icon={Book}
        title="Chưa có học phần nào"
        description="Khóa học này chưa có nội dung. Hãy bắt đầu bằng cách thêm học phần đầu tiên."
      />
    );
  }

  return (
    <Accordion type="multiple" className="w-full space-y-4">
      {modules.map((module, index) => (
        <ModuleItem
          key={module.id}
          module={module}
          isFirst={index === 0}
          isLast={index === modules.length - 1}
          onModulesChange={onModulesChange}
          onModuleReorder={(direction) => handleModuleReorder(module.id, direction)}
          onLessonReorder={(lessonId, direction) =>
            handleLessonReorder(module.id, lessonId, direction)
          }
        />
      ))}
    </Accordion>
  );
}
