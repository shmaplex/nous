import fs from "node:fs";
import path from "node:path";
import {
	Identities,
	type IdentitiesType,
	type Identity,
	KeyStore,
	type KeyStoreType,
} from "@orbitdb/core";

const KEYSTORE_PATH = process.env.KEYSTORE_PATH || "orbitdb-keystore";
const IDENTITY_FILE = path.join(KEYSTORE_PATH, "identity.json");

/**
 * Load persistent identity hash if available
 */
function loadIdentityHash(): string | null {
	try {
		if (fs.existsSync(IDENTITY_FILE)) {
			const data = JSON.parse(fs.readFileSync(IDENTITY_FILE, "utf8"));
			return data.hash ?? null;
		}
	} catch (err) {
		console.error("Failed to load identity file:", err);
	}
	return null;
}

/**
 * Save identity hash to identity.json
 */
function saveIdentityHash(hash: string) {
	try {
		fs.writeFileSync(IDENTITY_FILE, JSON.stringify({ hash }, null, 2), "utf8");
	} catch (err) {
		console.error("Failed to write identity file:", err);
	}
}

/**
 * Create or load a persistent OrbitDB identity
 */
export async function getOrbitDBIdentity(): Promise<{
	keystore: KeyStoreType;
	identities: IdentitiesType;
	identity: Identity;
}> {
	// Ensure keystore path exists
	if (!fs.existsSync(KEYSTORE_PATH)) {
		fs.mkdirSync(KEYSTORE_PATH, { recursive: true });
	}

	const keystore = await KeyStore({ path: KEYSTORE_PATH });
	const identities = await Identities({ keystore, path: KEYSTORE_PATH });

	// Try to load saved identity hash
	const savedHash = loadIdentityHash();

	let identity: Identity;
	if (savedHash) {
		try {
			console.log("🔐 Restoring existing OrbitDB identity");
			identity = await identities.getIdentity(savedHash);

			if (identity) {
				return { keystore, identities, identity };
			}
		} catch (err) {
			console.error("Failed to restore identity:", err);
		}
	}

	// No identity found → create a new one
	console.log("✨ Creating new OrbitDB identity");

	identity = await identities.createIdentity({
		id: "nous-node",
		type: "ed25519",
	});

	// Save the identity hash for future loads
	saveIdentityHash(identity.id);

	return { keystore, identities, identity };
}
