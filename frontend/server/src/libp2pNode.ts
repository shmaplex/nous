import { circuitRelayServer, circuitRelayTransport } from "@libp2p/circuit-relay-v2";
import { gossipsub } from "@libp2p/gossipsub";
import { identify, identifyPush } from "@libp2p/identify";
import { webRTC } from "@libp2p/webrtc";
import { webTransport } from "@libp2p/webtransport";
import { type Multiaddr, multiaddr } from "@multiformats/multiaddr";
import { createLibp2p, type Libp2p } from "libp2p";
import { addDebugLog, log } from "@/lib/log.server";

/**
 * Initializes a Libp2p node with common transports, relays, and PubSub logging.
 *
 * @param {string} libp2pListenAddr - The multiaddr for the node to listen on.
 * @param {string[]} [relayAddresses=[]] - Optional array of relay multiaddrs to connect to.
 * @returns {Promise<Libp2p>} The initialized Libp2p node instance.
 *
 * @example
 * const libp2p = await createLibp2pNode("/ip4/127.0.0.1/tcp/15003", ["/ip4/1.2.3.4/tcp/15003/p2p/12D3KooXYZ"]);
 */
export async function createLibp2pNode(
	libp2pListenAddr: string,
	relayAddresses: string[] = [],
): Promise<Libp2p> {
	const libp2p: Libp2p = await createLibp2p({
		addresses: { listen: [libp2pListenAddr, "/webrtc", "/webtransport", "/p2p-circuit"] },
		transports: [webRTC(), webTransport(), circuitRelayTransport()],
		services: {
			identify: identify(),
			identifyPush: identifyPush(),
			relay: circuitRelayServer(),
			pubsub: gossipsub({ allowPublishToZeroTopicPeers: true }),
		},
	});

	// Log listening addresses (forEach callback should not return a value)
	libp2p.getMultiaddrs().forEach((addr: Multiaddr) => {
		log(`🚦 Listening on: ${addr.toString()}`);
		addDebugLog({
			message: `🚦 Listening on: ${addr.toString()}`,
			level: "info",
			// meta: { address: addr.toString() },
			// type: "p2p",
		});
	});

	// Connect to relays
	for (const addr of relayAddresses) {
		try {
			await libp2p.dial(multiaddr(addr));
			log(`Connected to relay ${addr.toString()}`);
			addDebugLog({
				message: `Connected to relay ${addr.toString()}`,
				level: "info",
				// meta: { address: addr.toString() },
				// type: "p2p",
			});
		} catch (err) {
			log(`Failed to connect to relay ${addr}: ${(err as Error).message}`);
			addDebugLog({
				message: `Failed to connect to relay ${addr}: ${(err as Error).message}`,
				level: "info",
				// meta: { address: addr.toString(), error: (err as Error).message },
				// type: "p2p",
			});
		}
	}

	// PubSub logging
	(libp2p.services.pubsub as any).addEventListener("message", (evt: any) => {
		log(`PubSub message received: ${JSON.stringify(evt.detail)}`);
		addDebugLog({
			message: `PubSub message received: ${JSON.stringify(evt.detail)}`,
			level: "info",
			// meta: { event: JSON.stringify(evt.detail) },
			// type: "p2p",
		});
	});

	return libp2p;
}
