import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $insertNodeToNearestRoot } from '@lexical/utils';
import { COMMAND_PRIORITY_EDITOR } from 'lexical';
import { useEffect } from 'react';
import * as React from 'react';
import { $createYouTubeNode, YouTubeNode } from '../nodes/YouTubeNode';

import { INSERT_YOUTUBE_COMMAND } from './InsertPluginRegistry';

export default function YouTubePlugin(): React.JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([YouTubeNode])) {
      throw new Error('YouTubePlugin: YouTubeNode not registered on editor');
    }

    return editor.registerCommand<string>(
      INSERT_YOUTUBE_COMMAND,
      (payload) => {
        const youtubeNode = $createYouTubeNode(payload);
        $insertNodeToNearestRoot(youtubeNode);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}
