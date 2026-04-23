import { LexicalEditor, REDO_COMMAND, UNDO_COMMAND } from 'lexical';

interface HistoryButtonsProps {
    activeEditor: LexicalEditor;
    canUndo: boolean;
    canRedo: boolean;
    isEditable: boolean;
}

export function HistoryButtons({
    activeEditor,
    canUndo,
    canRedo,
    isEditable,
}: HistoryButtonsProps) {
    return (
        <>
            <button
                disabled={!canUndo || !isEditable}
                onClick={() => {
                    activeEditor.dispatchCommand(UNDO_COMMAND, undefined);
                }}
                title="Undo (Ctrl+Z)"
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded text-zinc-600 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-zinc-300 dark:hover:bg-zinc-700"
                aria-label="Undo"
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
                    <path d="M3 7v6h6" />
                    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                </svg>
            </button>
            <button
                disabled={!canRedo || !isEditable}
                onClick={() => {
                    activeEditor.dispatchCommand(REDO_COMMAND, undefined);
                }}
                title="Redo (Ctrl+Y)"
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded text-zinc-600 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-zinc-300 dark:hover:bg-zinc-700"
                aria-label="Redo"
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
                    <path d="M21 7v6h-6" />
                    <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
                </svg>
            </button>
        </>
    );
}
