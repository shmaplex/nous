import { Archive } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { AnalyzeButton } from "@/components/button-analyze";
import { TranslateButton } from "@/components/button-translate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import type { Article } from "@/types";

interface Props {
	article: Article;
	onArchive?: (id: string) => void | Promise<void>;
	onAnalyze?: (article: Article) => void | Promise<void>;
	onTranslate?: (article: Article) => void | Promise<void>;
	onOpen?: (article: Article) => void;
}

const ArticleLocalCard: React.FC<Props> = ({
	article,
	onArchive,
	onAnalyze,
	onTranslate,
	onOpen,
}) => {
	const [isArchiving, setIsArchiving] = useState(false);

	const openUrl = () => {
		if (onOpen) onOpen(article);
		else if (article.url) window.open(article.url, "_blank");
	};

	const handleAnalyze = async (e?: React.MouseEvent) => {
		e?.stopPropagation();
		if (!onAnalyze) return;
		await onAnalyze(article);
	};

	const handleTranslate = async (e?: React.MouseEvent) => {
		e?.stopPropagation();
		if (!onTranslate) return;
		await onTranslate(article);
	};

	const handleArchive = async (e: React.MouseEvent) => {
		e.stopPropagation();
		if (!onArchive) return;
		setIsArchiving(true);
		try {
			await onArchive(article.id);
		} finally {
			setIsArchiving(false);
		}
	};

	const image = article.image || "https://placehold.co/800x500?text=No+Image";

	return (
		<Card
			className="flex flex-col overflow-hidden pt-0 rounded-xl shadow-sm cursor-pointer transition-all duration-200 bg-linear-to-b from-white to-muted/10 hover:shadow-md hover:scale-[1.01] hover:bg-muted/5"
			onClick={openUrl}
		>
			{/* Image */}
			<div className="w-full h-44 overflow-hidden rounded-t-xl bg-muted/20">
				<img src={image} alt={article.title} className="w-full h-full object-cover" />
			</div>

			{/* Header & Action Buttons */}
			<CardHeader className="flex justify-between items-start gap-2 pb-2 relative">
				<div className="flex-1">
					<CardTitle className="text-base sm:text-lg font-semibold leading-tight line-clamp-2">
						{article.title}
					</CardTitle>
				</div>

				<div className="flex flex-col gap-1 items-end">
					{onAnalyze && <AnalyzeButton article={article} onAnalyze={() => handleAnalyze()} />}

					{onTranslate && (
						<TranslateButton article={article} onTranslate={() => handleTranslate()} />
					)}

					{onArchive && (
						<Button
							variant="ghost"
							size="icon"
							onClick={handleArchive}
							className="p-1 rounded-full text-muted-foreground hover:bg-muted/20 hover:text-accent transition-colors"
							aria-label={`Archive ${article.title}`}
							disabled={isArchiving}
						>
							{isArchiving ? <Spinner className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
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
				<div>{article.publishedAt && new Date(article.publishedAt).toLocaleDateString()}</div>
			</CardFooter>
		</Card>
	);
};

export default ArticleLocalCard;
