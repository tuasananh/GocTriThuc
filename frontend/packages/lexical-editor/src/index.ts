import { NotionEditorElement } from "./element/NotionEditorElement"

export function defineNotionEditor(tagName = "notion-editor") {
	if (typeof customElements !== "undefined" && !customElements.get(tagName)) {
		customElements.define(tagName, NotionEditorElement)
	}
}

defineNotionEditor()

// Export TYPES ONLY — do not leak Lexical out of the package
export type { SerializedDocument, SerializedBlock, BlockType, RichSpan } from "./types"
