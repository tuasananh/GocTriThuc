export type BlockType =
	| "paragraph"
	| "heading-1"
	| "heading-2"
	| "heading-3"
	| "bulleted-list"
	| "numbered-list"
	| "check-list"
	| "quote"
	| "code"
	| "divider"

export type RichSpan = {
	text: string
	bold?: boolean
	italic?: boolean
	underline?: boolean
	strikethrough?: boolean
	code?: boolean
}

export type SerializedBlock = {
	id: string
	type: BlockType
	text: string
	rich?: RichSpan[]
	checked?: boolean
	language?: string
}

export type SerializedDocument = {
	version: 1
	blocks: SerializedBlock[]
}
