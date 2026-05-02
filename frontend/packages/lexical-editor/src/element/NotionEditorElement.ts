import { createRoot, type Root } from "react-dom/client"
import { createElement } from "react"
import { EditorRoot } from "../ui/EditorRoot"
import themeCss from "../ui/theme.css?inline"
import playgroundCss from "../playground-vendor/themes/PlaygroundEditorTheme.css?inline"

const STYLE_FLAG = "data-notion-editor-styles"

function injectStylesOnce(): void {
	const doc = typeof document !== "undefined" ? document : null
	if (!doc || doc.head.querySelector(`style[${STYLE_FLAG}]`)) return
	const style = doc.createElement("style")
	style.setAttribute(STYLE_FLAG, "")
	style.textContent = playgroundCss + "\n" + themeCss
	doc.head.appendChild(style)
}

export class NotionEditorElement extends HTMLElement {
	private root: Root | null = null
	private mount: HTMLDivElement | null = null

	connectedCallback(): void {
		// IMPORTANT: do NOT use Shadow DOM.
		// Lexical reads document.getSelection() / document.activeElement on every input.
		// Both stop at the shadow boundary, so the editor state never transitions to non-empty.
		// Light-DOM mount is the only reliable approach.
		injectStylesOnce()
		this.classList.add("notion-editor-host")
		const mount = document.createElement("div")
		mount.className = "notion-editor-root"
		this.appendChild(mount)
		this.mount = mount
		this.root = createRoot(mount)
		this.root.render(createElement(EditorRoot))
		queueMicrotask(() => this.dispatchEvent(new CustomEvent("editor-ready")))
	}

	disconnectedCallback(): void {
		this.root?.unmount()
		this.root = null
		if (this.mount?.parentNode === this) this.removeChild(this.mount)
		this.mount = null
	}
}
