import { useEffect, useRef, useState } from "react";
import { loadLocalArticles, saveLocalArticlesBatch } from "@/lib/articles/local";
import { addDebugLog } from "@/lib/log";
import {
	type ArticleAnalyzed,
	type ArticleStored,
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
import { fetchArticlesBySources } from "./lib/sources";
import type { FilterOptions } from "./types/filter";

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
	const [articles, setArticles] = useState<ArticleStored[]>([]);
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

	const status = useNodeStatus();

	/** -----------------------------
	 * Loading Overlay
	 * ----------------------------- */
	const [loading, setLoading] = useState(true);
	const [loadingStatus, setLoadingStatus] = useState("Starting up…");
	const [progress, setProgress] = useState(5);

	// Persisted flag to avoid refetching on status changes
	const fetchedRef = useRef(false);

	/** -----------------------------------------
	 * 🔄 Initialize OrbitDB Debug DB
	 * ----------------------------------------- */
	useEffect(() => {
		const initDebug = async () => {
			try {
				await addDebugLog({ message: "Debug DB initialized", level: "info" });
			} catch (err) {
				console.error("Failed to initialize debug DB", err);
			}
		};
		initDebug();
	}, []);

	/**
	 * Wait until P2P node, connection, and OrbitDB are ready,
	 * then fetch articles **once**, save them locally, and finally
	 * reload from the canonical local DB.
	 */
	useEffect(() => {
		const waitForReady = async () => {
			if (fetchedRef.current) return; // Prevent double fetch

			// Still waiting for services to become ready
			if (!status.running || !status.connected || !status.orbitConnected) {
				setLoadingStatus("Waiting for P2P node and databases…");
				setProgress(10);
				return;
			}

			fetchedRef.current = true; // Mark as fetched

			setLoadingStatus("Fetching articles from sources…");
			setProgress(40);

			try {
				/** --------------------------------------------------
				 * 1. Fetch from external sources
				 * -------------------------------------------------- */
				const fetched = await fetchArticlesBySources();

				setLoadingStatus("Saving articles locally…");
				setProgress(70);

				/** --------------------------------------------------
				 * 2. Save into Local DB (validated + deduped backend)
				 * -------------------------------------------------- */
				await saveLocalArticlesBatch(
					fetched.map((a) => ({
						...a,
						fetchedAt: a.fetchedAt ?? new Date().toISOString(),
						analyzed: false,
					})),
				);

				setLoadingStatus("Loading local database…");
				setProgress(85);

				/** --------------------------------------------------
				 * 3. Load canonical local DB (source of truth)
				 * -------------------------------------------------- */
				const local = await loadLocalArticles();
				setArticles(local);

				setProgress(100);
				setLoading(false);

				await addDebugLog({
					message: `Fetched and saved ${fetched.length} articles`,
					level: "info",
					meta: { type: "fetch" },
				});
			} catch (err) {
				console.error(err);

				setLoadingStatus("Failed to fetch articles. Is node running?");
				setProgress(0);

				await addDebugLog({
					message: `Failed to fetch articles: ${(err as Error).message}`,
					level: "error",
					meta: { type: "fetch" },
				});
			}
		};

		waitForReady();
	}, [status]); // Re-run until first successful fetch

	/** -----------------------------------------
	 * 🔄 Wails Event - Open Settings
	 * ----------------------------------------- */
	useEffect(() => {
		const handle = () => setSettingsOpen(true);
		if (EventsOn) {
			EventsOn("open-settings", handle);
		} else {
			console.warn("Wails runtime not loaded yet");
		}
		return () => EventsOff("open-settings", handle as any);
	}, []);

	const mergedArticles = [...articles, ...analyzedArticles, ...federatedArticles];

	return (
		<ThemeProvider>
			<div className="min-h-screen flex flex-col bg-background text-foreground pb-12">
				{/* Loading Overlay */}
				<LoadingOverlay open={loading} status={loadingStatus} progress={progress} />

				{/* Header */}
				<HeaderTop selectedLocation={location} onLocationChange={setLocationState} />

				{/* Filters */}
				<div className="sticky top-0 z-30 bg-background px-6 py-3 border-b shadow-sm border-border">
					<FiltersPanel filter={filter} setFilter={setFilter} />
				</div>

				{/* Main Content */}
				<div className="flex-1 flex flex-col lg:flex-row px-6 py-6 max-w-[1600px] mx-auto gap-6 w-full">
					<div className="flex-1">
						<ArticlesGrid
							articles={mergedArticles}
							onArchive={(id) => console.log("Archive:", id)}
						/>
					</div>

					<div className="hidden lg:block w-80 shrink-0 sticky top-24">
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
