import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import {
  $getNodeByKey,
  COMMAND_PRIORITY_LOW,
  CLICK_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  NodeKey,
} from 'lexical';
import * as React from 'react';
import { useCallback, useEffect, useRef } from 'react';

import { $isFileNode } from './FileNode';

export default function FileComponent({
  src,
  fileName,
  fileSize,
  nodeKey,
}: {
  src: string;
  fileName: string;
  fileSize?: string;
  nodeKey: NodeKey;
}): React.JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
  const componentRef = useRef<HTMLDivElement>(null);

  const onDelete = useCallback(
    (payload: KeyboardEvent) => {
      if (isSelected) {
        payload.preventDefault();
        editor.update(() => {
          const node = $getNodeByKey(nodeKey);
          if ($isFileNode(node)) {
            node.remove();
          }
        });
      }
      return false;
    },
    [editor, isSelected, nodeKey],
  );

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        CLICK_COMMAND,
        (event: MouseEvent) => {
          if (componentRef.current?.contains(event.target as Node)) {
            if (!event.shiftKey) {
              clearSelection();
            }
            setSelected(!isSelected);
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(KEY_DELETE_COMMAND, onDelete, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_BACKSPACE_COMMAND, onDelete, COMMAND_PRIORITY_LOW),
    );
  }, [clearSelection, editor, isSelected, onDelete, setSelected]);

  return (
    <div
      ref={componentRef}
      className={`inline-block my-2 mx-1 p-3 rounded-lg border transition-all duration-200 cursor-default select-none ${
        isSelected
          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 ring-1 ring-blue-500'
          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-700'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-md bg-white dark:bg-zinc-900 shadow-sm border border-zinc-100 dark:border-zinc-800">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-blue-500"
          >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
        <div className="flex flex-col min-w-[120px]">
          <span
            className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[200px]"
            title={fileName}
          >
            {fileName}
          </span>
          {fileSize && (
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium uppercase">
              {fileSize}
            </span>
          )}
        </div>
        <a
          href={src}
          download={fileName}
          className="p-1.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
          onClick={(e) => e.stopPropagation()}
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
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </a>
      </div>
    </div>
  );
}
