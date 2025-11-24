// frontend/src/prompts/tag.ts
function getTagsPrompt(text: string): string {
	return `
Extract important tags, topics, and named entities from the text.
Return as a JSON array of strings.
Text:
"""${text}"""
`;
}
