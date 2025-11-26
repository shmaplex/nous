// frontend/src/lib/sources.ts
import { DEFAULT_SOURCES } from "@/constants/sources";
import {
	type Article,
	type ArticlesBySource,
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
import { getNormalizer } from "./normalizers";
import { getParser } from "./parsers";

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
	} as Source;
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
 * Get all sources that are actually available (enabled and usable).
 *
 * Rules:
 * - Sources with requiresApiKey = true → include only if apiKey exists
 * - Sources with requiresApiKey = false → include if enabled = true
 * - Disabled sources → excluded
 */
export const getAvailableSources = async (): Promise<Source[]> => {
	const loadedSources = await loadSources();
	const sourcesToCheck = loadedSources.length > 0 ? loadedSources : DEFAULT_SOURCES;

	const availableSources: Source[] = sourcesToCheck
		.map((s) => {
			const requiresKey = s.requiresApiKey ?? false;

			// Include only if source is usable
			const usable = requiresKey ? !!s.apiKey && (s.enabled ?? true) : (s.enabled ?? true);

			const lastUpdated =
				s.lastUpdated instanceof Date
					? s.lastUpdated
					: s.lastUpdated
						? new Date(s.lastUpdated)
						: undefined;

			return { ...s, enabled: usable, lastUpdated };
		})
		.filter((s) => s.enabled); // remove anything not usable

	return availableSources;
};

/**
 * Fetch articles from all available sources.
 *
 * This function:
 * 1. Gets all currently available sources (free or with an API key applied)
 * 2. Calls the Wails backend `FetchArticlesBySources` to fetch raw feed data
 *    (JSON, RSS/XML, HTML, etc.) for each source
 * 3. Parses and normalizes each source’s raw data using its configured parser
 *    and normalizer into the unified `Article` type
 * 4. Returns a flattened array of valid articles
 *
 * @returns Array of fully parsed and normalized articles
 */
export const fetchArticlesBySources = async (): Promise<Article[]> => {
	try {
		const availableSources = await getAvailableSources();
		if (availableSources.length === 0) return [];

		console.log("availableSources", availableSources);

		// Fetch raw feed data from backend (returns ArticlesBySource: { [sourceName]: rawData })
		const backendResult: ArticlesBySource = await FetchArticlesBySources(availableSources);

		if (typeof backendResult !== "object" || backendResult === null) {
			console.error("Invalid backend response: expected object keyed by source.");
			return [];
		}

		const allNormalized: Article[] = [];

		// Process each source individually
		for (const source of availableSources) {
			const rawForSource = backendResult[source.name];

			if (!rawForSource) {
				console.warn(`No raw data returned for source: ${source.name}`);
				continue;
			}

			// Get the parser/normalizer functions from the registry
			const parser = getParser(source);
			const normalizer = getNormalizer(source);

			// Parse raw feed data (JSON, RSS/XML, HTML, etc.)
			const parsedItems = parser(rawForSource, source) ?? [];

			// Normalize parsed items into standard Article shape
			const normalizedItems = parsedItems.map((item) => normalizer(item, source));

			allNormalized.push(...normalizedItems);
		}

		// Final validation & cleanup: only keep items with title and URL
		const validArticles: Article[] = allNormalized
			.filter((a) => a?.url && a?.title)
			.map((a) => {
				const edition: Edition = editions.includes(a.edition as Edition)
					? (a.edition as Edition)
					: "other";

				const bias: PoliticalBias =
					a.sourceMeta?.bias && PoliticalBiasValues.includes(a.sourceMeta.bias)
						? (a.sourceMeta.bias as PoliticalBias)
						: "center";

				return {
					...a,
					analyzed: false as const,
					edition,
					sourceMeta: a.sourceMeta ? { ...a.sourceMeta, bias } : undefined,
				};
			});

		console.log(
			`Fetched + normalized ${validArticles.length} total articles from ${availableSources.length} sources.`,
		);

		return validArticles;
	} catch (err) {
		console.error("Failed to fetch articles by sources:", err);
		return [];
	}
};
