// frontend/src/prompts/bias-cognitive.ts
function getCognitiveBiasPrompt(text: string): string {
	return `
Analyze the following text for cognitive biases or subtle framing techniques.
Return results as a JSON array with fields:
- bias: Name of the cognitive bias
- snippet: Exact text showing the bias
- explanation: Short layman's explanation
- severity: low | medium | high
- description: Optional detailed description
- category: Category of the bias (Framing, Confirmation Bias, Emotional Appeal, etc.)

Text:
"""${text}"""
`;
}
