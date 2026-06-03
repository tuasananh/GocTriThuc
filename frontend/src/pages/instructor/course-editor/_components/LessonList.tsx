import type { LessonDto } from '@/types';
import { LessonItem } from './LessonItem';

interface LessonListProps {
  lessons: LessonDto[];
  onModulesChange: () => void;
}

export function LessonList({ lessons, onModulesChange }: LessonListProps) {
  if (lessons.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic px-4 py-3 bg-muted/30 rounded-md border border-dashed">
        Chưa có bài học nào.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {lessons.map((lesson, index) => (
        <LessonItem
          key={lesson.id}
          lesson={lesson}
          isFirst={index === 0}
          isLast={index === lessons.length - 1}
          onModulesChange={onModulesChange}
        />
      ))}
    </div>
  );
}
