// frontend/src/lib/sources.ts
import { DEFAULT_SOURCES } from "@/constants/sources";
import {
	type Article,
	type AuthType,
	type Edition,
	editions,
	type PoliticalBias,
	PoliticalBiasValues,
	type Source,
	type SourceCategory,
	SourcesSchema,
	type SourceWithHidden,
} from "@/types";
import { FetchArticlesBySources, LoadSources, SaveSources } from "../../wailsjs/go/main/App";

/**
 * Normalize raw source data into a valid Source object.
 * Provides sensible defaults and maps legacy backend fields.
 */
export function createSource(
	raw: Partial<Source> & { url?: string; requiresKey?: boolean },
): Source {
	return {
		name: raw.name ?? "Unnamed Source",
		endpoint: raw.endpoint || raw.url || "",
		apiKey: raw.apiKey ?? undefined,
		instructions: raw.instructions ?? undefined,
		apiLink: raw.apiLink ?? undefined,
		enabled: raw.enabled ?? !!raw.apiKey,
		requiresApiKey: raw.requiresApiKey ?? raw.requiresKey ?? false,
		category: raw.category as SourceCategory | undefined,
		tags: raw.tags ?? [],
		language: raw.language ?? undefined,
		region: raw.region ?? undefined,
		authType: raw.authType as AuthType | undefined,
		rateLimitPerMinute: raw.rateLimitPerMinute ?? undefined,
		headers: raw.headers ?? undefined,
		lastUpdated: raw.lastUpdated ? new Date(raw.lastUpdated) : undefined,
		pinned: raw.pinned ?? undefined,
	};
}

/**
 * Load sources from the Wails backend.
 * Validates loaded data using Zod and normalizes with `createSource`.
 */
export async function loadSources(): Promise<Source[]> {
	try {
		const loaded: any[] = await LoadSources();
		const normalized = (loaded ?? []).map(createSource);
		return SourcesSchema.parse(normalized);
	} catch (err) {
		console.error("Failed to load sources:", err);
		return [];
	}
}

/**
 * Save sources to the Wails backend.
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
			requiresKey: s.requiresApiKey ?? false,
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
		await SaveSources(payload as any);
	} catch (err) {
		console.error("Failed to save sources:", err);
	}
}

/**
 * Parse a list of raw sources into validated Sources array.
 * Wrapper around Zod validation using `createSource`.
 */
export function parseSources(
	loaded?: (Partial<Source> & { url?: string; requiresKey?: boolean })[],
): Source[] {
	const normalized = (loaded ?? []).map(createSource);
	return SourcesSchema.parse(normalized);
}

/**
 * Initialize sources with defaults and hidden states.
 *
 * Combines loaded sources from backend with default sources.
 * Marks sources as hidden or default where applicable.
 */
export const initSources = async (): Promise<SourceWithHidden[]> => {
	const loadedSources = await loadSources();

	const combined: SourceWithHidden[] = (
		loadedSources.length > 0 ? loadedSources : DEFAULT_SOURCES
	).map((s) => {
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

/**
 * Get all sources that are free or have an API key applied.
 *
 * Includes:
 * - Default free sources
 * - Default sources with an API key
 * - Custom user-added sources (from Wails backend)
 */
export const getAvailableSources = async (): Promise<Source[]> => {
	const loadedSources = await loadSources();

	const availableSources: Source[] = (loadedSources.length > 0 ? loadedSources : DEFAULT_SOURCES)
		.map((s) => {
			const isApiKeySource = s.requiresApiKey ?? false;
			const enabled = isApiKeySource ? !!s.apiKey : (s.enabled ?? true);

			// Keep lastUpdated as Date, don't convert to string
			return {
				...s,
				enabled,
				lastUpdated:
					s.lastUpdated instanceof Date
						? s.lastUpdated
						: s.lastUpdated
							? new Date(s.lastUpdated)
							: undefined,
			};
		})
		.filter((s) => !s.requiresApiKey || (s.requiresApiKey && s.apiKey));

	return availableSources;
};

/**
 * Fetch articles from all available sources.
 *
 * This function:
 * 1. Gets all currently available sources (free or with an API key applied)
 * 2. Calls the Wails backend `FetchArticlesBySources` to fetch articles from those sources
 * 3. Returns a flattened array of articles
 *
 * @returns {Promise<Article[]>} Array of articles fetched from all available sources
 */
export const fetchArticlesBySources = async (): Promise<Article[]> => {
	try {
		const availableSources = await getAvailableSources();
		if (availableSources.length === 0) return [];

		const articlesFromBackend = await FetchArticlesBySources(availableSources);

		if (!Array.isArray(articlesFromBackend)) {
			console.error("Invalid response: expected an array of articles.");
			return [];
		}

		const validArticles: Article[] = articlesFromBackend
			.filter((a) => a.url && a.title && a.content)
			.map((a) => {
				const analyzed = false as const;

				// Map edition to Edition union type
				const edition: Edition = editions.includes(a.edition as Edition)
					? (a.edition as Edition)
					: "other";

				// Map political bias string to PoliticalBias union
				const sourceMeta = a.sourceMeta
					? {
							...a.sourceMeta,
							bias: PoliticalBiasValues.includes(a.sourceMeta.bias as PoliticalBias)
								? (a.sourceMeta.bias as PoliticalBias)
								: "center", // fallback
						}
					: undefined;

				return {
					...a,
					analyzed,
					edition,
					sourceMeta,
				};
			});

		console.log(
			`Fetched ${validArticles.length} articles from ${availableSources.length} sources.`,
		);

		return validArticles;
	} catch (err) {
		console.error("Failed to fetch articles by sources:", err);
		return [];
	}
};
