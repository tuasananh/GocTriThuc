import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_LOW, PASTE_COMMAND } from 'lexical';
import { useEffect } from 'react';
import { INSERT_YOUTUBE_COMMAND } from './InsertPluginRegistry';
import * as React from 'react';

const YOUTUBE_ID_REGEX =
  /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|&v(?:i)?=))([^#&?]*).*/;

function parseYouTubeID(url: string): string | null {
  const match = url.match(YOUTUBE_ID_REGEX);
  const id = match ? (match[1].length === 11 ? match[1] : null) : null;
  return id;
}

export default function AutoEmbedPlugin(): React.JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        PASTE_COMMAND,
        (event: ClipboardEvent) => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
            return false;
          }

          const clipboardData = event.clipboardData;
          if (!clipboardData) {
            return false;
          }

          const text = clipboardData.getData('text');
          const youtubeID = parseYouTubeID(text);

          if (youtubeID) {
            // Prevent default paste if we're embedding
            event.preventDefault();
            editor.dispatchCommand(INSERT_YOUTUBE_COMMAND, youtubeID);
            return true;
          }

          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor]);

  return null;
}
