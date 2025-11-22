// frontend/src/orbitdb/types.ts
import { z } from "zod";
import { ArticleSchema } from "@/types/articles";

// Extend the ArticleSchema with OrbitDB-specific fields
export const LocalArticleSchema = ArticleSchema.extend({
	analyzed: z.boolean().optional(),
	ipfsHash: z.string().optional(),
	analysisTimestamp: z.string().optional(),
});

// TypeScript type inferred from Zod
export type LocalArticle = z.infer<typeof LocalArticleSchema>;

// Feed type
export const FeedTypeSchema = z.enum(["local", "analyzed"]);
export type FeedType = z.infer<typeof FeedTypeSchema>;
