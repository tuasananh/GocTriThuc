import { createCommand, LexicalCommand } from 'lexical';

export const INSERT_YOUTUBE_COMMAND: LexicalCommand<string> =
  createCommand('INSERT_YOUTUBE_COMMAND');

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

export const INSERT_EQUATION_COMMAND: LexicalCommand<{
  equation: string;
  inline: boolean;
}> = createCommand('INSERT_EQUATION_COMMAND');

export const INSERT_IMAGE_COMMAND: LexicalCommand<{
  altText: string;
  src: string;
}> = createCommand('INSERT_IMAGE_COMMAND');

export const INSERT_FILE_COMMAND: LexicalCommand<FilePayload> =
  createCommand('INSERT_FILE_COMMAND');

export interface FilePayload {
  src: string;
  fileName: string;
  fileSize?: string;
}

export const INSERT_COLLAPSIBLE_COMMAND: LexicalCommand<void> = createCommand(
  'INSERT_COLLAPSIBLE_COMMAND',
);
