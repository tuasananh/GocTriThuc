import {
  BlockNoteSchema,
  defaultInlineContentSpecs,
  defaultBlockSpecs,
  filterSuggestionItems,
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

import '@blocknote/core/fonts/inter.css';
import '@blocknote/shadcn/style.css';
import 'mathlive';

const schema = BlockNoteSchema.create({
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    inlineMath: InlineMath,
  },
  blockSpecs: {
    ...defaultBlockSpecs,
    mathBlock: MathBlock(),
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
    editor.insertBlocks(
      [
        {
          type: 'mathBlock',
          props: { latex: '' },
        },
      ],
      editor.getTextCursorPosition().block,
      'after',
    );
  },
  aliases: ['math', 'mathblock'],
  group: 'Math',
  icon: <Calculator size={18} />,
});

interface RichTextEditorProps {
  storageKey?: string;
  onChange?: (editor: typeof schema.BlockNoteEditor) => void;
}

export function RichTextEditor({ storageKey, onChange }: RichTextEditorProps) {
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

  return (
    <div className="w-full h-full min-h-[500px] border border-border rounded-xl shadow-sm bg-background flex flex-col overflow-hidden">
      <style>{`
        @media not (pointer: coarse) {
          math-field::part(virtual-keyboard-toggle) {
            display: none;
          }
          math-field::part(menu-toggle) {
            display: none;
          }
        }
      `}</style>
      <div className="p-4 flex-1">
        <BlockNoteView
          editor={editor}
          slashMenu={false}
          theme="light"
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
