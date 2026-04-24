import {
    FORMAT_TEXT_COMMAND,
    LexicalEditor,
    TextFormatType,
} from 'lexical';

interface TextFormatButtonsProps {
    activeEditor: LexicalEditor;
    isBold: boolean;
    isItalic: boolean;
    isUnderline: boolean;
    isStrikethrough: boolean;
    isSuperscript: boolean;
    isSubscript: boolean;
    isCode: boolean;
    isEditable: boolean;
}

interface FormatButtonConfig {
    format: TextFormatType;
    label: string;
    title: string;
    isActive: boolean;
    icon: React.ReactNode;
}

export function TextFormatButtons({
    activeEditor,
    isBold,
    isItalic,
    isUnderline,
    isStrikethrough,
    isSuperscript,
    isSubscript,
    isCode,
    isEditable,
}: TextFormatButtonsProps) {
    const formatButtons: FormatButtonConfig[] = [
        {
            format: 'bold',
            label: 'Bold',
            title: 'Bold (Ctrl+B)',
            isActive: isBold,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8" />
                </svg>
            ),
        },
        {
            format: 'italic',
            label: 'Italic',
            title: 'Italic (Ctrl+I)',
            isActive: isItalic,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" x2="10" y1="4" y2="4" />
                    <line x1="14" x2="5" y1="20" y2="20" />
                    <line x1="15" x2="9" y1="4" y2="20" />
                </svg>
            ),
        },
        {
            format: 'underline',
            label: 'Underline',
            title: 'Underline (Ctrl+U)',
            isActive: isUnderline,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 4v6a6 6 0 0 0 12 0V4" />
                    <line x1="4" x2="20" y1="20" y2="20" />
                </svg>
            ),
        },
        {
            format: 'strikethrough',
            label: 'Strikethrough',
            title: 'Strikethrough',
            isActive: isStrikethrough,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 4H9a3 3 0 0 0-2.83 4" />
                    <path d="M14 12a4 4 0 0 1 0 8H6" />
                    <line x1="4" x2="20" y1="12" y2="12" />
                </svg>
            ),
        },
        {
            format: 'superscript',
            label: 'Superscript',
            title: 'Superscript',
            isActive: isSuperscript,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m4 19 8-8" />
                    <path d="m12 19-8-8" />
                    <path d="M20 12h-4c0-1.5.442-2 1.5-2.5S20 8.334 20 7.002c0-.472-.17-.93-.484-1.29a2.105 2.105 0 0 0-2.617-.436c-.42.239-.738.614-.899 1.06" />
                </svg>
            ),
        },
        {
            format: 'subscript',
            label: 'Subscript',
            title: 'Subscript',
            isActive: isSubscript,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m4 5 8 8" />
                    <path d="m12 5-8 8" />
                    <path d="M20 19h-4c0-1.5.44-2 1.5-2.5S20 15.33 20 14c0-.47-.17-.93-.48-1.29a2.11 2.11 0 0 0-2.62-.44c-.42.24-.74.62-.9 1.06" />
                </svg>
            ),
        },
        {
            format: 'code',
            label: 'Inline Code',
            title: 'Inline Code',
            isActive: isCode,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                </svg>
            ),
        },
    ];

    return (
        <>
            {formatButtons.map(({ format, label, title, isActive, icon }) => (
                <button
                    key={format}
                    disabled={!isEditable}
                    onClick={() => {
                        activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
                    }}
                    title={title}
                    type="button"
                    className={`flex h-8 w-8 items-center justify-center rounded disabled:cursor-not-allowed disabled:opacity-30 ${isActive
                        ? 'bg-zinc-200 text-blue-600 dark:bg-zinc-600 dark:text-blue-400'
                        : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700'
                        }`}
                    aria-label={label}
                    aria-pressed={isActive}
                >
                    {icon}
                </button>
            ))}
        </>
    );
}
