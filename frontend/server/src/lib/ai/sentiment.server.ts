import { getPipeline } from "./models.server";
import type { ArticleAnalyzed } from "@/types/article-analyzed";

/**
 * Perform sentiment analysis on an article using a lightweight,
 * locally runnable text-classification model via Transformers.js.
 *
 * Currently uses:
 *   - Task: `"text-classification"`
 *   - Model: `"Xenova/distilbert-base-uncased-finetuned-sst-2-english"`
 *
 * The SST-2 model outputs high-level sentiment classes:
 *   - `"positive"`
 *   - `"negative"`
 *   - `"neutral"` (if the model supports it or inferred fallback)
 *
 * ## Processing Details
 * 1. The article's first 500 characters are analyzed for speed and consistency.
 * 2. If no content is provided → returns `"neutral"`.
 * 3. Results are normalized to lowercase.
 *
 * ## Returned Value
 * Returns a sentiment string compatible with:
 *   `ArticleAnalyzed["sentiment"]`
 *
 * Example output:
 * ```ts
 * "positive" | "negative" | "neutral"
 * ```
 *
 * ## Example
 * ```ts
 * const sentiment = await analyzeSentiment({ content: "The market reacted strongly..." });
 * console.log(sentiment); // "positive"
 * ```
 *
 * @param article - Partial article containing optional textual content.
 * @returns A sentiment label string.
 *
 * @remarks
 * This is a placeholder implementation using a general-purpose sentiment model.
 * You may later upgrade to:
 *   - Domain-specific sentiment models (e.g., political news sentiment)
 *   - Multilingual sentiment models for KR, JP, EU news
 *   - Models stored on IPFS for decentralized loading
 */
export async function analyzeSentiment(
  article: { content?: string }
): Promise<ArticleAnalyzed["sentiment"]> {
  const content = article.content ?? "";
  if (!content) return "neutral";

  // Load (or reuse) a cached classifier pipeline
  const classifier = await getPipeline(
    "text-classification",
    "Xenova/distilbert-base-uncased-finetuned-sst-2-english"
  );

  // Limit input for efficiency
  const text = content.slice(0, 500);

  const output = await classifier(text);

  const label = output?.[0]?.label?.toLowerCase() ?? "neutral";

  return label as ArticleAnalyzed["sentiment"];
}