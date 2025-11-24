// frontend/src/prompts/sentiment.ts
function getSentimentPrompt(text: string): string {
	return `
Analyze the following text and determine:
- overall sentiment (positive, negative, neutral)
- confidence score (0-1)

Text:
"""${text}"""
`;
}
