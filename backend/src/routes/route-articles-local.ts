// frontend/src/p2p/routes/route-article-local.ts
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Helia } from "helia";
import { addDebugLog, log } from "@/lib/log.server";
import type { Article, DebugLogEntry, RouteHandler, Source } from "@/types";
import { handleError } from "./helpers";

/**
 * Simple in-memory throttle map to limit requests per IP
 */
const throttleMap = new Map<string, { count: number; lastRequest: number }>();
const THROTTLE_LIMIT = 15; // max requests per TIME_WINDOW
const TIME_WINDOW = 1000 * 5; // 5 seconds

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
		fetchAllLocalSources,
		addUniqueLocalArticles,
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
		fetchAllLocalSources?: (
			sources: Source[],
			since?: Date,
		) => Promise<{ articles: Article[]; errors: { endpoint: string; error: string }[] }>;

		/**
		 * Function to add multiple unique articles to the local DB.
		 * Returns the number of articles successfully added.
		 */
		addUniqueLocalArticles?: (articles: Article[]) => Promise<number>;

		/** Node.js HTTP response object */
		res: ServerResponse;

		/** Request body */
		body?: { sources?: Source[]; since?: string };
	}) => {
		res.setHeader("Content-Type", "application/json");

		if (!fetchAllLocalSources || !addUniqueLocalArticles) {
			await handleError(res, "Required DB functions not provided", 500, "error");
			return;
		}

		const sources = Array.isArray(body?.sources) ? body.sources : [];
		const since = body?.since ? new Date(body.since) : undefined;

		// Fire-and-forget background fetch
		(async () => {
			try {
				const { articles, errors } = await fetchAllLocalSources(sources, since);

				// Save only unique articles
				const addedCount = await addUniqueLocalArticles(articles);

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
						meta: { sources: sources.map((s) => s.name) ?? 0 },
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
		add: addDebugLog,
		getAllLocalArticles,
		res,
		req,
	}: {
		/**
		 * Optional function to log debug entries asynchronously.
		 */
		add?: (entry: DebugLogEntry) => Promise<void>;
		getAllLocalArticles?: (sources?: Source[]) => Promise<Article[]>;
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

		if (!getAllLocalArticles) {
			await handleError(res, "getAllLocalArticles function not provided", 500, "error");
			return;
		}

		try {
			const allArticles = await getAllLocalArticles();

			console.log("allArticles", JSON.stringify(allArticles, null, 2));

			if (addDebugLog) {
				await addDebugLog({
					_id: crypto.randomUUID(),
					timestamp: new Date().toISOString(),
					message: `Fetched ${allArticles.length} articles for ${clientIP}`,
					level: "info",
				});
			}

			res.end(JSON.stringify(allArticles));
		} catch (err) {
			const message = (err as Error).message || "Unknown error fetching articles";
			await handleError(res, `Error fetching articles for ${clientIP}: ${message}`, 500, "error");
		}
	},
};

/**
 * GET /articles/local/full
 * Fetch a single local article by ID, CID, or URL,
 * ensure content is fetched from the source if missing,
 * store summary and full content, and run analysis if needed.
 */
export const getFullLocalArticleRoute: RouteHandler = {
	method: "GET",
	path: "/articles/local/full",
	handler: async ({
		getLocalArticle,
		getFullLocalArticle,
		analyzeArticle,
		helia,
		req,
		res,
	}: {
		getLocalArticle?: (idOrCidOrUrl: string) => Promise<Article | null>;
		getFullLocalArticle?: (article: Article, helia: Helia) => Promise<Article>;
		analyzeArticle?: (article: Article) => Promise<Article>;
		helia?: Helia;
		req: IncomingMessage;
		res: ServerResponse;
	}) => {
		res.setHeader("Content-Type", "application/json");

		if (!getLocalArticle) {
			await handleError(res, "getLocalArticle function not provided", 500, "error");
			return;
		}
		if (!getFullLocalArticle) {
			await handleError(res, "getFullLocalArticle function not provided", 500, "error");
			return;
		}
		if (!helia) {
			await handleError(res, "Helia node not provided", 500, "error");
			return;
		}

		try {
			// Parse query params: id, cid, or url
			const urlParams = new URLSearchParams(req.url?.split("?")[1] ?? "");
			const id = urlParams.get("id");
			const cid = urlParams.get("cid");
			const url = urlParams.get("url");

			if (!id && !cid && !url) {
				await handleError(res, "No article ID, CID, or URL provided", 400, "warn");
				return;
			}

			const lookupKey = id || cid || url!;
			const article = await getLocalArticle(lookupKey);
			if (!article) {
				await handleError(res, `Article not found for ID/CID/URL: ${lookupKey}`, 404, "warn");
				return;
			}

			// Load full content from IPFS or source if missing
			const fullArticle = await getFullLocalArticle(article, helia);

			// Run AI analysis if not already done
			let analyzedArticle = fullArticle;
			if (!fullArticle.analyzed && analyzeArticle) {
				analyzedArticle = await analyzeArticle(fullArticle);
			}

			res.end(JSON.stringify(analyzedArticle));
		} catch (err) {
			const message = (err as Error).message;
			await handleError(res, `Error fetching article: ${message}`, 500, "error");
		}
	},
};


/**
 * GET /api/article/aggregated/:id
 * Fetch aggregated article with full analysis
 */
// export const getAggregatedArticleRoute: RouteHandler = {
//   method: "GET",
//   path: "/api/article/aggregated/",
//   handler: async ({ res, url, getAllLocalArticles }) => {
//     res.setHeader("Content-Type", "application/json");

//     if (!getAllLocalArticles) {
//       return handleError(res, "getAllLocalArticles function not provided", 500, "error");
//     }

//     try {
//       const pathParts = url?.split("/") || [];
//       const storyId = decodeURIComponent(pathParts.slice(4).join("/"));
//       if (!storyId) {
//         return handleError(res, "No story ID provided", 400, "warn");
//       }

//       const allArticles = await getAllLocalArticles();
//       // Aggregate articles for the same story
//       const related = allArticles.filter(a => a.storyId === storyId);

//       if (related.length === 0) {
//         return handleError(res, `No articles found for story: ${storyId}`, 404, "warn");
//       }

//       // Combine content
//       const combinedContent = related.map(a => a.content).filter(Boolean).join("\n\n");

//       // TODO: Run analysis (political bias, cognitive bias, summary, bullet points)
//       const analyzed = await analyzeContent(combinedContent, related);

//       res.end(JSON.stringify(analyzed));
//     } catch (err) {
//       return handleError(res, `Error fetching aggregated article: ${(err as Error).message}`, 500, "error");
//     }
//   },
// };

/**
 * POST /articles/local/save
 * Save a single new source article
 */
export const saveLocalArticleRoute: RouteHandler = {
	method: "POST",
	path: "/articles/local/save",
	handler: async ({
		saveLocalArticle,
		res,
		body,
	}: {
		saveLocalArticle?: (doc: Article) => Promise<void>;
		res: ServerResponse<any>;
		body?: any;
	}) => {
		res.setHeader("Content-Type", "application/json");

		if (!saveLocalArticle) {
			await handleError(res, "saveLocalArticle not provided", 500, "error");
			return;
		}
		if (!body || !body.url || !body.title || !body.content) {
			await handleError(res, "Missing required article fields", 400, "warn");
			return;
		}

		try {
			await saveLocalArticle(body);
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
		addUniqueLocalArticles,
		res,
		body,
	}: {
		addUniqueLocalArticles?: (articles: Article[]) => Promise<number>;
		res: ServerResponse<any>;
		body?: any;
	}) => {
		res.setHeader("Content-Type", "application/json");

		if (!addUniqueLocalArticles) {
			await handleError(res, "addUniqueLocalArticles not provided", 500, "error");
			return;
		}
		if (!body || !Array.isArray(body)) {
			await handleError(res, "Expected an array of articles", 400, "warn");
			return;
		}

		try {
			const addedCount = await addUniqueLocalArticles(body);
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
		deleteLocalArticle,
		res,
		url,
	}: {
		deleteLocalArticle?: (url: string) => Promise<void>;
		res: ServerResponse<any>;
		url?: string;
	}) => {
		res.setHeader("Content-Type", "application/json");

		if (!deleteLocalArticle) {
			await handleError(res, "deleteLocalArticle not provided", 500, "error");
			return;
		}

		try {
			const pathParts = url?.split("/") || [];
			const articleUrl = decodeURIComponent(pathParts.slice(4).join("/"));
			if (!articleUrl) {
				await handleError(res, "No article URL provided", 400, "warn");
				return;
			}

			await deleteLocalArticle(articleUrl);
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
	getFullLocalArticleRoute,
	refetchLocalArticlesRoute,
	saveLocalArticleRoute,
	deleteLocalArticleRoute,
];
