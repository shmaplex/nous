// src/types/articles.ts
import { z } from "zod";

// Edition type
export const editions = ["international", "us", "kr"] as const;

export const ArticleSchema = z.object({
	id: z.string().optional(),
	title: z.string(),
	url: z.string(),
	content: z.string(),
	bias: z.enum(["left", "center", "right"]).optional(),
	antithesis: z.string().optional(),
	philosophical: z.string().optional(),
	source: z.string().optional(),
	category: z.string().optional(),
	author: z.string().optional(),
	publishedAt: z.string().optional(),
	tags: z.array(z.string()).optional(),
	sentiment: z.string().optional(),
	edition: z.enum(editions).optional(),
	analyzed: z.boolean().optional(), // flag to indicate analysis completed
	ipfsHash: z.string().optional(), // IPFS hash of full content
	analysisTimestamp: z.string().optional(), // when analysis was performed
});

// TypeScript type inferred from Zod
export type Article = z.infer<typeof ArticleSchema>;
