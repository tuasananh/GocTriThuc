import type { LessonDetailDto } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface VideoLessonFormProps {
  lesson: LessonDetailDto;
}

export function VideoLessonForm({ lesson }: VideoLessonFormProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Video Bài giảng</h2>
        <p className="text-sm text-muted-foreground">Cung cấp đường dẫn video cho bài học này.</p>
      </div>

      <div className="space-y-4 max-w-xl">
        <div className="space-y-2">
          <Label htmlFor="video-url">Đường dẫn Video (YouTube, Vimeo, ...)</Label>
          <Input
            id="video-url"
            placeholder="VD: https://www.youtube.com/watch?v=..."
            defaultValue={lesson.video?.providerValue || ''}
          />
        </div>
      </div>
    </div>
  );
}
