import { DEFAULT_SOURCES } from "@/constants/sources";
import { loadSources, saveSources as saveSourcesToBackend } from "@/lib/sources";
import type { Source } from "@/types/sources";

export interface SourceWithHidden extends Source {
	hidden?: boolean;
	isDefault?: boolean;
}

// Initialize sources with defaults & hidden states
export const initSources = async (): Promise<SourceWithHidden[]> => {
	const loadedSources = await loadSources();
	const combined = (loadedSources.length > 0 ? loadedSources : DEFAULT_SOURCES).map((s) => {
		const isApiKeySource = s.requiresApiKey ?? false;
		const enabled = isApiKeySource ? !!s.apiKey : (s.enabled ?? true);
		const hidden = !isApiKeySource && !enabled;

		return {
			...s,
			enabled,
			hidden,
			isDefault: DEFAULT_SOURCES.some((d) => d.name === s.name && d.endpoint === s.endpoint),
		};
	});
	return combined;
};

// Save sources to backend
export const saveSources = async (sources: SourceWithHidden[]) => {
	try {
		await saveSourcesToBackend(
			sources.map((s) => ({
				name: s.name,
				endpoint: s.endpoint,
				apiKey: s.apiKey,
				instructions: s.instructions,
				apiLink: s.apiLink,
				enabled: s.enabled,
				requiresApiKey: s.requiresApiKey,
				category: s.category,
				authType: s.authType,
			})),
		);
	} catch (err) {
		console.error("Failed to save sources:", err);
	}
};
