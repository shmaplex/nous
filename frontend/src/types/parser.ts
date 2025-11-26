import { z } from "zod";
import { type Article, ArticleSchema, type Source } from "@/types";

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
export const ParserFnReturnSchema = z.array(ArticleSchema);
