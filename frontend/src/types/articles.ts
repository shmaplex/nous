// src/types/articles.ts
import { z } from "zod";

/**
 * Enumeration of supported source types for news ingestion.
 * This helps identify where the article originated and how it was parsed.
 *
 * - "gdelt": GDELT Project global news feed
 * - "rss": Standard RSS/Atom feed
 * - "html": Raw HTML page scrape
 * - "api": JSON or REST API feed
 * - "custom": Any custom integration
 * - "newswire": Wire services like AP, Reuters, AFP
 * - "google_news", "bing_news", "gcm": Search aggregator feeds
 * - "social": Generic social platform ingestion
 * - "twitter", "reddit", "youtube": Specific social platforms
 * - "newsletter", "email": Substack, Mailchimp, or email parsing
 * - "blog": Blog platforms, XML-RPC, or HTML
 * - "pdf", "doc": Document ingestion (PDF, Word, etc.)
 * - "transcript", "podcast": Audio/video transcript parsing
 * - "academic": Academic sources like arXiv, SSRN
 * - "gov", "foia", "ngo": Government, FOIA, NGO sources
 * - "openweb", "crawler": Custom web crawling / open web monitoring
 */
export const SourceTypes = [
	"gdelt",
	"rss",
	"html",
	"api",
	"custom",
	"newswire",
	"google_news",
	"bing_news",
	"gcm",
	"social",
	"twitter",
	"reddit",
	"youtube",
	"newsletter",
	"email",
	"blog",
	"pdf",
	"doc",
	"transcript",
	"podcast",
	"academic",
	"gov",
	"foia",
	"ngo",
	"openweb",
	"crawler",
] as const;

/**
 * Normalized article schema for raw news articles that have been ingested
 * but not yet analyzed. This schema is designed to:
 * 1. Provide consistent, validated fields for ingestion
 * 2. Store raw content and metadata
 * 3. Track parsing confidence and source type
 */
export const ArticleSchema = z.object({
	/** Unique identifier for the article (hashed URL, UUID, or similar) */
	id: z.string(),

	/** Fully qualified URL of the article */
	url: z.string().url(),

	/** Article title. Must not be empty. */
	title: z.string().min(1),

	/** Optional short summary or description of the article */
	summary: z.string().optional(),

	/** Full content of the article (if available) */
	content: z.string().optional(),

	/** Primary image URL associated with the article */
	image: z.string().url().optional(),

	/** Domain name of the source website (e.g., "bbc.com") */
	sourceDomain: z.string().optional(),

	/** Language code of the article (ISO 639-1, e.g., "en", "ko") */
	language: z.string().optional(),

	/** Original published date as ISO string or raw date string from feed */
	publishedAt: z.string().optional(),

	/** Raw original feed response for debugging or audit purposes */
	raw: z.any().optional(),

	/** Type of source the article was ingested from, based on `SourceTypes` */
	sourceType: z.enum(SourceTypes).optional(),

	/**
	 * Parser confidence score between 0 and 1.
	 * Useful to indicate low-quality or uncertain extractions.
	 */
	confidence: z.number().min(0).max(1).optional(),

	/**
	 * Indicates that this article has not yet been analyzed.
	 * Will be converted to `true` once processed for bias, sentiment, etc.
	 */
	analyzed: z.literal(false).default(false),

	/** IPFS hash of raw content (optional) */
	ipfsHash: z.string().optional(),
});

/** TypeScript type inferred from `ArticleSchema` */
export type Article = z.infer<typeof ArticleSchema>;
