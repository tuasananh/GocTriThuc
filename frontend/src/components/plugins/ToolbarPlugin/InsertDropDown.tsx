import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import * as React from 'react';
import DropDown, { DropDownItem } from '../../ui/DropDown';
import {
  OPEN_INSERT_IMAGE_MODAL_COMMAND,
  OPEN_INSERT_YOUTUBE_MODAL_COMMAND,
  OPEN_INSERT_TABLE_MODAL_COMMAND,
  OPEN_INSERT_EQUATION_MODAL_COMMAND,
} from '../InsertPluginRegistry';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
import { INSERT_FILE_COMMAND } from '../FilePlugin';

export default function InsertDropDown(): React.JSX.Element {
  const [editor] = useLexicalComposerContext();

  return (
    <DropDown
      buttonClassName="flex items-center gap-2 px-2 h-8 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-zinc-900 dark:text-zinc-100 font-semibold border border-zinc-200 dark:border-white/10"
      buttonLabel="Insert"
      buttonAriaLabel="Insert specialized editor nodes"
      buttonIconClassName="icon plus"
    >
      <DropDownItem
        onClick={() => editor.dispatchCommand(OPEN_INSERT_IMAGE_MODAL_COMMAND, 'url')}
        className="item"
      >
        <i className="icon image" />
        <span className="text">Image (URL)</span>
      </DropDownItem>
      <DropDownItem
        onClick={() => editor.dispatchCommand(OPEN_INSERT_IMAGE_MODAL_COMMAND, 'upload')}
        className="item"
      >
        <i className="icon image" />
        <span className="text">Image (Upload)</span>
      </DropDownItem>
      <DropDownItem
        onClick={() => editor.dispatchCommand(OPEN_INSERT_YOUTUBE_MODAL_COMMAND, undefined)}
        className="item"
      >
        <i className="icon youtube" />
        <span className="text">YouTube Video</span>
      </DropDownItem>
      <DropDownItem
        onClick={() => {
          editor.dispatchCommand(OPEN_INSERT_TABLE_MODAL_COMMAND, undefined);
        }}
        className="item"
      >
        <i className="icon table" />
        <span className="text">Table</span>
      </DropDownItem>
      <DropDownItem
        onClick={() => {
          editor.dispatchCommand(OPEN_INSERT_EQUATION_MODAL_COMMAND, true);
        }}
        className="item"
      >
        <i className="icon equation" />
        <span className="text">Inline Equation</span>
      </DropDownItem>
      <DropDownItem
        onClick={() => {
          editor.dispatchCommand(OPEN_INSERT_EQUATION_MODAL_COMMAND, false);
        }}
        className="item"
      >
        <i className="icon equation" />
        <span className="text">Block Equation</span>
      </DropDownItem>
      <DropDownItem
        onClick={() => {
          editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
        }}
        className="item"
      >
        <i className="icon horizontal-rule" />
        <span className="text">Divider</span>
      </DropDownItem>
      <DropDownItem
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = () => {
                editor.dispatchCommand(INSERT_FILE_COMMAND, {
                  src: reader.result as string,
                  fileName: file.name,
                  fileSize: `${(file.size / 1024).toFixed(1)} KB`,
                });
              };
              reader.readAsDataURL(file);
            }
          };
          input.click();
        }}
        className="item"
      >
        <i className="icon file" />
        <span className="text">File Attachment</span>
      </DropDownItem>
    </DropDown>
  );
}
