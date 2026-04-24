import { FORMAT_ELEMENT_COMMAND, ElementFormatType, LexicalEditor } from 'lexical';

interface AlignmentButtonsProps {
  activeEditor: LexicalEditor;
  elementFormat: ElementFormatType;
  isEditable: boolean;
}

interface AlignmentConfig {
  format: ElementFormatType;
  label: string;
  title: string;
  icon: React.ReactNode;
}

export function AlignmentButtons({
  activeEditor,
  elementFormat,
  isEditable,
}: AlignmentButtonsProps) {
  const alignments: AlignmentConfig[] = [
    {
      format: 'left',
      label: 'Left Align',
      title: 'Left Align',
      icon: (
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
          <line x1="21" x2="3" y1="6" y2="6" />
          <line x1="15" x2="3" y1="12" y2="12" />
          <line x1="17" x2="3" y1="18" y2="18" />
        </svg>
      ),
    },
    {
      format: 'center',
      label: 'Center Align',
      title: 'Center Align',
      icon: (
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
          <line x1="21" x2="3" y1="6" y2="6" />
          <line x1="17" x2="7" y1="12" y2="12" />
          <line x1="19" x2="5" y1="18" y2="18" />
        </svg>
      ),
    },
    {
      format: 'right',
      label: 'Right Align',
      title: 'Right Align',
      icon: (
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
          <line x1="21" x2="3" y1="6" y2="6" />
          <line x1="21" x2="9" y1="12" y2="12" />
          <line x1="21" x2="7" y1="18" y2="18" />
        </svg>
      ),
    },
    {
      format: 'justify',
      label: 'Justify Align',
      title: 'Justify Align',
      icon: (
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
          <line x1="21" x2="3" y1="6" y2="6" />
          <line x1="21" x2="3" y1="12" y2="12" />
          <line x1="21" x2="3" y1="18" y2="18" />
        </svg>
      ),
    },
  ];

  return (
    <>
      {alignments.map(({ format, label, title, icon }) => {
        const isActive =
          elementFormat === format ||
          (format === 'left' && (elementFormat === '' || elementFormat === 'start'));
        return (
          <button
            key={format}
            disabled={!isEditable}
            onClick={() => {
              activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, format);
            }}
            title={title}
            type="button"
            className={`flex h-8 w-8 items-center justify-center rounded disabled:cursor-not-allowed disabled:opacity-30 ${
              isActive
                ? 'bg-zinc-200 text-blue-600 dark:bg-zinc-600 dark:text-blue-400'
                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700'
            }`}
            aria-label={label}
          >
            {icon}
          </button>
        );
      })}
    </>
  );
}
