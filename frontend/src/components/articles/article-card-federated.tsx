// frontend/src/components/articles/article-card-federated.tsx
import type React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { ArticleFederated } from "../../types";

interface Props {
	article: ArticleFederated;
}

const ArticleCardFederated: React.FC<Props> = ({ article }) => {
	const openIpfs = () => {
		if (article.cid) window.open(`https://ipfs.io/ipfs/${article.cid}`, "_blank");
	};

	return (
		<Card
			className="flex flex-col shadow-md rounded-lg cursor-pointer hover:shadow-lg transition-shadow duration-200"
			onClick={openIpfs}
		>
			<CardHeader>
				<CardTitle className="text-lg font-semibold line-clamp-2">Federated Article</CardTitle>
			</CardHeader>

			<CardContent className="text-sm text-muted-foreground">
				<p>CID: {article.cid}</p>
				{article.source && <p>Source: {article.source}</p>}
				{article.edition && <p>Edition: {article.edition}</p>}
			</CardContent>

			<CardFooter className="text-xs text-muted-foreground">
				<p>Last updated: {new Date(article.timestamp).toLocaleDateString()}</p>
			</CardFooter>
		</Card>
	);
};

export default ArticleCardFederated;
