/**
 * @file articles-tabs.tsx
 * @description
 * Reusable tabbed view for switching between:
 *   - Unanalyzed (raw/local) articles
 *   - Federated articles (P2P/IPFS)
 *   - Analyzed articles (AI-enriched)
 *
 * Features:
 *  - Automatic state management for active tab
 *  - Clean tab button row
 *  - Displays lists of articles per category
 *  - Fully typed
 */

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ArticleStored, ArticleAnalyzed, FederatedArticlePointer } from "@/types";

interface Props {
  /** Local unanalyzed articles */
  articles?: ArticleStored[];

  /** Federated P2P/IPFS articles */
  federatedArticles?: FederatedArticlePointer[];

  /** AI-analyzed articles */
  analyzedArticles?: ArticleAnalyzed[];
}

/**
 * ArticlesTabs Component
 *
 * Renders a tabbed interface for the three article categories.
 */
const ArticlesTabs: React.FC<Props> = ({ articles, federatedArticles, analyzedArticles }) => {
  const [tab, setTab] = useState<"unanalyzed" | "federated" | "analyzed">("analyzed");

  const renderTabContent = () => {
    switch (tab) {
      case "unanalyzed":
        return articles && (
          <ul className="space-y-2">
            {articles.map((a) => (
              <li key={a.id} className="border p-2 rounded">
                {a.title} ({a.sourceType})
              </li>
            ))}
          </ul>
        );
      case "federated":
        return federatedArticles && (
          <ul className="space-y-2">
            {federatedArticles.map((f) => (
              <li key={f.cid} className="border p-2 rounded">
                {f.source ?? "Federated"} - {f.cid.slice(0, 8)}...
              </li>
            ))}
          </ul>
        );
      case "analyzed":
        return analyzedArticles && (
          <ul className="space-y-2">
            {analyzedArticles.map((a) => (
              <li key={a.id} className="border p-2 rounded">
                {a.title} - {a.politicalBias ?? "neutral"} - {a.source}
              </li>
            ))}
          </ul>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Tab Buttons */}
      <div className="flex gap-2 mb-4">
        {["unanalyzed", "federated", "analyzed"].map((t) => (
          <Button
            key={t}
            variant={tab === t ? "default" : "outline"}
            size="sm"
            onClick={() => setTab(t as typeof tab)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {renderTabContent()}
      </div>
    </div>
  );
};

export default ArticlesTabs;