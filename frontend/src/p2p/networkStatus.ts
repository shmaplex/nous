// frontend/src/p2p/networkStatus.ts
import type { Helia } from "helia";
import type { ConnectionInfo, NodeStatus } from "../types";
import { log, updateStatus } from "./utils";

export function startNetworkStatusPoll(helia: Helia, status: NodeStatus, interval = 5000) {
	async function updateNetworkStatus() {
		try {
			const peers: ConnectionInfo[] = helia.libp2p
				? helia.libp2p.getPeers().map((peerId: any) => {
						const conns: any[] = helia.libp2p.getConnections(peerId);
						return {
							peerId: peerId.toString(),
							connected: conns.length > 0,
							addresses: conns.map((c: any) => c.remoteAddr.toString()),
						};
					})
				: [];
			status.peers = peers;
			updateStatus(status, peers.length > 0, status.syncing);
		} catch (err) {
			log(`Network status error: ${(err as Error).message}`);
			updateStatus(status, false, status.syncing);
			status.peers = [];
		}
	}

	updateNetworkStatus();
	const id = setInterval(updateNetworkStatus, interval);
	return () => clearInterval(id); // returns a cleanup function
}
