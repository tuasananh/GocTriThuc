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
import { $isListNode, ListNode } from '@lexical/list';
import { $isHeadingNode } from '@lexical/rich-text';
import { $isCodeNode, CODE_LANGUAGE_FRIENDLY_NAME_MAP } from '@lexical/code';
import DropDown, { DropDownItem } from '../../ui/DropDown';
import { $isLinkNode } from '@lexical/link';
import { OPEN_LINK_MODAL_COMMAND } from '../LinkCommands';
import { $getSelectionStyleValueForProperty, $patchStyleText } from '@lexical/selection';
import { $findMatchingParent, mergeRegister, $getNearestNodeOfType } from '@lexical/utils';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useCallback, useEffect, useState } from 'react';

import { AlignmentButtons } from './AlignmentButtons';
import { Divider } from './Divider';
import { FontDropDown } from './FontDropDown';
import { FontSize } from './FontSize';
import { HistoryButtons } from './HistoryButtons';
import { TextFormatButtons } from './TextFormatButtons';
import { BlockFormatDropDown, blockTypeToBlockName } from './BlockFormatDropDown';
import InsertDropDown from './InsertDropDown';
import { TableToolbar } from './TableToolbar';
import DropdownColorPicker from '../../ui/DropdownColorPicker';
import { IndentButtons } from './IndentButtons';
import { ClearFormattingButton } from './ClearFormattingButton';

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
  const [isCode, setIsCode] = useState(false);

  // Font state
  const [fontFamily, setFontFamily] = useState<string>('Arial');
  const [fontSize, setFontSize] = useState<string>('15px');

  // Color state
  const [fontColor, setFontColor] = useState<string>('#000');
  const [bgColor, setBgColor] = useState<string>('#fff');

  // Alignment state
  const [elementFormat, setElementFormat] = useState<ElementFormatType>('left');

  const [blockType, setBlockType] = useState<keyof typeof blockTypeToBlockName>('paragraph');
  const [selectedCodeLanguage, setSelectedCodeLanguage] = useState<string>('');
  const [isLink, setIsLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkNodeKey, setLinkNodeKey] = useState<string | null>(null);

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
      setIsCode(selection.hasFormat('code'));

      // Font styles
      setFontFamily($getSelectionStyleValueForProperty(selection, 'font-family', 'Arial'));
      setFontSize($getSelectionStyleValueForProperty(selection, 'font-size', '15px'));

      // Colors
      setFontColor($getSelectionStyleValueForProperty(selection, 'color', '#000'));
      setBgColor($getSelectionStyleValueForProperty(selection, 'background-color', '#fff'));

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

      // Block type
      if ($isListNode(matchingParent)) {
        const parentList = $getNearestNodeOfType<ListNode>(anchorNode, ListNode);
        const type = parentList ? parentList.getListType() : matchingParent.getListType();
        setBlockType(type);
      } else {
        const type = $isHeadingNode(matchingParent)
          ? matchingParent.getTag()
          : $isCodeNode(matchingParent)
            ? 'code'
            : matchingParent?.getType();
        if (type && type in blockTypeToBlockName) {
          setBlockType(type as keyof typeof blockTypeToBlockName);
        } else {
          setBlockType('paragraph');
        }

        if ($isCodeNode(matchingParent)) {
          setSelectedCodeLanguage(matchingParent.getLanguage() || '');
        }
      }

      // Link
      const node = selection.focus.getNode();
      const linkNode = $findMatchingParent(node, $isLinkNode);
      if ($isLinkNode(linkNode)) {
        setIsLink(true);
        setLinkUrl(linkNode.getURL());
        setLinkNodeKey(linkNode.getKey());
      } else {
        setIsLink(false);
        setLinkUrl('');
        setLinkNodeKey(null);
      }
    }
  }, []);

  const onCodeLanguageSelect = useCallback(
    (value: string) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode();
          const codeNode = $findMatchingParent(anchorNode, $isCodeNode);
          if ($isCodeNode(codeNode)) {
            codeNode.setLanguage(value);
          }
        }
      });
    },
    [editor],
  );

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
      <BlockFormatDropDown blockType={blockType} editor={editor} disabled={!isEditable} />
      {blockType === 'code' && (
        <>
          <Divider />
          <DropDown
            disabled={!isEditable}
            buttonClassName="flex items-center gap-2 px-2 h-8 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-zinc-600 dark:text-zinc-300"
            buttonLabel={
              CODE_LANGUAGE_FRIENDLY_NAME_MAP[selectedCodeLanguage] ||
              selectedCodeLanguage ||
              'Select language'
            }
            buttonAriaLabel="Select language"
          >
            <div className="max-h-60 overflow-y-auto">
              {Object.entries(CODE_LANGUAGE_FRIENDLY_NAME_MAP).map(([value, name]) => (
                <DropDownItem
                  key={value}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer ${selectedCodeLanguage === value ? 'bg-zinc-50 dark:bg-zinc-800' : ''}`}
                  onClick={() => onCodeLanguageSelect(value)}
                >
                  <span className="text-sm font-medium">{name}</span>
                </DropDownItem>
              ))}
            </div>
          </DropDown>
        </>
      )}
      <Divider />
      <TextFormatButtons
        activeEditor={editor}
        isBold={isBold}
        isItalic={isItalic}
        isUnderline={isUnderline}
        isStrikethrough={isStrikethrough}
        isSuperscript={isSuperscript}
        isSubscript={isSubscript}
        isCode={isCode}
        isEditable={isEditable}
      />
      <ClearFormattingButton activeEditor={editor} disabled={!isEditable} />
      <button
        disabled={!isEditable}
        onClick={() => {
          editor.dispatchCommand(OPEN_LINK_MODAL_COMMAND, {
            nodeKey: linkNodeKey,
            url: isLink ? linkUrl : '',
          });
        }}
        className={`flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-700 ${isLink ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-zinc-600 dark:text-zinc-300'}`}
        aria-label={isLink ? 'Edit link' : 'Insert link'}
        type="button"
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
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      </button>
      <Divider />
      <AlignmentButtons
        activeEditor={editor}
        elementFormat={elementFormat}
        isEditable={isEditable}
      />
      <IndentButtons activeEditor={editor} disabled={!isEditable} />
      <Divider />
      <InsertDropDown />
      <Divider />
      <FontDropDown editor={editor} value={fontFamily} disabled={!isEditable} />
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
            <path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z" />
            <path d="m5 2 5 5" />
            <path d="M2 13h15" />
            <path d="M22 20a2 2 0 1 1-4 0c0-1.6 1.7-2.4 2-4 .3 1.6 2 2.4 2 4Z" />
          </svg>
        }
      />
      <Divider />
      <TableToolbar />
    </div>
  );
}
