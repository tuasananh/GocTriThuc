import {
    $getSelection,
    $isRangeSelection,
    $isElementNode,
    $isRootOrShadowRoot,
    CAN_REDO_COMMAND,
    CAN_UNDO_COMMAND,
    COMMAND_PRIORITY_CRITICAL,
    ElementFormatType,
    SELECTION_CHANGE_COMMAND,
} from 'lexical';
import {
    $getSelectionStyleValueForProperty,
    $patchStyleText,
} from '@lexical/selection';
import { $findMatchingParent, mergeRegister } from '@lexical/utils';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useCallback, useEffect, useState } from 'react';

import { AlignmentButtons } from './AlignmentButtons';
import { Divider } from './Divider';
import { FontDropDown } from './FontDropDown';
import { FontSize } from './FontSize';
import { HistoryButtons } from './HistoryButtons';
import { TextFormatButtons } from './TextFormatButtons';
import DropdownColorPicker from '../../ui/DropdownColorPicker';

function parseFontSizeForToolbar(input: string): string {
    const match = input.match(/^(\d+(?:\.\d+)?)(px|pt)$/);
    if (!match) {
        return '';
    }
    const [, fontSize, unit] = match;
    const fontSizePx = unit === 'pt' ? Math.round((Number(fontSize) * 4) / 3) : Number(fontSize);
    return `${fontSizePx}px`;
}

export function ToolbarPlugin() {
    const [editor] = useLexicalComposerContext();

    // History state
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

    // Text format state
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);
    const [isStrikethrough, setIsStrikethrough] = useState(false);
    const [isSuperscript, setIsSuperscript] = useState(false);
    const [isSubscript, setIsSubscript] = useState(false);

    // Font state
    const [fontFamily, setFontFamily] = useState<string>('Arial');
    const [fontSize, setFontSize] = useState<string>('15px');

    // Color state
    const [fontColor, setFontColor] = useState<string>('#000');
    const [bgColor, setBgColor] = useState<string>('#fff');

    // Alignment state
    const [elementFormat, setElementFormat] = useState<ElementFormatType>('left');

    const [isEditable, setIsEditable] = useState(() => editor.isEditable());

    const $updateToolbar = useCallback(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
            // Text format
            setIsBold(selection.hasFormat('bold'));
            setIsItalic(selection.hasFormat('italic'));
            setIsUnderline(selection.hasFormat('underline'));
            setIsStrikethrough(selection.hasFormat('strikethrough'));
            setIsSuperscript(selection.hasFormat('superscript'));
            setIsSubscript(selection.hasFormat('subscript'));

            // Font styles
            setFontFamily(
                $getSelectionStyleValueForProperty(selection, 'font-family', 'Arial'),
            );
            setFontSize(
                $getSelectionStyleValueForProperty(selection, 'font-size', '15px'),
            );

            // Colors
            setFontColor(
                $getSelectionStyleValueForProperty(selection, 'color', '#000'),
            );
            setBgColor(
                $getSelectionStyleValueForProperty(selection, 'background-color', '#fff'),
            );

            // Alignment — find the nearest block element
            const anchorNode = selection.anchor.getNode();
            let matchingParent = $findMatchingParent(
                anchorNode,
                (parentNode) => $isElementNode(parentNode) && !parentNode.isInline(),
            );
            if (!matchingParent) {
                // Try finding from root
                matchingParent = $findMatchingParent(anchorNode, (e) => {
                    const parent = e.getParent();
                    return parent !== null && $isRootOrShadowRoot(parent);
                });
            }
            if ($isElementNode(matchingParent)) {
                setElementFormat(matchingParent.getFormatType() || 'left');
            } else {
                const parent = anchorNode.getParent();
                if ($isElementNode(parent)) {
                    setElementFormat(parent.getFormatType() || 'left');
                }
            }
        }
    }, []);

    useEffect(() => {
        return mergeRegister(
            editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                () => {
                    $updateToolbar();
                    return false;
                },
                COMMAND_PRIORITY_CRITICAL,
            ),
            editor.registerUpdateListener(({ editorState }) => {
                editorState.read(() => {
                    $updateToolbar();
                });
            }),
            editor.registerCommand<boolean>(
                CAN_UNDO_COMMAND,
                (payload) => {
                    setCanUndo(payload);
                    return false;
                },
                COMMAND_PRIORITY_CRITICAL,
            ),
            editor.registerCommand<boolean>(
                CAN_REDO_COMMAND,
                (payload) => {
                    setCanRedo(payload);
                    return false;
                },
                COMMAND_PRIORITY_CRITICAL,
            ),
            editor.registerEditableListener((editable) => {
                setIsEditable(editable);
            }),
        );
    }, [editor, $updateToolbar]);

    const applyStyleText = useCallback(
        (styles: Record<string, string>, skipHistoryStack?: boolean) => {
            editor.update(
                () => {
                    const selection = $getSelection();
                    if (selection !== null) {
                        $patchStyleText(selection, styles);
                    }
                },
                skipHistoryStack ? { tag: 'historic' } : {},
            );
        },
        [editor],
    );

    const onFontColorSelect = useCallback(
        (value: string, skipHistoryStack: boolean) => {
            applyStyleText({ color: value }, skipHistoryStack);
        },
        [applyStyleText],
    );

    const onBgColorSelect = useCallback(
        (value: string, skipHistoryStack: boolean) => {
            applyStyleText({ 'background-color': value }, skipHistoryStack);
        },
        [applyStyleText],
    );

    const fontSizeDisplay = parseFontSizeForToolbar(fontSize);

    return (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-zinc-200 bg-white px-2 py-1 dark:border-white/[0.12] dark:bg-[#1f1f21]">
            <HistoryButtons
                activeEditor={editor}
                canUndo={canUndo}
                canRedo={canRedo}
                isEditable={isEditable}
            />
            <Divider />
            <TextFormatButtons
                activeEditor={editor}
                isBold={isBold}
                isItalic={isItalic}
                isUnderline={isUnderline}
                isStrikethrough={isStrikethrough}
                isSuperscript={isSuperscript}
                isSubscript={isSubscript}
                isEditable={isEditable}
            />
            <Divider />
            <FontDropDown
                editor={editor}
                value={fontFamily}
                disabled={!isEditable}
            />
            <Divider />
            <FontSize
                selectionFontSize={fontSizeDisplay ? fontSizeDisplay.slice(0, -2) : ''}
                editor={editor}
                disabled={!isEditable}
            />
            <Divider />
            <DropdownColorPicker
                disabled={!isEditable}
                buttonClassName="relative flex h-8 w-8 items-center justify-center rounded text-zinc-600 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-zinc-300 dark:hover:bg-zinc-700"
                buttonAriaLabel="Text color"
                color={fontColor}
                onChange={onFontColorSelect}
                icon={
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 20h16" />
                        <path d="m6 16 6-12 6 12" />
                        <path d="M8 12h8" />
                    </svg>
                }
            />
            <DropdownColorPicker
                disabled={!isEditable}
                buttonClassName="relative flex h-8 w-8 items-center justify-center rounded text-zinc-600 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-zinc-300 dark:hover:bg-zinc-700"
                buttonAriaLabel="Background color"
                color={bgColor}
                onChange={onBgColorSelect}
                icon={
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z" />
                        <path d="m5 2 5 5" />
                        <path d="M2 13h15" />
                        <path d="M22 20a2 2 0 1 1-4 0c0-1.6 1.7-2.4 2-4 .3 1.6 2 2.4 2 4Z" />
                    </svg>
                }
            />
            <Divider />
            <AlignmentButtons
                activeEditor={editor}
                elementFormat={elementFormat}
                isEditable={isEditable}
            />
        </div>
    );
}
