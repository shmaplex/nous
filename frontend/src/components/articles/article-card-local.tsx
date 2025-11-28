/**
 * @file article-card-local.tsx
 * @description
 * Modern Perplexity-style article card for raw/local articles.
 *
 * Features:
 *  - Image-first layout with fallback
 *  - Clean metadata section (source, date)
 *  - Archive button for local/analyzed articles
 *  - Subtle hover elevation & scale
 *  - Placeholder hooks for AI tags, bias badges, confidence meters
 *  - Fully typed using the `Article` type
 */

import { Archive } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Article } from "../../types";

interface Props {
	/** The article to display */
	article: Article;

	/** Optional callback to archive/hide the article */
	onArchive?: (id: string) => void;
}

/**
 * ArticleCardLocal Component
 *
 * Renders a single local article in a modern Perplexity-inspired card.
 */
const ArticleCardLocal: React.FC<Props> = ({ article, onArchive }) => {
	const openUrl = () => article.url && window.open(article.url, "_blank");

	const handleArchive = (e: React.MouseEvent) => {
		e.stopPropagation();
		onArchive?.(article.id);
	};

	/* Image fallback chain */
	const image = article.image || "https://placehold.co/800x500?text=No+Image";

	return (
		<Card
			className="flex flex-col overflow-hidden pt-0 rounded-xl border border-border/40 shadow-sm cursor-pointer transition-all duration-200 bg-linear-to-b from-white to-muted/10 hover:shadow-md hover:scale-[1.01] hover:bg-muted/5"
			onClick={openUrl}
		>
			{/* Article image */}
			<div className="w-full h-44 overflow-hidden rounded-t-xl bg-muted/20">
				<img src={image} alt={article.title} className="w-full h-full object-cover" />
			</div>

			{/* Header */}
			<CardHeader className="flex justify-between items-start gap-2 pb-2">
				<CardTitle className="text-base sm:text-lg font-semibold leading-tight line-clamp-2">
					{article.title}
				</CardTitle>

				{onArchive && (
					<Button
						variant="ghost"
						size="icon"
						onClick={handleArchive}
						className="
							p-1 rounded-full text-muted-foreground
							hover:bg-muted/20 hover:text-accent transition-colors
						"
						aria-label={`Archive ${article.title}`}
					>
						<Archive className="w-4 h-4" />
					</Button>
				)}
			</CardHeader>

			{/* Summary / Content */}
			<CardContent className="text-sm text-muted-foreground line-clamp-4">
				{article.summary ?? article.content ?? "No content available."}
			</CardContent>

			{/* Footer Metadata */}
			<CardFooter className="text-xs text-muted-foreground flex justify-between items-center pt-3">
				<div className="opacity-80">
					{article.source ?? article.sourceDomain ?? "Unknown source"}
				</div>
				<div>{article.publishedAt && new Date(article.publishedAt).toLocaleDateString()}</div>
			</CardFooter>

			{/* Placeholder future features */}
			{/* TODO: Render bias badge from article.sourceMeta?.bias */}
			{/* TODO: Render AI topic tags */}
			{/* TODO: Render confidence score bar (article.confidence) */}
			{/* TODO: Render edition/location indicators */}
		</Card>
	);
};

export default ArticleCardLocal;
