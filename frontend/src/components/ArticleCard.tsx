import React from "react";
import { Article } from "../types";

interface ArticleCardProps {
  article: Article;
  onDelete: (id: string) => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onDelete }) => {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">{article.title}</h3>
        <button
          onClick={() => onDelete(article.id)}
          className="text-red-500 hover:text-red-700"
        >
          ✕
        </button>
      </div>

      <p className="text-gray-700 mb-2">{article.content}</p>

      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent hover:underline break-all"
      >
        {article.url}
      </a>
    </div>
  );
};

export default ArticleCard;