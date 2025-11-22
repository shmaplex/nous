// src/lib/sources.ts
import type { Source } from "@/types/sources";
import { LoadSources, SaveSources } from "../../wailsjs/go/main/App";

/**
 * Load sources from the Wails backend.
 *
 * @returns {Promise<Source[]>} A promise that resolves to an array of Source objects.
 */
export async function loadSources(): Promise<Source[]> {
	try {
		const loaded: Source[] = await LoadSources();
		return loaded ?? [];
	} catch (err) {
		console.error("Failed to load sources:", err);
		return [];
	}
}

/**
 * Save sources to the Wails backend.
 *
 * @param {Source[]} sources - Array of sources to persist
 * @returns {Promise<void>}
 */
export async function saveSources(sources: Source[]): Promise<void> {
	try {
		await SaveSources(sources);
	} catch (err) {
		console.error("Failed to save sources:", err);
	}
}
