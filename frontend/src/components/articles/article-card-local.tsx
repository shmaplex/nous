/**
 * @file article-card-local.tsx
 * @description
 * Modern Perplexity-style article card for raw/local articles.
 * Supports optional `onOpen` for opening full article view.
 */

import { Archive, Sparkles } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Article } from "../../types";

interface Props {
  /** The article to display */
  article: Article;

  /** Optional callback to archive/hide the article */
  onArchive?: (id: string) => void;

  /**
   * Optional callback to trigger AI analysis.
   * When provided, an "Analyze" button will be shown.
   */
  onAnalyze?: (article: Article) => void;

  /**
   * Optional callback when the user clicks the card to view full article
   */
  onOpen?: (article: Article) => void;
}

/**
 * ArticleCardLocal Component
 *
 * Renders a single local article card with optional actions.
 */
const ArticleLocalCard: React.FC<Props> = ({ article, onArchive, onAnalyze, onOpen }) => {
  const openUrl = () => {
    if (onOpen) onOpen(article);
    else if (article.url) window.open(article.url, "_blank");
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    onArchive?.(article.id);
  };

  const handleAnalyze = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAnalyze?.(article);
  };

  /* Image fallback */
  const image = article.image || "https://placehold.co/800x500?text=No+Image";

  return (
    <Card
      className="
        flex flex-col overflow-hidden pt-0 rounded-xl
        shadow-sm cursor-pointer transition-all duration-200
        bg-linear-to-b from-white to-muted/10
        hover:shadow-md hover:scale-[1.01] hover:bg-muted/5
      "
      onClick={openUrl}
    >
      {/* Image */}
      <div className="w-full h-44 overflow-hidden rounded-t-xl bg-muted/20">
        <img src={image} alt={article.title} className="w-full h-full object-cover" />
      </div>

      {/* Header */}
      <CardHeader className="flex justify-between items-start gap-2 pb-2 relative">
        <div className="flex-1">
          <CardTitle className="text-base sm:text-lg font-semibold leading-tight line-clamp-2">
            {article.title}
          </CardTitle>
        </div>

        <div className="flex flex-col gap-1 items-end">
          {onAnalyze && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAnalyze}
              className="h-7 px-2 py-0 text-xs gap-1 border-accent/40 text-accent hover:bg-accent/10"
            >
              <Sparkles className="w-3 h-3" />
              Analyze
            </Button>
          )}

          {onArchive && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleArchive}
              className="p-1 rounded-full text-muted-foreground hover:bg-muted/20 hover:text-accent transition-colors"
              aria-label={`Archive ${article.title}`}
            >
              <Archive className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="text-sm text-muted-foreground line-clamp-4">
        {article.summary ?? article.content ?? "No content available."}
      </CardContent>

      {/* Footer */}
      <CardFooter className="text-xs text-muted-foreground flex justify-between items-center pt-3">
        <div className="opacity-80">
          {article.source ?? article.sourceDomain ?? "Unknown source"}
        </div>
        <div>
          {article.publishedAt && new Date(article.publishedAt).toLocaleDateString()}
        </div>
      </CardFooter>
    </Card>
  );
};

export default ArticleLocalCard;