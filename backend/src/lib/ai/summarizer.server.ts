import { getPipeline } from "./models.server";


/**
 * Generate an AI-powered summary using a local transformer model.
 *
 * This uses Xenova's distilled BART model for abstractive summarization.
 * Runs fully locally (no API key, no remote server needed).
 *
 * @param content - Raw article content to summarize
 * @returns A concise abstractive summary
 */
export async function summarizeContentAI(content: string): Promise<string> {
  if (!content || content.trim().length === 0) return "";

  const summarizer = await getPipeline(
    "summarization",
    "Xenova/distilbart-cnn-6-6"
  );

  // Limit input length for performance
  const safeInput = content.slice(0, 3000);

  const output = await summarizer(safeInput, {
    max_length: 130,
    min_length: 40,
  });

  return output[0]?.summary_text ?? "";
}

/**
 * Generate an "antithesis" summary for an article — a concise synthesis of
 * the opposing viewpoint or counter-narrative to the article’s main thrust.
 *
 * This function uses a local summarization model via Transformers.js:
 *   - Task: `"summarization"`
 *   - Model: `"Xenova/distilbart-cnn-6-6"`
 *
 * ## Processing Logic
 * 1. Up to the first **2000 characters** of the article are extracted.
 * 2. Passed into a BART-based summarizer to condense the ideas.
 * 3. The result is re-framed linguistically as an *opposing viewpoint*.
 *
 * ## Returns
 * A short string prefixed with:
 *   `"Opposing viewpoint: ..."`
 *
 * Example:
 * ```ts
 * Opposing viewpoint: While the article emphasizes regulatory necessity,
 * critics argue that such oversight could suppress innovation...
 * ```
 *
 * ## Intended Usage
 * This is *not* true political antithesis generation yet—it is a
 * summarization-based approximation. Later versions may:
 *   - Use instruction-tuned LLMs
 *   - Use contrastive summarization models
 *   - Incorporate rhetorical structure analysis
 *
 * @param article - Object containing optional raw article text.
 * @returns A reframed summarization that suggests an opposing viewpoint.
 */
export async function generateAntithesis(article: { content?: string }): Promise<string> {
  const content = article.content?.slice(0, 2000) ?? "";
  if (!content) return "";

  const summarizer = await getPipeline(
    "summarization",
    "Xenova/distilbart-cnn-6-6"
  );

  const result = await summarizer(content, { max_length: 120 });
  return "Opposing viewpoint: " + result[0].summary_text;
}

/**
 * Generate a short philosophical or thematic interpretation of an article.
 *
 * Uses a summarization model to create a compressed representation of the
 * article’s emotional or conceptual tone, then reframes it as a
 * philosophical insight. This is an approximation until a dedicated model,
 * rhetorical classifier, or LLM-powered interpretive layer is added.
 *
 * Model used:
 *   - Task: `"summarization"`
 *   - Model: `"Xenova/distilbart-cnn-6-6"`
 *
 * ## Processing Logic
 * 1. Analyze the first **2000 characters** of the article.
 * 2. Summarize into a condensed conceptual core (max 80 tokens).
 * 3. Prefix with `"Philosophical framing: "` to produce a reflective insight.
 *
 * ## Returns
 * A short reflective or thematic interpretation, e.g.:
 * ```ts
 * Philosophical framing: The narrative reflects a broader tension
 * between technological progress and collective responsibility...
 * ```
 *
 * ## Future Enhancements
 * - Embedding-based theme extraction
 * - Symbolic/rhetorical device detection
 * - LLM-driven metaphysical/ethical framing
 *
 * @param article - Partial article containing optional raw content.
 * @returns A short interpretive/philosophical summary string.
 */
export async function generatePhilosophicalInsight(article: { content?: string }): Promise<string> {
  const content = article.content?.slice(0, 2000) ?? "";
  if (!content) return "";

  const summarizer = await getPipeline(
    "summarization",
    "Xenova/distilbart-cnn-6-6"
  );

  const result = await summarizer(content, { max_length: 80 });

  return "Philosophical framing: " + result[0].summary_text;
}