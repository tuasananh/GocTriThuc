import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { COMMAND_PRIORITY_EDITOR, $getNodeByKey } from 'lexical';
import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import TextInput from '../ui/TextInput';
import FileInput from '../ui/FileInput';
import { INSERT_TABLE_COMMAND } from '@lexical/table';
import { mergeRegister } from '@lexical/utils';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { OPEN_LINK_MODAL_COMMAND } from './LinkCommands';

import {
  OPEN_INSERT_IMAGE_MODAL_COMMAND,
  OPEN_INSERT_YOUTUBE_MODAL_COMMAND,
  OPEN_INSERT_TABLE_MODAL_COMMAND,
  OPEN_INSERT_EQUATION_MODAL_COMMAND,
  INSERT_YOUTUBE_COMMAND,
  INSERT_IMAGE_COMMAND,
  INSERT_EQUATION_COMMAND,
} from './InsertPluginRegistry';

export {
  OPEN_INSERT_IMAGE_MODAL_COMMAND,
  OPEN_INSERT_YOUTUBE_MODAL_COMMAND,
  OPEN_INSERT_TABLE_MODAL_COMMAND,
  OPEN_INSERT_EQUATION_MODAL_COMMAND,
  OPEN_LINK_MODAL_COMMAND,
};

export default function InsertPlugin(): React.JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const [activeModal, setActiveModal] = useState<
    'image-url' | 'image-upload' | 'youtube' | 'link' | 'table' | 'equation' | null
  >(null);
  const [url, setUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [rows, setRows] = useState('3');
  const [cols, setCols] = useState('3');
  const [isInline, setIsInline] = useState(false);
  const [editingNodeKey, setEditingNodeKey] = useState<string | null>(null);

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        OPEN_INSERT_IMAGE_MODAL_COMMAND,
        (type) => {
          setActiveModal(type === 'url' ? 'image-url' : 'image-upload');
          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        OPEN_INSERT_YOUTUBE_MODAL_COMMAND,
        () => {
          setActiveModal('youtube');
          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        OPEN_INSERT_TABLE_MODAL_COMMAND,
        () => {
          setActiveModal('table');
          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        OPEN_INSERT_EQUATION_MODAL_COMMAND,
        (inline: boolean) => {
          setIsInline(inline);
          setActiveModal('equation');
          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        OPEN_LINK_MODAL_COMMAND,
        (payload) => {
          setUrl(payload.url);
          setEditingNodeKey(payload.nodeKey);
          setActiveModal('link');
          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    );
  }, [editor]);

  const closeModal = () => {
    setActiveModal(null);
    setUrl('');
    setAltText('');
    setRows('3');
    setCols('3');
    setIsInline(false);
    setEditingNodeKey(null);
  };

  const onInsertImageURL = () => {
    editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
      altText,
      src: url,
    });
    closeModal();
  };

  const onInsertImageUpload = (files: FileList | null) => {
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
            altText: files[0].name,
            src: reader.result,
          });
        }
      };
      reader.readAsDataURL(files[0]);
      closeModal();
    }
  };

  const onInsertYouTube = () => {
    const youtubeID = url.match(
      /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|&v(?:i)?=))([^#&?]*).*/,
    )?.[1];
    if (youtubeID && youtubeID.length === 11) {
      editor.dispatchCommand(INSERT_YOUTUBE_COMMAND, youtubeID);
      closeModal();
    } else {
      alert('Invalid YouTube URL');
    }
  };

  const onInsertTable = () => {
    const r = parseInt(rows, 10);
    const c = parseInt(cols, 10);
    if (isNaN(r) || isNaN(c) || r <= 0 || c <= 0) {
      alert('Please enter valid row and column numbers');
      return;
    }
    // includeHeaders: false to satisfy "không bôi đen hàng đầu cột đầu"
    editor.dispatchCommand(INSERT_TABLE_COMMAND, {
      columns: cols,
      rows: rows,
      includeHeaders: false,
    });
    closeModal();
  };

  const onInsertEquation = () => {
    editor.dispatchCommand(INSERT_EQUATION_COMMAND, { equation: url, inline: isInline });
    closeModal();
  };

  const onConfirmLink = useCallback(() => {
    if (editingNodeKey) {
      editor.update(() => {
        const node = $getNodeByKey(editingNodeKey);
        if ($isLinkNode(node)) {
          node.setURL(url);
        }
      });
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
    }
    closeModal();
  }, [editor, editingNodeKey, url]);

  const onRemoveLink = useCallback(() => {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    closeModal();
  }, [editor]);

  return (
    <>
      {activeModal === 'image-url' && (
        <Modal title="Insert Image (URL)" onClose={closeModal}>
          <TextInput
            label="Image URL"
            value={url}
            onChange={setUrl}
            placeholder="https://example.com/image.png"
          />
          <TextInput
            label="Alt Text"
            value={altText}
            onChange={setAltText}
            placeholder="Description of image"
          />
          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={closeModal}
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              onClick={onInsertImageURL}
              disabled={!url}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Insert
            </button>
          </div>
        </Modal>
      )}

      {activeModal === 'image-upload' && (
        <Modal title="Upload Image" onClose={closeModal}>
          <FileInput label="Select image file" accept="image/*" onChange={onInsertImageUpload} />
          <div className="mt-6 flex justify-end">
            <button
              onClick={closeModal}
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {activeModal === 'youtube' && (
        <Modal title="Insert YouTube Video" onClose={closeModal}>
          <TextInput
            label="YouTube Video URL"
            value={url}
            onChange={setUrl}
            placeholder="https://www.youtube.com/watch?v=..."
          />
          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={closeModal}
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              onClick={onInsertYouTube}
              disabled={!url}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Insert
            </button>
          </div>
        </Modal>
      )}

      {activeModal === 'table' && (
        <Modal title="Insert Table" onClose={closeModal}>
          <div className="grid grid-cols-2 gap-4">
            <TextInput label="Rows" value={rows} onChange={setRows} placeholder="3" type="number" />
            <TextInput
              label="Columns"
              value={cols}
              onChange={setCols}
              placeholder="3"
              type="number"
            />
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={closeModal}
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              onClick={onInsertTable}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Insert
            </button>
          </div>
        </Modal>
      )}

      {activeModal === 'equation' && (
        <Modal
          title={isInline ? 'Insert Inline Equation' : 'Insert Block Equation'}
          onClose={closeModal}
        >
          <TextInput label="LaTeX Equation" value={url} onChange={setUrl} placeholder="e = mc^2" />
          <div className="mt-4 flex items-center gap-2">
            <input
              type="checkbox"
              tabIndex={-1}
              id="inline-checkbox"
              checked={isInline}
              onChange={(e) => setIsInline(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="inline-checkbox"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Inline Equation
            </label>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={closeModal}
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              onClick={onInsertEquation}
              disabled={!url}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Insert
            </button>
          </div>
        </Modal>
      )}

      {activeModal === 'link' && (
        <Modal title={editingNodeKey ? 'Edit Link' : 'Insert Link'} onClose={closeModal}>
          <TextInput
            label="Link URL"
            value={url}
            onChange={setUrl}
            placeholder="https://example.com"
          />
          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={closeModal}
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5"
            >
              Cancel
            </button>
            {editingNodeKey && (
              <button
                onClick={onRemoveLink}
                className="rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Remove
              </button>
            )}
            <button
              onClick={onConfirmLink}
              disabled={!url}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {editingNodeKey ? 'Save' : 'Insert'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
