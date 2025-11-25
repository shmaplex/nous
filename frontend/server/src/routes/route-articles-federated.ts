// frontend/src/p2p/routes/route-article-federated.ts
import type { FederatedArticlePointer, RouteHandler } from "@/types";
import { handleError } from "./helpers";

/**
 * GET /articles/federated
 * Returns all federated articles from the P2P node.
 */
export const federatedArticlesRoute: RouteHandler = {
	method: "GET",
	path: "/articles/federated",
	handler: async ({
		getFederatedArticles,
		res,
	}: {
		getFederatedArticles?: () => Promise<FederatedArticlePointer[]>;
		res: import("node:http").ServerResponse;
	}) => {
		if (!getFederatedArticles) {
			await handleError(res, "getFederatedArticles function not provided", 500, "error");
			return;
		}

		try {
			const articles: FederatedArticlePointer[] = await getFederatedArticles();
			res.setHeader("Content-Type", "application/json");
			res.end(JSON.stringify(articles));
		} catch (err) {
			await handleError(res, (err as Error).message, 500, "error");
		}
	},
};

// Export as an array for easy spreading
export const routes: RouteHandler[] = [federatedArticlesRoute];
