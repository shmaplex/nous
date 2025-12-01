import { getCognitiveBiasPrompt } from "@/prompts/bias-cognitive";
import type { CognitiveBias } from "@/types/article-analyzed";
import { getPipeline } from "./models.server";

const MAX_TOKENS = 1024; // Max tokens supported by the model

/**
 * Detect cognitive biases within an article using a two-stage hybrid pipeline:
 *
 * Stage 1 — Binary Bias Classification (fast)
 *   Uses a sentiment model (distilbert-sst2) to approximate bias:
 *     - POSITIVE → Biased
 *     - NEGATIVE / NEUTRAL → Neutral
 *
 * Stage 2 — Cognitive Bias Breakdown (optional, slower)
 *   If Stage 1 detects bias **and** useTextGen=true, GPT-2 produces structured JSON.
 */
export async function detectCognitiveBias(
	article: { content?: string },
	options: { useTextGen?: boolean } = {},
): Promise<CognitiveBias[]> {
	const { useTextGen = true } = options;
	if (!article.content) return [];

	// ---------------------------------------------------------
	// Truncate text to max tokens before sending to models
	// ---------------------------------------------------------
	const truncatedText = article.content.split(/\s+/).slice(0, MAX_TOKENS).join(" ");

	const results: CognitiveBias[] = [];

	// ---------------------------------------------------------
	// 1. Binary bias detection using distilbert-sst2
	// ---------------------------------------------------------
	try {
		const classifier = await getPipeline("text-classification", "distilbert-sst2");
		const classification = await classifier(truncatedText);

		const rawLabel = classification?.[0]?.label ?? "NEGATIVE";
		const label = rawLabel.toUpperCase();

		// Map POSITIVE → biased, NEGATIVE → neutral
		const isBiased = label === "POSITIVE";

		// If the text is not biased, no need to perform deep analysis
		if (!isBiased && !useTextGen) {
			return [];
		}
	} catch (err) {
		console.warn("Binary bias classifier failed:", (err as Error).message);
		if (!useTextGen) return results;
	}

	// ---------------------------------------------------------
	// 2. Full cognitive-bias breakdown using GPT-2
	// ---------------------------------------------------------
	if (useTextGen) {
		try {
			const generator = await getPipeline("text-generation", "gpt2");

			// Truncate text for GPT-2 prompt as well
			const promptText = truncatedText.slice(0, 2000);
			const prompt = getCognitiveBiasPrompt(promptText);

			const output = await generator(prompt, { max_new_tokens: 400 });

			if (!output?.[0]?.generated_text) {
				console.warn("GPT-2 returned empty output.");
				return results;
			}

			// Remove prompt echo
			const raw = output[0].generated_text;
			const generated = raw.replace(prompt, "");

			// Extract JSON array
			const match = generated.match(/\[[\s\S]*?\]/);
			if (match) {
				try {
					const parsed = JSON.parse(match[0]);
					return parsed;
				} catch (jsonErr) {
					console.warn("Failed to parse GPT-2 JSON:", (jsonErr as Error).message);
				}
			} else {
				console.warn("GPT-2 returned no valid JSON array.");
			}
		} catch (err) {
			console.warn("GPT-2 cognitive bias detection failed:", (err as Error).message);
		}
	}

	return results;
}
