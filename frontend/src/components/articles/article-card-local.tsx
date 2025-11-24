// frontend/src/components/articles/article-card-local.tsx
import { Archive } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Article } from "../../types";

interface Props {
	article: Article;
	onArchive?: (id: string) => void;
}

const ArticleCardLocal: React.FC<Props> = ({ article, onArchive }) => {
	const openUrl = () => article.url && window.open(article.url, "_blank");
	const handleArchive = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (onArchive) onArchive(article.id);
	};

	return (
		<Card
			className="flex flex-col shadow-md rounded-lg cursor-pointer hover:shadow-lg transition-shadow duration-200 border border-muted/20"
			onClick={openUrl}
		>
			<CardHeader className="flex justify-between items-start gap-2">
				<CardTitle className="text-lg font-semibold line-clamp-2">{article.title}</CardTitle>
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
			</CardHeader>

			<CardContent className="text-sm text-muted-foreground line-clamp-5">
				{article.summary ?? article.content ?? "No content available."}
			</CardContent>

			{article.source && (
				<CardFooter className="text-xs text-muted-foreground">
					{article.source}{" "}
					{article.publishedAt && `• ${new Date(article.publishedAt).toLocaleDateString()}`}
				</CardFooter>
			)}
		</Card>
	);
};

export default ArticleCardLocal;
