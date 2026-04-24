import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  NodeKey,
} from 'lexical';
import { useCallback, useEffect, useRef } from 'react';
import ImageResizer from './ImageResizer';
import ImageToolbar from './ImageToolbar';
import { $isImageNode } from './ImageNode';

export default function ImageComponent({
  src,
  altText,
  nodeKey,
  width,
  height,
  maxWidth,
  rounded,
  lockAspectRatio,
}: {
  altText: string;
  height: 'inherit' | number;
  maxWidth: number;
  nodeKey: NodeKey;
  src: string;
  width: 'inherit' | number;
  rounded: boolean;
  lockAspectRatio: boolean;
}) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
  const [editor] = useLexicalComposerContext();

  const onDelete = useCallback(
    (payload: KeyboardEvent) => {
      if (isSelected && $isNodeSelection($getSelection())) {
        const event: KeyboardEvent = payload;
        event.preventDefault();
        const node = $getNodeByKey(nodeKey);
        if ($isImageNode(node)) {
          node.remove();
        }
        return true;
      }
      return false;
    },
    [isSelected, nodeKey],
  );

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        CLICK_COMMAND,
        (payload) => {
          const event = payload;
          if (event.target === imageRef.current) {
            event.preventDefault();
            event.stopPropagation();
            if (event.shiftKey) {
              setSelected(!isSelected);
            } else {
              clearSelection();
              setSelected(true);
            }
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(KEY_DELETE_COMMAND, onDelete, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_BACKSPACE_COMMAND, onDelete, COMMAND_PRIORITY_LOW),
    );
  }, [clearSelection, editor, isSelected, nodeKey, onDelete, setSelected]);

  const onResizeEnd = (nextWidth: number, nextHeight: number) => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isImageNode(node)) {
        node.setWidthAndHeight(nextWidth, nextHeight);
      }
    });
  };

  const onToggleRounded = () => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isImageNode(node)) {
        node.setRounded(!node.getRounded());
      }
    });
  };

  const onToggleLockRatio = () => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isImageNode(node)) {
        node.setLockAspectRatio(!node.getLockAspectRatio());
      }
    });
  };

  return (
    <div className="relative inline-block my-2" style={{ maxWidth }}>
      <div className="relative w-fit">
        <img
          className={`block transition-shadow ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:ring-1 hover:ring-zinc-300'} ${rounded ? 'editor-image-rounded' : 'rounded-sm'}`}
          src={src}
          alt={altText}
          ref={imageRef}
          style={{
            width: width === 'inherit' ? 'auto' : width,
            height: height === 'inherit' ? 'auto' : height,
            maxWidth: '100%',
          }}
          draggable={false}
        />
        {isSelected && (
          <>
            <ImageToolbar
              isRounded={rounded}
              onToggleRounded={onToggleRounded}
              isLockRatio={lockAspectRatio}
              onToggleLockRatio={onToggleLockRatio}
            />
            <ImageResizer
              imageRef={imageRef}
              onResizeEnd={onResizeEnd}
              lockAspectRatio={lockAspectRatio}
            />
          </>
        )}
      </div>
    </div>
  );
}
