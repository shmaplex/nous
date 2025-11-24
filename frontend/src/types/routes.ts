import type { ServerResponse } from "node:http";
import type { z } from "zod";
import type { NodeStatus } from "./";

export interface RouteHandler<BodySchema extends z.ZodTypeAny = z.ZodAny> {
	method: "GET" | "POST" | "DELETE" | "PUT";
	path: string;
	bodySchema?: BodySchema;
	handler: (context: {
		res: ServerResponse;
		status?: NodeStatus;
		orbitdbConnected?: boolean;
		httpPort?: number;

		/** Optional DB functions */
		[handlerKey: string]: any;

		/** Validated request body */
		body?: z.infer<BodySchema>;
	}) => Promise<void> | void;
}
