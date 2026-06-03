import { Accordion } from '@/components/ui/accordion';
import type { ModuleDto } from '@/types';
import { ModuleItem } from './ModuleItem';
import { EmptyState } from '@/components/EmptyState';
import { Book } from 'lucide-react';

interface ModuleListProps {
  modules: ModuleDto[];
  onModulesChange: () => void;
}

export function ModuleList({ modules, onModulesChange }: ModuleListProps) {
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
        />
      ))}
    </Accordion>
  );
}
