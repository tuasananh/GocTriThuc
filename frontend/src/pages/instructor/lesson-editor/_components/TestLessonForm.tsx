import type { LessonDetailDto } from '@/types';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/routes';
import { Link } from 'react-router-dom';

interface TestLessonFormProps {
  lesson: LessonDetailDto;
}

export function TestLessonForm({ lesson }: TestLessonFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Bài kiểm tra (Test)</h2>
        <p className="text-sm text-muted-foreground">
          Bài kiểm tra được quản lý thông qua trình tạo đề kiểm tra riêng.
        </p>
      </div>

      <div className="p-8 text-center bg-muted/20 border border-dashed rounded-xl">
        <p className="text-muted-foreground mb-4">
          Click vào nút bên dưới để mở trình xây dựng câu hỏi cho bài kiểm tra này.
        </p>
        <Button asChild>
          <Link to={ROUTES.INSTRUCTOR_TEST_BUILDER(lesson.id)}>Mở trình tạo câu hỏi</Link>
        </Button>
      </div>
    </div>
  );
}
