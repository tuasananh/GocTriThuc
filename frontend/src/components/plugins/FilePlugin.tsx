import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $insertNodes, COMMAND_PRIORITY_EDITOR } from 'lexical';
import { useEffect } from 'react';
import { $createFileNode } from '../nodes/FileNode';

import { INSERT_FILE_COMMAND, FilePayload } from './InsertPluginRegistry';
import * as React from 'react';

export default function FilePlugin(): React.JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand<FilePayload>(
      INSERT_FILE_COMMAND,
      (payload) => {
        const fileNode = $createFileNode(payload.src, payload.fileName, payload.fileSize);
        $insertNodes([fileNode]);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}
