import type { LessonDetailDto } from '@/types';
import { TestBuilder } from '@/pages/instructor/test-builder';

interface TestLessonFormProps {
  lesson: LessonDetailDto;
}

export function TestLessonForm({ lesson }: TestLessonFormProps) {
  return (
    <div className="mt-2">
      <TestBuilder lessonId={lesson.id} />
    </div>
  );
}
