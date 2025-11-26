import type { ParserFn, Source } from "@/types";

import { gdeltParser } from "./gdelt";
import { parseHackerNews } from "./hn";
import { htmlParser } from "./html";
import { jsonParser } from "./json";
import { rssParser } from "./rss";

/**
 * Map of parser name → parser function.
 */
export const parsers: Record<string, ParserFn> = {
	json: jsonParser,
	rss: rssParser,
	gdelt: gdeltParser,
	html: htmlParser,
	hn: parseHackerNews,
};

/**
 * Retrieves parser for a source.
 * Defaults to JSON parser.
 */
export function getParser(source: Source): ParserFn {
	const parserName = source.parser ?? "json";
	return parsers[parserName] ?? jsonParser;
}
