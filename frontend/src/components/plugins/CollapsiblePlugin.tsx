/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createParagraphNode,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
} from 'lexical';
import { useEffect } from 'react';

import {
  $createCollapsibleContainerNode,
  $createCollapsibleContentNode,
  $createCollapsibleTitleNode,
  CollapsibleContainerNode,
  CollapsibleContentNode,
  CollapsibleTitleNode,
} from '../nodes/CollapsibleNodes';

import { INSERT_COLLAPSIBLE_COMMAND } from './InsertPluginRegistry';
import * as React from 'react';

export { INSERT_COLLAPSIBLE_COMMAND } from './InsertPluginRegistry';

export function CollapsiblePlugin(): React.JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (
      !editor.hasNodes([CollapsibleContainerNode, CollapsibleTitleNode, CollapsibleContentNode])
    ) {
      throw new Error(
        'CollapsiblePlugin: CollapsibleContainerNode, CollapsibleTitleNode, or CollapsibleContentNode not registered on editor',
      );
    }

    return editor.registerCommand(
      INSERT_COLLAPSIBLE_COMMAND,
      () => {
        editor.update(() => {
          const selection = $getSelection();

          if ($isRangeSelection(selection)) {
            const titleNode = $createCollapsibleTitleNode();
            const contentNode = $createCollapsibleContentNode().append($createParagraphNode());
            const containerNode = $createCollapsibleContainerNode(true).append(
              titleNode,
              contentNode,
            );
            selection.insertNodes([containerNode]);
          }
        });
        return true;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection) && selection.isCollapsed()) {
          const anchorField = selection.anchor;
          if (anchorField.type === 'text') {
            const anchorNode = anchorField.getNode();
            const textContent = anchorNode.getTextContent();
            if (textContent.startsWith('> ')) {
              editor.update(() => {
                const parent = anchorNode.getParentOrThrow();
                if ($isElementNode(parent) && parent.getChildrenSize() === 1) {
                  anchorNode.setTextContent(textContent.slice(2));
                  editor.dispatchCommand(INSERT_COLLAPSIBLE_COMMAND, undefined);
                }
              });
            }
          }
        }
      });
    });
  }, [editor]);

  return null;
}
