// frontend/src/types/p2p.ts
import { z } from "zod";

/**
 * Zod schema for NodeConfig
 */
export const NodeConfigSchema = z.object({
	httpPort: z.number(),
	libp2pListenAddr: z.string(),
	relayAddresses: z.array(z.string()).optional(),
});

export type NodeConfig = z.infer<typeof NodeConfigSchema>;

/**
 * Zod schema for ConnectionInfo
 */
export const ConnectionInfoSchema = z.object({
	peerId: z.string(),
	addresses: z.array(z.string()),
	connected: z.boolean(),
});

export type ConnectionInfo = z.infer<typeof ConnectionInfoSchema>;

/**
 * Zod schema for NodeStatus
 */
export const NodeStatusSchema = z.object({
	running: z.boolean(),
	connected: z.boolean(),
	syncing: z.boolean(),
	lastSync: z.string().nullable(),
	peers: z.array(ConnectionInfoSchema).optional(),
	logs: z.array(z.string()).optional(),
});

export type NodeStatus = z.infer<typeof NodeStatusSchema>;
