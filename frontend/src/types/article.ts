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

/** TypeScript type inferred from `SourceMetaSchema` */
export type SourceMeta = z.infer<typeof SourceMetaSchema>;

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
 * but not yet analyzed.
 *
 * This schema ensures:
 * 1. Consistent, validated fields for ingestion
 * 2. Storage of raw content and metadata for audit/debug purposes
 * 3. Tracking parsing confidence, source, edition, and analyzed status
 */
export const ArticleSchema = z.object({
	/**
	 * Unique identifier for the article.
	 * Could be a hashed URL, UUID, or any consistent unique string.
	 */
	id: z.string(),

	/** Fully qualified URL of the article */
	url: z.string().url(),

	/** Article title. Must not be empty */
	title: z.string().min(1),

	/** Optional human-readable name of the source (e.g., "BBC News") */
	source: z.string().optional(),

	/** Domain name of the source website (e.g., "bbc.com") */
	sourceDomain: z.string().optional(),

	/** Type of source the article was ingested from (from `SourceTypes`) */
	sourceType: z.enum(SourceTypes).optional(),

	/** Optional short summary or description of the article */
	summary: z.string().optional(),

	/** Full textual content of the article */
	content: z.string().optional(),

	/** Primary image URL associated with the article */
	image: z.string().url().optional(),

	/** Optional array of categories (e.g., politics, sports, technology) */
	categories: z.array(z.string()).optional(),

	/** Optional array of tags or keywords extracted from the article */
	tags: z.array(z.string()).optional(),

	/** ISO 639-1 language code of the article content (e.g., "en", "ko") */
	language: z.string().optional(),

	/** Optional author(s) of the article */
	author: z.string().optional(),

	/** Original published date of the article, as an ISO string or feed-provided date */
	publishedAt: z.string().optional(),

	/** Edition or regional context (e.g., "US", "KR", "international") */
	edition: z.enum(editions).optional(),

	/**
	 * Parser confidence score between 0 and 1.
	 * Indicates the reliability of extracted content (e.g., low-quality extractions may have low confidence)
	 */
	confidence: z.number().min(0).max(1).optional(),

	/**
	 * Flag indicating whether this article has been analyzed.
	 * Default is `false`; will be set to `true` after processing for bias, sentiment, etc.
	 */
	analyzed: z.literal(false).default(false),

	/** IPFS hash of raw content, if stored on decentralized storage */
	ipfsHash: z.string().optional(),

	/** Original raw feed/response from the source, for debugging or audit purposes */
	raw: z.any().optional(),

	/** Metadata about the source, including political bias and confidence */
	sourceMeta: SourceMetaSchema.optional(),

	/** ISO timestamp when the article was fetched into the system */
	fetchedAt: z.string().optional(),
});

/** TypeScript type inferred from `ArticleSchema` */
export type Article = z.infer<typeof ArticleSchema>;
