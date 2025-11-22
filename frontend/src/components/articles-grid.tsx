import type React from "react";
import type { Article } from "../types";
import ArticleCard from "./article-card";

interface ArticlesGridProps {
	articles: Article[];
	onArchive?: (id: string) => void;
}

const ArticlesGrid: React.FC<ArticlesGridProps> = ({ articles, onArchive }) => {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
			{articles.map((article) => (
				<ArticleCard
					key={article.id ?? Math.random().toString(36).slice(2, 11)}
					article={article}
					onArchive={onArchive}
				/>
			))}
		</div>
	);
};

export default ArticlesGrid;
