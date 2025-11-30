import { getPipeline } from "./models.server";
import type { ArticleAnalyzed } from "@/types/article-analyzed";

/**
 * Detect the political bias of an article using a lightweight
 * local text-classification model (Transformers.js).
 *
 * This function currently uses:
 *   - Task: `"text-classification"`
 *   - Model: `"Xenova/distilbert-base-uncased-finetuned-sst-2-english"`
 *
 * Although the SST-2 model is trained for sentiment analysis (positive/negative),
 * we leverage its polarity as a *proxy signal* for political leaning:
 *
 *   - "positive" → interpreted as **left**
 *   - "negative" → interpreted as **right**
 *   - otherwise  → interpreted as **center**
 *
 * This is NOT a real political-bias model.
 * It serves as a placeholder until a fine-tuned ideological-bias classifier
 * is integrated (recommended models listed below).
 *
 * ## Processing Steps
 * 1. Extract text from the article (fallback to empty string).
 * 2. Limit inference to the first 500 characters for faster execution.
 * 3. Run inference through the Transformers.js pipeline.
 * 4. Map sentiment labels to political bias categories.
 *
 * ## Returns
 * A string representing one of:
 *   - `"left"`
 *   - `"center"`
 *   - `"right"`
 *
 * @param article - Partial article object containing optional `content`.
 *
 * @example
 * const bias = await detectPoliticalBias({ content: "The government announced..." });
 * console.log(bias) // "left" | "center" | "right"
 *
 * @remarks
 * To upgrade this to real political-bias detection, consider:
 *   - `Xenova/distilbert-base-uncased-finetuned-political-bias`
 *   - `cardiffnlp/twitter-roberta-base-political-bias`
 *   - `classla/bse-ideology`
 * Or load a custom fine-tuned model from IPFS.
 */
export async function detectPoliticalBias(
  article: { content?: string }
): Promise<ArticleAnalyzed["politicalBias"]> {
  const text = article.content ?? "";

  // Load the shared pipeline (cached automatically)
  const classifier = await getPipeline(
    "text-classification",
    "Xenova/distilbert-base-uncased-finetuned-sst-2-english"
  );

  // Only analyze the first part of the article to reduce compute cost
  const input = text.slice(0, 500);

  const result = await classifier(input);
  const label = result[0]?.label?.toLowerCase() ?? "neutral";

  // Basic label → political bias mapping
  if (label.includes("positive")) return "left";
  if (label.includes("negative")) return "right";
  return "center";
}