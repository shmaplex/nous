// frontend/src/p2p/routes/saveArticle.ts
import type { Article, RouteHandler } from "../../types";

/**
 * POST /save
 * Saves a new article to the P2P node.
 *
 * Expects a JSON body with the Article object shape.
 */
export const saveArticleRoute: RouteHandler = {
	method: "POST",
	path: "/save",
	handler: async ({ res, saveArticle, body }) => {
		if (!saveArticle) {
			res.statusCode = 500;
			res.end(JSON.stringify({ error: "saveArticle function not provided" }));
			return;
		}

		try {
			// Body should already be parsed before passing into the route
			const article: Article = body as Article;
			await saveArticle(article);
			res.end(JSON.stringify({ status: "ok" }));
		} catch (err) {
			res.statusCode = 400;
			res.end(JSON.stringify({ error: (err as Error).message }));
		}
	},
};

export const routes: RouteHandler[] = [saveArticleRoute];
