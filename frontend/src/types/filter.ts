// frontend/src/types/filter.ts
import { z } from "zod";
import { editions } from "./article";

export const biasOptions = ["left", "center", "right", "all"];
export const sentimentOptions = ["positive", "neutral", "negative", "all"];
export const coverageOptions = ["high", "medium", "low", "all"];
export const confidenceOptions = ["high", "medium", "low", "all"];
export const editionOptions = editions;

/**
 * Zod schema defining all possible filter options for articles.
 *
 * Properties:
 * - `bias`: Political leaning of the article ("left" | "center" | "right" | "all")
 * - `edition`: Edition/country of the article (from `editions`)
 * - `sentiment`: Sentiment of the article ("positive" | "neutral" | "negative" | "all"), optional
 * - `coverage`: Coverage level of the article ("high" | "medium" | "low" | "all"), optional
 * - `confidence`: Confidence level of the article ("high" | "medium" | "low" | "all"), optional
 * - `tags`: Array of string tags associated with the article, optional
 * - `source`: Source identifier or name for the article, optional
 */
export const FilterOptionsSchema = z.object({
	bias: z.enum(biasOptions),
	edition: z.enum(editionOptions),
	sentiment: z.enum(sentimentOptions).optional(),
	coverage: z.enum(coverageOptions).optional(),
	confidence: z.enum(confidenceOptions).optional(),
	tags: z.array(z.string()).optional(),
	source: z.string().optional(),
});

/**
 * Type representing the filter options for articles.
 * Automatically inferred from `FilterOptionsSchema`.
 */
export type FilterOptions = z.infer<typeof FilterOptionsSchema>;
