import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { useState } from "react"

import ToolbarPlugin from "../playground-vendor/plugins/ToolbarPlugin"
import ComponentPickerPlugin from "../playground-vendor/plugins/ComponentPickerPlugin"
import DraggableBlockPlugin from "../playground-vendor/plugins/DraggableBlockPlugin"
import FloatingTextFormatToolbarPlugin from "../playground-vendor/plugins/FloatingTextFormatToolbarPlugin"
import PlaygroundNodes from "../playground-vendor/nodes/PlaygroundNodes"
import PlaygroundEditorTheme from "../playground-vendor/themes/PlaygroundEditorTheme"
import { SharedHistoryContext } from "../playground-vendor/context/SharedHistoryContext"
import { ToolbarContext } from "../playground-vendor/context/ToolbarContext"
import { TableContext } from "../playground-vendor/plugins/TablePlugin"

function EditorInner() {
	const [editor] = useLexicalComposerContext()
	const [activeEditor, setActiveEditor] = useState(editor)
	const [isLinkEditMode, setIsLinkEditMode] = useState(false)
	const [floatingAnchor, setFloatingAnchor] = useState<HTMLDivElement | null>(null)

	const onRef = (el: HTMLDivElement | null) => {
		if (el !== null) {
			setFloatingAnchor(el)
		}
	}

	return (
		<>
			<ToolbarPlugin
				editor={editor}
				activeEditor={activeEditor}
				setActiveEditor={setActiveEditor}
				setIsLinkEditMode={setIsLinkEditMode}
			/>
			<div className="editor-shell" ref={onRef}>
				<RichTextPlugin
					contentEditable={<ContentEditable className="editor-input" />}
					placeholder={<div className="editor-placeholder">Type "/" to open the menu...</div>}
					ErrorBoundary={LexicalErrorBoundary}
				/>
				<HistoryPlugin />
				<ComponentPickerPlugin />
				{floatingAnchor && (
					<>
						<DraggableBlockPlugin anchorElem={floatingAnchor} />
						<FloatingTextFormatToolbarPlugin
							anchorElem={floatingAnchor}
							setIsLinkEditMode={setIsLinkEditMode}
						/>
					</>
				)}
			</div>
		</>
	)
}

export function EditorRoot() {
	const initialConfig = {
		namespace: "NotionEditor",
		theme: PlaygroundEditorTheme,
		nodes: [...PlaygroundNodes],
		onError: (e: Error) => console.error("[lexical-editor]", e),
	}

	return (
		<LexicalComposer initialConfig={initialConfig}>
			<SharedHistoryContext>
				<TableContext>
					<ToolbarContext>
						<EditorInner />
					</ToolbarContext>
				</TableContext>
			</SharedHistoryContext>
		</LexicalComposer>
	)
}
