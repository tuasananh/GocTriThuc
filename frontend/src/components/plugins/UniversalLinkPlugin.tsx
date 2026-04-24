import { $isLinkNode } from '@lexical/link';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $findMatchingParent } from '@lexical/utils';
import { $getNearestNodeFromDOMNode } from 'lexical';
import { useCallback, useEffect } from 'react';
import { OPEN_LINK_MODAL_COMMAND } from './LinkCommands';

export function UniversalLinkPlugin() {
  const [editor] = useLexicalComposerContext();

  const onContextMenu = useCallback(
    (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const linkDOM = target.closest('a');

      if (linkDOM) {
        event.preventDefault();
        event.stopPropagation();

        // Using editor.update instead of read because it's more robust
        // in setting the internal Lexical "active editor" context
        // which was causing the "Unable to find an active editor" crash.
        editor.update(() => {
          const lexicalNode = $getNearestNodeFromDOMNode(linkDOM);
          const node = $findMatchingParent(lexicalNode, $isLinkNode);

          if ($isLinkNode(node)) {
            const nodeKey = node.getKey();
            const url = node.getURL();

            // Dispatching outside any potential lock
            setTimeout(() => {
              editor.dispatchCommand(OPEN_LINK_MODAL_COMMAND, {
                nodeKey,
                url: url || '',
              });
            }, 0);
          }
        });
      }
    },
    [editor],
  );

  const onClick = useCallback(
    (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const linkDOM = target.closest('a');

      if (linkDOM) {
        const href = linkDOM.getAttribute('href');
        if (href) {
          event.preventDefault();
          event.stopPropagation();
          window.open(href, '_blank');
          return;
        }

        // Fallback for nodes that might not have href attribute yet
        editor.update(() => {
          const node = $findMatchingParent($getNearestNodeFromDOMNode(linkDOM), $isLinkNode);
          if ($isLinkNode(node)) {
            const url = node.getURL();
            if (url) {
              event.preventDefault();
              event.stopPropagation();
              window.open(url, '_blank');
            }
          }
        });
      }
    },
    [editor],
  );

  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (rootElement) {
      rootElement.addEventListener('contextmenu', onContextMenu, true);
      rootElement.addEventListener('click', onClick, true);
      return () => {
        rootElement.removeEventListener('contextmenu', onContextMenu, true);
        rootElement.removeEventListener('click', onClick, true);
      };
    }
  }, [editor, onContextMenu, onClick]);

  return null;
}
