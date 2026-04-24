import { INDENT_CONTENT_COMMAND, OUTDENT_CONTENT_COMMAND, LexicalEditor } from 'lexical';

interface IndentButtonsProps {
  activeEditor: LexicalEditor;
  disabled?: boolean;
}

export function IndentButtons({ activeEditor, disabled }: IndentButtonsProps) {
  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded text-zinc-600 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-zinc-300 dark:hover:bg-zinc-700"
        onClick={() => {
          activeEditor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
        }}
        disabled={disabled}
        title="Outdent"
        aria-label="Outdent"
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
          <path d="M21 6H11" />
          <path d="M21 12H11" />
          <path d="M21 18H11" />
          <path d="m7 8-4 4 4 4" />
        </svg>
      </button>
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded text-zinc-600 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-zinc-300 dark:hover:bg-zinc-700"
        onClick={() => {
          activeEditor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
        }}
        disabled={disabled}
        title="Indent"
        aria-label="Indent"
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
          <path d="M21 6H11" />
          <path d="M21 12H11" />
          <path d="M21 18H11" />
          <path d="m3 8 4 4-4 4" />
        </svg>
      </button>
    </div>
  );
}
