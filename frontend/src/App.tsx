import { useEffect, useState } from "react";
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

	/** -----------------------------
	 * Loading Overlay
	 * ----------------------------- */
	const [loading, setLoading] = useState(true);
	const [loadingStatus, setLoadingStatus] = useState("Starting up…");
	const [progress, setProgress] = useState(5);

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

	/** -----------------------------------------
	 * 🔄 Fetch Articles from Backend on Load
	 * ----------------------------------------- */
	useEffect(() => {
		const loadSourcesAndArticles = async () => {
			try {
				setLoadingStatus("Connecting to local node…");
				setProgress(10);
				await new Promise((r) => setTimeout(r, 300));

				setLoadingStatus("Fetching articles from available sources…");
				setProgress(40);

				// Use the new fetchArticlesBySources function
				const data = await fetchArticlesBySources();

				setLoadingStatus("Processing articles…");
				setProgress(70);

				// Save to state
				setArticles(data);

				setLoadingStatus("Finalizing setup…");
				setProgress(95);
				await new Promise((r) => setTimeout(r, 200));

				setProgress(100);
				setLoading(false);

				if (data.length > 0) {
					await addDebugLog({
						message: `Loaded ${data.length} articles from sources`,
						level: "info",
						meta: { type: "fetch" },
					});
				} else {
					await addDebugLog({
						message: "No articles loaded from sources",
						level: "warn",
						meta: { type: "fetch" },
					});
				}
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

		loadSourcesAndArticles();
	}, []);

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
					status={debugStatus}
				/>

				{/* StatusBar */}
				<StatusBar
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
