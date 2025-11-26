// frontend/src/types/article-analyzed.ts
import { z } from "zod";
import { editions, PoliticalBiasValues, SourceMetaSchema, SourceTypes } from "./article";

/** Cognitive bias detection output from AI */
export const CognitiveBiasSchema = z.object({
	/** Name of the detected cognitive bias (e.g., "Appeal to Emotion") */
	bias: z.string(),
	/** Exact snippet from the article that shows the bias */
	snippet: z.string(),
	/** Short layman's explanation */
	explanation: z.string(),
	/** Severity: low, medium, high */
	severity: z.enum(["low", "medium", "high"]),
	/** Detailed description of the cognitive bias */
	description: z.string().optional(),
	/** Category of the bias (e.g., "Framing", "Confirmation Bias") */
	category: z.string().optional(),
});

/**
 * Schema for analyzed news articles with enriched AI features
 */
export const ArticleAnalyzedSchema = z.object({
	/** Unique identifier for the article (hash, UUID, etc.) */
	id: z.string(),

	/** Article title, never empty */
	title: z.string(),

	/** Fully qualified URL of the article */
	url: z.string().url(),

	/** Full textual content of the article */
	content: z.string(),

	// ----------------------
	// AI / Feature-Enriched Fields
	// ----------------------

	/** Political/ideological bias of the article (optional) */
	politicalBias: z.enum(PoliticalBiasValues).optional(),

	/** Concise summary of opposing viewpoints (antithesis), optional */
	antithesis: z.string().optional(),

	/** Philosophical or thematic interpretation, optional */
	philosophical: z.string().optional(),

	/** Overall sentiment, e.g., positive/negative/neutral, optional */
	sentiment: z.string().optional(),

	/** Tags or keywords extracted from the article */
	tags: z.array(z.string()).optional(),

	/** Array of detected cognitive biases (AI-driven analysis) */
	cognitiveBiases: z.array(CognitiveBiasSchema).optional(),

	// ----------------------
	// Metadata
	// ----------------------

	/** Source name or domain (e.g., "bbc.com") */
	source: z.string().optional(),

	/** Type of source the article was ingested from, based on `SourceTypes` */
	sourceType: z.enum(SourceTypes).optional(),

	/** Category of article (e.g., "sports", "politics") */
	category: z.string().optional(),

	/** Author name(s) */
	author: z.string().optional(),

	/** Original published date (ISO string or feed raw) */
	publishedAt: z.string().optional(),

	/** Edition or regional context (international, US, KR, etc.) */
	edition: z.enum(editions).optional(),

	// ----------------------
	// Analysis Flags / Tracking
	// ----------------------

	/** Marks this article as analyzed */
	analyzed: z.literal(true).default(true),

	/** IPFS hash of full content, optional */
	ipfsHash: z.string().optional(),

	/** Timestamp when analysis was performed */
	analysisTimestamp: z.string().optional(),

	// ----------------------
	// Optional Future-Proof Fields
	// ----------------------

	/** Confidence score of the analysis (0-1) */
	confidence: z.number().min(0).max(1).optional(),

	/** Optional raw data snapshot for debugging / auditing */
	raw: z.any().optional(),

	/** Metadata about the source itself, including political bias and confidence */
	sourceMeta: SourceMetaSchema.optional(),

	/** ISO timestamp when the article was fetched into the system */
	fetchedAt: z.string().optional(),
});

export type ArticleAnalyzed = z.infer<typeof ArticleAnalyzedSchema>;
export type CognitiveBias = z.infer<typeof CognitiveBiasSchema>;
