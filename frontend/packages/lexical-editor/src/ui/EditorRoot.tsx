import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import PlaygroundNodes from "../playground-vendor/nodes/PlaygroundNodes"
import PlaygroundEditorTheme from "../playground-vendor/themes/PlaygroundEditorTheme"

export function EditorRoot() {
	const initialConfig = {
		namespace: "NotionEditor",
		theme: PlaygroundEditorTheme,
		nodes: [...PlaygroundNodes],
		onError: (e: Error) => console.error("[lexical-editor]", e),
	}
	return (
		<LexicalComposer initialConfig={initialConfig}>
			<div className="editor-shell">
				<RichTextPlugin
					contentEditable={<ContentEditable className="editor-input" />}
					placeholder={<div className="editor-placeholder">Start typing...</div>}
					ErrorBoundary={LexicalErrorBoundary}
				/>
				<HistoryPlugin />
			</div>
		</LexicalComposer>
	)
}
