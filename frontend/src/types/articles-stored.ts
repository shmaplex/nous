import { z } from "zod";

/**
 * Zod schema representing an article stored in OrbitDB as strings
 * (all fields are stored as strings for docstore compatibility).
 */
export const StoredArticleSchema = z.object({
	id: z.string(),
	title: z.string(),
	url: z.string(),
	content: z.string(),
	bias: z.string(),
	antithesis: z.string(),
	philosophical: z.string(),
	source: z.string(),
	category: z.string(),
	author: z.string(),
	publishedAt: z.string(),
	tags: z.string(), // JSON string of string[]
	sentiment: z.string(),
	edition: z.string(),
	analyzed: z.string(), // boolean stored as string
	ipfsHash: z.string(),
	analysisTimestamp: z.string(),
});

/**
 * TypeScript type inferred from the Zod schema
 */
export type StoredArticle = z.infer<typeof StoredArticleSchema>;
