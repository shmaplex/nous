// frontend/src/p2p/routes/articles-federated.ts
import type { FederatedArticlePointer, RouteHandler } from "../../types";

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
			res.statusCode = 500;
			res.end(JSON.stringify({ error: "getFederatedArticles not provided" }));
			return;
		}

		try {
			const articles: FederatedArticlePointer[] = await getFederatedArticles();
			res.end(JSON.stringify(articles));
		} catch (err) {
			res.statusCode = 500;
			res.end(JSON.stringify({ error: (err as Error).message }));
		}
	},
};

// Export as an array for easy spreading
export const routes: RouteHandler[] = [federatedArticlesRoute];
