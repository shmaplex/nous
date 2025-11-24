import { Eye, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SourceWithHidden } from "@/lib/sources";

interface SourceHeaderProps {
	source: SourceWithHidden;
	index: number;
	onToggleHidden: (index: number) => void;
	onDelete: (index: number) => void;
}

const SourceHeader: React.FC<SourceHeaderProps> = ({ source, index, onToggleHidden, onDelete }) => {
	return (
		<div className="flex justify-between items-center">
			<span className="font-semibold text-lg">{source.name || "Unnamed Source"}</span>
			<div className="flex items-center gap-2">
				<Button
					variant="ghost"
					size="icon"
					onClick={() => onToggleHidden(index)}
					title={source.hidden ? "Unhide Source" : "Hide Source"}
				>
					{source.hidden ? <Eye size={16} /> : <EyeOff size={16} />}
				</Button>
				{!source.isDefault && (
					<Button
						variant="ghost"
						size="icon"
						onClick={() => onDelete(index)}
						className="text-red-600 hover:bg-red-100"
						title="Delete Source"
					>
						<Trash2 size={16} />
					</Button>
				)}
			</div>
		</div>
	);
};

export default SourceHeader;
