import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection } from 'lexical';
import {
  $deleteTableColumnAtSelection,
  $deleteTableRowAtSelection,
  $getTableCellNodeFromLexicalNode,
  $insertTableColumnAtSelection,
  $insertTableRowAtSelection,
  $isTableCellNode,
  $isTableSelection,
  $mergeCells,
  $unmergeCell,
} from '@lexical/table';
import { useCallback, useEffect, useState } from 'react';

import { Divider } from './Divider';
import DropdownColorPicker from '../../ui/DropdownColorPicker';
import DropDown, { DropDownItem } from '../../ui/DropDown';

export function TableToolbar() {
  const [editor] = useLexicalComposerContext();
  const [isTable, setIsTable] = useState(false);
  const [canMerge, setCanMerge] = useState(false);
  const [canUnmerge, setCanUnmerge] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('#fff');

  const $updateTableToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection) || $isTableSelection(selection)) {
      const node = selection.anchor.getNode();
      const cell = $getTableCellNodeFromLexicalNode(node);
      setIsTable(cell !== null);

      if (cell) {
        setBackgroundColor(cell.getBackgroundColor() || '#fff');
      }

      if ($isTableSelection(selection)) {
        const nodes = selection.getNodes();
        const cells = nodes.filter($isTableCellNode);
        setCanMerge(cells.length > 1);
      } else {
        setCanMerge(false);
      }

      // Check for unmerge (simplified)
      if (cell && (cell.getColSpan() > 1 || cell.getRowSpan() > 1)) {
        setCanUnmerge(true);
      } else {
        setCanUnmerge(false);
      }
    } else {
      setIsTable(false);
    }
  }, []);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        $updateTableToolbar();
      });
    });
  }, [editor, $updateTableToolbar]);

  if (!isTable) return null;

  return (
    <>
      <Divider />
      <div className="flex items-center gap-1 bg-blue-50/20 dark:bg-blue-900/10 px-1 py-0.5 rounded-md border border-blue-100/50 dark:border-blue-900/20">
        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500/80 mx-1 select-none">
          Table
        </span>

        {/* Row Operations */}
        <DropDown
          buttonClassName="flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
          buttonLabel=""
          buttonAriaLabel="Row operations"
          buttonIconClassName="icon table-row"
        >
          <DropDownItem
            onClick={() => editor.update(() => $insertTableRowAtSelection(false))}
            className="item"
          >
            <span className="text">Insert Row Above</span>
          </DropDownItem>
          <DropDownItem
            onClick={() => editor.update(() => $insertTableRowAtSelection(true))}
            className="item"
          >
            <span className="text">Insert Row Below</span>
          </DropDownItem>
          <DropDownItem
            onClick={() => editor.update(() => $deleteTableRowAtSelection())}
            className="item"
          >
            <span className="text">Delete Row</span>
          </DropDownItem>
        </DropDown>

        {/* Column Operations */}
        <DropDown
          buttonClassName="flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
          buttonLabel=""
          buttonAriaLabel="Column operations"
          buttonIconClassName="icon table-column"
        >
          <DropDownItem
            onClick={() => editor.update(() => $insertTableColumnAtSelection(false))}
            className="item"
          >
            <span className="text">Insert Column Left</span>
          </DropDownItem>
          <DropDownItem
            onClick={() => editor.update(() => $insertTableColumnAtSelection(true))}
            className="item"
          >
            <span className="text">Insert Column Right</span>
          </DropDownItem>
          <DropDownItem
            onClick={() => editor.update(() => $deleteTableColumnAtSelection())}
            className="item"
          >
            <span className="text">Delete Column</span>
          </DropDownItem>
        </DropDown>

        <Divider />

        {/* Merge/Unmerge */}
        <button
          disabled={!canMerge}
          onClick={() => {
            editor.update(() => {
              const selection = $getSelection();
              if ($isTableSelection(selection)) {
                const nodes = selection.getNodes();
                const cells = nodes.filter($isTableCellNode);
                $mergeCells(cells);
              }
            });
          }}
          className={`flex h-8 w-8 items-center justify-center rounded transition-colors ${canMerge ? 'hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300' : 'opacity-20 cursor-not-allowed text-zinc-400'}`}
          title="Merge Cells"
        >
          <i className="icon merge" />
        </button>
        <button
          disabled={!canUnmerge}
          onClick={() => {
            editor.update(() => {
              $unmergeCell();
            });
          }}
          className={`flex h-8 w-8 items-center justify-center rounded transition-colors ${canUnmerge ? 'hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300' : 'opacity-20 cursor-not-allowed text-zinc-400'}`}
          title="Unmerge Cell"
        >
          <i className="icon unmerge" />
        </button>

        <Divider />

        {/* Vertical Align */}
        <DropDown
          buttonClassName="flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
          buttonLabel=""
          buttonAriaLabel="Vertical alignment"
          buttonIconClassName="icon vertical-middle"
        >
          <DropDownItem
            onClick={() =>
              editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection) || $isTableSelection(selection)) {
                  const nodes = $isTableSelection(selection)
                    ? selection.getNodes()
                    : [selection.anchor.getNode()];
                  nodes.forEach((node) => {
                    const cell = $getTableCellNodeFromLexicalNode(node);
                    if (cell) cell.setVerticalAlign('top');
                  });
                }
              })
            }
            className="item"
          >
            <div className="flex items-center gap-2">
              <i className="icon vertical-top" />
              <span className="text">Top</span>
            </div>
          </DropDownItem>
          <DropDownItem
            onClick={() =>
              editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection) || $isTableSelection(selection)) {
                  const nodes = $isTableSelection(selection)
                    ? selection.getNodes()
                    : [selection.anchor.getNode()];
                  nodes.forEach((node) => {
                    const cell = $getTableCellNodeFromLexicalNode(node);
                    if (cell) cell.setVerticalAlign('middle');
                  });
                }
              })
            }
            className="item"
          >
            <div className="flex items-center gap-2">
              <i className="icon vertical-middle" />
              <span className="text">Middle</span>
            </div>
          </DropDownItem>
          <DropDownItem
            onClick={() =>
              editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection) || $isTableSelection(selection)) {
                  const nodes = $isTableSelection(selection)
                    ? selection.getNodes()
                    : [selection.anchor.getNode()];
                  nodes.forEach((node) => {
                    const cell = $getTableCellNodeFromLexicalNode(node);
                    if (cell) cell.setVerticalAlign('bottom');
                  });
                }
              })
            }
            className="item"
          >
            <div className="flex items-center gap-2">
              <i className="icon vertical-bottom" />
              <span className="text">Bottom</span>
            </div>
          </DropDownItem>
        </DropDown>

        {/* Cell Background */}
        <DropdownColorPicker
          disabled={false}
          buttonClassName="flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
          buttonAriaLabel="Cell background color"
          color={backgroundColor}
          onChange={(color) => {
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection) || $isTableSelection(selection)) {
                const nodes = $isTableSelection(selection)
                  ? selection.getNodes()
                  : [selection.anchor.getNode()];
                nodes.forEach((node) => {
                  const cell = $getTableCellNodeFromLexicalNode(node);
                  if (cell) cell.setBackgroundColor(color);
                });
              }
            });
          }}
          icon={<i className="icon bucket" />}
        />
      </div>
    </>
  );
}
