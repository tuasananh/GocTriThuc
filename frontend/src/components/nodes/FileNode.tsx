import type {
    DOMConversionMap,
    DOMConversionOutput,
    EditorConfig,
    LexicalNode,
    NodeKey,
    SerializedLexicalNode,
    Spread,
} from 'lexical';

import { $applyNodeReplacement, DecoratorNode } from 'lexical';
import * as React from 'react';
import { JSX, Suspense } from 'react';

const FileComponent = React.lazy(() => import('./FileComponent'));

export type SerializedFileNode = Spread<
    {
        src: string;
        fileName: string;
        fileSize?: string;
    },
    SerializedLexicalNode
>;

function $convertFileElement(domNode: HTMLElement): null | DOMConversionOutput {
    const src = domNode.getAttribute('data-lexical-file-src');
    const fileName = domNode.getAttribute('data-lexical-file-name');
    const fileSize = domNode.getAttribute('data-lexical-file-size') || undefined;
    if (src && fileName) {
        const node = $createFileNode(src, fileName, fileSize);
        return { node };
    }
    return null;
}

export class FileNode extends DecoratorNode<JSX.Element> {
    __src: string;
    __fileName: string;
    __fileSize?: string;

    static getType(): string {
        return 'file';
    }

    static clone(node: FileNode): FileNode {
        return new FileNode(node.__src, node.__fileName, node.__fileSize, node.__key);
    }

    static importJSON(serializedNode: SerializedFileNode): FileNode {
        const { src, fileName, fileSize } = serializedNode;
        return $createFileNode(src, fileName, fileSize).updateFromJSON(serializedNode);
    }

    constructor(src: string, fileName: string, fileSize?: string, key?: NodeKey) {
        super(key);
        this.__src = src;
        this.__fileName = fileName;
        this.__fileSize = fileSize;
    }

    exportJSON(): SerializedFileNode {
        return {
            ...super.exportJSON(),
            src: this.__src,
            fileName: this.__fileName,
            fileSize: this.__fileSize,
        };
    }

    createDOM(config: EditorConfig): HTMLElement {
        const elem = document.createElement('span');
        elem.style.display = 'inline-block';
        return elem;
    }

    updateDOM(): false {
        return false;
    }

    static importDOM(): DOMConversionMap | null {
        return {
            span: (domNode: HTMLElement) => {
                if (!domNode.hasAttribute('data-lexical-file-src')) {
                    return null;
                }
                return {
                    conversion: $convertFileElement,
                    priority: 1,
                };
            },
        };
    }

    exportDOM(): { element: HTMLElement } {
        const element = document.createElement('span');
        element.setAttribute('data-lexical-file-src', this.__src);
        element.setAttribute('data-lexical-file-name', this.__fileName);
        if (this.__fileSize) {
            element.setAttribute('data-lexical-file-size', this.__fileSize);
        }
        element.innerText = this.__fileName;
        return { element };
    }

    decorate(): JSX.Element {
        return (
            <Suspense fallback={null}>
                <FileComponent
                    src={this.__src}
                    fileName={this.__fileName}
                    fileSize={this.__fileSize}
                    nodeKey={this.__key}
                />
            </Suspense>
        );
    }
}

export function $createFileNode(src: string, fileName: string, fileSize?: string): FileNode {
    return $applyNodeReplacement(new FileNode(src, fileName, fileSize));
}

export function $isFileNode(
    node: LexicalNode | null | undefined,
): node is FileNode {
    return node instanceof FileNode;
}
