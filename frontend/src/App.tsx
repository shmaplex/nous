import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Filters from "./components/Filters";
import ArticlesGrid from "./components/ArticlesGrid";
import AddArticleForm from "./components/AddArticleForm";
import SettingsPanel from "./components/SettingsPanel";
import { ThemeProvider } from "./context/ThemeContext";
import { Article } from "./types";
import {
  FetchArticles,
  SaveArticle,
  SetLocation,
  GetLocation,
  DeleteArticle,
} from "../wailsjs/go/main/App";

import { EventsOn } from "../wailsjs/runtime/runtime"; // import Wails runtime event listener

const App: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filter, setFilter] = useState("all");
  const [location, setLocation] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Initial fetch
  useEffect(() => {
    async function init() {
      const loc = await GetLocation();
      if (loc) setLocation(loc);
      loadArticles();
    }
    init();

    // Subscribe to Wails event to open settings
    EventsOn("open-settings", () => {
      setSettingsOpen(true);
    });

  }, []);

  const loadArticles = async () => {
    try {
      const result = await FetchArticles();
      if (!result) {
        setArticles([]);
        return;
      }
      const parsed: Article[] = JSON.parse(result);
      setArticles(parsed);
    } catch (err) {
      console.error("Failed to load articles:", err);
    }
  };

  const handleSaveArticle = async (title: string, url: string, content: string) => {
    try {
      await SaveArticle(title, url, content);
      loadArticles();
    } catch (err) {
      console.error("Failed to save article:", err);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    try {
      await DeleteArticle(id);
      loadArticles();
    } catch (err) {
      console.error("Failed to delete article:", err);
    }
  };

  const handleUpdateLocation = async () => {
    try {
      await SetLocation(location);
    } catch (err) {
      console.error("Failed to update location:", err);
    }
  };

  const filteredArticles = articles.filter(
    (a) => filter === "all" || a.bias === filter
  );

  return (
    <ThemeProvider>
      <div
        className="min-h-screen p-4"
        style={{
          backgroundColor: "var(--color-background)",
          color: "var(--color-foreground)",
        }}
      >
        {/* Settings panel overlay */}
        <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

        {/* Main components */}
        <Header
          location={location}
          onLocationChange={setLocation}
          onUpdateLocation={handleUpdateLocation}
        />

        <Filters filter={filter} onChange={setFilter} />

        <AddArticleForm onSave={handleSaveArticle} />

        <ArticlesGrid articles={filteredArticles} onDelete={handleDeleteArticle} />
      </div>
    </ThemeProvider>
  );
};

export default App;