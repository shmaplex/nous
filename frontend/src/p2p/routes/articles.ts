import type { Article, RouteHandler } from "../../types";

/**
 * GET /articles
 * Returns all articles.
 */
export const articlesRoute: RouteHandler = {
	method: "GET",
	path: "/articles",
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

		const articles: Article[] = await getAllArticles();
		res.end(JSON.stringify(articles));
	},
};
