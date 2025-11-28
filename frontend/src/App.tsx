/**
 * @file App.tsx
 * @description
 * Main application entry for the Nous Desktop Client.
 *
 * Handles:
 *  - Startup sequencing and P2P readiness checks
 *  - Fetching articles from backend (Go → P2P node)
 *  - Polling local OrbitDB until articles available
 *  - Rendering UI sections (header, filters, grid, modals, debug, etc)
 */

import { useEffect, useRef, useState } from "react";
import { loadLocalArticles } from "@/lib/articles/local";
import { addDebugLog } from "@/lib/log";
import {
	type Article,
	type ArticleAnalyzed,
	createEmptyDebugStatus,
	type DebugStatus,
	type FederatedArticlePointer,
} from "@/types";
import { EventsOff, EventsOn } from "../wailsjs/runtime";
import AddArticleModal from "./components/articles/add-article-modal";
import ArticlesGrid from "./components/articles/articles-grid";
import { DebugPanel } from "./components/debug/debug-panel";
import FiltersPanel from "./components/filters-panel";
import HeaderTop from "./components/header-top";
import InsightsPanel from "./components/insights-panel";
import { LoadingOverlay } from "./components/loading/loading-overlay";
import SettingsPanel from "./components/settings-panel";
import StatusBar from "./components/status-bar";
import { ThemeProvider } from "./context/ThemeContext";
import { useNodeStatus } from "./hooks/useNodeStatus";
import { fetchArticlesBySources, getAvailableSources } from "./lib/sources";
import type { FilterOptions } from "./types/filter";

/** Slow polling to avoid OrbitDB "Too many requests" warnings */
const POLL_INTERVAL = 5000; // was 500ms
const MAX_POLL_ATTEMPTS = 25; // 25 × 1.5s = ~37.5s total

/**
 * Main App Component
 */
const App = () => {
	/** -----------------------------
	 * Debug Panel State
	 * ----------------------------- */
	const [debugOpen, setDebugOpen] = useState(false);
	const [debugTab, setDebugTab] = useState("node");
	const [debugStatus, setDebugStatus] = useState<DebugStatus>(createEmptyDebugStatus());

	/** -----------------------------
	 * Content State
	 * ----------------------------- */
	const [articles, setArticles] = useState<Article[]>([]);
	const [federatedArticles, setFederatedArticles] = useState<FederatedArticlePointer[]>([]);
	const [analyzedArticles, setAnalyzedArticles] = useState<ArticleAnalyzed[]>([]);

	/** -----------------------------
	 * UI State
	 * ----------------------------- */
	const [filter, setFilter] = useState<FilterOptions>({
		bias: "all",
		sentiment: "all",
		coverage: "all",
		confidence: "all",
		edition: "international",
	});
	const [location, setLocationState] = useState("international");
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [addArticleOpen, setAddArticleOpen] = useState(false);

	/** -----------------------------
	 * Node Status
	 * ----------------------------- */
	const status = useNodeStatus();

	/** -----------------------------
	 * Loading Overlay
	 * ----------------------------- */
	const [loading, setLoading] = useState(true);
	const [loadingStatus, setLoadingStatus] = useState("Starting up…");
	const [progress, setProgress] = useState(5);

	/** Prevent running fetch twice EVER */
	const fetchOnceRef = useRef(false);

	/**
	 * Initialize debug logging only when the P2P node is fully ready.
	 */
	useEffect(() => {
		const initDebug = async () => {
			if (!status.running || !status.orbitConnected) return;
			try {
				await addDebugLog({ message: "App logger initialized", level: "info" });
			} catch (err) {
				console.error("Failed to initialize application logger", err);
			}
		};
		initDebug();
	}, [status.running, status.orbitConnected]);

	/**
	 * One-shot startup routine:
	 *
	 * 1. Wait for P2P + OrbitDB readiness
	 * 2. Fire fetchArticlesBySources() EXACTLY ONCE
	 * 3. Slowly poll local DB until articles exist
	 * 4. Load articles into UI
	 */
	useEffect(() => {
		const run = async () => {
			// Wait until everything is ready
			if (!status.running || !status.connected || !status.orbitConnected) {
				setLoadingStatus("Waiting for P2P node and databases…");
				setProgress(10);
				return;
			}

			// Ensure the fetch happens EXACTLY once — never again
			if (fetchOnceRef.current) return;
			fetchOnceRef.current = true;

			// Give OrbitDB 300ms breathing room to stabilize
			await new Promise((r) => setTimeout(r, 1000));

			/** -----------------------------
			 * Step 0 — Load available sources
			 * ----------------------------- */
			setLoadingStatus("Loading news sources…");
			setProgress(20);

			const sources = await getAvailableSources();
			if (!sources || sources.length === 0) {
				console.warn("No available sources found.");
			}

			/** -----------------------------
			 * Step 1 — Fetch external articles
			 * ----------------------------- */
			setLoadingStatus("Fetching articles from sources…");
			setProgress(40);

			try {
				await fetchArticlesBySources(sources); // <-- FIXED
			} catch (err) {
				console.error("Fetch failed:", err);
				setLoadingStatus("Failed to fetch external sources.");
				setProgress(0);
				return;
			}

			/** -----------------------------
			 * Step 2 — Slow poll until articles appear
			 * ----------------------------- */
			setLoadingStatus("Waiting for articles to populate…");
			setProgress(60);

			let attempts = 0;
			let found: Article[] = [];

			while (attempts < MAX_POLL_ATTEMPTS) {
				const local = await loadLocalArticles();

				if (Array.isArray(local) && local.length > 0) {
					found = local;
					break;
				}

				attempts++;
				await new Promise((r) => setTimeout(r, POLL_INTERVAL));
			}

			/** -----------------------------
			 * Step 3 — Timeout case
			 * ----------------------------- */
			if (found.length === 0) {
				setLoadingStatus("No articles found. Try again?");
				setProgress(100);
				setLoading(false);
				return;
			}

			/** -----------------------------
			 * Step 4 — Success
			 * ----------------------------- */
			setArticles(found);
			setProgress(100);
			setLoading(false);

			await addDebugLog({
				message: `Loaded ${found.length} local articles`,
				level: "info",
			});
		};

		run();
	}, [status]);

	/**
	 * Listen for Wails events (open-settings, etc)
	 */
	useEffect(() => {
		const handler = () => setSettingsOpen(true);
		if (EventsOn) EventsOn("open-settings", handler);

		return () => EventsOff("open-settings", handler as any);
	}, []);

	/**
	 * Merge all article types for rendering
	 */
	const mergedArticles = [...articles, ...analyzedArticles, ...federatedArticles];

	/* -----------------------------------------------------------
	 * Render
	 * ----------------------------------------------------------- */
	return (
		<ThemeProvider>
			<div className="min-h-screen flex flex-col bg-background text-foreground pb-12">
				{/* Loading Overlay */}
				<LoadingOverlay open={loading} status={loadingStatus} progress={progress} />

				{/* Header */}
				<HeaderTop selectedLocation={location} onLocationChange={setLocationState} />

				{/* Filters */}
				<div className="sticky top-0 z-20 bg-background px-6 py-3 border-b shadow-sm border-border">
					<FiltersPanel filter={filter} setFilter={setFilter} />
				</div>

				{/* Main Content */}
				<div className="flex-1 flex flex-col lg:flex-row px-6 py-6 max-w-[1600px] mx-auto gap-6 w-full">
					<div className="flex-1">
						<ArticlesGrid articles={mergedArticles} />
					</div>

					<div className="hidden lg:block w-80 shrink-0 sticky top-20">
						<InsightsPanel />
					</div>
				</div>

				{/* Modals */}
				<SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
				<AddArticleModal
					isOpen={addArticleOpen}
					onClose={() => setAddArticleOpen(false)}
					onSave={async () => console.log("Save article")}
				/>

				{/* Debug Panel */}
				<DebugPanel
					open={debugOpen}
					onClose={() => setDebugOpen(false)}
					defaultTab={debugTab}
					status={status}
					debugStatus={debugStatus}
				/>

				{/* StatusBar */}
				<StatusBar
					status={status}
					onOpenDebug={(tab) => {
						setDebugTab(tab);
						setDebugOpen(true);
					}}
				/>
			</div>
		</ThemeProvider>
	);
};

export default App;
