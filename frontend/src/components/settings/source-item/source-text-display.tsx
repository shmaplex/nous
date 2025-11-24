import { Label } from "@/components/ui/label";

interface SourceTextDisplayProps {
	label: string;
	value: string;
	extra?: React.ReactNode;
	muted?: boolean;
}

const SourceTextDisplay: React.FC<SourceTextDisplayProps> = ({ label, value, extra, muted }) => {
	return (
		<div className="flex flex-col gap-1">
			<Label className="text-xs font-medium">{label}</Label>
			<div
				className={`text-sm flex items-center justify-between ${muted ? "text-muted-foreground opacity-80" : ""}`}
			>
				<span>{value}</span>
				{extra}
			</div>
		</div>
	);
};

export default SourceTextDisplay;
