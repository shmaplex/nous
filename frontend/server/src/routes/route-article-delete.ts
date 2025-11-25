// frontend/src/p2p/routes/route-article-delete.ts
import type { RouteHandler } from "@/types";
import { handleError } from "./helpers";

/**
 * @deprecated use deleteLocalArticleRoute etc.
 * POST /delete/:url
 * Deletes an article by its URL from the P2P node.
 *
 * The URL is extracted from the request body.
 */
export const deleteArticleRoute: RouteHandler = {
	method: "POST",
	path: "/articles/delete/", // base path; the specific URL will be appended
	handler: async ({ res, deleteArticle, body }) => {
		if (!deleteArticle) {
			await handleError(res, "deleteArticle function not provided", 500, "error");
			return;
		}

		try {
			// Extract URL from body
			const urlToDelete: string = (body?.url as string) || "";
			if (!urlToDelete) {
				await handleError(res, "No URL provided", 400, "warn");
				return;
			}

			await deleteArticle(urlToDelete);
			res.setHeader("Content-Type", "application/json");
			res.end(JSON.stringify({ status: "deleted", url: urlToDelete }));
		} catch (err) {
			await handleError(res, (err as Error).message, 500, "error");
		}
	},
};

export const routes: RouteHandler[] = [deleteArticleRoute];
