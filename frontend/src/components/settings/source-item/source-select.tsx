import type * as React from "react";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface SourceSelectProps {
	label: string;
	value: string;
	options: string[];
	onChange: (value: string) => void;
	disabled?: boolean;
}

const SourceSelect: React.FC<SourceSelectProps> = ({
	label,
	value,
	options,
	onChange,
	disabled,
}) => {
	return (
		<div className="flex flex-col gap-1 w-full">
			<Label className="text-xs font-medium pb-1">{label}</Label>
			<Select value={value} onValueChange={onChange} disabled={disabled}>
				<SelectTrigger className="text-sm p-2 rounded-md border w-full">
					<SelectValue placeholder={`Select ${label}`} />
				</SelectTrigger>
				<SelectContent>
					{options.map((opt) => (
						<SelectItem key={opt} value={opt}>
							{opt}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
};

export default SourceSelect;
