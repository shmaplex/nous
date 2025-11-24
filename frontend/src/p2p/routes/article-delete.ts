// frontend/src/p2p/routes/deleteArticle.ts
import type { RouteHandler } from "../../types";

/**
 * POST /delete/:url
 * Deletes an article by its URL from the P2P node.
 *
 * The URL is extracted from the request path.
 */
export const deleteArticleRoute: RouteHandler = {
	method: "POST",
	path: "/delete/", // base path; the specific URL will be appended
	handler: async ({ res, deleteArticle, body }) => {
		if (!deleteArticle) {
			res.statusCode = 500;
			res.end(JSON.stringify({ error: "deleteArticle function not provided" }));
			return;
		}

		try {
			// Extract URL from body or throw error if missing
			const urlToDelete: string = (body?.url as string) || "";
			if (!urlToDelete) {
				res.statusCode = 400;
				res.end(JSON.stringify({ error: "No URL provided" }));
				return;
			}

			await deleteArticle(urlToDelete);
			res.end(JSON.stringify({ status: "deleted" }));
		} catch (err) {
			res.statusCode = 400;
			res.end(JSON.stringify({ error: (err as Error).message }));
		}
	},
};

export const routes: RouteHandler[] = [deleteArticleRoute];
