/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { $isAtNodeEnd } from '@lexical/selection';
import { ElementNode, RangeSelection, TextNode } from 'lexical';

export function getSelectedNode(selection: RangeSelection): TextNode | ElementNode {
  const anchorNode = selection.anchor.getNode();
  const focusNode = selection.focus.getNode();
  if (anchorNode === focusNode) {
    return anchorNode;
  }
  const isBackward = selection.isBackward();
  if (isBackward) {
    return $isAtNodeEnd(selection.focus) ? anchorNode : focusNode;
  } else {
    return $isAtNodeEnd(selection.anchor) ? anchorNode : focusNode;
  }
}

export function setFloatingElemPositionForLinkEditor(
  targetRect: DOMRect | null,
  floatingElem: HTMLElement,
  anchorElem: HTMLElement,
): void {
  const scrollerElem = anchorElem.parentElement;

  if (targetRect === null || !scrollerElem) {
    floatingElem.style.opacity = '0';
    floatingElem.style.transform = 'translate(-10000px, -10000px)';
    return;
  }

  const floatingElemRect = floatingElem.getBoundingClientRect();
  const anchorElementRect = anchorElem.getBoundingClientRect();
  const editorScrollerRect = scrollerElem.getBoundingClientRect();

  // Use a default height if the element hasn't been measured yet to avoid overlap
  const floatingHeight = floatingElemRect.height || 45;
  const effectiveVerticalGap = 15; // Increased gap for better look

  let top = targetRect.top - floatingHeight - effectiveVerticalGap;
  let left = targetRect.left;

  // If it hits the top of the scroller, show it below the target instead
  if (top < editorScrollerRect.top + 10) {
    top = targetRect.bottom + effectiveVerticalGap;
  }

  // Ensure it's not cut off on the right
  if (left + floatingElemRect.width > window.innerWidth - 20) {
    left = window.innerWidth - floatingElemRect.width - 20;
  }

  // Horizontal centering relative to the block/link can be tricky,
  // let's stick to the left but ensure it's not off-screen left
  if (left < 10) {
    left = 10;
  }

  top -= anchorElementRect.top;
  left -= anchorElementRect.left;

  floatingElem.style.opacity = '1';
  floatingElem.style.transform = `translate(${left}px, ${top}px)`;
}

const SUPPORTED_URL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'sms:', 'tel:']);

export function sanitizeUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);

    if (!SUPPORTED_URL_PROTOCOLS.has(parsedUrl.protocol)) {
      return 'about:blank';
    }
  } catch {
    return url;
  }
  return url;
}
