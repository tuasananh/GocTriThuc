/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
    DOMConversionMap,
    DOMConversionOutput,
    DOMExportOutput,
    EditorConfig,
    LexicalEditor,
    LexicalNode,
    NodeKey,
    SerializedLexicalNode,
    Spread,
} from 'lexical';

import { $applyNodeReplacement, DecoratorNode } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import {
    $getNodeByKey,
    $getSelection,
    $isNodeSelection,
    CLICK_COMMAND,
    COMMAND_PRIORITY_LOW,
    KEY_BACKSPACE_COMMAND,
    KEY_DELETE_COMMAND,
} from 'lexical';
import * as React from 'react';
import { useCallback, useEffect, useRef } from 'react';

import ImageResizer from './ImageResizer';
import ImageToolbar from './ImageToolbar';

// --- Types ---

export interface ImagePayload {
    altText: string;
    height?: number;
    key?: NodeKey;
    maxWidth?: number;
    src: string;
    width?: number;
    rounded?: boolean;
    lockAspectRatio?: boolean;
}

export type SerializedImageNode = Spread<
    {
        altText: string;
        height?: number;
        maxWidth: number;
        src: string;
        width?: number;
        rounded?: boolean;
        lockAspectRatio?: boolean;
    },
    SerializedLexicalNode
>;

// --- ImageComponent ---

function ImageComponent({
    src,
    altText,
    nodeKey,
    width,
    height,
    maxWidth,
    rounded,
    lockAspectRatio,
}: {
    altText: string;
    height: 'inherit' | number;
    maxWidth: number;
    nodeKey: NodeKey;
    src: string;
    width: 'inherit' | number;
    rounded: boolean;
    lockAspectRatio: boolean;
}) {
    const imageRef = useRef<HTMLImageElement>(null);
    const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
    const [editor] = useLexicalComposerContext();

    const onDelete = useCallback(
        (payload: KeyboardEvent) => {
            if (isSelected && $isNodeSelection($getSelection())) {
                const event: KeyboardEvent = payload;
                event.preventDefault();
                const node = $getNodeByKey(nodeKey);
                if ($isImageNode(node)) {
                    node.remove();
                }
                return true;
            }
            return false;
        },
        [isSelected, nodeKey],
    );

    useEffect(() => {
        return mergeRegister(
            editor.registerCommand(
                CLICK_COMMAND,
                (payload) => {
                    const event = payload;
                    if (event.target === imageRef.current) {
                        event.preventDefault();
                        event.stopPropagation();
                        if (event.shiftKey) {
                            setSelected(!isSelected);
                        } else {
                            clearSelection();
                            setSelected(true);
                        }
                        return true;
                    }
                    return false;
                },
                COMMAND_PRIORITY_LOW,
            ),
            editor.registerCommand(
                KEY_DELETE_COMMAND,
                onDelete,
                COMMAND_PRIORITY_LOW,
            ),
            editor.registerCommand(
                KEY_BACKSPACE_COMMAND,
                onDelete,
                COMMAND_PRIORITY_LOW,
            ),
        );
    }, [clearSelection, editor, isSelected, nodeKey, onDelete, setSelected]);

    const onResizeEnd = (nextWidth: number, nextHeight: number) => {
        editor.update(() => {
            const node = $getNodeByKey(nodeKey);
            if ($isImageNode(node)) {
                node.setWidthAndHeight(nextWidth, nextHeight);
            }
        });
    };

    const onToggleRounded = () => {
        editor.update(() => {
            const node = $getNodeByKey(nodeKey);
            if ($isImageNode(node)) {
                node.setRounded(!node.getRounded());
            }
        });
    };

    const onToggleLockRatio = () => {
        editor.update(() => {
            const node = $getNodeByKey(nodeKey);
            if ($isImageNode(node)) {
                node.setLockAspectRatio(!node.getLockAspectRatio());
            }
        });
    };

    return (
        <div className="relative inline-block my-2" style={{ maxWidth }}>
            <div className="relative w-fit">
                <img
                    className={`block transition-shadow ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:ring-1 hover:ring-zinc-300'} ${rounded ? 'editor-image-rounded' : 'rounded-sm'}`}
                    src={src}
                    alt={altText}
                    ref={imageRef}
                    style={{
                        width: width === 'inherit' ? 'auto' : width,
                        height: height === 'inherit' ? 'auto' : height,
                        maxWidth: '100%',
                    }}
                    draggable={false}
                />
                {isSelected && (
                    <>
                        <ImageToolbar
                            isRounded={rounded}
                            onToggleRounded={onToggleRounded}
                            isLockRatio={lockAspectRatio}
                            onToggleLockRatio={onToggleLockRatio}
                        />
                        <ImageResizer
                            imageRef={imageRef}
                            onResizeEnd={onResizeEnd}
                            lockAspectRatio={lockAspectRatio}
                        />
                    </>
                )}
            </div>
        </div>
    );
}

// --- ImageNode ---

export class ImageNode extends DecoratorNode<React.JSX.Element> {
    __src: string;
    __altText: string;
    __width: 'inherit' | number;
    __height: 'inherit' | number;
    __maxWidth: number;
    __rounded: boolean;
    __lockAspectRatio: boolean;

    static getType(): string {
        return 'image';
    }

    static clone(node: ImageNode): ImageNode {
        return new ImageNode(
            node.__src,
            node.__altText,
            node.__maxWidth,
            node.__width,
            node.__height,
            node.__rounded,
            node.__lockAspectRatio,
            node.__key,
        );
    }

    static importJSON(serializedNode: SerializedImageNode): ImageNode {
        const { altText, height, maxWidth, src, width, rounded, lockAspectRatio } = serializedNode;
        const node = $createImageNode({
            altText,
            height,
            maxWidth,
            src,
            width,
            rounded,
            lockAspectRatio,
        });
        return node;
    }

    exportDOM(): DOMExportOutput {
        const element = document.createElement('img');
        element.setAttribute('src', this.__src);
        element.setAttribute('alt', this.__altText);
        element.setAttribute('width', this.__width.toString());
        element.setAttribute('height', this.__height.toString());
        if (this.__rounded) {
            element.classList.add('editor-image-rounded');
        }
        return { element };
    }

    static importDOM(): DOMConversionMap | null {
        return {
            img: (node: Node) => ({
                conversion: convertImageElement,
                priority: 0,
            }),
        };
    }

    constructor(
        src: string,
        altText: string,
        maxWidth: number,
        width?: 'inherit' | number,
        height?: 'inherit' | number,
        rounded?: boolean,
        lockAspectRatio?: boolean,
        key?: NodeKey,
    ) {
        super(key);
        this.__src = src;
        this.__altText = altText;
        this.__maxWidth = maxWidth;
        this.__width = width || 'inherit';
        this.__height = height || 'inherit';
        this.__rounded = !!rounded;
        this.__lockAspectRatio = !!lockAspectRatio;
    }

    exportJSON(): SerializedImageNode {
        return {
            altText: this.getAltText(),
            height: this.__height === 'inherit' ? 0 : this.__height,
            maxWidth: this.__maxWidth,
            src: this.getSrc(),
            rounded: this.__rounded,
            lockAspectRatio: this.__lockAspectRatio,
            type: 'image',
            version: 1,
            width: this.__width === 'inherit' ? 0 : this.__width,
        };
    }

    setWidthAndHeight(
        width: 'inherit' | number,
        height: 'inherit' | number,
    ): void {
        const writable = this.getWritable();
        writable.__width = width;
        writable.__height = height;
    }

    setRounded(rounded: boolean): void {
        const writable = this.getWritable();
        writable.__rounded = rounded;
    }

    getRounded(): boolean {
        return this.__rounded;
    }

    setLockAspectRatio(lock: boolean): void {
        const writable = this.getWritable();
        writable.__lockAspectRatio = lock;
    }

    getLockAspectRatio(): boolean {
        return this.__lockAspectRatio;
    }

    createDOM(config: EditorConfig): HTMLElement {
        const span = document.createElement('span');
        const theme = config.theme;
        const className = theme.image as string | undefined;
        if (className !== undefined) {
            span.className = className;
        }
        return span;
    }

    updateDOM(): false {
        return false;
    }

    getSrc(): string {
        return this.__src;
    }

    getAltText(): string {
        return this.__altText;
    }

    decorate(): React.JSX.Element {
        return (
            <ImageComponent
                src={this.__src}
                altText={this.__altText}
                width={this.__width}
                height={this.__height}
                maxWidth={this.__maxWidth}
                rounded={this.__rounded}
                lockAspectRatio={this.__lockAspectRatio}
                nodeKey={this.getKey()}
            />
        );
    }
}

function convertImageElement(domNode: Node): null | DOMConversionOutput {
    if (domNode instanceof HTMLImageElement) {
        const { alt: altText, src, width, height } = domNode;
        const rounded = domNode.classList.contains('editor-image-rounded');
        const node = $createImageNode({ altText, height, src, width, rounded });
        return { node };
    }
    return null;
}

export function $createImageNode({
    altText,
    height,
    maxWidth = 500,
    src,
    width,
    rounded,
    lockAspectRatio,
    key,
}: ImagePayload): ImageNode {
    return $applyNodeReplacement(
        new ImageNode(src, altText, maxWidth, width, height, rounded, lockAspectRatio, key),
    );
}

export function $isImageNode(
    node: LexicalNode | null | undefined,
): node is ImageNode {
    return node instanceof ImageNode;
}
