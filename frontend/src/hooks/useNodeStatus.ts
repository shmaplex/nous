// frontend/src/hooks/useNodeStatus.ts
import { useEffect, useMemo, useState } from "react";
import { createEmptyNodeStatus, type NodeStatus } from "@/types";
import { AppStatus } from "../../wailsjs/go/main/App";

/**
 * Custom React hook to poll the current status of the P2P node.
 *
 * This hook periodically calls the Go `AppStatus` function via Wails, parses
 * the JSON response, and returns a `NodeStatus` object representing the current
 * state of the node, including:
 * - Node running status
 * - P2P connection status
 * - OrbitDB connection status
 * - Syncing state
 * - Last sync time
 * - Peer count
 * - HTTP port
 *
 * The hook updates its state at the interval specified by `pollInterval`.
 *
 * @param pollInterval - The interval in milliseconds to poll the node status (default: 3000ms)
 * @returns The latest node status and a derived `appLoaded` flag
 *
 * @example
 * const { status, appLoaded } = useNodeStatus();
 * if (appLoaded) {
 *   // Node is ready, can fetch articles
 * }
 */
export function useNodeStatus(pollInterval = 3000) {
	const [status, setStatus] = useState<NodeStatus>(createEmptyNodeStatus());

	useEffect(() => {
		const interval = setInterval(async () => {
			try {
				const raw = await AppStatus();
				const parsed: NodeStatus = raw
					? (() => {
							try {
								const data = JSON.parse(raw);
								return { ...data, port: data.port ?? 9001 };
							} catch {
								return createEmptyNodeStatus();
							}
						})()
					: createEmptyNodeStatus();

				setStatus(parsed);
			} catch {
				setStatus(createEmptyNodeStatus());
			}
		}, pollInterval);

		return () => clearInterval(interval);
	}, [pollInterval]);

	/**
	 * Derived boolean indicating if the node is fully ready for fetching articles.
	 */
	const appLoaded = useMemo(() => {
		return status.running && status.connected && status.orbitConnected;
	}, [status]);

	return { status, appLoaded };
}
