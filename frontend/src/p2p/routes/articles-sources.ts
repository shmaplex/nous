import type { IncomingMessage, ServerResponse } from "node:http";
import { addDebugLog } from "@/lib/log";
import { getAvailableSources, type SourceWithHidden } from "@/lib/sources";
import type { Article, RouteHandler } from "../../types";

/**
 * Simple in-memory throttle map to limit requests per IP
 */
const throttleMap = new Map<string, { count: number; lastRequest: number }>();
const THROTTLE_LIMIT = 5; // max requests per TIME_WINDOW
const TIME_WINDOW = 1000 * 10; // 10 seconds

/**
 * GET /articles/sources
 * Returns only articles whose source is enabled (available).
 * Throttled per client IP to protect bandwidth.
 * Adds debug logging for each request.
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
		const clientIP = req.socket.remoteAddress || "unknown";

		// Throttle requests per IP
		const now = Date.now();
		const throttle = throttleMap.get(clientIP) || { count: 0, lastRequest: now };
		if (now - throttle.lastRequest > TIME_WINDOW) {
			throttle.count = 0; // reset after window
		}
		throttle.count++;
		throttle.lastRequest = now;
		throttleMap.set(clientIP, throttle);

		if (throttle.count > THROTTLE_LIMIT) {
			res.statusCode = 429;
			const msg = "Too many requests — please slow down.";
			await addDebugLog({ message: msg, level: "warn" });
			res.end(JSON.stringify({ error: msg }));
			return;
		}

		if (!getAllArticles) {
			res.statusCode = 500;
			const msg = "getAllArticles not provided";
			await addDebugLog({ message: msg, level: "error" });
			res.end(JSON.stringify({ error: msg }));
			return;
		}

		try {
			const allArticles = await getAllArticles();
			const availableSources: SourceWithHidden[] = await getAvailableSources();

			// Build a lookup of available endpoints
			const availableEndpoints = new Set(availableSources.map((s) => s.endpoint));

			// Filter only articles whose source endpoint is in available sources
			const filtered = allArticles.filter((article) =>
				availableEndpoints.has(article.source || ""),
			);

			await addDebugLog({
				message: `Fetched ${filtered.length} articles for ${clientIP}`,
				level: "info",
			});

			res.setHeader("Content-Type", "application/json");
			res.end(JSON.stringify(filtered));
		} catch (err) {
			res.statusCode = 500;
			const message = (err as Error).message || "Unknown error fetching articles";
			await addDebugLog({
				message: `Error fetching articles for ${clientIP}: ${message}`,
				level: "error",
			});
			res.end(JSON.stringify({ error: message }));
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
		if (!getArticle) {
			res.statusCode = 500;
			await addDebugLog({ message: "getArticle not provided", level: "error" });
			res.end(JSON.stringify({ error: "getArticle not provided" }));
			return;
		}
		try {
			const pathParts = url?.split("/") || [];
			const articleUrl = decodeURIComponent(pathParts.slice(3).join("/"));
			if (!articleUrl) {
				res.statusCode = 400;
				await addDebugLog({ message: "No article URL provided", level: "warn" });
				res.end(JSON.stringify({ error: "No article URL provided" }));
				return;
			}
			const article = await getArticle(articleUrl);
			if (!article) {
				res.statusCode = 404;
				await addDebugLog({ message: `Article not found: ${articleUrl}`, level: "warn" });
				res.end(JSON.stringify({ error: "Article not found" }));
				return;
			}
			res.end(JSON.stringify(article));
		} catch (err) {
			const message = (err as Error).message;
			res.statusCode = 500;
			await addDebugLog({ message: `Error fetching article: ${message}`, level: "error" });
			res.end(JSON.stringify({ error: message }));
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
		if (!saveArticle) {
			res.statusCode = 500;
			await addDebugLog({ message: "saveArticle not provided", level: "error" });
			res.end(JSON.stringify({ error: "saveArticle not provided" }));
			return;
		}
		if (!body || !body.url || !body.title || !body.content) {
			res.statusCode = 400;
			await addDebugLog({ message: "Missing required article fields", level: "warn" });
			res.end(JSON.stringify({ error: "Missing required article fields" }));
			return;
		}
		try {
			await saveArticle(body);
			await addDebugLog({ message: `Saved article: ${body.url}`, level: "info" });
			res.end(JSON.stringify({ success: true, url: body.url }));
		} catch (err) {
			const message = (err as Error).message;
			res.statusCode = 500;
			await addDebugLog({ message: `Error saving article: ${message}`, level: "error" });
			res.end(JSON.stringify({ error: message }));
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
		if (!addUniqueArticles) {
			res.statusCode = 500;
			await addDebugLog({ message: "addUniqueArticles not provided", level: "error" });
			res.end(JSON.stringify({ error: "addUniqueArticles not provided" }));
			return;
		}
		if (!body || !Array.isArray(body)) {
			res.statusCode = 400;
			await addDebugLog({ message: "Expected an array of articles", level: "warn" });
			res.end(JSON.stringify({ error: "Expected an array of articles" }));
			return;
		}
		try {
			const addedCount = await addUniqueArticles(body);
			await addDebugLog({ message: `Refetched ${addedCount} unique articles`, level: "info" });
			res.end(JSON.stringify({ success: true, added: addedCount }));
		} catch (err) {
			const message = (err as Error).message;
			res.statusCode = 500;
			await addDebugLog({ message: `Error refetching articles: ${message}`, level: "error" });
			res.end(JSON.stringify({ error: message }));
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
		if (!deleteArticle) {
			res.statusCode = 500;
			await addDebugLog({ message: "deleteArticle not provided", level: "error" });
			res.end(JSON.stringify({ error: "deleteArticle not provided" }));
			return;
		}
		try {
			const pathParts = url?.split("/") || [];
			const articleUrl = decodeURIComponent(pathParts.slice(4).join("/"));
			if (!articleUrl) {
				res.statusCode = 400;
				await addDebugLog({ message: "No article URL provided", level: "warn" });
				res.end(JSON.stringify({ error: "No article URL provided" }));
				return;
			}
			await deleteArticle(articleUrl);
			await addDebugLog({ message: `Deleted article: ${articleUrl}`, level: "info" });
			res.end(JSON.stringify({ success: true, url: articleUrl }));
		} catch (err) {
			const message = (err as Error).message;
			res.statusCode = 500;
			await addDebugLog({ message: `Error deleting article: ${message}`, level: "error" });
			res.end(JSON.stringify({ error: message }));
		}
	},
};

// Export all routes as array
export const routes: RouteHandler[] = [
	getAllSourcesRoute,
	getSourceByUrlRoute,
	saveSourceRoute,
	refetchSourcesRoute,
	deleteSourceRoute,
];
