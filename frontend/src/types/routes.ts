import type { ServerResponse } from "node:http";
import type { z } from "zod";
import type { Article, NodeStatus } from "./";

/**
 * Generic RouteHandler type with optional Zod schema validation
 */
export interface RouteHandler<BodySchema extends z.ZodTypeAny = z.ZodAny> {
	/** HTTP method */
	method: "GET" | "POST";

	/** Route path */
	path: string;

	/** Optional Zod schema for validating request body */
	bodySchema?: BodySchema;

	/** Route handler function */
	handler: (context: {
		res: ServerResponse;
		getAllArticles?: () => Promise<Article[]>;
		saveArticle?: (doc: Article) => Promise<void>;
		deleteArticle?: (url: string) => Promise<void>;
		status?: NodeStatus;
		orbitdbConnected?: boolean;
		httpPort?: number;
		/** Validated request body */
		body?: z.infer<BodySchema>;
	}) => Promise<void> | void;
}
