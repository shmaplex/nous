import type { Helia } from "helia";
import type { ArticleAnalyzed } from "@/types";
import type { Article } from "@/types/article";
import { analyzeArticle } from "./ai";
import { smartFetch } from "./fetch.server";
import { fetchArticleFromIPFS, saveArticleToIPFS } from "./ipfs.server";
import { summarizeContentAI } from "./ai/summarizer.server";

/** Fetch content from source URL */
export async function fetchFromSource(url: string): Promise<string> {
	const res = await smartFetch(url);
	if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
	return await res.text();
}

/** Generate a summary of the content */
export async function summarizeContent(content: string): Promise<string> {
	const sentences = content.split(/(?<=[.!?])\s+/);
	const summary = sentences.slice(0, 3).join(" ");
	return summary.length > 300 ? `${summary.slice(0, 300)}...` : summary;
}

/**
 * Get full article content from IPFS or source,
 * populate raw content, summary, and run AI analysis
 */
export async function getFullLocalArticle(
  article: Article,
  helia: Helia,
  saveLocalArticle: (article: Article | ArticleAnalyzed) => Promise<void>,
): Promise<Article | ArticleAnalyzed> {

  // 1️⃣ Already fully present?
  if (article.content && article.raw) return article;

  // 2️⃣ Try pulling from IPFS
  if (article.ipfsHash) {
    try {
      const fetched = await fetchArticleFromIPFS(helia, article.ipfsHash);
      if (fetched) {
        await saveLocalArticle(fetched);
        return fetched;
      }
    } catch (err) {
      console.warn(`IPFS load failed for ${article.id}: ${(err as Error).message}`);
    }
  }

  // 3️⃣ Fallback: fetch from source URL
  if (article.url) {
    const raw = await fetchFromSource(article.url);
    let summary = await summarizeContent(raw); // fallback

		try {
			summary = await summarizeContentAI(raw); // preferred
		} catch (err) {
			console.warn("AI summarization failed:", (err as Error).message);
		}

    const enrichedBase: Article = {
      ...article,
      raw,
      content: raw,
      summary,
    };

    // 4️⃣ AI analysis (may return null)
    let analyzed: ArticleAnalyzed | null = null;
    try {
      analyzed = await analyzeArticle(enrichedBase);
    } catch (err) {
      console.warn(`AI analysis failed for ${article.id}: ${(err as Error).message}`);
    }

    // Decide which version to store:
    const finalVersion = analyzed ?? enrichedBase;

    // 5️⃣ Save to IPFS if available
    if (helia) {
      try {
        const cid = await saveArticleToIPFS(helia, finalVersion);
        finalVersion.ipfsHash = cid;
      } catch (err) {
        console.warn(
          `Failed to save article to IPFS for ${article.id}: ${(err as Error).message}`
        );
      }
    }

    // Save in local DB
    await saveLocalArticle(finalVersion);
    return finalVersion;
  }

  // 6️⃣ If nothing works, return original article
  return article;
}
