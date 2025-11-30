import type { CognitiveBias } from "@/types/article-analyzed";
import { getPipeline } from "./models.server";

export async function detectCognitiveBias(article: { content?: string }): Promise<CognitiveBias[]> {
	if (!article.content) return [];

	const embedder = await getPipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");

	// Very basic heuristic — later replace with full rules
	const text = article.content;
	const lower = text.toLowerCase();

	const results: CognitiveBias[] = [];

	if (lower.includes("shocking") || lower.includes("outrage") || lower.includes("horrific")) {
		results.push({
			bias: "Appeal to Emotion",
			snippet: text.slice(0, 200),
			explanation: "Emotionally charged phrasing detected.",
			severity: "medium",
			category: "Framing",
		});
	}

	return results;
}
