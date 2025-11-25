import { z } from "zod";
import type { Article, Source } from "@/types";

/** Valid parser types */
export const SourceParsers = ["json", "rss", "gdelt", "html", "hn", "reddit"] as const;
export const SourceParserSchema = z.enum(SourceParsers);
export type SourceParser = z.infer<typeof SourceParserSchema>;

/**
 * TypeScript function signature for a parser.
 * A parser:
 *   - receives rawData (any)
 *   - receives the full Source definition
 *   - returns an array of normalized Articles
 */
export type ParserFn = (rawData: any, source: Source) => Article[];

/**
 * Optional runtime Zod validation for parser return values.
 *
 * You can wrap the parser if you want to validate the output at runtime:
 */
export const ParserFnReturnSchema = z.array(
	z.object({
		id: z.string(),
		url: z.url(),
		title: z.string(),
		content: z.string().optional(),
		summary: z.string().optional(),
		source: z.string().optional(),
		sourceDomain: z.string().optional(),
		sourceType: z.string().optional(),
		categories: z.array(z.string()).optional(),
		tags: z.array(z.string()).optional(),
		language: z.string().optional(),
		author: z.string().optional(),
		publishedAt: z.string().optional(),
		edition: z.string().optional(),
		confidence: z.number().min(0).max(1).optional(),
		analyzed: z.boolean(),
		ipfsHash: z.string().optional(),
		raw: z.any().optional(),
		sourceMeta: z.any().optional(),
	}),
);
