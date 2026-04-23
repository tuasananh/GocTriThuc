import { useCallback } from 'react';

import {
    $getSelection,
    $addUpdateTag,
    LexicalEditor,
    SKIP_SELECTION_FOCUS_TAG,
} from 'lexical';
import { $patchStyleText } from '@lexical/selection';

import DropDown, { DropDownItem } from '../../ui/DropDown';

const FONT_FAMILY_OPTIONS: [string, string][] = [
    ['Be Vietnam Pro', 'Be Vietnam Pro'],
    ['Nunito', 'Nunito'],
    ['Roboto', 'Roboto'],
    ['Open Sans', 'Open Sans'],
    ['Montserrat', 'Montserrat'],
    ['Lexend', 'Lexend'],
    ['Source Sans 3', 'Source Sans 3'],
    ['Inter', 'Inter'],
    ['Tahoma', 'Tahoma'],
    ['Arial', 'Arial'],
    ['Verdana', 'Verdana'],
    ['Times New Roman', 'Times New Roman'],
];

interface FontDropDownProps {
    editor: LexicalEditor;
    value: string;
    disabled?: boolean;
}

export function FontDropDown({
    editor,
    value,
    disabled = false,
}: FontDropDownProps) {
    const handleClick = useCallback(
        (option: string) => {
            editor.update(() => {
                $addUpdateTag(SKIP_SELECTION_FOCUS_TAG);
                const selection = $getSelection();
                if (selection !== null) {
                    $patchStyleText(selection, {
                        'font-family': option,
                    });
                }
            });
        },
        [editor],
    );

    return (
        <DropDown
            disabled={disabled}
            buttonClassName="flex h-8 items-center gap-1 rounded px-2 text-zinc-600 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-zinc-300 dark:hover:bg-zinc-700"
            buttonLabel={value}
            buttonAriaLabel="Formatting options for font family"
        >
            {FONT_FAMILY_OPTIONS.map(([option, text]) => (
                <DropDownItem
                    className={`dropdown-item ${value === option ? 'dropdown-item-active' : ''}`}
                    onClick={() => handleClick(option)}
                    key={option}
                >
                    <span style={{ fontFamily: option }}>{text}</span>
                </DropDownItem>
            ))}
        </DropDown>
    );
}
