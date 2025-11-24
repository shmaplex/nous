function getPhilosophicalPrompt(text: string): string {
	return `
Analyze the following text for philosophical or thematic interpretation.
Describe the main themes, moral or ethical considerations, and any underlying worldview.
Return as JSON with:
- philosophical: summary of philosophical angle
- explanation: short reasoning

Text:
"""${text}"""
`;
}
