/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { LexicalEditor } from 'lexical';
import DropDown, { DropDownItem } from '../../ui/DropDown';
import {
  formatBulletList,
  formatCheckList,
  formatCode,
  formatHeading,
  formatNumberedList,
  formatParagraph,
  formatQuote,
} from './utils';

import { blockTypeToBlockName } from './constants';

const blockTypeToIcon = {
  paragraph: (
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
      <path d="M2 12h20M2 5h20M2 19h20" />
    </svg>
  ),
  h1: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12h8m-8-6v12m8-12v12m5 0v-6a2 2 0 0 1 4 0v6" />
    </svg>
  ),
  h2: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12h8m-8-6v12m8-12v12m5 6v-1a3 3 0 0 1 3-3h1a3 3 0 0 0 3-3V6" />
    </svg>
  ),
  h3: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12h8m-8-6v12m8-12v12m5 4h2a2 2 0 0 0 2-2 2 2 0 0 0-2-2h-2m2-4a2 2 0 0 0-2-2h-2" />
    </svg>
  ),
  bullet: (
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
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  number: (
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
      <line x1="10" y1="6" x2="21" y2="6" />
      <line x1="10" y1="12" x2="21" y2="12" />
      <line x1="10" y1="18" x2="21" y2="18" />
      <path d="M4 6h1v4" />
      <path d="M4 10h2" />
      <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
    </svg>
  ),
  check: (
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
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  ),
  quote: (
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
      <path d="M3 21c3 0 7-1 7-8V5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v8c0 2.2 1.8 4 4 4" />
      <path d="M15 21c3 0 7-1 7-8V5c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v8c0 2.2 1.8 4 4 4" />
    </svg>
  ),
  code: (
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
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
};

export function BlockFormatDropDown({
  editor,
  blockType,
  disabled = false,
}: {
  blockType: keyof typeof blockTypeToBlockName;
  editor: LexicalEditor;
  disabled?: boolean;
}) {
  return (
    <DropDown
      disabled={disabled}
      buttonClassName="flex items-center gap-2 px-2 h-8 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-zinc-600 dark:text-zinc-300"
      buttonLabel={blockTypeToBlockName[blockType]}
      buttonIconClassName="flex items-center justify-center w-4 h-4 opacity-70"
      buttonContent={blockTypeToIcon[blockType]}
      buttonAriaLabel="Formatting options for text style"
    >
      <DropDownItem
        className={`flex items-center gap-2 px-3 py-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer ${
          blockType === 'paragraph' ? 'bg-zinc-50 dark:bg-zinc-800' : ''
        }`}
        onClick={() => formatParagraph(editor)}
      >
        <span className="opacity-70">{blockTypeToIcon.paragraph}</span>
        <span className="text-sm font-medium">Normal</span>
      </DropDownItem>
      <DropDownItem
        className={`flex items-center gap-2 px-3 py-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer ${
          blockType === 'h1' ? 'bg-zinc-50 dark:bg-zinc-800' : ''
        }`}
        onClick={() => formatHeading(editor, blockType, 'h1')}
      >
        <span className="opacity-70">{blockTypeToIcon.h1}</span>
        <span className="text-sm font-medium">Heading 1</span>
      </DropDownItem>
      <DropDownItem
        className={`flex items-center gap-2 px-3 py-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer ${
          blockType === 'h2' ? 'bg-zinc-50 dark:bg-zinc-800' : ''
        }`}
        onClick={() => formatHeading(editor, blockType, 'h2')}
      >
        <span className="opacity-70">{blockTypeToIcon.h2}</span>
        <span className="text-sm font-medium">Heading 2</span>
      </DropDownItem>
      <DropDownItem
        className={`flex items-center gap-2 px-3 py-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer ${
          blockType === 'h3' ? 'bg-zinc-50 dark:bg-zinc-800' : ''
        }`}
        onClick={() => formatHeading(editor, blockType, 'h3')}
      >
        <span className="opacity-70">{blockTypeToIcon.h3}</span>
        <span className="text-sm font-medium">Heading 3</span>
      </DropDownItem>
      <DropDownItem
        className={`flex items-center gap-2 px-3 py-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer ${
          blockType === 'bullet' ? 'bg-zinc-50 dark:bg-zinc-800' : ''
        }`}
        onClick={() => formatBulletList(editor, blockType)}
      >
        <span className="opacity-70">{blockTypeToIcon.bullet}</span>
        <span className="text-sm font-medium">Bullet List</span>
      </DropDownItem>
      <DropDownItem
        className={`flex items-center gap-2 px-3 py-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer ${
          blockType === 'number' ? 'bg-zinc-50 dark:bg-zinc-800' : ''
        }`}
        onClick={() => formatNumberedList(editor, blockType)}
      >
        <span className="opacity-70">{blockTypeToIcon.number}</span>
        <span className="text-sm font-medium">Numbered List</span>
      </DropDownItem>
      <DropDownItem
        className={`flex items-center gap-2 px-3 py-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer ${
          blockType === 'check' ? 'bg-zinc-50 dark:bg-zinc-800' : ''
        }`}
        onClick={() => formatCheckList(editor, blockType)}
      >
        <span className="opacity-70">{blockTypeToIcon.check}</span>
        <span className="text-sm font-medium">Check List</span>
      </DropDownItem>
      <DropDownItem
        className={`flex items-center gap-2 px-3 py-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer ${
          blockType === 'quote' ? 'bg-zinc-50 dark:bg-zinc-800' : ''
        }`}
        onClick={() => formatQuote(editor, blockType)}
      >
        <span className="opacity-70">{blockTypeToIcon.quote}</span>
        <span className="text-sm font-medium">Quote</span>
      </DropDownItem>
      <DropDownItem
        className={`flex items-center gap-2 px-3 py-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer ${
          blockType === 'code' ? 'bg-zinc-50 dark:bg-zinc-800' : ''
        }`}
        onClick={() => formatCode(editor, blockType)}
      >
        <span className="opacity-70">{blockTypeToIcon.code}</span>
        <span className="text-sm font-medium">Code Block</span>
      </DropDownItem>
    </DropDown>
  );
}
