import React from "react";
import { Article } from "../types";
import ArticleCard from "./ArticleCard";

interface ArticlesGridProps {
  articles: Article[];
  onDelete: (id: string) => void;
}

const ArticlesGrid: React.FC<ArticlesGridProps> = ({ articles, onDelete }) => {
  if (articles.length === 0) {
    return <p className="text-gray-500">No articles found</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {articles.map((a) => (
        <ArticleCard key={a.id} article={a} onDelete={onDelete} />
      ))}
    </div>
  );
};

export default ArticlesGrid;