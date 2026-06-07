import { useEffect, useMemo } from 'react';
import {
  BlockNoteSchema,
  defaultInlineContentSpecs,
  defaultBlockSpecs,
  createCodeBlockSpec,
} from '@blocknote/core';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/shadcn';
import { InlineMath } from '@/components/rich-text-editor/extensions/InlineMath';
import { MathBlock } from '@/components/rich-text-editor/extensions/MathBlock';
import { codeBlockOptions } from '@blocknote/code-block';
import '@blocknote/shadcn/style.css';
import 'mathlive';

/**
 * Schema khớp với RichTextEditor để đảm bảo các block
 * custom (InlineMath, MathBlock, CodeBlock) render đúng.
 */
const viewerSchema = BlockNoteSchema.create({
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    inlineMath: InlineMath,
  },
  blockSpecs: {
    ...defaultBlockSpecs,
    mathBlock: MathBlock(),
    codeBlock: createCodeBlockSpec(codeBlockOptions),
  },
});

interface BlogLessonViewerProps {
  blog: { content: string };
}

/**
 * Hiển thị nội dung bài học dạng Blog bằng BlockNote read-only.
 *
 * - Parse HTML (đã được backend sanitize bằng jsoup) thành BlockNote blocks.
 * - `editable={false}` — học viên chỉ xem, không thể chỉnh sửa.
 * - Dùng cùng schema với RichTextEditor để render đúng InlineMath / MathBlock / CodeBlock.
 */
export function BlogLessonViewer({ blog }: BlogLessonViewerProps) {
  const editor = useCreateBlockNote({
    schema: viewerSchema,
    initialContent: undefined,
  });

  // Memoize content string để tránh re-parse không cần thiết
  const htmlContent = useMemo(() => blog.content?.trim() ?? '', [blog.content]);

  useEffect(() => {
    let cancelled = false;

    async function loadContent() {
      if (!htmlContent) {
        // Nội dung rỗng — xóa hết block
        editor.replaceBlocks(editor.document, []);
        return;
      }

      try {
        const blocks = await editor.tryParseHTMLToBlocks(htmlContent);
        if (!cancelled) {
          editor.replaceBlocks(editor.document, blocks);
        }
      } catch (err) {
        console.error('[BlogLessonViewer] Failed to parse HTML to blocks:', err);
      }
    }

    void loadContent();

    return () => {
      cancelled = true;
    };
  }, [htmlContent, editor]);

  if (!htmlContent) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
        <p className="text-sm">Bài học này chưa có nội dung.</p>
      </div>
    );
  }

  return (
    <article className="w-full" aria-label="Nội dung bài học">
      {/* Ẩn thanh công cụ và giao diện edit của BlockNote trong chế độ read-only */}
      <style>{`
        /* Ẩn placeholder text của BlockNote khi read-only */
        .bn-editor [data-placeholder]:empty::before {
          display: none !important;
        }
        /* Xóa cursor dạng text vì đây là read-only */
        .bn-editor .bn-block-content {
          cursor: default;
        }
      `}</style>
      <BlockNoteView editor={editor} editable={false} theme="light" className="bn-viewer" />
    </article>
  );
}
