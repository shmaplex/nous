import { z } from "zod";

export const SourceSchema = z.object({
	name: z.string(),
	endpoint: z.url(), // the API/RSS endpoint without the key
	apiKey: z.string().optional(), // user-entered key
	instructions: z.string().optional(),
	apiLink: z.url().optional(),
	enabled: z.boolean().optional(), // true if source should be active
	requiresApiKey: z.boolean().optional(), // new flag for sources that require an API key
	category: z.enum(["news", "blog", "rss", "social", "podcast", "tech"]).optional(),
	tags: z.array(z.string()).optional(),
	language: z.string().optional(), // e.g., 'en', 'ko'
	region: z.string().optional(), // e.g., 'US', 'KR'
	authType: z.enum(["none", "apiKey", "bearerToken", "oauth"]).optional(),
	rateLimitPerMinute: z.number().optional(),
	headers: z.record(z.string(), z.string()).optional(),
	lastUpdated: z.date().optional(),
	pinned: z.boolean().optional(),
});

// TypeScript type inferred
export type Source = z.infer<typeof SourceSchema>;

export const SourcesSchema = z.array(SourceSchema);
export type Sources = z.infer<typeof SourcesSchema>;
