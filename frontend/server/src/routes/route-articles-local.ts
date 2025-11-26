// frontend/src/p2p/routes/route-article-local.ts
import type { IncomingMessage, ServerResponse } from "node:http";
import { addDebugLog, log } from "@/lib/log.server";
import type { Article, DebugLogEntry, RouteHandler, Source } from "@/types";
import { handleError } from "./helpers";

/**
 * Simple in-memory throttle map to limit requests per IP
 */
const throttleMap = new Map<string, { count: number; lastRequest: number }>();
const THROTTLE_LIMIT = 5; // max requests per TIME_WINDOW
const TIME_WINDOW = 1000 * 10; // 10 seconds

/**
 * POST /articles/local/fetch
 *
 * Starts a **background fetch** of articles from provided sources.
 * The route immediately responds with success, while the actual fetching,
 * parsing, normalizing, and saving happens asynchronously in the background.
 *
 * Request body may include:
 * - `sources`: array of Source objects to fetch from (default: empty array)
 * - `since`: ISO date string — only fetch articles published after this date
 *
 * Example request body:
 * ```json
 * {
 *   "sources": [
 *     { "endpoint": "https://news.example.com/api", "enabled": true },
 *     { "endpoint": "https://other.example.com/api", "enabled": true }
 *   ],
 *   "since": "2025-11-23T00:00:00Z"
 * }
 * ```
 *
 * Response (immediate):
 * - `success`: boolean — always true if the fetch was triggered
 * - `message`: string — status message
 *
 * Notes:
 * - Errors during the actual fetch process are logged via the optional `addDebugLog` function.
 * - Articles are saved only if they are unique in the local DB.
 */
export const fetchLocalArticlesRoute: RouteHandler = {
	method: "POST",
	path: "/articles/local/fetch",
	handler: async ({
		add: addDebugLog,
		fetchAllSources,
		addUniqueArticles,
		res,
		body,
	}: {
		/**
		 * Optional function to log debug entries asynchronously.
		 */
		add?: (entry: DebugLogEntry) => Promise<void>;

		/**
		 * Function that fetches articles from the provided sources.
		 * Should return a list of articles and any per-source errors.
		 */
		fetchAllSources?: (
			sources: Source[],
			since?: Date,
		) => Promise<{ articles: Article[]; errors: { endpoint: string; error: string }[] }>;

		/**
		 * Function to add multiple unique articles to the local DB.
		 * Returns the number of articles successfully added.
		 */
		addUniqueArticles?: (articles: Article[]) => Promise<number>;

		/** Node.js HTTP response object */
		res: ServerResponse;

		/** Request body */
		body?: { sources?: Source[]; since?: string };
	}) => {
		res.setHeader("Content-Type", "application/json");

		if (!fetchAllSources || !addUniqueArticles) {
			await handleError(res, "Required DB functions not provided", 500, "error");
			return;
		}

		const sources = Array.isArray(body?.sources) ? body.sources : [];
		const since = body?.since ? new Date(body.since) : undefined;

		// Fire-and-forget background fetch
		(async () => {
			try {
				const { articles, errors } = await fetchAllSources(sources, since);

				// Save only unique articles
				const addedCount = await addUniqueArticles(articles);

				// Log any fetch errors
				if (errors && addDebugLog) {
					log(`fetchAllSources errors: ${JSON.stringify(errors)}`, "error");
					await addDebugLog({
						_id: crypto.randomUUID(),
						timestamp: new Date().toISOString(),
						message: "fetchAllSources encountered errors",
						level: "error",
						meta: { errors },
					});
				}

				// Log successful fetch
				if (addDebugLog) {
					await addDebugLog({
						_id: crypto.randomUUID(),
						timestamp: new Date().toISOString(),
						message: `Background fetch completed: ${addedCount} new articles`,
						level: "info",
						meta: { sources: sources.map((s) => s.name) },
					});
				}
			} catch (err) {
				const message = (err as Error).message || "Unknown error fetching articles";
				log(`Background fetch error: ${message}`, "error");

				if (addDebugLog) {
					await addDebugLog({
						_id: crypto.randomUUID(),
						timestamp: new Date().toISOString(),
						message: `Background fetch failed: ${message}`,
						level: "error",
					});
				}
			}
		})();

		// Immediately respond so frontend can show a loader
		res.end(JSON.stringify({ success: true, message: "Article fetch started" }));
	},
};

/**
 * GET /articles/local
 * Returns all articles from the local article DB, filtered by enabled sources.
 * Throttled per client IP to prevent abuse.
 *
 * This route expects a `getAllArticles` function that returns all articles stored
 * in the local article DB (e.g., OrbitDB). Only articles whose source endpoint is in
 * the available sources list will be returned.
 */
export const getAllLocalArticlesRoute: RouteHandler = {
	method: "GET",
	path: "/articles/local",
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
 * GET /articles/local/:url
 * Fetch a single source article by URL
 */
export const getLocalArticleByUrlRoute: RouteHandler = {
	method: "GET",
	path: "/articles/local/",
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
 * POST /articles/local/save
 * Save a single new source article
 */
export const saveLocalArticleRoute: RouteHandler = {
	method: "POST",
	path: "/articles/local/save",
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
 * POST /articles/local/refetch
 * Add multiple articles, skipping duplicates
 */
export const refetchLocalArticlesRoute: RouteHandler = {
	method: "POST",
	path: "/articles/local/refetch",
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
 * DELETE /articles/local/delete/:url
 * Delete a source article by URL
 */
export const deleteLocalArticleRoute: RouteHandler = {
	method: "DELETE",
	path: "/articles/local/delete/",
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
	fetchLocalArticlesRoute,
	getAllLocalArticlesRoute,
	getLocalArticleByUrlRoute,
	refetchLocalArticlesRoute,
	saveLocalArticleRoute,
	deleteLocalArticleRoute,
];
