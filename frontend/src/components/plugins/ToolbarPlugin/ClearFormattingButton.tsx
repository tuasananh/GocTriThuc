import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  LexicalEditor,
  $createParagraphNode,
} from 'lexical';
import { $patchStyleText, $setBlocksType } from '@lexical/selection';

interface ClearFormattingButtonProps {
  activeEditor: LexicalEditor;
  disabled?: boolean;
}

export function ClearFormattingButton({ activeEditor, disabled }: ClearFormattingButtonProps) {
  const clearFormatting = () => {
    activeEditor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode());
        selection.getNodes().forEach((node) => {
          if ($isTextNode(node)) {
            node.setFormat(0);
            node.setStyle('');
          }
        });
        $patchStyleText(selection, {
          'font-size': '',
          'font-family': '',
          color: '',
          'background-color': '',
        });
      }
    });
  };

  return (
    <button
      type="button"
      className="flex h-8 w-8 items-center justify-center rounded text-zinc-600 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-zinc-300 dark:hover:bg-zinc-700"
      onClick={clearFormatting}
      disabled={disabled}
      title="Clear Formatting"
      aria-label="Clear Formatting"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.9-9.9c1-1 2.5-1 3.4 0l4.3 4.3c1 1 1 2.5 0 3.4L10.5 21" />
        <path d="m15 5 4 4" />
        <path d="m9 11 4 4" />
        <path d="M5 19h14" />
        <path d="m20 20-2-2" />
      </svg>
    </button>
  );
}
