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
import { Calculator, Download, Loader2 } from 'lucide-react';
import { useState, useCallback, useRef } from 'react';

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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
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
  onExport?: (html: string) => void;
}

export function RichTextEditor({ storageKey, onExport }: RichTextEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaveTimeRef = useRef<number>(Date.now());

  const getInitialContent = () => {
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
  };

  const editor = useCreateBlockNote({
    schema,
    initialContent: getInitialContent(),
  });

  const saveToStorage = useCallback(() => {
    if (!storageKey) return;
    setIsSaving(true);
    const content = JSON.stringify(editor.document);
    localStorage.setItem(storageKey, content);
    lastSaveTimeRef.current = Date.now();

    setTimeout(() => {
      setIsSaving(false);
    }, 500);
  }, [editor, storageKey]);

  const handleEditorChange = useCallback(() => {
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
  }, [storageKey, saveToStorage]);

  const handleExport = async () => {
    const html = await editor.blocksToHTMLLossy(editor.document);
    onExport?.(html);
  };

  return (
    <div className="w-full h-full min-h-[500px] border border-border rounded-xl shadow-sm bg-background flex flex-col overflow-hidden">
      <div className="flex justify-between items-center px-4 py-3 bg-muted/20 border-b border-border">
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          {isSaving ? (
            <>
              <Loader2 size={12} className="animate-spin" /> Saving...
            </>
          ) : storageKey ? (
            'All changes saved locally'
          ) : null}
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Download size={16} />
          Export HTML
        </button>
      </div>

      <div className="p-4 flex-1">
        <BlockNoteView editor={editor} slashMenu={false} theme="dark" onChange={handleEditorChange}>
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
