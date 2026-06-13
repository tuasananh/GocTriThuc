import { RichTextEditor } from '@/components/rich-text-editor';

interface BlogLessonFormProps {
  lessonId: string;
  initialHtml: string;
  onChangeContent: (html: string) => void;
}

export function BlogLessonForm({ lessonId, initialHtml, onChangeContent }: BlogLessonFormProps) {
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
        <RichTextEditor
          storageKey={`blog-lesson-${lessonId}`}
          initialHtml={initialHtml}
          onChange={async (editor) => {
            const html = await editor.blocksToHTMLLossy(editor.document);
            onChangeContent(html);
          }}
        />
      </div>
    </div>
  );
}
