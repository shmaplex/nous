import { FileText } from "lucide-react"; // Lucide icon
import type React from "react";

interface PlaceholderProps {
	message?: string;
}

const Placeholder: React.FC<PlaceholderProps> = ({ message }) => {
	return (
		<div className="flex flex-col items-center justify-center h-64 rounded-xl border border-border bg-card text-card-foreground dark:bg-card-dark dark:text-card-foreground shadow-md p-6 text-center">
			<FileText className="w-12 h-12 mb-4 text-accent" />
			<p className="text-lg font-semibold mb-2">{message || "No articles available yet."}</p>
			<p className="text-sm text-muted-foreground max-w-xs">
				Articles you save or sync from your sources will appear here. Start by adding a new article
				to see it listed.
			</p>
		</div>
	);
};

export default Placeholder;
