import { createCommand, LexicalCommand } from 'lexical';

export const OPEN_INSERT_IMAGE_MODAL_COMMAND: LexicalCommand<'url' | 'upload'> = createCommand(
    'OPEN_INSERT_IMAGE_MODAL_COMMAND',
);

export const OPEN_INSERT_YOUTUBE_MODAL_COMMAND: LexicalCommand<void> = createCommand(
    'OPEN_INSERT_YOUTUBE_MODAL_COMMAND',
);

export const OPEN_INSERT_TABLE_MODAL_COMMAND: LexicalCommand<void> = createCommand(
    'OPEN_INSERT_TABLE_MODAL_COMMAND',
);

export const OPEN_INSERT_EQUATION_MODAL_COMMAND: LexicalCommand<boolean> = createCommand(
    'OPEN_INSERT_EQUATION_MODAL_COMMAND',
);
