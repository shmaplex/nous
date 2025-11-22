import { useEffect, useState } from "react";
import { PLACEHOLDER_ARTICLES as DEFAULT_ARTICLES } from "@/constants/articles";
import {
	deleteArticle,
	filterArticles,
	getLocation,
	loadArticlesFromBackend,
	saveArticle,
	setLocation,
} from "@/lib/articles";
import { EventsOff, EventsOn } from "../wailsjs/runtime";
import AddArticleModal from "./components/add-article-modal";
import ArticlesGrid from "./components/articles-grid";
import Filters from "./components/filters";
import Header from "./components/header";
import HeaderTop from "./components/header-top";
import SettingsPanel from "./components/settings-panel";
import StatusBar from "./components/status-bar";
import { ThemeProvider } from "./context/ThemeContext";
import type { Article } from "./types";

const App: React.FC = () => {
	const [articles, setArticles] = useState<Article[]>([]);
	const [filter, setFilter] = useState("all");
	const [location, setLocationState] = useState("international");
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [addArticleOpen, setAddArticleOpen] = useState(false);

	useEffect(() => {
		async function init() {
			const loc = await getLocation();
			if (loc) setLocationState(loc);

			const backendArticles = await loadArticlesFromBackend();
			setArticles(backendArticles);
		}
		init();
	}, []);

	useEffect(() => {
		const handleOpenSettings = () => setSettingsOpen(true);

		EventsOn("open-settings", handleOpenSettings);

		return () => {
			EventsOff("open-settings", handleOpenSettings as any);
		};
	}, []);

	const handleSaveArticle = async (
		title: string,
		url: string,
		content: string,
		edition?: string,
	) => {
		const success = await saveArticle(title, url, content, edition);
		if (success) setArticles(await loadArticlesFromBackend());
		setAddArticleOpen(false);
	};

	const handleDeleteArticle = async (id: string) => {
		const success = await deleteArticle(id);
		if (success) setArticles(await loadArticlesFromBackend());
	};

	const handleUpdateLocation = async () => {
		await setLocation(location);
	};

	// Merge backend articles with defaults, then filter
	const baseArticles = [...DEFAULT_ARTICLES, ...articles];
	const displayArticles = filterArticles(
		baseArticles,
		filter as "left" | "center" | "right" | "all",
		location,
	);

	return (
		<ThemeProvider>
			<div className="min-h-screen flex flex-col bg-background text-foreground">
				{/* Top bar with time + location selector */}
				<HeaderTop selectedLocation={location} onLocationChange={setLocationState} />
				<div className="flex-1 p-6 space-y-8 max-w-[1600px] mx-auto overflow-auto">
					<SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
					<AddArticleModal
						isOpen={addArticleOpen}
						onClose={() => setAddArticleOpen(false)}
						onSave={handleSaveArticle}
					/>

					<Header location={location} />

					<Filters filter={filter} onChange={setFilter} />

					<ArticlesGrid articles={displayArticles} onArchive={handleDeleteArticle} />
				</div>

				{/* Status bar fixed at bottom */}
				<StatusBar />
			</div>
		</ThemeProvider>
	);
};

export default App;
