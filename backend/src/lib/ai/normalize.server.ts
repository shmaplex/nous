// backend/src/lib/ai/normalize.server.ts
import { JSDOM } from "jsdom";
import { getPipeline } from "./models.server";
import { translateContentAI } from "./translate.server";

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

export interface NormalizedArticle {
	content: string;
	summary: string;
	tags: string[];
}

/**
 * Normalize messy HTML content into clean text.
 * - Removes <script>, <style>, <noscript>
 * - Removes hidden elements, ads, navs, headers, footers
 * - Removes common paywall overlays
 * - Collapses multiple spaces and newlines
 * @param html - The raw HTML content
 * @returns Cleaned text
 */
export function cleanHTML(html: string): string {
	if (!html) return "";

	const dom = new JSDOM(html);
	const doc = dom.window.document;

	// Utility: safely remove elements from NodeList
	const removeAll = (nodes: NodeListOf<Element>) => {
		nodes.forEach((el) => {
			el.remove(); // explicitly no return
		});
	};

	// Remove scripts, styles, and noscript
	removeAll(doc.querySelectorAll("script, style, noscript"));

	// Remove headers, footers, navs, and aside (ads/sidebar)
	removeAll(doc.querySelectorAll("header, footer, nav, aside"));

	// Remove elements that are visually hidden (display:none or hidden attribute)
	removeAll(doc.querySelectorAll("[style*='display:none'], [hidden]"));

	// Remove common paywall overlays
	removeAll(doc.querySelectorAll(".paywall, .overlay, .meteredContent, #gateway-content"));

	// Get all visible text from the body
	let content = doc.body.textContent?.trim() ?? "";

	// Collapse multiple spaces/newlines
	content = content.replace(/\s+/g, " ").trim();

	return content;
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
		const summarizer = await getPipeline("summarization", "Xenova/distilbart-cnn-6-6");

		const result = await summarizer(content.slice(0, 2000), { max_length: 120 });
		return (
			result[0]?.summary_text ??
			content
				.split(/(?<=[.!?])\s+/)
				.slice(0, 3)
				.join(" ")
		);
	} catch (err) {
		console.warn("AI summarization failed, using fallback:", (err as Error).message);
		return content
			.split(/(?<=[.!?])\s+/)
			.slice(0, 3)
			.join(" ");
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
			"Xenova/bert-base-uncased-finetuned-ner",
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
export async function normalizeArticleAI(rawHTML: string): Promise<NormalizedArticle> {
	const content = cleanHTML(rawHTML);
	const summary = await summarizeContentAI(content);
	const tags = await extractTagsAI(content);

	return { content, summary, tags };
}

/**
 * Full AI-enhanced normalization pipeline with optional translation.
 * @param rawHTML - Raw HTML from source or IPFS
 * @param targetLanguage - Optional BCP-47 language code for translation / Defaults to: English
 * @returns Object with content, summary, tags
 */
export async function normalizeAndTranslateArticle(
	rawHTML: string,
	targetLanguage = "en",
): Promise<NormalizedArticle> {
	// 1. Clean HTML
	let content = cleanHTML(rawHTML);

	// 2. Optional translation
	if (targetLanguage) {
		content = await translateContentAI(content, targetLanguage);
	}

	// 3. Summarize and extract tags
	const summary = await summarizeContentAI(content);
	const tags = await extractTagsAI(content);

	return { content, summary, tags };
}

/**
 * Example usage:
 * const normalized = await normalizeArticleAI(rawHtmlString);
 * console.log(normalized.content, normalized.summary, normalized.tags);
 */
