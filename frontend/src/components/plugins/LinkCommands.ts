import { createCommand, LexicalCommand } from 'lexical';

export const OPEN_LINK_MODAL_COMMAND: LexicalCommand<{
    nodeKey: string | null;
    url: string;
}> = createCommand('OPEN_LINK_MODAL_COMMAND');
