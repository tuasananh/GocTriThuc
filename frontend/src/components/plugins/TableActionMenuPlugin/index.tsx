import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import { $isTableCellNode, $isTableSelection, TableCellNode } from '@lexical/table';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import { JSX, useCallback, useEffect, useRef, useState } from 'react';
import useModal from '../../../hooks/useModal';
import { TableCellActionMenuContainer } from './TableActionMenu';

export default function TableActionMenuPlugin({
  cellMerge = false,
}: {
  anchorElem?: HTMLElement;
  cellMerge?: boolean;
}): null | JSX.Element {
  const isEditable = useLexicalEditable();
  const [editor] = useLexicalComposerContext();
  const menuButtonRef = useRef<HTMLDivElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [tableCellNode, setTableCellNode] = useState<TableCellNode | null>(null);
  const [modal, showModal] = useModal();

  const updateTableCellActionMenu = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      const nativeSelection = window.getSelection();
      const rootElement = editor.getRootElement();

      if (
        nativeSelection !== null &&
        rootElement !== null &&
        rootElement.contains(nativeSelection.anchorNode)
      ) {
        if ($isRangeSelection(selection)) {
          const tableCellNodeFromSelection = selection.anchor.getNode().getParentOrThrow();
          if ($isTableCellNode(tableCellNodeFromSelection)) {
            setTableCellNode(tableCellNodeFromSelection);
          } else {
            setTableCellNode(null);
          }
        } else if ($isTableSelection(selection)) {
          const anchorNode = selection.anchor.getNode();
          if ($isTableCellNode(anchorNode)) {
            setTableCellNode(anchorNode);
          } else {
            const tableCellNodeFromSelection = anchorNode.getParent();
            if ($isTableCellNode(tableCellNodeFromSelection)) {
              setTableCellNode(tableCellNodeFromSelection);
            } else {
              setTableCellNode(null);
            }
          }
        } else {
          setTableCellNode(null);
        }
      } else {
        setTableCellNode(null);
      }
    });
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateTableCellActionMenu();
        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor, updateTableCellActionMenu]);

  useEffect(() => {
    if (isMenuOpen && tableCellNode) {
      const tableCellElement = editor.getElementByKey(tableCellNode.getKey());
      if (tableCellElement && menuButtonRef.current) {
        const tableCellRect = tableCellElement.getBoundingClientRect();
        const menuButtonRect = menuButtonRef.current.getBoundingClientRect();
        const anchorRect = editor.getRootElement()?.getBoundingClientRect();
        if (anchorRect) {
          menuButtonRef.current.style.top = `${tableCellRect.top - anchorRect.top}px`;
          menuButtonRef.current.style.left = `${tableCellRect.right - anchorRect.left - menuButtonRect.width}px`;
        }
      }
    }
  }, [editor, isMenuOpen, tableCellNode]);

  if (!isEditable || tableCellNode === null) {
    return null;
  }

  return (
    <div className="table-cell-action-button-container" ref={menuButtonRef}>
      <div
        className="active"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        onMouseDown={(e) => e.preventDefault()}
      >
        <i className="chevron-down" />
      </div>
      {isMenuOpen && (
        <TableCellActionMenuContainer
          contextRef={menuButtonRef}
          setIsMenuOpen={setIsMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          tableCellNode={tableCellNode}
          cellMerge={cellMerge}
          showColorPickerModal={showModal}
        />
      )}
      {modal}
    </div>
  );
}
