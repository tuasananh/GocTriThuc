import { useEffect, useMemo } from 'react';
import { useTheme } from 'next-themes';
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
import { cn } from '@/lib/utils';

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

interface RichTextViewerProps {
  htmlContent: string;
  className?: string;
  emptyMessage?: string;
}

export function RichTextViewer({ htmlContent, className, emptyMessage }: RichTextViewerProps) {
  const editor = useCreateBlockNote({
    schema: viewerSchema,
    initialContent: undefined,
  });

  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === 'dark' ? 'dark' : 'light';

  const parsedContent = useMemo(() => htmlContent?.trim() ?? '', [htmlContent]);

  useEffect(() => {
    let cancelled = false;

    async function loadContent() {
      if (!parsedContent) {
        editor.replaceBlocks(editor.document, []);
        return;
      }

      try {
        const blocks = editor.tryParseHTMLToBlocks(parsedContent);
        if (!cancelled) {
          editor.replaceBlocks(editor.document, blocks);
        }
      } catch (err) {
        console.error('[RichTextViewer] Failed to parse HTML to blocks:', err);
      }
    }

    void loadContent();

    return () => {
      cancelled = true;
    };
  }, [parsedContent, editor]);

  if (!parsedContent) {
    if (emptyMessage) {
      return <div className={cn('text-muted-foreground', className)}>{emptyMessage}</div>;
    }
    return null;
  }

  return (
    <div className={cn('w-full rich-text-viewer-wrapper', className)}>
      <style>{`
        /* Ẩn placeholder text của BlockNote khi read-only */
        .rich-text-viewer-wrapper .bn-editor [data-placeholder]:empty::before {
          display: none !important;
        }
        /* Xóa cursor dạng text vì đây là read-only */
        .rich-text-viewer-wrapper .bn-editor .bn-block-content {
          cursor: default;
        }
        /* Bỏ padding mặc định của editor để embed gọn hơn */
        .rich-text-viewer-wrapper .bn-editor {
          padding-inline: 0 !important;
          padding-block: 0 !important;
        }
        /* Remove margin in paragraphs */
        .rich-text-viewer-wrapper .bn-block-content[data-content-type="paragraph"] {
          margin-top: 0;
          margin-bottom: 0;
        }
        /* Make background completely transparent to blend with parent */
        .rich-text-viewer-wrapper .bn-container,
        .rich-text-viewer-wrapper .bn-editor,
        .rich-text-viewer-wrapper .ProseMirror {
          background-color: transparent !important;
          background: transparent !important;
          --bn-colors-editor-background: transparent !important;
        }
        /* Ẩn các công cụ tương tác của math-field trong viewer */
        .rich-text-viewer-wrapper math-field::part(virtual-keyboard-toggle),
        .rich-text-viewer-wrapper math-field::part(menu-toggle) {
          display: none !important;
        }
        /* Ngăn click vào công thức toán học khi đang ở chế độ xem */
        .rich-text-viewer-wrapper math-field {
          pointer-events: none;
        }
      `}</style>
      <BlockNoteView editor={editor} editable={false} theme={theme} />
    </div>
  );
}
