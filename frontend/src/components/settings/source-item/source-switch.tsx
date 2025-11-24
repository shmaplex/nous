import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface SourceSwitchProps {
	checked: boolean;
	label?: string;
	onCheckedChange: (checked: boolean) => void;
	disabled?: boolean;
}

const SourceSwitch: React.FC<SourceSwitchProps> = ({
	checked,
	label = "Enabled",
	onCheckedChange,
	disabled,
}) => {
	return (
		<div className="flex items-center gap-2 mt-2">
			<Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
			<Label className="text-sm">{label}</Label>
		</div>
	);
};

export default SourceSwitch;
