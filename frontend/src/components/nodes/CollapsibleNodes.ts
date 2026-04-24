/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  $createParagraphNode,
  $isElementNode,
  EditorConfig,
  ElementNode,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedElementNode,
  Spread,
} from 'lexical';

// CollapsibleContainerNode
type SerializedCollapsibleContainerNode = Spread<
  {
    open: boolean;
  },
  SerializedElementNode
>;

export class CollapsibleContainerNode extends ElementNode {
  __open: boolean;

  constructor(open: boolean, key?: NodeKey) {
    super(key);
    this.__open = open;
  }

  static getType(): string {
    return 'collapsible-container';
  }

  static clone(node: CollapsibleContainerNode): CollapsibleContainerNode {
    return new CollapsibleContainerNode(node.__open, node.__key);
  }

  createDOM(_config: EditorConfig, editor: LexicalEditor): HTMLElement {
    const dom = document.createElement('details');
    dom.classList.add('Collapsible__container');
    dom.open = this.__open;
    dom.addEventListener('toggle', () => {
      const open = editor.getEditorState().read(() => this.getOpen());
      if (open !== dom.open) {
        editor.update(() => this.toggleOpen());
      }
    });
    return dom;
  }

  updateDOM(prevNode: this, dom: HTMLDetailsElement): boolean {
    const currentOpen = this.__open;
    if (prevNode.__open !== currentOpen) {
      dom.open = currentOpen;
    }
    return false;
  }

  static importJSON(serializedNode: SerializedCollapsibleContainerNode): CollapsibleContainerNode {
    return $createCollapsibleContainerNode(serializedNode.open).updateFromJSON(serializedNode);
  }

  exportJSON(): SerializedCollapsibleContainerNode {
    return {
      ...super.exportJSON(),
      open: this.__open,
    };
  }

  setOpen(open: boolean): this {
    const writable = this.getWritable();
    writable.__open = open;
    return writable;
  }

  getOpen(): boolean {
    return this.getLatest().__open;
  }

  toggleOpen(): this {
    return this.setOpen(!this.getOpen());
  }
}

export function $createCollapsibleContainerNode(isOpen: boolean): CollapsibleContainerNode {
  return new CollapsibleContainerNode(isOpen);
}

export function $isCollapsibleContainerNode(
  node: LexicalNode | null | undefined,
): node is CollapsibleContainerNode {
  return node instanceof CollapsibleContainerNode;
}

// CollapsibleTitleNode
export class CollapsibleTitleNode extends ElementNode {
  static getType(): string {
    return 'collapsible-title';
  }

  static clone(node: CollapsibleTitleNode): CollapsibleTitleNode {
    return new CollapsibleTitleNode(node.__key);
  }

  createDOM(): HTMLElement {
    const dom = document.createElement('summary');
    dom.classList.add('Collapsible__title');
    return dom;
  }

  updateDOM(): boolean {
    return false;
  }

  collapseAtStart(): boolean {
    const containerNode = this.getParentOrThrow();
    if (!$isCollapsibleContainerNode(containerNode)) {
      return false;
    }

    const contentNode = this.getNextSibling();
    if (!$isCollapsibleContentNode(contentNode)) {
      return false;
    }

    const firstChild = this.getFirstChild();
    if (firstChild !== null && firstChild.getTextContentSize() > 0) {
      return false;
    }

    // Move content out and remove container
    const children = contentNode.getChildren();
    for (const child of children) {
      containerNode.insertBefore(child);
    }
    containerNode.remove();
    return true;
  }

  insertNewAfter(_: unknown, restoreSelection = true): ElementNode {
    const containerNode = this.getParentOrThrow();

    if (!$isCollapsibleContainerNode(containerNode)) {
      throw new Error('CollapsibleTitleNode expects to be child of CollapsibleContainerNode');
    }

    if (containerNode.getOpen()) {
      const contentNode = this.getNextSibling();
      if (!$isCollapsibleContentNode(contentNode)) {
        throw new Error('CollapsibleTitleNode expects to have CollapsibleContentNode sibling');
      }

      const firstChild = contentNode.getFirstChild();
      if ($isElementNode(firstChild)) {
        return firstChild;
      } else {
        const paragraph = $createParagraphNode();
        contentNode.append(paragraph);
        return paragraph;
      }
    } else {
      const paragraph = $createParagraphNode();
      containerNode.insertAfter(paragraph, restoreSelection);
      return paragraph;
    }
  }

  static importJSON(serializedNode: SerializedElementNode): CollapsibleTitleNode {
    return $createCollapsibleTitleNode().updateFromJSON(serializedNode);
  }

  exportJSON(): SerializedElementNode {
    return {
      ...super.exportJSON(),
    };
  }
}

export function $createCollapsibleTitleNode(): CollapsibleTitleNode {
  return new CollapsibleTitleNode();
}

export function $isCollapsibleTitleNode(
  node: LexicalNode | null | undefined,
): node is CollapsibleTitleNode {
  return node instanceof CollapsibleTitleNode;
}

// CollapsibleContentNode
export class CollapsibleContentNode extends ElementNode {
  static getType(): string {
    return 'collapsible-content';
  }

  static clone(node: CollapsibleContentNode): CollapsibleContentNode {
    return new CollapsibleContentNode(node.__key);
  }

  createDOM(): HTMLElement {
    const dom = document.createElement('div');
    dom.classList.add('Collapsible__content');
    return dom;
  }

  updateDOM(): boolean {
    return false;
  }

  static importJSON(serializedNode: SerializedElementNode): CollapsibleContentNode {
    return $createCollapsibleContentNode().updateFromJSON(serializedNode);
  }

  exportJSON(): SerializedElementNode {
    return {
      ...super.exportJSON(),
    };
  }

  isShadowRoot(): boolean {
    return true;
  }
}

export function $createCollapsibleContentNode(): CollapsibleContentNode {
  return new CollapsibleContentNode();
}

export function $isCollapsibleContentNode(
  node: LexicalNode | null | undefined,
): node is CollapsibleContentNode {
  return node instanceof CollapsibleContentNode;
}
