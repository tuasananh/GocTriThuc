/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { TabIndentationExtension } from '@lexical/extension';
import { HistoryExtension } from '@lexical/history';
import { ListExtension } from '@lexical/list';
import { CodeExtension } from '@lexical/code';
import { LinkExtension } from '@lexical/link';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalExtensionComposer } from '@lexical/react/LexicalExtensionComposer';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import { RichTextExtension } from '@lexical/rich-text';
import { FileNode } from './nodes/FileNode';
import FilePlugin from './plugins/FilePlugin';
import { defineExtension } from 'lexical';
import { useState } from 'react';

import { DragPlugin } from './plugins/DragPlugin';
import { SlashMenuPlugin } from './plugins/SlashMenuPlugin';
import { ToolbarPlugin } from './plugins/ToolbarPlugin';
import { CodeHighlightPlugin } from './plugins/CodeHighlightPlugin';
import { CollapsiblePlugin } from './plugins/CollapsiblePlugin';
import { UniversalLinkPlugin } from './plugins/UniversalLinkPlugin';
import ImagePlugin from './plugins/ImagePlugin';
import YouTubePlugin from './plugins/YouTubePlugin';
import AutoEmbedPlugin from './plugins/AutoEmbedPlugin';
import InsertPlugin from './plugins/InsertPlugin';
import TableActionMenuPlugin from './plugins/TableActionMenuPlugin';
import TableCellResizerPlugin from './plugins/TableCellResizer';
import EquationsPlugin from './plugins/EquationsPlugin';
import EmojiPickerPlugin from './plugins/EmojiPickerPlugin';
import { EmojisExtension } from './plugins/EmojisExtension';
import { TableNode, TableCellNode, TableRowNode } from '@lexical/table';
import { ImageNode } from './nodes/ImageNode';
import { YouTubeNode } from './nodes/YouTubeNode';
import { EquationNode } from './nodes/EquationNode';
import { EmojiNode } from './nodes/EmojiNode';
import {
  CollapsibleContainerNode,
  CollapsibleContentNode,
  CollapsibleTitleNode,
} from './nodes/CollapsibleNodes';

const theme = {
  heading: {
    h1: 'mt-2 mb-1 text-[1.75rem] font-bold leading-[1.25]',
    h2: 'mt-2 mb-[0.15rem] text-[1.3rem] font-semibold leading-[1.3]',
    h3: 'mt-[0.4rem] mb-[0.1rem] text-[1.1rem] font-semibold leading-[1.35]',
  },
  list: {
    listitem: 'my-[0.1rem] leading-[1.6]',
    listitemChecked: 'editor-listitem-checklist editor-listitem-checklist-checked',
    listitemUnchecked: 'editor-listitem-checklist',
    ol: 'my-[0.2rem] pl-5 list-decimal',
    ul: 'my-[0.2rem] pl-5 list-disc',
  },
  paragraph: 'my-0 py-0.5 leading-[1.6]',
  quote:
    'my-[0.4rem] border-l-[3px] [border-left-style:solid] border-zinc-300 pl-3.5 italic text-zinc-500 dark:border-zinc-700 dark:text-zinc-400',
  code: 'editor-code',
  codeHighlight: {
    atrule: 'editor-token-atrule',
    attrName: 'editor-token-attrName',
    attrValue: 'editor-token-attrValue',
    boolean: 'editor-token-boolean',
    builtin: 'editor-token-builtin',
    cdata: 'editor-token-cdata',
    char: 'editor-token-char',
    class: 'editor-token-class',
    className: 'editor-token-className',
    comment: 'editor-token-comment',
    constant: 'editor-token-constant',
    deleted: 'editor-token-deleted',
    doctype: 'editor-token-doctype',
    entity: 'editor-token-entity',
    function: 'editor-token-function',
    important: 'editor-token-important',
    inserted: 'editor-token-inserted',
    keyword: 'editor-token-keyword',
    namespace: 'editor-token-namespace',
    number: 'editor-token-number',
    operator: 'editor-token-operator',
    prolog: 'editor-token-prolog',
    property: 'editor-token-property',
    punctuation: 'editor-token-punctuation',
    regex: 'editor-token-regex',
    selector: 'editor-token-selector',
    string: 'editor-token-string',
    symbol: 'editor-token-symbol',
    tag: 'editor-token-tag',
    url: 'editor-token-url',
    variable: 'editor-token-variable',
  },
  link: 'editor-link',
  text: {
    bold: 'font-bold',
    code: 'rounded-[3px] bg-[rgba(135,131,120,0.15)] px-[0.3em] py-[0.1em] font-mono text-[0.875em] dark:bg-white/10',
    italic: 'italic',
    strikethrough: 'editor-text-strikethrough',
    subscript: 'editor-text-subscript',
    superscript: 'editor-text-superscript',
    underline: 'editor-text-underline',
    underlineStrikethrough: 'editor-text-underline-strikethrough',
  },
  equation: 'EquationNode_equation',
};

const editorExtension = defineExtension({
  dependencies: [
    RichTextExtension,
    HistoryExtension,
    ListExtension,
    TabIndentationExtension,
    CodeExtension,
    LinkExtension,
    EmojisExtension,
  ],
  nodes: [
    TableNode,
    TableCellNode,
    TableRowNode,
    CollapsibleContainerNode,
    CollapsibleTitleNode,
    CollapsibleContentNode,
    ImageNode,
    YouTubeNode,
    EquationNode,
    EmojiNode,
    HorizontalRuleNode,
    FileNode,
  ],
  name: '@lexical/website/notion-like-editor',
  namespace: '@lexical/website/notion-like-editor',
  theme,
});

import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TRANSFORMERS } from '@lexical/markdown';
import { EQUATION } from './plugins/EquationsPlugin/EquationTransformer';

export default function Editor() {
  const [anchorElem, setAnchorElem] = useState<HTMLElement | null>(null);

  return (
    <LexicalExtensionComposer extension={editorExtension} contentEditable={null}>
      <div className="relative w-full overflow-hidden rounded-lg border border-solid border-zinc-200 bg-white dark:border-white/[0.12] dark:bg-[#1f1f21]">
        <ToolbarPlugin />
        <div className="relative" ref={setAnchorElem}>
          <ContentEditable
            className="h-[400px] overflow-y-auto px-14 py-5 text-black outline-none max-[996px]:h-[260px] dark:text-zinc-200"
            aria-label="Rich text editor"
            aria-placeholder="Type '/' for commands..."
            placeholder={
              <div className="pointer-events-none absolute top-[22px] left-14 text-[0.95rem] text-zinc-400 select-none">
                Type &apos;/&apos; for commands...
              </div>
            }
          />
          <SlashMenuPlugin />
          <ListPlugin />
          <CheckListPlugin />
          <LinkPlugin />
          <UniversalLinkPlugin />
          <CodeHighlightPlugin />
          <CollapsiblePlugin />
          <ImagePlugin />
          <YouTubePlugin />
          <AutoEmbedPlugin />
          <InsertPlugin />
          <TablePlugin />
          <TableCellResizerPlugin />
          <HorizontalRulePlugin />
          <FilePlugin />
          {anchorElem && <TableActionMenuPlugin anchorElem={anchorElem} cellMerge={true} />}
          <EquationsPlugin />
          <EmojiPickerPlugin />
          <MarkdownShortcutPlugin transformers={[...TRANSFORMERS, EQUATION]} />
          {anchorElem ? <DragPlugin anchorElem={anchorElem} /> : null}
        </div>
      </div>
    </LexicalExtensionComposer>
  );
}
