/**
 * @file App.tsx
 * @description
 * Main application entry for the Nous Desktop Client.
 *
 * Responsibilities:
 *  - Header
 *  - View switching between Workbench and Reading
 *  - Loading overlay management
 *  - Full article view integration
 *  - Modals, debug panel, and status bar
 *  - Wails event listeners for opening settings
 */

import { useEffect, useState } from "react";
import { FetchLocalArticle } from "@/../wailsjs/go/main/App"; // Wails binding
import AddArticleModal from "@/components/articles/add-article-modal";
import ArticlesView from "@/components/articles/article-view";
import DebugPanel from "@/components/debug/debug-panel";
import HeaderTop from "@/components/header-top";
import InsightsPanel from "@/components/insights-panel";
import { LoadingOverlay } from "@/components/loading/loading-overlay";
import SettingsPanel from "@/components/settings-panel";
import StatusBar from "@/components/status-bar";
import ReadingView from "@/components/views/view-reading";
import ViewSwitcher from "@/components/views/view-switcher";
import WorkbenchView from "@/components/views/view-workbench";
import { ThemeProvider } from "@/context/ThemeContext";
import { useNodeStatus } from "@/hooks/useNodeStatus";
import { addDebugLog } from "@/lib/log";
import type { Article, DebugStatus } from "@/types";
import { createEmptyDebugStatus } from "@/types";
import type { FilterOptions } from "@/types/filter";
import type { ViewMode } from "@/types/view";
import { EventsOff, EventsOn } from "../wailsjs/runtime";

const App = () => {
	/** -----------------------------
	 * UI State
	 * ----------------------------- */
	const [mode, setMode] = useState<ViewMode>("workbench");
	const [location, setLocationState] = useState("international");
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [addArticleOpen, setAddArticleOpen] = useState(false);
	const [debugOpen, setDebugOpen] = useState(false);
	const [debugTab, setDebugTab] = useState("node");

	/** -----------------------------
	 * Filters per view
	 * ----------------------------- */
	const [workbenchFilter, setWorkbenchFilter] = useState<FilterOptions>({
		bias: "all",
		sentiment: "all",
		coverage: "all",
		confidence: "all",
		edition: "international",
	});

	const [readingFilter, setReadingFilter] = useState<FilterOptions>({
		bias: "all",
		sentiment: "all",
		coverage: "all",
		confidence: "all",
		edition: "international",
	});

	/** -----------------------------
	 * Node Status
	 * ----------------------------- */
	const status = useNodeStatus();

	/** -----------------------------
	 * Loading Overlay (shared across views)
	 * ----------------------------- */
	const [loading, setLoading] = useState(true);
	const [loadingStatus, setLoadingStatus] = useState("Starting up…");
	const [progress, setProgress] = useState(5);

	/** -----------------------------
	 * Debug Status
	 * ----------------------------- */
	const [debugStatus, setDebugStatus] = useState<DebugStatus>(createEmptyDebugStatus());

	/** -----------------------------
	 * Full article view state
	 * ----------------------------- */
	const [fullArticle, setFullArticle] = useState<Article | null>(null);

	/** -----------------------------
	 * Initialize debug logging when node is ready
	 * ----------------------------- */
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

	/** -----------------------------
	 * Listen for Wails events
	 * ----------------------------- */
	useEffect(() => {
		const handler = () => setSettingsOpen(true);
		if (EventsOn) EventsOn("open-settings", handler);
		return () => EventsOff("open-settings", handler as any);
	}, []);

	/** -----------------------------
	 * Analysis callback for Workbench
	 *
	 * @param article - Article to analyze
	 */
	const handleAnalyzeArticle = (article: Article) => {
		console.log("Analyze triggered for:", article.title);
		// Forward to WorkbenchView / useArticleLoader to process
	};

	/** -----------------------------
	 * Shared callback to control overlay from views
	 *
	 * @param isLoading - Whether the view is currently loading
	 * @param statusMessage - Optional textual status for overlay
	 * @param percent - Optional progress value for overlay
	 */
	const handleViewLoading = (isLoading: boolean, statusMessage?: string, percent?: number) => {
		setLoading(isLoading);
		if (statusMessage) setLoadingStatus(statusMessage);
		if (percent !== undefined) setProgress(percent);
	};

	/** -----------------------------
	 * Open full article from any view
	 *
	 * Fetches the full article from Wails backend via Go binding
	 *
	 * @param article - Article clicked
	 */
	const handleOpenArticle = async (article: Article) => {
		setLoading(true);
		setFullArticle(null);

		const pollInterval = 2000; // 2 seconds
		const maxRetries = 30; // timeout after ~1 min

		let retries = 0;
		let fetchedArticle: Article | null = null;

		const pollArticle = async () => {
			try {
				const res = await FetchLocalArticle(article.id);
				const data = JSON.parse(res);

				if (data.status === "complete") {
					fetchedArticle = JSON.parse(data.body);
					setFullArticle(fetchedArticle);
					setLoading(false);
					console.log("Article ready:", fetchedArticle);
					return;
				}
				if (data.status === "error") {
					console.error("Failed to fetch article:", data.errorMsg);
					setFullArticle(null);
					setLoading(false);
					return;
				}
				// still pending
				retries++;
				if (retries >= maxRetries) {
					console.warn("Article processing timeout");
					setFullArticle(null);
					setLoading(false);
					return;
				}
				// retry after interval
				setTimeout(pollArticle, pollInterval);
			} catch (err) {
				console.error("Error polling article:", err);
				setFullArticle(null);
				setLoading(false);
			}
		};

		pollArticle();
	};

	/**
	 * Callback when the article is translated
	 * @param id Article id translated
	 * @param title New translated title (or old as fallback if failed)
	 * @param successs Whether or not the translation was a success
	 */
	const handleArticleTranslated = async (id: string, title: string, success: boolean) => {
		console.log(`Article ${id}: ${title} translated successfully: ${success}`);
	};

	/** -----------------------------
	 * Back button to exit full article view
	 * ----------------------------- */
	const handleCloseFullArticle = () => {
		setFullArticle(null);
	};

	if (fullArticle) console.log("fullArticle", fullArticle);

	/* -----------------------------
	 * Render
	 * ----------------------------- */
	return (
		<ThemeProvider>
			<div className="min-h-screen flex flex-col bg-background text-foreground pb-12">
				{/* Loading Overlay */}
				<LoadingOverlay open={loading} status={loadingStatus} progress={progress} />

				{/* Header */}
				<HeaderTop selectedLocation={location} onLocationChange={setLocationState} />

				{/* View Switcher */}
				{!fullArticle && <ViewSwitcher mode={mode} onChange={setMode} />}

				{/* Main Content */}
				<div className="flex-1 flex flex-col lg:flex-row px-6 py-6 max-w-[1600px] mx-auto gap-6 w-full">
					{fullArticle ? (
						<div className="flex-1 space-y-6">
							<ArticlesView
								article={fullArticle}
								location={location}
								onBack={handleCloseFullArticle}
							/>
						</div>
					) : (
						<>
							<div className="flex-1">
								{mode === "workbench" ? (
									<WorkbenchView
										onAnalyzeArticle={handleAnalyzeArticle}
										onTranslated={handleArticleTranslated}
										onLoadingChange={handleViewLoading}
										filter={workbenchFilter}
										setFilter={setWorkbenchFilter}
										onOpen={handleOpenArticle}
									/>
								) : (
									<ReadingView
										onLoadingChange={handleViewLoading}
										filter={readingFilter}
										setFilter={setReadingFilter}
									/>
								)}
							</div>

							<div className="hidden lg:block w-80 shrink-0">
								<div className="sticky top-18">
									<InsightsPanel />
								</div>
							</div>
						</>
					)}
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
