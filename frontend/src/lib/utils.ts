// frontend/src/lib/utils.ts
import { dagCbor } from "@helia/dag-cbor";
import type { Helia } from "helia";
import { CID } from "multiformats/cid";
import { sha256 } from "multiformats/hashes/sha2";

/**
 * Combine multiple class names into a single string, ignoring falsy values.
 *
 * Useful for conditional CSS classes, e.g., Tailwind or dynamic styling.
 *
 * @param classes - An array of strings or falsy values (`undefined`, `null`, `false`) to combine
 * @returns A single string of classes separated by spaces
 *
 * @example
 * ```ts
 * cn("btn", isPrimary && "btn-primary", null, "mt-4");
 * // => "btn btn-primary mt-4"
 * ```
 */
export function cn(...classes: (string | undefined | false | null)[]): string {
	return classes.filter(Boolean).join(" ");
}

/**
 * Store arbitrary JSON in IPFS using DAG-CBOR and return the CID.
 */
export async function storeInIPFS<T extends Record<string, any>>(
	ipfs: Helia,
	content: T,
): Promise<string> {
	const dag = dagCbor(ipfs);
	const cid = await dag.add(content);
	return cid.toString();
}

/**
 * Generate a content-addressed CID for a JSON-serializable object.
 *
 * This is useful for creating unique, deterministic IDs for documents
 * that can be referenced across IPFS/OrbitDB/Helia.
 *
 * @template T - The type of object to generate a CID for
 * @param doc - Any JSON-serializable object
 * @returns A string representation of the CID
 *
 * @example
 * ```ts
 * const article = { title: "Hello", url: "https://..." };
 * const cid = await generateCID(article);
 * console.log(cid); // "bafy..."
 * ```
 */
export async function generateCID<T extends Record<string, any>>(doc: T): Promise<string> {
	const bytes = new TextEncoder().encode(JSON.stringify(doc));
	const hash = await sha256.digest(bytes);
	const cid = CID.create(1, 0x55 /* raw */, hash); // 0x55 = raw
	return cid.toString();
}
