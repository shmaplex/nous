import type { Source } from "@/types/sources";
import { SourcesSchema } from "@/types/sources";
import { LoadSources, SaveSources } from "../../wailsjs/go/main/App";

/**
 * Load sources from the Wails backend.
 *
 * Validates loaded data using Zod to ensure all fields match the schema.
 */
export async function loadSources(): Promise<Source[]> {
	try {
		const loaded: any[] = await LoadSources();

		// Use Zod to validate/parse the data
		const parsed = SourcesSchema.parse(
			(loaded ?? []).map((s) => ({
				name: s.name ?? "Unnamed Source",
				endpoint: s.endpoint || s.url || "",
				apiKey: s.apiKey ?? "",
				instructions: s.instructions ?? "",
				apiLink: s.apiLink ?? "",
				enabled: s.enabled ?? !!s.apiKey,
				requiresApiKey: s.requiresKey ?? false, // map backend field
				category: s.category, // Zod will validate allowed enum
				tags: s.tags ?? [],
				language: s.language ?? undefined,
				region: s.region ?? undefined,
				authType: s.authType, // Zod will validate allowed enum
				rateLimitPerMinute: s.rateLimitPerMinute ?? undefined,
				headers: s.headers ?? undefined,
				lastUpdated: s.lastUpdated ? new Date(s.lastUpdated) : undefined,
				pinned: s.pinned ?? undefined,
			})),
		);

		return parsed;
	} catch (err) {
		console.error("Failed to load sources:", err);
		return [];
	}
}

/**
 * Save sources to the Wails backend.
 *
 * Only necessary fields are sent.
 */
export async function saveSources(sources: Source[]): Promise<void> {
	try {
		const payload = sources.map((s) => ({
			name: s.name,
			endpoint: s.endpoint,
			apiKey: s.apiKey,
			instructions: s.instructions,
			apiLink: s.apiLink,
			enabled: s.enabled,
			requiresKey: s.requiresApiKey ?? false, // map back to backend
			category: s.category,
			tags: s.tags,
			language: s.language,
			region: s.region,
			authType: s.authType,
			rateLimitPerMinute: s.rateLimitPerMinute,
			headers: s.headers,
			lastUpdated: s.lastUpdated?.toISOString(),
			pinned: s.pinned,
		}));

		await SaveSources(payload);
	} catch (err) {
		console.error("Failed to save sources:", err);
	}
}
