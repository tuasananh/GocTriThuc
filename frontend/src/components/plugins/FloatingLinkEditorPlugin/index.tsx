/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import {
    $getSelection,
    $isNodeSelection,
    $isRangeSelection,
    BaseSelection,
    CLICK_COMMAND,
    COMMAND_PRIORITY_CRITICAL,
    COMMAND_PRIORITY_HIGH,
    COMMAND_PRIORITY_LOW,
    getDOMSelection,
    KEY_ESCAPE_COMMAND,
    LexicalEditor,
    SELECTION_CHANGE_COMMAND,
    $isElementNode,
} from 'lexical';
import { $isLinkNode, $isAutoLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $findMatchingParent, mergeRegister } from '@lexical/utils';
import { Dispatch, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { getSelectedNode, sanitizeUrl, setFloatingElemPositionForLinkEditor } from './utils';

function FloatingLinkEditor({
    editor,
    isLink,
    setIsLink,
    anchorElem,
    isLinkEditMode,
    setIsLinkEditMode,
}: {
    editor: LexicalEditor;
    isLink: boolean;
    setIsLink: Dispatch<boolean>;
    anchorElem: HTMLElement;
    isLinkEditMode: boolean;
    setIsLinkEditMode: Dispatch<boolean>;
}) {
    const editorRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [linkUrl, setLinkUrl] = useState('');
    const [editedLinkUrl, setEditedLinkUrl] = useState('');
    const [lastSelection, setLastSelection] = useState<BaseSelection | null>(null);

    const $updateLinkEditor = useCallback(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
            const node = getSelectedNode(selection);
            const linkParent = $findMatchingParent(node, $isLinkNode);

            if (linkParent) {
                setLinkUrl(linkParent.getURL());
            } else if ($isLinkNode(node)) {
                setLinkUrl(node.getURL());
            } else {
                setLinkUrl('');
            }
        } else if ($isNodeSelection(selection)) {
            const nodes = selection.getNodes();
            if (nodes.length > 0) {
                const node = nodes[0];
                const parent = node.getParent();
                if ($isLinkNode(parent)) {
                    setLinkUrl(parent.getURL());
                } else if ($isLinkNode(node)) {
                    setLinkUrl(node.getURL());
                } else {
                    setLinkUrl('');
                }
            }
        }

        const editorElem = editorRef.current;
        if (editorElem === null) {
            return;
        }

        const rootElement = editor.getRootElement();

        if (selection !== null && rootElement !== null && editor.isEditable()) {
            let domRect: DOMRect | undefined;

            if ($isNodeSelection(selection)) {
                const nodes = selection.getNodes();
                if (nodes.length > 0) {
                    const element = editor.getElementByKey(nodes[0].getKey());
                    if (element) {
                        domRect = element.getBoundingClientRect();
                    }
                }
            } else {
                const nativeSelection = getDOMSelection(editor._window);
                if (nativeSelection !== null && rootElement.contains(nativeSelection.anchorNode)) {
                    // Try to find the parent block element synchronously from the editor state
                    const blockNode = editor.getEditorState().read(() => {
                        const selection = $getSelection();
                        if ($isRangeSelection(selection)) {
                            const node = selection.anchor.getNode();
                            return $findMatchingParent(node, (n) => $isElementNode(n) && !n.isInline());
                        }
                        return null;
                    });

                    if ($isElementNode(blockNode)) {
                        const element = editor.getElementByKey(blockNode.getKey());
                        if (element) {
                            domRect = element.getBoundingClientRect();
                        }
                    }

                    // Fallback to the specific link element if block detection fails
                    if (!domRect) {
                        domRect = nativeSelection.anchorNode?.parentElement?.getBoundingClientRect();
                    }
                }
            }

            if (domRect && editorElem) {
                setFloatingElemPositionForLinkEditor(domRect, editorElem, anchorElem);
            }
            setLastSelection(selection);
        } else {
            const activeElement = document.activeElement;
            if (
                !activeElement ||
                (activeElement !== inputRef.current && !editorRef.current?.contains(activeElement))
            ) {
                if (rootElement !== null) {
                    setFloatingElemPositionForLinkEditor(null, editorElem, anchorElem);
                }
                setLastSelection(null);
                setIsLinkEditMode(false);
                setLinkUrl('');
            }
        }

        return true;
    }, [anchorElem, editor, setIsLinkEditMode, isLinkEditMode]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                editorRef.current &&
                !editorRef.current.contains(event.target as Node) &&
                isLink
            ) {
                setIsLink(false);
                setIsLinkEditMode(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isLink, setIsLink, setIsLinkEditMode]);

    useEffect(() => {
        const scrollerElem = anchorElem.parentElement;

        const update = () => {
            editor.getEditorState().read(() => {
                $updateLinkEditor();
            });
        };

        window.addEventListener('resize', update);

        if (scrollerElem) {
            scrollerElem.addEventListener('scroll', update);
        }

        return () => {
            window.removeEventListener('resize', update);

            if (scrollerElem) {
                scrollerElem.removeEventListener('scroll', update);
            }
        };
    }, [anchorElem.parentElement, editor, $updateLinkEditor]);

    useEffect(() => {
        return mergeRegister(
            editor.registerUpdateListener(({ editorState }) => {
                editorState.read(() => {
                    $updateLinkEditor();
                });
            }),

            editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                () => {
                    $updateLinkEditor();
                    return true;
                },
                COMMAND_PRIORITY_LOW,
            ),
            editor.registerCommand(
                KEY_ESCAPE_COMMAND,
                () => {
                    if (isLink) {
                        setIsLink(false);
                        return true;
                    }
                    return false;
                },
                COMMAND_PRIORITY_HIGH,
            ),
        );
    }, [editor, $updateLinkEditor, setIsLink, isLink]);

    useEffect(() => {
        editor.getEditorState().read(() => {
            $updateLinkEditor();
        });
    }, [editor, $updateLinkEditor]);

    useEffect(() => {
        if (isLinkEditMode && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isLinkEditMode]);

    const handleLinkSubmission = () => {
        if (lastSelection !== null) {
            if (editedLinkUrl !== '') {
                editor.dispatchCommand(TOGGLE_LINK_COMMAND, sanitizeUrl(editedLinkUrl));
            }
            setIsLinkEditMode(false);
        }
    };

    return (
        <div
            ref={editorRef}
            className="absolute top-0 left-0 z-50 flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg transition-opacity dark:border-zinc-700 dark:bg-[#232325]"
        >
            {!isLink ? null : isLinkEditMode ? (
                <div className="flex items-center gap-1">
                    <input
                        ref={inputRef}
                        className="w-48 rounded bg-zinc-50 px-2 py-1 text-sm outline-none dark:bg-zinc-800 dark:text-zinc-200"
                        value={editedLinkUrl}
                        onChange={(event) => {
                            setEditedLinkUrl(event.target.value);
                        }}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                event.preventDefault();
                                handleLinkSubmission();
                            } else if (event.key === 'Escape') {
                                event.preventDefault();
                                setIsLinkEditMode(false);
                            }
                        }}
                    />
                    <button
                        className="flex h-7 w-7 items-center justify-center rounded hover:bg-zinc-100 dark:hover:bg-zinc-700"
                        onClick={() => setIsLinkEditMode(false)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    </button>
                    <button
                        className="flex h-7 w-7 items-center justify-center rounded text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30"
                        onClick={handleLinkSubmission}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                    </button>
                </div>
            ) : (
                <div className="flex items-center gap-1 px-1">
                    <a
                        href={sanitizeUrl(linkUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="max-w-[150px] truncate text-xs text-blue-600 underline hover:text-blue-700 dark:text-blue-400"
                    >
                        {linkUrl}
                    </a>
                    <div className="mx-1 h-3 w-[1px] bg-zinc-200 dark:bg-zinc-700" />
                    <button
                        className="flex h-7 w-7 items-center justify-center rounded hover:bg-zinc-100 dark:hover:bg-zinc-700"
                        onClick={() => {
                            setEditedLinkUrl(linkUrl);
                            setIsLinkEditMode(true);
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                    </button>
                    <button
                        className="flex h-7 w-7 items-center justify-center rounded text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                        onClick={() => {
                            editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                    </button>
                </div>
            )}
        </div>
    );
}

export function FloatingLinkEditorPlugin({
    anchorElem = document.body,
}: {
    anchorElem?: HTMLElement;
}) {
    const [editor] = useLexicalComposerContext();
    const [isLink, setIsLink] = useState(false);
    const [isLinkEditMode, setIsLinkEditMode] = useState(false);

    useEffect(() => {
        function $updateToolbar() {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                const focusNode = getSelectedNode(selection);
                const focusLinkNode = $findMatchingParent(focusNode, $isLinkNode);
                const focusAutoLinkNode = $findMatchingParent(focusNode, $isAutoLinkNode);
                if (!(focusLinkNode || focusAutoLinkNode)) {
                    setIsLink(false);
                    return;
                }
                setIsLink(true);
            } else if ($isNodeSelection(selection)) {
                const nodes = selection.getNodes();
                if (nodes.length === 0) {
                    setIsLink(false);
                    return;
                }
                const node = nodes[0];
                const parent = node.getParent();
                if ($isLinkNode(parent) || $isLinkNode(node)) {
                    setIsLink(true);
                } else {
                    setIsLink(false);
                }
            }
        }

        return mergeRegister(
            editor.registerUpdateListener(({ editorState }) => {
                editorState.read(() => {
                    $updateToolbar();
                });
            }),
            editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                () => {
                    $updateToolbar();
                    return false;
                },
                COMMAND_PRIORITY_CRITICAL,
            ),
            editor.registerCommand(
                CLICK_COMMAND,
                (payload) => {
                    const selection = $getSelection();
                    if ($isRangeSelection(selection)) {
                        const node = getSelectedNode(selection);
                        const linkNode = $findMatchingParent(node, $isLinkNode);
                        if ($isLinkNode(linkNode) && (payload.metaKey || payload.ctrlKey)) {
                            window.open(linkNode.getURL(), '_blank');
                            return true;
                        }
                    }
                    return false;
                },
                COMMAND_PRIORITY_LOW,
            ),
        );
    }, [editor]);

    return createPortal(
        <FloatingLinkEditor
            editor={editor}
            isLink={isLink}
            anchorElem={anchorElem}
            setIsLink={setIsLink}
            isLinkEditMode={isLinkEditMode}
            setIsLinkEditMode={setIsLinkEditMode}
        />,
        anchorElem,
    );
}
