import { z } from "zod";

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
});

/** TypeScript type inferred from `SourceSchema` */
export type Source = z.infer<typeof SourceSchema>;

/** Array schema for multiple sources */
export const SourcesSchema = z.array(SourceSchema);

/** TypeScript type inferred for an array of sources */
export type Sources = z.infer<typeof SourcesSchema>;
