import { createRoot, type Root } from "react-dom/client"
import { createElement } from "react"
import { EditorRoot } from "../ui/EditorRoot"
import themeCss from "../ui/theme.css?inline"
import playgroundCss from "../playground-vendor/themes/PlaygroundEditorTheme.css?inline"

export class NotionEditorElement extends HTMLElement {
	private root: Root | null = null

	connectedCallback() {
		const shadow = this.attachShadow({ mode: "open" })
		const style = document.createElement("style")
		style.textContent = playgroundCss + "\n" + themeCss
		shadow.appendChild(style)
		const mount = document.createElement("div")
		shadow.appendChild(mount)
		this.root = createRoot(mount)
		this.root.render(createElement(EditorRoot))
		queueMicrotask(() => this.dispatchEvent(new CustomEvent("editor-ready")))
	}

	disconnectedCallback() {
		this.root?.unmount()
		this.root = null
	}
}
