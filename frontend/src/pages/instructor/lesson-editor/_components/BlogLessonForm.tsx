import type { LessonDetailDto } from '@/types';
import { RichTextEditor } from '@/components/rich-text-editor';

interface BlogLessonFormProps {
  lesson: LessonDetailDto;
  onChange?: (html: string) => void;
}

export function BlogLessonForm({ lesson, onChange }: BlogLessonFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Nội dung bài viết (Blog)</h2>
        <p className="text-sm text-muted-foreground">
          Sử dụng trình soạn thảo bên dưới để viết nội dung bài giảng của bạn. Nhấn{' '}
          <kbd className="font-mono text-xs bg-muted px-1 rounded">/</kbd> để xem các lệnh.
        </p>
      </div>

      <div className="relative rounded-lg overflow-hidden border border-border">
        {/* We use a storageKey unique to this lesson so that drafts are preserved */}
        <RichTextEditor
          storageKey={`blog-lesson-${lesson.id}`}
          initialHtml={lesson.blog?.content}
          onChange={async (editor) => {
            if (onChange) {
              const html = await editor.blocksToHTMLLossy(editor.document);
              onChange(html);
            }
          }}
        />
      </div>
    </div>
  );
}
