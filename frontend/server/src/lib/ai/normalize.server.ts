import { getPipeline } from "./models.server";

/**
 * Example:
 * const normalized = await normalizeArticleAI(raw);
 * const enrichedBase: Article = {
 *    ...article,
 *    raw,
 *    content: normalized.content,
 *    summary: normalized.summary,
 *    tags: normalized.tags,
 * };
 */


/**
 * Normalize messy HTML content into clean text.
 * Removes scripts, styles, and other non-content elements.
 * @param html - The raw HTML content
 * @returns Cleaned text
 */
export function cleanHTML(html: string): string {
	if (!html) return "";

	// Remove script/style tags and their content
	let cleaned = html.replace(/<script[\s\S]*?<\/script>/gi, "");
	cleaned = cleaned.replace(/<style[\s\S]*?<\/style>/gi, "");

	// Remove all remaining HTML tags
	cleaned = cleaned.replace(/<\/?[^>]+(>|$)/g, "");

	// Collapse multiple spaces / newlines
	cleaned = cleaned.replace(/\s+/g, " ").trim();

	return cleaned;
}

/**
 * Use AI to generate a summary of text content.
 * Falls back to first 3 sentences if AI fails.
 * @param content - The text content to summarize
 * @returns AI-generated summary
 */
export async function summarizeContentAI(content: string): Promise<string> {
	if (!content) return "";

	try {
		const summarizer = await getPipeline(
			"summarization",
			"Xenova/distilbart-cnn-6-6"
		);

		const result = await summarizer(content.slice(0, 2000), { max_length: 120 });
		return result[0]?.summary_text ?? content.split(/(?<=[.!?])\s+/).slice(0, 3).join(" ");
	} catch (err) {
		console.warn("AI summarization failed, using fallback:", (err as Error).message);
		return content.split(/(?<=[.!?])\s+/).slice(0, 3).join(" ");
	}
}

/**
 * Use AI to extract relevant tags or keywords from the text content.
 * @param content - The text to analyze
 * @returns Array of tags
 */
export async function extractTagsAI(content: string): Promise<string[]> {
	if (!content) return [];

	try {
		const tagger = await getPipeline(
			"token-classification",
			"Xenova/bert-base-uncased-finetuned-ner"
		);

		const entities = await tagger(content.slice(0, 1000));
		const tags = entities
			.filter((e: any) => e.entity?.startsWith("B-") || e.entity?.startsWith("I-"))
			.map((e: any) => e.word.toLowerCase());

		// Remove duplicates
		return Array.from(new Set(tags));
	} catch (err) {
		console.warn("Tag extraction AI failed:", (err as Error).message);
		return [];
	}
}

/**
 * Full AI-enhanced normalization pipeline.
 * Cleans HTML, summarizes, extracts tags, returns normalized article content.
 * @param rawHTML - Raw HTML from source or IPFS
 * @returns Object with content, summary, and tags
 */
export async function normalizeArticleAI(rawHTML: string) {
	const content = cleanHTML(rawHTML);
	const summary = await summarizeContentAI(content);
	const tags = await extractTagsAI(content);

	return { content, summary, tags };
}

/**
 * Example usage:
 * const normalized = await normalizeArticleAI(rawHtmlString);
 * console.log(normalized.content, normalized.summary, normalized.tags);
 */