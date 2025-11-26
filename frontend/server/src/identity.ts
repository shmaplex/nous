// frontend/src/p2p/identity.ts
import { Identities, type Identity, KeyStore, type KeyStoreType } from "@orbitdb/core";

const NODE_ID = process.env.NODE_ID || "nous-node";
const KEYSTORE_PATH = process.env.KEYSTORE_PATH || "orbitdb-keystore";

/**
 * Create or retrieve the OrbitDB identity for the node.
 */
export async function getOrbitDBIdentity(): Promise<{
	keystore: KeyStoreType;
	identity: Identity;
	identities: any;
}> {
	const keystore = await KeyStore({ path: KEYSTORE_PATH });
	const identities = await Identities({ keystore });

	let identity: Identity;
	try {
		identity =
			(await identities.getIdentity(NODE_ID)) ??
			(await identities.createIdentity({ id: NODE_ID, keystore, type: "ed25519" }));
	} catch {
		identity = await identities.createIdentity({ id: NODE_ID, keystore, type: "ed25519" });
	}

	return { keystore, identity, identities };
}
