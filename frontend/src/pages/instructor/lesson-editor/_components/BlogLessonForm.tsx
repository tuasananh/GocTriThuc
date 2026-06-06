import type { LessonDetailDto } from '@/types';
import { RichTextEditor } from '@/components/rich-text-editor';
import { useState, useCallback } from 'react';

interface BlogLessonFormProps {
  lesson: LessonDetailDto;
}

export function BlogLessonForm({ lesson }: BlogLessonFormProps) {
  // We use the storageKey as a fallback, but the initial data should ideally come from the server
  // Since we don't have blocknote content parsing from HTML yet, we'll initialize empty if it's not present.
  const [contentHTML, setContentHTML] = useState<string>(lesson.blog?.content || '');

  const handleChange = useCallback((editor: any) => {
    // We can extract HTML or JSON here. For now, we leave it as an editor callback.
    // In Day 7, you'd extract the HTML and save it to the server.
    // Example: const html = await editor.blocksToHTMLLossy();
    // setContentHTML(html);
  }, []);

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
        <RichTextEditor storageKey={`blog-lesson-${lesson.id}`} onChange={handleChange} />
      </div>
    </div>
  );
}
