import { Eye, EyeOff } from "lucide-react";
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SourceFieldProps {
	label: string;
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
	placeholder?: string;
	type?: "text" | "number" | "password" | "url";
	showToggle?: boolean; // optional show/hide toggle for password
}

const SourceField: React.FC<SourceFieldProps> = ({
	label,
	value,
	onChange,
	disabled = false,
	type = "text",
	placeholder = "",
	showToggle = false,
}) => {
	const [showValue, setShowValue] = React.useState(false);

	const isPasswordType = type === "password";

	return (
		<div className="flex flex-col gap-1 relative">
			<Label className="text-xs font-medium pb-1">{label}</Label>
			<div className="relative">
				<Input
					type={isPasswordType && !showValue ? "password" : "text"}
					placeholder={placeholder || label || ""}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					disabled={disabled}
					className={`text-sm p-2 rounded-md ${showToggle ? "pr-10" : ""}`}
				/>
				{showToggle && isPasswordType && (
					<button
						type="button"
						onClick={() => setShowValue(!showValue)}
						className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
					>
						{showValue ? <EyeOff size={16} /> : <Eye size={16} />}
					</button>
				)}
			</div>
		</div>
	);
};

export default SourceField;
