// frontend/src/orbitdb/index.ts
// orbitdb/
// ├─ index.ts         # re-exports fetch/save/server
// ├─ client.ts        # helper functions for frontend
// ├─ fetch.ts         # fetch articles from local or analyzed feed
// ├─ save.ts          # save articles (un-analyzed or analyzed)
// ├─ server.ts        # OrbitDB "server" process
// ├─ types.ts         # TS types for articles

// Example usage in frontend code:
// import { fetchArticles, saveArticle } from "@/orbitdb/client";

// // fetch un-analyzed articles
// const inbox = await fetchArticles("local");

// // analyze first article
// const article = inbox[0];
// article.bias = "center";
// article.antithesis = "Opposing viewpoint...";
// article.philosophical = "Philosophical insight";
// article.analyzed = true;

// // save to analyzed feed (and later broadcast)
// await saveArticle(article, "analyzed");

export * from "./fetch";
export * from "./save";
export * from "./server";
