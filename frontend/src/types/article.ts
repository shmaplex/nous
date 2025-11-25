// frontend/src/types/article.ts
import { z } from "zod";

export const PoliticalBiasValues = ["left", "center", "right"];

/** TypeScript type for political bias */
export type PoliticalBias = (typeof PoliticalBiasValues)[number];

// Zod schema for bias
export const PoliticalBiasSchema = z.enum(PoliticalBiasValues);

/**
 * Metadata about a news source, including political bias and confidence.
 * This is used to enrich article analysis by providing context about the source
 * itself, which can then be aggregated across multiple articles covering the same story.
 */
export const SourceMetaSchema = z.object({
	/** Name of the source (e.g., "CBS News", "The New York Times") */
	name: z.string(),

	/** Political/ideological leaning of the source */
	bias: PoliticalBiasSchema,

	/**
	 * Confidence score for the source's bias classification
	 * Range: 0 (uncertain) to 1 (fully confident)
	 */
	confidence: z.number().min(0).max(1).optional(),
});

/**
 * Editions define the target audience or regional context of the article.
 * Useful for categorizing content for different countries, regions, or language markets.
 */
export const editions = [
	"international",
	"us",
	"uk",
	"ca",
	"au",
	"eu",
	"de",
	"fr",
	"es",
	"it",
	"jp",
	"kr",
	"cn",
	"in",
	"br",
	"ru",
	"mx",
	"sa",
	"ae",
	"ng",
	"za",
	"other",
] as const;

/** TypeScript type for edition */
export type Edition = (typeof editions)[number];

/** Zod schema for edition */
export const EditionSchema = z.enum(editions);

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
 * 3. Track parsing confidence, source, and regional context
 */
export const ArticleSchema = z.object({
	/** Unique identifier for the article (hashed URL, UUID, or similar) */
	id: z.string(),

	/** Fully qualified URL of the article */
	url: z.string().url(),

	/** Article title. Must not be empty. */
	title: z.string().min(1),

	/** Optional human-readable source name (e.g., "BBC News") */
	source: z.string().optional(),

	/** Domain name of the source website (e.g., "bbc.com") */
	sourceDomain: z.string().optional(),

	/** Type of source the article was ingested from, based on `SourceTypes` */
	sourceType: z.enum(SourceTypes).optional(),

	/** Optional short summary or description of the article */
	summary: z.string().optional(),

	/** Full content of the article (if available) */
	content: z.string().optional(),

	/** Primary image URL associated with the article */
	image: z.string().url().optional(),

	/** Optional array of categories (e.g., politics, sports, tech) */
	categories: z.array(z.string()).optional(),

	/** Optional array of tags/keywords extracted from the article */
	tags: z.array(z.string()).optional(),

	/** Language code of the article (ISO 639-1, e.g., "en", "ko") */
	language: z.string().optional(),

	/** Optional author(s) of the article */
	author: z.string().optional(),

	/** Original published date as ISO string or raw date string from feed */
	publishedAt: z.string().optional(),

	/** Edition or regional context (e.g., "US", "KR", "international") */
	edition: z.enum(editions).optional(),

	/**
	 * Parser confidence score between 0 and 1.
	 * Useful to indicate low-quality or uncertain extractions.
	 */
	confidence: z.number().min(0).max(1).optional(),

	/** Indicates that this article has not yet been analyzed. Will be converted to `true` once processed for bias, sentiment, etc. */
	analyzed: z.literal(false).default(false),

	/** IPFS hash of raw content (optional) */
	ipfsHash: z.string().optional(),

	/** Original raw feed/response from the source (debugging / audit purposes) */
	raw: z.any().optional(),

	/** Metadata about the source itself, including political bias and confidence */
	sourceMeta: SourceMetaSchema.optional(),
});

/** TypeScript type inferred from `ArticleSchema` */
export type Article = z.infer<typeof ArticleSchema>;
