import { z } from "zod";
import { SourceNormalizerSchema } from "./normalizer";
import { SourceParserSchema } from "./parser";

/**
 * Comprehensive list of source categories.
 * Used for news, blogs, feeds, podcasts, and tech sources.
 */
export const SourceCategories = [
	"news",
	"blog",
	"rss",
	"social",
	"podcast",
	"tech",
	"research",
	"science",
	"entertainment",
	"sports",
	"politics",
	"business",
	"finance",
	"health",
	"education",
	"lifestyle",
	"travel",
	"culture",
	"art",
	"music",
	"gaming",
	"technology",
	"ai",
	"environment",
	"opinion",
	"editorial",
	"local",
	"international",
	"government",
	"ngo",
	"legal",
] as const;

export type SourceCategory = (typeof SourceCategories)[number];

/**
 * List of authentication types that a source may require.
 */
export const AuthTypes = [
	"none", // No authentication required
	"apiKey", // Simple API key
	"bearerToken", // OAuth bearer token
	"oauth", // Full OAuth flow
	"basicAuth", // HTTP Basic Auth
	"digestAuth", // HTTP Digest Auth
] as const;

export type AuthType = (typeof AuthTypes)[number];

/**
 * Extends Source with hidden and default flags.
 */
export interface SourceWithHidden extends Source {
	hidden?: boolean;
	isDefault?: boolean;
}

/**
 * Schema for a content or news source.
 *
 * This defines metadata and configuration for any source of articles,
 * including API endpoints, access keys, type, region, and additional metadata.
 */
export const SourceSchema = z.object({
	/** Name of the source (e.g., "BBC News", "The New York Times") */
	name: z.string(),

	/** API or RSS endpoint URL (without any keys included) */
	endpoint: z.url(),

	/** Optional API key provided by the user for accessing the source */
	apiKey: z.string().optional(),

	/** Optional instructions for using or integrating with this source */
	instructions: z.string().optional(),

	/** Optional URL pointing to API documentation for the source */
	apiLink: z.url().optional(),

	/** Optional flag indicating if this source is active/enabled */
	enabled: z.boolean().optional(),

	/** Optional flag: does this source require an API key for access? */
	requiresApiKey: z.boolean().optional(),

	/** Optional source category */
	category: z.enum(SourceCategories).optional(),

	/** Optional array of tags associated with this source */
	tags: z.array(z.string()).optional(),

	/** Optional language code (ISO 639-1), e.g., 'en', 'ko' */
	language: z.string().optional(),

	/** Optional region code for the source, e.g., 'US', 'KR' */
	region: z.string().optional(),

	/** Optional authentication type required by the source */
	authType: z.enum(AuthTypes).optional(),

	/** Optional API rate limit in requests per minute */
	rateLimitPerMinute: z.number().optional(),

	/** Optional custom headers for API requests (key-value map) */
	headers: z.record(z.string(), z.string()).optional(),

	/** Optional timestamp of the last time this source was updated */
	lastUpdated: z.date().optional(),

	/** Optional flag indicating whether this source is pinned for priority display */
	pinned: z.boolean().optional(),

	/**
	 * Parser used to interpret the raw data returned by the source.
	 *
	 * The parser determines *how the raw payload is read* (RSS, JSON, GDELT, HTML, etc.)
	 * **before** normalization.
	 *
	 * Examples:
	 * - "rss" → uses rssParser
	 * - "json" → uses jsonParser
	 * - "gdelt" → uses gdeltParser
	 * - "hn" → Hacker News-specific parser
	 * - "html" → raw HTML parsing (scraping)
	 *
	 * Defaults to `"json"` since most APIs return JSON.
	 */
	parser: SourceParserSchema.default("json"),

	/**
	 * Normalizer used to convert parsed items into the unified `Article` shape.
	 *
	 * A normalizer transforms *parsed* items (RSS item, JSON entry, GDELT article, HN story ID)
	 * into your internal application-wide `Article` format.
	 *
	 * Examples:
	 * - "json" → normalizeJson
	 * - "rss" → normalizeRss
	 * - "gdelt" → normalizeGdelt
	 * - "reddit" → normalizeReddit
	 * - "hn" → normalizeHackerNews
	 *
	 * Defaults to `"json"` because it's the most common structure.
	 */
	normalizer: SourceNormalizerSchema.default("json"),
});

/** TypeScript type inferred from `SourceSchema` */
export type Source = z.infer<typeof SourceSchema>;

/** Array schema for multiple sources */
export const SourcesSchema = z.array(SourceSchema);

/** TypeScript type inferred for an array of sources */
export type Sources = z.infer<typeof SourcesSchema>;

/**
 * ArticlesBySource represents a collection of raw feed data grouped by source name.
 *
 * Each entry maps a source name to the raw response fetched from that source.
 * The raw data can be JSON, XML, RSS, HTML, or any other format provided by the source.
 * Parsing and normalization is intended to be handled by the Node/JS frontend.
 *
 * Example:
 *
 * {
 *   "BBC News": "<rss>...</rss>",
 *   "NY Times": "[{ \"id\": \"3\", \"title\": \"Article C\", \"url\": \"https://nytimes.com/c\" }]"
 * }
 */
export const ArticlesBySourceSchema = z.record(z.string(), z.instanceof(Uint8Array).or(z.string()));

/** TypeScript type for ArticlesBySource */
export type ArticlesBySource = z.infer<typeof ArticlesBySourceSchema>;
