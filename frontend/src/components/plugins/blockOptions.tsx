/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_CHECK_LIST_COMMAND,
} from '@lexical/list';
import { INSERT_COLLAPSIBLE_COMMAND } from './CollapsiblePlugin';
import {
  OPEN_INSERT_IMAGE_MODAL_COMMAND,
  OPEN_INSERT_YOUTUBE_MODAL_COMMAND,
  OPEN_INSERT_TABLE_MODAL_COMMAND,
  OPEN_INSERT_EQUATION_MODAL_COMMAND,
} from './InsertPluginRegistry';
import { MenuOption } from '@lexical/react/LexicalTypeaheadMenuPlugin';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { $createCodeNode } from '@lexical/code';
import { $setBlocksType } from '@lexical/selection';
import { $createParagraphNode, $getSelection, $isRangeSelection, LexicalEditor } from 'lexical';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
import { INSERT_FILE_COMMAND } from './FilePlugin';

export const ICON_URLS = {
  bullet: '/img/list-ul.svg',
  check: '/img/list-check.svg',
  code: '/img/code-slash.svg',
  h1: '/img/type-h1.svg',
  h2: '/img/type-h2.svg',
  h3: '/img/type-h3.svg',
  number: '/img/list-ol.svg',
  paragraph: '/img/text-paragraph.svg',
  quote: '/img/chat-square-quote.svg',
  toggle: '/img/caret-right-fill.svg',
  image: '/img/image.svg',
  youtube: '/img/youtube.svg',
  table: '/img/table.svg',
  equation: '/img/calculator.svg',
  divider: '/img/divider.svg',
  file: '/img/file-earmark.svg',
} as const;

export type IconKey = keyof typeof ICON_URLS;

interface BlockOptionConfig {
  iconKey: IconKey;
  keywords?: string[];
  onSelect: () => void;
}

export class BlockOption extends MenuOption {
  iconKey: IconKey;
  keywords: string[];
  onSelect: () => void;

  constructor(title: string, { iconKey, keywords = [], onSelect }: BlockOptionConfig) {
    super(title);
    this.iconKey = iconKey;
    this.keywords = keywords;
    this.onSelect = onSelect;
  }
}

export function getBlockOptions(editor: LexicalEditor): BlockOption[] {
  return [
    new BlockOption('Text', {
      iconKey: 'paragraph',
      keywords: ['paragraph', 'text', 'p', 'normal'],
      onSelect: () =>
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createParagraphNode());
          }
        }),
    }),
    new BlockOption('Heading 1', {
      iconKey: 'h1',
      keywords: ['heading', 'title', 'h1'],
      onSelect: () =>
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createHeadingNode('h1'));
          }
        }),
    }),
    new BlockOption('Heading 2', {
      iconKey: 'h2',
      keywords: ['heading', 'subtitle', 'h2'],
      onSelect: () =>
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createHeadingNode('h2'));
          }
        }),
    }),
    new BlockOption('Heading 3', {
      iconKey: 'h3',
      keywords: ['heading', 'h3'],
      onSelect: () =>
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createHeadingNode('h3'));
          }
        }),
    }),
    new BlockOption('Bulleted List', {
      iconKey: 'bullet',
      keywords: ['bulleted list', 'unordered list', 'ul'],
      onSelect: () => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined),
    }),
    new BlockOption('Numbered List', {
      iconKey: 'number',
      keywords: ['numbered list', 'ordered list', 'ol'],
      onSelect: () => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined),
    }),
    new BlockOption('Check List', {
      iconKey: 'check',
      keywords: ['check list', 'todo list', 'checklist'],
      onSelect: () => editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined),
    }),
    new BlockOption('Quote', {
      iconKey: 'quote',
      keywords: ['quote', 'blockquote'],
      onSelect: () =>
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createQuoteNode());
          }
        }),
    }),
    new BlockOption('Code Block', {
      iconKey: 'code',
      keywords: ['code block', 'source code'],
      onSelect: () =>
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createCodeNode());
          }
        }),
    }),
    new BlockOption('Toggle Block', {
      iconKey: 'toggle',
      keywords: ['toggle', 'collapsible', 'expandable'],
      onSelect: () => editor.dispatchCommand(INSERT_COLLAPSIBLE_COMMAND, undefined),
    }),
    new BlockOption('Image', {
      iconKey: 'image',
      keywords: ['image', 'photo', 'picture', 'img'],
      onSelect: () => editor.dispatchCommand(OPEN_INSERT_IMAGE_MODAL_COMMAND, 'url'),
    }),
    new BlockOption('YouTube', {
      iconKey: 'youtube',
      keywords: ['youtube', 'video', 'embed'],
      onSelect: () => editor.dispatchCommand(OPEN_INSERT_YOUTUBE_MODAL_COMMAND, undefined),
    }),
    new BlockOption('Table', {
      iconKey: 'table',
      keywords: ['table', 'grid', 'spreadsheet', 'rows', 'columns'],
      onSelect: () => editor.dispatchCommand(OPEN_INSERT_TABLE_MODAL_COMMAND, undefined),
    }),
    new BlockOption('Inline Equation', {
      iconKey: 'equation',
      keywords: ['equation', 'latex', 'math', 'inline'],
      onSelect: () => editor.dispatchCommand(OPEN_INSERT_EQUATION_MODAL_COMMAND, true),
    }),
    new BlockOption('Block Equation', {
      iconKey: 'equation',
      keywords: ['equation', 'latex', 'math', 'block'],
      onSelect: () => editor.dispatchCommand(OPEN_INSERT_EQUATION_MODAL_COMMAND, false),
    }),
    new BlockOption('Divider', {
      iconKey: 'divider',
      keywords: ['divider', 'horizontal rule', 'hr', 'line'],
      onSelect: () => editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined),
    }),
    new BlockOption('File Attachment', {
      iconKey: 'file',
      keywords: ['file', 'attach', 'document', 'pdf'],
      onSelect: () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = () => {
              editor.dispatchCommand(INSERT_FILE_COMMAND, {
                src: reader.result as string,
                fileName: file.name,
                fileSize: `${(file.size / 1024).toFixed(1)} KB`,
              });
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
      },
    }),
  ];
}
