import {
  BlockNoteSchema,
  defaultInlineContentSpecs,
  defaultBlockSpecs,
  filterSuggestionItems,
  createCodeBlockSpec,
} from '@blocknote/core';
import {
  useCreateBlockNote,
  SuggestionMenuController,
  getDefaultReactSlashMenuItems,
} from '@blocknote/react';
import { BlockNoteView } from '@blocknote/shadcn';
import { InlineMath } from './extensions/InlineMath';
import { MathBlock } from './extensions/MathBlock';
import { Calculator } from 'lucide-react';
import { useCallback, useRef, useEffect, useMemo } from 'react';
import { codeBlockOptions } from '@blocknote/code-block';

import '@blocknote/shadcn/style.css';
import 'mathlive';
import { useTheme } from 'next-themes';

const schema = BlockNoteSchema.create({
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

const insertInlineMathItem = (editor: typeof schema.BlockNoteEditor) => ({
  title: 'Inline Math',
  onItemClick: () => {
    editor.insertInlineContent([{ type: 'inlineMath', props: { latex: '' } }, ' ']);
  },
  aliases: ['inlinemath', 'math'],
  group: 'Math',
  icon: <Calculator size={18} />,
});

const insertMathBlockItem = (editor: typeof schema.BlockNoteEditor) => ({
  title: 'Math Block',
  onItemClick: () => {
    const currentBlock = editor.getTextCursorPosition().block;
    const content = currentBlock.content;
    const isEmpty =
      !content ||
      (typeof content === 'string' && content === '') ||
      (Array.isArray(content) &&
        (content.length === 0 ||
          (content.length === 1 && content[0].type === 'text' && content[0].text === '')));

    if (isEmpty) {
      editor.updateBlock(currentBlock, {
        type: 'mathBlock',
        props: { latex: '' },
      });
    } else {
      editor.insertBlocks(
        [
          {
            type: 'mathBlock',
            props: { latex: '' },
          },
        ],
        currentBlock,
        'after',
      );
    }
  },
  aliases: ['math', 'mathblock'],
  group: 'Math',
  icon: <Calculator size={18} />,
});

interface RichTextEditorProps {
  storageKey?: string;
  initialHtml?: string;
  onChange?: (editor: typeof schema.BlockNoteEditor) => void;
  className?: string;
  /** Remove inner padding for compact/embedded use cases */
  noPadding?: boolean;
  /** Hide the side menu (+ / drag handle) and remove its reserved left padding */
  hideSideMenu?: boolean;
}

export function RichTextEditor({
  storageKey,
  initialHtml,
  onChange,
  className,
  noPadding,
  hideSideMenu,
}: RichTextEditorProps) {
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaveTimeRef = useRef<number>(0);

  useEffect(() => {
    lastSaveTimeRef.current = Date.now();
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const initialContent = useMemo(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved editor content', e);
        }
      }
    }
    return undefined;
  }, [storageKey]);

  const editor = useCreateBlockNote({
    schema,
    initialContent,
  });

  const isHtmlLoaded = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function loadHtml() {
      if (isHtmlLoaded.current) return;
      if (initialHtml && (!storageKey || !localStorage.getItem(storageKey))) {
        try {
          const blocks = await editor.tryParseHTMLToBlocks(initialHtml);
          if (!cancelled) {
            editor.replaceBlocks(editor.document, blocks);
            isHtmlLoaded.current = true;
          }
        } catch (e) {
          console.error('Failed to parse initialHtml', e);
        }
      }
    }
    loadHtml();
    return () => {
      cancelled = true;
    };
  }, [initialHtml, editor, storageKey]);

  const saveToStorage = useCallback(() => {
    if (!storageKey) return;
    const content = JSON.stringify(editor.document);
    localStorage.setItem(storageKey, content);
    lastSaveTimeRef.current = Date.now();
  }, [editor, storageKey]);

  const handleEditorChange = useCallback(() => {
    onChange?.(editor);

    if (!storageKey) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    const now = Date.now();
    const timeSinceLastSave = now - lastSaveTimeRef.current;

    if (timeSinceLastSave > 30000) {
      saveToStorage();
    } else {
      saveTimeoutRef.current = setTimeout(() => {
        saveToStorage();
      }, 5000);
    }
  }, [storageKey, saveToStorage, onChange, editor]);

  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === 'dark' ? 'dark' : 'light';

  return (
    <div
      className={`w-full h-full border border-border rounded-xl shadow-sm bg-background flex flex-col ${className || 'min-h-[500px]'}`}
    >
      <style>{`
        @media not (pointer: coarse) {
          math-field::part(virtual-keyboard-toggle) {
            display: none;
          }
          math-field::part(menu-toggle) {
            display: none;
          }
        }
        .transparent-bg .bn-container,
        .transparent-bg .bn-editor,
        .transparent-bg .ProseMirror {
          background-color: transparent !important;
          background: transparent !important;
          --bn-colors-editor-background: transparent !important;
        }
        .no-side-menu .bn-editor {
          padding-inline-start: 0 !important;
        }
      `}</style>
      <div
        className={`flex-1 transparent-bg ${noPadding ? '' : 'p-4'} ${hideSideMenu ? 'no-side-menu' : ''}`}
      >
        <BlockNoteView
          editor={editor}
          slashMenu={false}
          sideMenu={!hideSideMenu}
          theme={theme}
          onChange={handleEditorChange}
        >
          <SuggestionMenuController
            triggerCharacter={'/'}
            getItems={async (query) =>
              filterSuggestionItems(
                [
                  ...getDefaultReactSlashMenuItems(editor),
                  insertInlineMathItem(editor),
                  insertMathBlockItem(editor),
                ],
                query,
              )
            }
          />
        </BlockNoteView>
      </div>
    </div>
  );
}
