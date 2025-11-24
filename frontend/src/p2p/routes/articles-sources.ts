import type { Article, RouteHandler } from "../../types";

/**
 * GET /articles/sources
 * Returns all source articles.
 */
export const getAllSourcesRoute: RouteHandler = {
	method: "GET",
	path: "/articles/sources",
	handler: async ({
		getAllArticles,
		res,
	}: {
		getAllArticles?: () => Promise<Article[]>;
		res: import("node:http").ServerResponse;
	}) => {
		if (!getAllArticles) {
			res.statusCode = 500;
			res.end(JSON.stringify({ error: "getAllArticles not provided" }));
			return;
		}
		try {
			const articles = await getAllArticles();
			res.end(JSON.stringify(articles));
		} catch (err) {
			res.statusCode = 500;
			res.end(JSON.stringify({ error: (err as Error).message }));
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
		res: import("node:http").ServerResponse;
		url?: string;
	}) => {
		if (!getArticle) {
			res.statusCode = 500;
			res.end(JSON.stringify({ error: "getArticle not provided" }));
			return;
		}
		try {
			const pathParts = url?.split("/") || [];
			const articleUrl = decodeURIComponent(pathParts.slice(3).join("/"));
			if (!articleUrl) {
				res.statusCode = 400;
				res.end(JSON.stringify({ error: "No article URL provided" }));
				return;
			}
			const article = await getArticle(articleUrl);
			if (!article) {
				res.statusCode = 404;
				res.end(JSON.stringify({ error: "Article not found" }));
				return;
			}
			res.end(JSON.stringify(article));
		} catch (err) {
			res.statusCode = 500;
			res.end(JSON.stringify({ error: (err as Error).message }));
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
		res: import("node:http").ServerResponse;
		body?: any;
	}) => {
		if (!saveArticle) {
			res.statusCode = 500;
			res.end(JSON.stringify({ error: "saveArticle not provided" }));
			return;
		}
		if (!body || !body.url || !body.title || !body.content) {
			res.statusCode = 400;
			res.end(JSON.stringify({ error: "Missing required article fields" }));
			return;
		}
		try {
			await saveArticle(body);
			res.end(JSON.stringify({ success: true, url: body.url }));
		} catch (err) {
			res.statusCode = 500;
			res.end(JSON.stringify({ error: (err as Error).message }));
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
		res: import("node:http").ServerResponse;
		body?: any;
	}) => {
		if (!addUniqueArticles) {
			res.statusCode = 500;
			res.end(JSON.stringify({ error: "addUniqueArticles not provided" }));
			return;
		}
		if (!body || !Array.isArray(body)) {
			res.statusCode = 400;
			res.end(JSON.stringify({ error: "Expected an array of articles" }));
			return;
		}
		try {
			const addedCount = await addUniqueArticles(body);
			res.end(JSON.stringify({ success: true, added: addedCount }));
		} catch (err) {
			res.statusCode = 500;
			res.end(JSON.stringify({ error: (err as Error).message }));
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
		res: import("node:http").ServerResponse;
		url?: string;
	}) => {
		if (!deleteArticle) {
			res.statusCode = 500;
			res.end(JSON.stringify({ error: "deleteArticle not provided" }));
			return;
		}
		try {
			const pathParts = url?.split("/") || [];
			const articleUrl = decodeURIComponent(pathParts.slice(4).join("/"));
			if (!articleUrl) {
				res.statusCode = 400;
				res.end(JSON.stringify({ error: "No article URL provided" }));
				return;
			}
			await deleteArticle(articleUrl);
			res.end(JSON.stringify({ success: true, url: articleUrl }));
		} catch (err) {
			res.statusCode = 500;
			res.end(JSON.stringify({ error: (err as Error).message }));
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
