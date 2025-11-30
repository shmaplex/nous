import type { Express, NextFunction, Request, Response } from "express";
import type { Helia } from "helia";
import { addDebugLog, log } from "@/lib/log.server";
import type { Article, DebugLogEntry, Source } from "@/types";
import { handleError } from "./helpers";

/**
 * Simple in-memory throttle map to limit requests per IP
 */
const throttleMap = new Map<string, { count: number; lastRequest: number }>();
const THROTTLE_LIMIT = 15; // max requests per TIME_WINDOW
const TIME_WINDOW = 1000 * 5; // 5 seconds

/**
 * Express middleware to throttle requests per IP
 */
export const throttleMiddleware = (req: Request, res: Response, next: NextFunction) => {
	const clientIP = req.ip || req.socket.remoteAddress || "unknown";
	const now = Date.now();
	const throttle = throttleMap.get(clientIP) || { count: 0, lastRequest: now };

	if (now - throttle.lastRequest > TIME_WINDOW) throttle.count = 0;
	throttle.count++;
	throttle.lastRequest = now;
	throttleMap.set(clientIP, throttle);

	if (throttle.count > THROTTLE_LIMIT) {
		res.status(429).json({ error: "Too many requests — please slow down." });
		return;
	}

	next();
};

/**
 * POST /articles/local/fetch
 *
 * Starts a background fetch of articles.
 */
export const fetchLocalArticlesHandler = async (req: Request, res: Response, handlers: any) => {
	const { addDebugLog, fetchAllLocalSources, addUniqueLocalArticles } = handlers;

	if (!fetchAllLocalSources || !addUniqueLocalArticles) {
		await handleError(res, "Required DB functions not provided", 500, "error");
		return;
	}

	const sources: Source[] = Array.isArray(req.body?.sources) ? req.body.sources : [];
	const since = req.body?.since ? new Date(req.body.since) : undefined;

	// Fire-and-forget background fetch
	(async () => {
		try {
			const { articles, errors } = await fetchAllLocalSources(sources, since);

			const addedCount = await addUniqueLocalArticles(articles);

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

	res.json({ success: true, message: "Article fetch started" });
};

/**
 * GET /api/article/aggregated/:id
 * Fetch aggregated article with full analysis
 */
// export const getAggregatedArticleHandler = async (
// 	req: Request,
// 	res: Response,
// 	handlers: {
// 		getAllLocalArticles?: () => Promise<Article[]>;
// 	},
// ) => {
// 	const { getAllLocalArticles } = handlers;

// 	res.setHeader("Content-Type", "application/json");

// 	if (!getAllLocalArticles) {
// 		return handleError(res, "getAllLocalArticles function not provided", 500, "error");
// 	}

// 	try {
// 		const storyId = req.params.id;
// 		if (!storyId) {
// 			return handleError(res, "No story ID provided", 400, "warn");
// 		}

// 		const allArticles = await getAllLocalArticles();

// 		// Aggregate articles for the same story
// 		const related = allArticles.filter((a) => a.storyId === storyId);

// 		if (related.length === 0) {
// 			return handleError(res, `No articles found for story: ${storyId}`, 404, "warn");
// 		}

// 		// Combine content
// 		const combinedContent = related
// 			.map((a) => a.content)
// 			.filter(Boolean)
// 			.join("\n\n");

// 		// TODO: Run analysis (political bias, cognitive bias, summary, bullet points)
// 		const analyzed = await analyzeContent(combinedContent, related);

// 		res.json(analyzed);
// 	} catch (err) {
// 		return handleError(
// 			res,
// 			`Error fetching aggregated article: ${(err as Error).message}`,
// 			500,
// 			"error",
// 		);
// 	}
// };

/**
 * GET /articles/local
 * Returns all articles from the local article DB, throttled per IP
 */
export const getAllLocalArticlesHandler = async (req: Request, res: Response, handlers: any) => {
	const { addDebugLog, getAllLocalArticles } = handlers;

	if (!getAllLocalArticles) {
		await handleError(res, "getAllLocalArticles function not provided", 500, "error");
		return;
	}

	try {
		const allArticles = await getAllLocalArticles();

		if (addDebugLog) {
			await addDebugLog({
				_id: crypto.randomUUID(),
				timestamp: new Date().toISOString(),
				message: `Fetched ${allArticles.length} articles for ${req.ip}`,
				level: "info",
			});
		}

		res.json(allArticles);
	} catch (err) {
		const message = (err as Error).message || "Unknown error fetching articles";
		await handleError(res, `Error fetching articles for ${req.ip}: ${message}`, 500, "error");
	}
};

/**
 * GET /articles/local/full
 * Fetch a single local article by ID, CID, or URL
 */
export const getFullLocalArticleHandler = async (req: Request, res: Response, handlers: any) => {
	const { getLocalArticle, getFullLocalArticle, analyzeArticle, helia } = handlers;

	if (!getLocalArticle) return handleError(res, "getLocalArticle not provided", 500, "error");
	if (!getFullLocalArticle)
		return handleError(res, "getFullLocalArticle not provided", 500, "error");
	if (!helia) return handleError(res, "Helia node not provided", 500, "error");

	try {
		const lookupKey = req.query.id || req.query.cid || req.query.url;
		console.log("lookupKey", lookupKey);
		if (!lookupKey) return handleError(res, "No article ID, CID, or URL provided", 400, "warn");

		const article = await getLocalArticle(lookupKey as string);
		console.log("found local article", article);
		if (!article) return handleError(res, `Article not found for ${lookupKey}`, 404, "warn");

		const fullArticle = await getFullLocalArticle(article, helia);

		console.log("Found full article", fullArticle);

		let analyzedArticle = fullArticle;
		if (!fullArticle.analyzed && analyzeArticle) {
			analyzedArticle = await analyzeArticle(fullArticle);
		}

		console.log("analyzedArticle", analyzedArticle);
		res.json(analyzedArticle);
	} catch (err) {
		const message = (err as Error).message;
		await handleError(res, `Error fetching article: ${message}`, 500, "error");
	}
};

/**
 * POST /articles/local/save
 * Save a single new source article
 */
export const saveLocalArticleHandler = async (req: Request, res: Response, handlers: any) => {
	const { saveLocalArticle } = handlers;

	if (!saveLocalArticle) return handleError(res, "saveLocalArticle not provided", 500, "error");
	if (!req.body || !req.body.url || !req.body.title || !req.body.content) {
		return handleError(res, "Missing required article fields", 400, "warn");
	}

	try {
		await saveLocalArticle(req.body);
		await addDebugLog({ message: `Saved article: ${req.body.url}`, level: "info" });
		res.json({ success: true, url: req.body.url });
	} catch (err) {
		const message = (err as Error).message;
		await handleError(res, `Error saving article: ${message}`, 500, "error");
	}
};

/**
 * POST /articles/local/refetch
 * Add multiple articles, skipping duplicates
 */
export const refetchLocalArticlesHandler = async (req: Request, res: Response, handlers: any) => {
	const { addUniqueLocalArticles } = handlers;

	if (!addUniqueLocalArticles)
		return handleError(res, "addUniqueLocalArticles not provided", 500, "error");
	if (!req.body || !Array.isArray(req.body))
		return handleError(res, "Expected an array of articles", 400, "warn");

	try {
		const addedCount = await addUniqueLocalArticles(req.body);
		await addDebugLog({ message: `Refetched ${addedCount} unique articles`, level: "info" });
		res.json({ success: true, added: addedCount });
	} catch (err) {
		const message = (err as Error).message;
		await handleError(res, `Error refetching articles: ${message}`, 500, "error");
	}
};

/**
 * DELETE /articles/local/delete/:url
 * Delete a source article by URL
 */
export const deleteLocalArticleHandler = async (req: Request, res: Response, handlers: any) => {
	const { deleteLocalArticle } = handlers;

	if (!deleteLocalArticle) return handleError(res, "deleteLocalArticle not provided", 500, "error");

	try {
		const articleUrl = decodeURIComponent(req.params.url);
		if (!articleUrl) return handleError(res, "No article URL provided", 400, "warn");

		await deleteLocalArticle(articleUrl);
		await addDebugLog({ message: `Deleted article: ${articleUrl}`, level: "info" });
		res.json({ success: true, url: articleUrl });
	} catch (err) {
		const message = (err as Error).message;
		await handleError(res, `Error deleting article: ${message}`, 500, "error");
	}
};

/**
 * Helper: register all local article routes in an Express app
 */
export function registerLocalArticleRoutes(app: Express, handlers: any = {}) {
	app.post("/articles/local/fetch", (req, res) => fetchLocalArticlesHandler(req, res, handlers));
	app.get("/articles/local", throttleMiddleware, (req, res) =>
		getAllLocalArticlesHandler(req, res, handlers),
	);
	app.get("/articles/local/full", (req, res) => getFullLocalArticleHandler(req, res, handlers));
	app.post("/articles/local/save", (req, res) => saveLocalArticleHandler(req, res, handlers));
	app.post("/articles/local/refetch", (req, res) =>
		refetchLocalArticlesHandler(req, res, handlers),
	);
	app.delete("/articles/local/delete/:url", (req, res) =>
		deleteLocalArticleHandler(req, res, handlers),
	);
}
