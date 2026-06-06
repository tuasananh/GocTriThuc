import type { LessonDto } from '@/types';
import { LessonItem } from './LessonItem';

interface LessonListProps {
  lessons: LessonDto[];
  onModulesChange: () => void;
  onLessonReorder: (lessonId: string, direction: 'up' | 'down') => void;
}

export function LessonList({ lessons, onModulesChange, onLessonReorder }: LessonListProps) {
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
          onReorder={(direction) => onLessonReorder(lesson.id, direction)}
        />
      ))}
    </div>
  );
}
