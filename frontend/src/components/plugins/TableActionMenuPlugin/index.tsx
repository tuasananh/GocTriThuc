import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import { ReactPortal } from 'react';
import { createPortal } from 'react-dom';
import TableCellActionMenuContainer from './TableActionMenu';

export default function TableActionMenuPlugin({
  anchorElem = document.body,
  cellMerge = false,
}: {
  anchorElem?: HTMLElement;
  cellMerge?: boolean;
}): null | ReactPortal {
  const isEditable = useLexicalEditable();
  return createPortal(
    isEditable ? (
      <TableCellActionMenuContainer anchorElem={anchorElem} cellMerge={cellMerge} />
    ) : null,
    anchorElem,
  );
}
