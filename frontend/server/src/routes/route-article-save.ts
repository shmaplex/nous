// frontend/src/p2p/routes/route-article-save.ts
import type { Article, RouteHandler } from "@/types";
import { handleError } from "./helpers";

/**
 * @deprecated Use saveLocalArticleRoute etc.
 * POST /save
 * Saves a new article to the P2P node.
 *
 * Expects a JSON body with the Article object shape.
 */
export const saveArticleRoute: RouteHandler = {
	method: "POST",
	path: "/articles/save",
	handler: async ({ res, saveArticle, body }) => {
		if (!saveArticle) {
			await handleError(res, "saveArticle function not provided", 500, "error");
			return;
		}

		try {
			// Body should already be parsed before passing into the route
			const article: Article = body as Article;

			if (!article.url || !article.title || !article.content) {
				await handleError(res, "Missing required article fields", 400, "warn");
				return;
			}

			await saveArticle(article);

			res.setHeader("Content-Type", "application/json");
			res.end(JSON.stringify({ status: "ok", url: article.url }));
		} catch (err) {
			await handleError(res, (err as Error).message, 500, "error");
		}
	},
};

export const routes: RouteHandler[] = [saveArticleRoute];
