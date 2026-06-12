import { RichTextViewer } from '@/components/rich-text-editor/RichTextViewer';

interface BlogLessonViewerProps {
  blog: { content: string };
}

/**
 * Hiển thị nội dung bài học dạng Blog.
 */
export function BlogLessonViewer({ blog }: BlogLessonViewerProps) {
  return (
    <article className="w-full" aria-label="Nội dung bài học">
      <RichTextViewer
        htmlContent={blog.content}
        emptyMessage="Bài học này chưa có nội dung."
        className="py-8"
      />
    </article>
  );
}
