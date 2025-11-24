import { useEffect, useState } from "react";
import { EventsOff, EventsOn } from "../wailsjs/runtime";
import AddArticleModal from "./components/articles/add-article-modal";
import ArticlesGrid from "./components/articles/articles-grid";
import FiltersPanel from "./components/filters-panel";
import HeaderTop from "./components/header-top";
import InsightsPanel from "./components/insights-panel";
import SettingsPanel from "./components/settings-panel";
import StatusBar from "./components/status-bar";
import { ThemeProvider } from "./context/ThemeContext";

import type { ArticleAnalyzed, ArticleStored, FederatedArticlePointer } from "./types";
import type { FilterOptions } from "./types/filter";

/**
 * Root application component
 *
 * Manages state for articles, filters, location, and modals.
 * Integrates Wails runtime events for settings.
 */
const App = () => {
	/** Local articles ingested directly */
	const [articles, setArticles] = useState<ArticleStored[]>([]);
	/** Articles fetched from federated sources */
	const [federatedArticles, setFederatedArticles] = useState<FederatedArticlePointer[]>([]);
	/** AI-analyzed articles with bias and sentiment data */
	const [analyzedArticles, setAnalyzedArticles] = useState<ArticleAnalyzed[]>([]);
	/** Current filter options applied to the article feed */
	const [filter, setFilter] = useState<FilterOptions>({
		bias: "all",
		sentiment: "all",
		coverage: "all",
		confidence: "all",
		edition: "international",
	});
	/** Currently selected location (for filtering or UI) */
	const [location, setLocationState] = useState("international");
	/** Toggle for settings modal visibility */
	const [settingsOpen, setSettingsOpen] = useState(false);
	/** Toggle for add-article modal visibility */
	const [addArticleOpen, setAddArticleOpen] = useState(false);

	/**
	 * Initialize application data on mount.
	 * Currently sets empty arrays as placeholders.
	 */
	useEffect(() => {
		const init = async () => {
			setArticles(await Promise.resolve([]));
			setFederatedArticles(await Promise.resolve([]));
			setAnalyzedArticles(await Promise.resolve([]));
			setLocationState(await Promise.resolve("international"));
		};
		init();
	}, []);

	/**
	 * Listen to Wails runtime events for opening settings modal.
	 */
	useEffect(() => {
		const handleOpenSettings = () => setSettingsOpen(true);
		EventsOn("open-settings", handleOpenSettings);
		return () => EventsOff("open-settings", handleOpenSettings as any);
	}, []);

	/** Merge all articles into a single array for display in the grid */
	const mergedArticles = [...articles, ...analyzedArticles, ...federatedArticles];

	return (
		<ThemeProvider>
			<div className="min-h-screen flex flex-col bg-background text-foreground font-sans pb-12">
				{/* Top Header */}
				<HeaderTop selectedLocation={location} onLocationChange={setLocationState} />

				{/* Filters Panel */}
				<div className="sticky top-0 z-30 bg-background px-6 py-3 border-b border-border shadow-sm">
					<FiltersPanel filter={filter} setFilter={setFilter} />
				</div>

				{/* Main Content */}
				<div className="flex-1 flex flex-col lg:flex-row px-6 py-6 max-w-[1600px] mx-auto gap-6 w-full">
					{/* Articles Feed */}
					<div className="flex-1 space-y-4">
						<ArticlesGrid
							articles={mergedArticles}
							onArchive={(id) => console.log("Archive:", id)}
						/>
					</div>

					{/* Insights Panel */}
					<div className="hidden lg:block w-80 shrink-0 sticky top-24">
						<InsightsPanel />
					</div>
				</div>

				{/* Modals */}
				<SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
				<AddArticleModal
					isOpen={addArticleOpen}
					onClose={() => setAddArticleOpen(false)}
					onSave={async () => console.log("Save article placeholder")}
				/>

				{/* Bottom Status Bar */}
				<StatusBar />
			</div>
		</ThemeProvider>
	);
};

export default App;
