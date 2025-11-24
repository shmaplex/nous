// frontend/src/components/articles/article-card-analyzed.tsx
import { Archive } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { ArticleAnalyzed, CognitiveBias } from "../../types";
import BiasBar from "../bias-bar";

interface Props {
	article: ArticleAnalyzed;
	onArchive?: (id: string) => void;
}

const biasColorMap: Record<string, string> = {
	left: "border-bias-left bg-bias-left/10 text-bias-left",
	center: "border-bias-center bg-bias-center/10 text-bias-center",
	right: "border-bias-right bg-bias-right/10 text-bias-right",
	none: "border-bias-none bg-bias-none/10 text-bias-none",
};

const ArticleCardAnalyzed: React.FC<Props> = ({ article, onArchive }) => {
	const openUrl = () => article.url && window.open(article.url, "_blank");

	const handleArchive = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (onArchive) onArchive(article.id);
	};

	const politicalBiasKey = article.politicalBias?.toLowerCase() || "none";

	return (
		<Card
			className={`flex flex-col border-t-4 shadow-md rounded-lg cursor-pointer hover:shadow-lg transition-shadow duration-200 ${biasColorMap[politicalBiasKey]}`}
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

			<CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
				<p className="line-clamp-5">{article.content}</p>

				{/* Bias bar (only if BiasBar component can handle undefined values) */}
				{article.politicalBias && <BiasBar bias={politicalBiasKey} />}

				{/* Categories, tags, antithesis, philosophical */}
				<div className="flex flex-wrap gap-2">
					{article.category && (
						<span className="text-xs uppercase tracking-wide font-medium text-muted-foreground">
							{article.category}
						</span>
					)}
					{article.tags?.map((tag) => (
						<span key={tag} className="text-xs bg-muted/20 px-2 py-0.5 rounded-full">
							{tag}
						</span>
					))}
					{article.antithesis && (
						<span className="text-xs italic text-secondary">Antithesis: {article.antithesis}</span>
					)}
					{article.philosophical && (
						<span className="text-xs italic text-secondary">
							Philosophical: {article.philosophical}
						</span>
					)}
				</div>

				{/* Cognitive biases */}
				{article.cognitiveBiases?.length ? (
					<div className="mt-2">
						<span className="text-xs font-semibold">Detected Biases:</span>
						<ul className="text-xs list-disc list-inside">
							{article.cognitiveBiases.map((bias: CognitiveBias, idx) => (
								<li key={idx}>
									<b>{bias.bias}</b>: {bias.snippet}{" "}
									{bias.severity && <span className="italic">({bias.severity})</span>}
								</li>
							))}
						</ul>
					</div>
				) : null}
			</CardContent>

			{/* Footer: source, author, date, sentiment */}
			{article.source || article.author || article.publishedAt || article.sentiment ? (
				<CardFooter className="text-xs text-muted-foreground flex flex-wrap justify-between items-center gap-1">
					<div className="flex flex-wrap gap-2 items-center">
						{article.source && <span>{article.source}</span>}
						{article.author && <span>• {article.author}</span>}
						{article.publishedAt && (
							<span>• {new Date(article.publishedAt).toLocaleDateString()}</span>
						)}
						{article.sentiment && <span>• Sentiment: {article.sentiment}</span>}
					</div>
				</CardFooter>
			) : null}
		</Card>
	);
};

export default ArticleCardAnalyzed;
