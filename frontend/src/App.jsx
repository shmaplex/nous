import { useState, useEffect } from "react";
import logo from "./assets/images/logo-universal.png";

import {
  FetchArticles,
  SaveArticle,
  Greet,
  SetLocation,
  GetLocation,
  DeleteArticle,
} from "../wailsjs/go/main/App";

function App() {
  const [log, setLog] = useState("");
  const [articles, setArticles] = useState([]);
  const [newArticle, setNewArticle] = useState({ title: "", url: "", content: "" });
  const [filter, setFilter] = useState("all");
  const [location, setLocationState] = useState("");

  const appendLog = (msg) => setLog((prev) => prev + msg + "\n");

  useEffect(() => {
    async function init() {
      appendLog(await Greet("User"));

      const loc = await GetLocation();
      if (loc) {
        setLocationState(loc);
        appendLog("Loaded saved location: " + loc);
      }

      appendLog("Loading articles from network...");
      loadArticles();
    }
    init();
  }, []);

  async function loadArticles() {
    try {
      const result = await FetchArticles();
      if (!result) {
        appendLog("No articles found");
        setArticles([]);
        return;
      }

      const parsed = JSON.parse(result);
      setArticles(parsed);
      appendLog(`Fetched ${parsed.length} articles`);
    } catch (err) {
      appendLog("Failed to fetch: " + err);
    }
  }

  async function saveNewArticle() {
    const { title, url, content } = newArticle;

    if (!title || !url || !content) {
      appendLog("Missing fields");
      return;
    }

    try {
      const result = await SaveArticle(title, url, content);
      appendLog(result);
      setNewArticle({ title: "", url: "", content: "" });
      loadArticles();
    } catch (err) {
      appendLog("Failed to save: " + err);
    }
  }

  async function updateLocation() {
    try {
      await SetLocation(location);
      appendLog("Location updated to: " + location);
    } catch (err) {
      appendLog("Failed to set location: " + err);
    }
  }

  async function handleDeleteArticle(id) {
    try {
      await DeleteArticle(id);
      appendLog("Deleted article " + id);
      loadArticles();
    } catch (err) {
      appendLog("Failed to delete article: " + err);
    }
  }

  const filteredArticles = articles.filter(
    (a) => filter === "all" || a.bias === filter
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <header className="flex flex-col md:flex-row items-center justify-between mb-6">
        <div className="flex items-center space-x-4 mb-4 md:mb-0">
          <img src={logo} alt="Nous" className="h-12 w-12" />
          <h1 className="text-2xl font-serif font-bold">Nous - P2P News Dashboard</h1>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Set Location"
            value={location}
            onChange={(e) => setLocationState(e.target.value)}
            className="border rounded px-2 py-1"
          />
          <button
            onClick={updateLocation}
            className="bg-blue-600 text-white px-4 py-1 rounded"
          >
            Update
          </button>
        </div>
      </header>

      {/* Filters */}
      <nav className="flex space-x-2 mb-6">
        {["all", "left", "center", "right"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded border ${
              filter === f
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white border-gray-300"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </nav>

      {/* Add Article */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Add a New Article</h2>
        <div className="flex flex-col space-y-2">
          <input
            placeholder="Title"
            value={newArticle.title}
            onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
            className="border rounded px-2 py-1"
          />
          <input
            placeholder="URL"
            value={newArticle.url}
            onChange={(e) => setNewArticle({ ...newArticle, url: e.target.value })}
            className="border rounded px-2 py-1"
          />
          <textarea
            placeholder="Content"
            value={newArticle.content}
            onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
            className="border rounded px-2 py-1"
          />
          <button
            onClick={saveNewArticle}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Save Article
          </button>
        </div>
      </section>

      {/* Articles */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Articles</h2>

        {filteredArticles.length === 0 ? (
          <p className="text-gray-500">No articles found</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredArticles.map((a, i) => (
              <div key={i} className="bg-white shadow rounded p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">{a.title}</h3>
                  <button
                    onClick={() => handleDeleteArticle(a.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>

                <p className="text-gray-700 mb-2">{a.content}</p>

                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all"
                >
                  {a.url}
                </a>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Logs */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Logs</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm">{log}</pre>
      </section>
    </div>
  );
}

export default App;