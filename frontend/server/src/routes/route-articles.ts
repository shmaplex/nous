import type { IncomingMessage, ServerResponse } from "node:http";
import type { Article, RouteHandler } from "@/types";
import { handleError } from "./helpers";

/**
 * @route GET /api/article
 * @description
 * Fetch a single article from the local cache (OrbitDB / Helia) or IPFS.
 * The route supports multiple query parameters for locating the article:
 *
 * - `cid`: The IPFS CID of the article (content-addressed)
 * - `id`: Unique internal ID of the article
 * - `url`: Original URL of the article
 *
 * The route attempts to find the article in the following priority:
 * 1. CID
 * 2. ID
 * 3. URL
 *
 * @example
 * GET /api/article?cid=bafybeid...
 * GET /api/article?id=abc123
 * GET /api/article?url=https://example.com/news
 *
 * @param req - Node.js HTTP IncomingMessage
 * @param res - Node.js HTTP ServerResponse
 * @param getLocalArticle - Optional helper function to fetch an article from DB by CID, ID, or URL
 * @returns JSON object containing the article or an error message
 */
export const getArticleRoute: RouteHandler = {
	method: "GET",
	path: "/api/article",
	handler: async ({
		req,
		res,
		getLocalArticle,
	}: {
		req: IncomingMessage;
		res: ServerResponse;
		getLocalArticle?: (idOrCid: string) => Promise<Article | null>;
	}) => {
		res.setHeader("Content-Type", "application/json");

		try {
			// Parse query parameters
			const urlParams = new URL(`http://dummy${req.url}`).searchParams;
			const cid = urlParams.get("cid");
			const id = urlParams.get("id");
			const url = urlParams.get("url");

			let article: Article | null = null;

			// Try fetching by CID first
			if (cid && getLocalArticle) {
				article = await getLocalArticle(cid);
			}
			// Then try by internal ID
			else if (id && getLocalArticle) {
				article = await getLocalArticle(id);
			}
			// Fallback to URL
			else if (url && getLocalArticle) {
				article = await getLocalArticle(url);
			}

			// Return 404 if not found
			if (!article) {
				res.statusCode = 404;
				res.end(JSON.stringify({ error: "Article not found" }));
				return;
			}

			// Successful fetch
			res.end(JSON.stringify(article));
		} catch (err) {
			res.statusCode = 500;
			res.end(JSON.stringify({ error: (err as Error).message }));
		}
	},
};

/**
 * @function fetchArticleByIdOrCid
 * @description Helper method for server-side logic to fetch an article by any identifier.
 * @param idOrCid - CID or internal ID of the article
 * @param getLocalArticle - Function to access the local DB
 * @returns Article object or null if not found
 */
export async function fetchArticleByIdOrCid(
	idOrCid: string,
	getLocalArticle?: (idOrCid: string) => Promise<Article | null>,
): Promise<Article | null> {
	if (!getLocalArticle) return null;
	try {
		return await getLocalArticle(idOrCid);
	} catch {
		return null;
	}
}

/**
 * @function fetchArticleByUrl
 * @description Helper method to fetch an article using its original URL
 * @param url - Original article URL
 * @param getLocalArticle - Function to access the local DB
 * @returns Article object or null if not found
 */
export async function fetchArticleByUrl(
	url: string,
	getLocalArticle?: (idOrCid: string) => Promise<Article | null>,
): Promise<Article | null> {
	if (!getLocalArticle) return null;
	try {
		return await getLocalArticle(url);
	} catch {
		return null;
	}
}

// Export all routes in a single array for router registration
export const routes: RouteHandler[] = [getArticleRoute];
