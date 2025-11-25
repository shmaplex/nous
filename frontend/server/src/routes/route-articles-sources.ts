// frontend/src/p2p/routes/route-article-sources.ts
import type { IncomingMessage, ServerResponse } from "node:http";
import { addDebugLog, log } from "@/lib/log.server";
import type { Article, RouteHandler, Source } from "@/types";
import { handleError } from "./helpers";

/**
 * Simple in-memory throttle map to limit requests per IP
 */
const throttleMap = new Map<string, { count: number; lastRequest: number }>();
const THROTTLE_LIMIT = 5; // max requests per TIME_WINDOW
const TIME_WINDOW = 1000 * 10; // 10 seconds

/**
 * POST /articles/sources/fetch
 * Fetch articles from a list of enabled sources.
 *
 * Expects `body.sources` to be an array of source objects, each containing:
 * - `endpoint`: string — the URL to fetch articles from
 * - `enabled`: boolean — whether this source should be used
 *
 * The route will call the provided `fetchAllSources` function, passing the
 * sources from the request body. It returns the flattened array of all fetched articles.
 *
 * Example request body:
 * ```json
 * {
 *   "sources": [
 *     { "endpoint": "https://news.example.com/api", "enabled": true },
 *     { "endpoint": "https://other.example.com/api", "enabled": false }
 *   ]
 * }
 * ```
 */
export const fetchSourcesRoute: RouteHandler = {
	method: "POST",
	path: "/articles/sources/fetch",
	handler: async ({
		fetchAllSources,
		res,
		body,
	}: {
		fetchAllSources?: (sources: Source[]) => Promise<Article[]>;
		res: ServerResponse;
		body?: { sources: Source[] };
	}) => {
		res.setHeader("Content-Type", "application/json");

		if (!body || !Array.isArray(body.sources)) {
			await handleError(res, "Missing or invalid 'sources' array in body", 400, "warn");
			return;
		}

		if (!fetchAllSources) {
			await handleError(res, "fetchAllSources function not provided", 500, "error");
			return;
		}

		try {
			const fetchedArticles = await fetchAllSources(body.sources);
			res.end(JSON.stringify({ success: true, articles: fetchedArticles }));
		} catch (err) {
			const message = (err as Error).message;
			log(`Error in fetchSourcesRoute: ${message}`, "error");
			await handleError(res, message, 500, "error");
		}
	},
};

/**
 * GET /articles/sources
 * Returns all articles from the sources DB, filtered by enabled sources.
 * Throttled per client IP to prevent abuse.
 *
 * This route expects a `getAllArticles` function that returns all articles stored
 * in the sources DB (e.g., OrbitDB). Only articles whose source endpoint is in
 * the available sources list will be returned.
 */
export const getAllSourcesRoute: RouteHandler = {
	method: "GET",
	path: "/articles/sources",
	handler: async ({
		getAllArticles,
		res,
		req,
	}: {
		getAllArticles?: () => Promise<Article[]>;
		res: ServerResponse<any>;
		req: IncomingMessage;
	}) => {
		res.setHeader("Content-Type", "application/json");
		const clientIP = req.socket.remoteAddress || "unknown";

		// --- Throttle requests per client IP ---
		const now = Date.now();
		const throttle = throttleMap.get(clientIP) || { count: 0, lastRequest: now };

		if (now - throttle.lastRequest > TIME_WINDOW) throttle.count = 0;
		throttle.count++;
		throttle.lastRequest = now;
		throttleMap.set(clientIP, throttle);

		if (throttle.count > THROTTLE_LIMIT) {
			await handleError(res, "Too many requests — please slow down.", 429, "warn");
			return;
		}

		if (!getAllArticles) {
			await handleError(res, "getAllArticles function not provided", 500, "error");
			return;
		}

		try {
			const allArticles = await getAllArticles();
			const availableSources: { endpoint: string }[] = []; // TODO: replace with real sources
			const availableEndpoints = new Set(availableSources.map((s) => s.endpoint));

			const filtered = allArticles.filter((article) =>
				availableEndpoints.has(article.source || ""),
			);

			await addDebugLog({
				message: `Fetched ${filtered.length} articles for ${clientIP}`,
				level: "info",
			});

			res.end(JSON.stringify(filtered));
		} catch (err) {
			const message = (err as Error).message || "Unknown error fetching articles";
			await handleError(res, `Error fetching articles for ${clientIP}: ${message}`, 500, "error");
		}
	},
};

/**
 * GET /articles/sources/:url
 * Fetch a single source article by URL
 */
export const getSourceByUrlRoute: RouteHandler = {
	method: "GET",
	path: "/articles/sources/",
	handler: async ({
		getArticle,
		res,
		url,
	}: {
		getArticle?: (url: string) => Promise<Article | null>;
		res: ServerResponse<any>;
		url?: string;
	}) => {
		res.setHeader("Content-Type", "application/json");

		if (!getArticle) {
			await handleError(res, "getArticle not provided", 500, "error");
			return;
		}

		try {
			const pathParts = url?.split("/") || [];
			const articleUrl = decodeURIComponent(pathParts.slice(3).join("/"));
			if (!articleUrl) {
				await handleError(res, "No article URL provided", 400, "warn");
				return;
			}

			const article = await getArticle(articleUrl);
			if (!article) {
				await handleError(res, `Article not found: ${articleUrl}`, 404, "warn");
				return;
			}

			res.end(JSON.stringify(article));
		} catch (err) {
			const message = (err as Error).message;
			await handleError(res, `Error fetching article: ${message}`, 500, "error");
		}
	},
};

/**
 * POST /articles/sources/save
 * Save a single new source article
 */
export const saveSourceRoute: RouteHandler = {
	method: "POST",
	path: "/articles/sources/save",
	handler: async ({
		saveArticle,
		res,
		body,
	}: {
		saveArticle?: (doc: Article) => Promise<void>;
		res: ServerResponse<any>;
		body?: any;
	}) => {
		res.setHeader("Content-Type", "application/json");

		if (!saveArticle) {
			await handleError(res, "saveArticle not provided", 500, "error");
			return;
		}
		if (!body || !body.url || !body.title || !body.content) {
			await handleError(res, "Missing required article fields", 400, "warn");
			return;
		}

		try {
			await saveArticle(body);
			await addDebugLog({ message: `Saved article: ${body.url}`, level: "info" });
			res.end(JSON.stringify({ success: true, url: body.url }));
		} catch (err) {
			const message = (err as Error).message;
			await handleError(res, `Error saving article: ${message}`, 500, "error");
		}
	},
};

/**
 * POST /articles/sources/refetch
 * Add multiple articles, skipping duplicates
 */
export const refetchSourcesRoute: RouteHandler = {
	method: "POST",
	path: "/articles/sources/refetch",
	handler: async ({
		addUniqueArticles,
		res,
		body,
	}: {
		addUniqueArticles?: (articles: Article[]) => Promise<number>;
		res: ServerResponse<any>;
		body?: any;
	}) => {
		res.setHeader("Content-Type", "application/json");

		if (!addUniqueArticles) {
			await handleError(res, "addUniqueArticles not provided", 500, "error");
			return;
		}
		if (!body || !Array.isArray(body)) {
			await handleError(res, "Expected an array of articles", 400, "warn");
			return;
		}

		try {
			const addedCount = await addUniqueArticles(body);
			await addDebugLog({ message: `Refetched ${addedCount} unique articles`, level: "info" });
			res.end(JSON.stringify({ success: true, added: addedCount }));
		} catch (err) {
			const message = (err as Error).message;
			await handleError(res, `Error refetching articles: ${message}`, 500, "error");
		}
	},
};

/**
 * DELETE /articles/sources/delete/:url
 * Delete a source article by URL
 */
export const deleteSourceRoute: RouteHandler = {
	method: "DELETE",
	path: "/articles/sources/delete/",
	handler: async ({
		deleteArticle,
		res,
		url,
	}: {
		deleteArticle?: (url: string) => Promise<void>;
		res: ServerResponse<any>;
		url?: string;
	}) => {
		res.setHeader("Content-Type", "application/json");

		if (!deleteArticle) {
			await handleError(res, "deleteArticle not provided", 500, "error");
			return;
		}

		try {
			const pathParts = url?.split("/") || [];
			const articleUrl = decodeURIComponent(pathParts.slice(4).join("/"));
			if (!articleUrl) {
				await handleError(res, "No article URL provided", 400, "warn");
				return;
			}

			await deleteArticle(articleUrl);
			await addDebugLog({ message: `Deleted article: ${articleUrl}`, level: "info" });
			res.end(JSON.stringify({ success: true, url: articleUrl }));
		} catch (err) {
			const message = (err as Error).message;
			await handleError(res, `Error deleting article: ${message}`, 500, "error");
		}
	},
};

// Export all routes as array
export const routes: RouteHandler[] = [
	fetchSourcesRoute,
	getAllSourcesRoute,
	getSourceByUrlRoute,
	saveSourceRoute,
	refetchSourcesRoute,
	deleteSourceRoute,
];
