import { Archive } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Article } from "../types";
import BiasBar from "./bias-bar";

interface ArticleCardProps {
	article: Article;
	onArchive?: (id: string) => void;
}

const biasColorMap: Record<string, string> = {
	left: "border-bias-left bg-bias-left/10 text-bias-left",
	center: "border-bias-center bg-bias-center/10 text-bias-center",
	right: "border-bias-right bg-bias-right/10 text-bias-right",
	none: "border-bias-none bg-bias-none/10 text-bias-none",
};

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onArchive }) => {
	const handleArchive = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (onArchive && article.id) onArchive(article.id);
	};

	const openUrl = () => {
		if (article.url) window.open(article.url, "_blank");
	};

	const biasKey = article.bias?.toLowerCase() || "none";

	return (
		<Card
			className={`
				flex flex-col border-t-4 shadow-md rounded-lg cursor-pointer
				hover:shadow-lg transition-shadow duration-200
				${biasColorMap[biasKey]}
			`}
			onClick={openUrl}
		>
			<CardHeader className="flex justify-between items-start">
				<CardTitle className="text-lg font-semibold line-clamp-2">{article.title}</CardTitle>

				{onArchive && article.id && (
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

			<CardContent className="text-muted-foreground flex flex-col gap-2">
				<p className="line-clamp-4">{article.content}</p>

				{/* {article.bias && (
					<span className={`text-sm font-medium ${biasColorMap[biasKey]}`}>
						Bias: {article.bias}
					</span>
				)} */}
				<BiasBar left={3} center={2} right={5} none={1} />
				{article.antithesis && (
					<span className="text-sm text-secondary font-medium">
						Antithesis: {article.antithesis}
					</span>
				)}
				{article.philosophical && (
					<span className="text-sm text-secondary font-medium">
						Philosophical: {article.philosophical}
					</span>
				)}
				{article.category && (
					<span className="text-xs text-muted-foreground uppercase tracking-wide">
						Category: {article.category}
					</span>
				)}
				{article.tags && article.tags.length > 0 && (
					<div className="flex flex-wrap gap-1">
						{article.tags.map((tag) => (
							<span key={tag} className="text-xs bg-muted/30 px-2 py-0.5 rounded-full">
								{tag}
							</span>
						))}
					</div>
				)}
			</CardContent>

			{(article.source || article.publishedAt || article.author || article.sentiment) && (
				<CardFooter className="text-sm text-muted-foreground flex flex-wrap gap-2 justify-between items-center">
					<div className="flex flex-wrap gap-1">
						{article.source && <span>{article.source}</span>}
						{article.author && <span>• {article.author}</span>}
						{article.publishedAt && (
							<span>• {new Date(article.publishedAt).toLocaleDateString()}</span>
						)}
						{article.sentiment && <span>• Sentiment: {article.sentiment}</span>}
					</div>
				</CardFooter>
			)}
		</Card>
	);
};

export default ArticleCard;
