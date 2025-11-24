// frontend/src/prompts/bias-political.ts
function getPoliticalBiasPrompt(text: string): string {
	return `
Analyze the following news article text and determine its political or ideological bias.
Return a single value: "left", "center", or "right".
Text:
"""${text}"""
`;
}
