import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $insertNodes, createCommand, LexicalCommand, COMMAND_PRIORITY_EDITOR } from 'lexical';
import { useEffect } from 'react';
import { $createFileNode } from '../nodes/FileNode';

export interface FilePayload {
    src: string;
    fileName: string;
    fileSize?: string;
}

export const INSERT_FILE_COMMAND: LexicalCommand<FilePayload> = createCommand('INSERT_FILE_COMMAND');

export default function FilePlugin(): JSX.Element | null {
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
