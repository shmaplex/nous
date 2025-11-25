import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { SourceWithHidden } from "@/types";
// import { BrowserOpenURL } from "../../../../wailsjs/runtime/runtime";
import { OpenURL } from "../../../../wailsjs/go/main/App";
import SourceField from "./source-field";
import SourceHeader from "./source-header";
import SourceSelect from "./source-select";
import SourceSwitch from "./source-switch";
import SourceTextDisplay from "./source-text-display";

interface Props {
	source: SourceWithHidden;
	index: number;
	onUpdate: (index: number, key: keyof SourceWithHidden, value: any) => void;
	onToggleHidden: (index: number) => void;
	onDelete: (index: number) => void;
	isNew?: boolean;
}

const CATEGORY_OPTIONS = ["news", "blog", "rss", "social", "podcast", "tech"];
const LANGUAGE_OPTIONS = ["en", "ko", "es", "fr", "de", "zh"];
const REGION_OPTIONS = ["US", "KR", "EU", "ASIA", "GLOBAL"];
const AUTH_TYPE_OPTIONS = ["none", "apiKey", "bearerToken", "oauth"];

export const SourceItem: React.FC<Props> = ({
	source,
	index,
	onUpdate,
	onToggleHidden,
	onDelete,
	isNew = false,
}) => {
	const [showApiKey, setShowApiKey] = useState(false);

	const handleOpenURL = (url?: string) => {
		if (!url) return;
		// TODO: Look into replacing with BrowserOpenURL
		OpenURL(url).catch((err: any) => console.error("Failed to open URL:", err));
	};

	const isEditable = isNew || !source.isDefault || source.requiresApiKey;

	return (
		<div
			className={`flex flex-col gap-4 p-4 border rounded-xl shadow-md bg-background transition-opacity duration-300 ${source.hidden ? "opacity-50" : "opacity-100"}`}
		>
			<SourceHeader
				source={source}
				index={index}
				onToggleHidden={onToggleHidden}
				onDelete={onDelete}
			/>

			<div className="flex flex-col gap-3">
				{isEditable ? (
					<>
						<SourceField
							label="Name"
							value={source.name}
							onChange={(v) => onUpdate(index, "name", v)}
							disabled={source.hidden}
						/>
						<SourceField
							label="Endpoint"
							value={source.endpoint}
							onChange={(v) => onUpdate(index, "endpoint", v)}
							disabled={source.hidden}
						/>
						{source.requiresApiKey && (
							<SourceField
								label="API Key"
								value={source.apiKey || ""}
								onChange={(v) => onUpdate(index, "apiKey", v)}
								disabled={source.hidden}
								type={showApiKey ? "text" : "password"}
								extra={
									<Button
										variant="link"
										className="text-xs flex gap-1 p-0"
										onClick={() => setShowApiKey(!showApiKey)}
									>
										{showApiKey ? "Hide" : "Show"}
									</Button>
								}
							/>
						)}
						<SourceField
							label="Instructions"
							value={source.instructions || ""}
							placeholder={
								source.instructions || "e.g., Sign up for an API key and replace YOUR_KEY..."
							}
							onChange={(v) => onUpdate(index, "instructions", v)}
							disabled={source.hidden}
						/>
						<SourceField
							label="API Docs Link"
							value={source.apiLink || ""}
							onChange={(v) => onUpdate(index, "apiLink", v)}
							disabled={source.hidden}
							extra={
								source.apiLink && (
									<Button
										variant="link"
										className="text-xs flex gap-1 p-0"
										onClick={() => handleOpenURL(source.apiLink)}
									>
										Open Docs <ExternalLink size={14} />
									</Button>
								)
							}
						/>
						<div className="grid grid-cols-2 gap-4">
							<SourceSelect
								label="Category"
								value={source.category || ""}
								options={CATEGORY_OPTIONS}
								onChange={(v) => onUpdate(index, "category", v)}
								disabled={source.hidden}
							/>
							<SourceSelect
								label="Language"
								value={source.language || ""}
								options={LANGUAGE_OPTIONS}
								onChange={(v) => onUpdate(index, "language", v)}
								disabled={source.hidden}
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<SourceSelect
								label="Region"
								value={source.region || ""}
								options={REGION_OPTIONS}
								onChange={(v) => onUpdate(index, "region", v)}
								disabled={source.hidden}
							/>
							<SourceSelect
								label="Auth Type"
								value={source.authType || "none"}
								options={AUTH_TYPE_OPTIONS}
								onChange={(v) => onUpdate(index, "authType", v)}
								disabled={source.hidden}
							/>
						</div>

						<SourceField
							label="Rate Limit / Minute"
							value={source.rateLimitPerMinute?.toString() || "60"}
							onChange={(v) => onUpdate(index, "rateLimitPerMinute", Number(v))}
							disabled={source.hidden}
						/>
						<div className="grid grid-cols-2 gap-4">
							<SourceSwitch
								checked={source.pinned ?? false}
								onCheckedChange={(checked) => onUpdate(index, "pinned", checked)}
								disabled={source.hidden}
								label="Pinned"
							/>
							<SourceSwitch
								checked={source.enabled ?? true}
								onCheckedChange={(checked) => onUpdate(index, "enabled", checked)}
								disabled={source.hidden}
								label="Enabled"
							/>
						</div>
					</>
				) : (
					<>
						<SourceTextDisplay label="Name" value={source.name || "-"} />
						<SourceTextDisplay label="Endpoint" value={source.endpoint} />
						<SourceTextDisplay label="Instructions" value={source.instructions || "-"} muted />
						<SourceTextDisplay
							label="API Docs Link"
							value={source.apiLink || "-"}
							extra={
								source.apiLink && (
									<Button
										variant="link"
										className="text-xs flex gap-1 p-0"
										onClick={() => handleOpenURL(source.apiLink)}
									>
										Open Docs <ExternalLink size={14} />
									</Button>
								)
							}
							muted
						/>
						{source.requiresApiKey && (
							<SourceField
								label="API Key"
								value={source.apiKey || ""}
								onChange={(v) => onUpdate(index, "apiKey", v)}
								disabled={source.hidden || !isEditable}
								type="password"
								showToggle={true} // enables the eye icon
							/>
						)}
						<SourceSwitch
							checked={source.enabled ?? true}
							onCheckedChange={(checked) => onUpdate(index, "enabled", checked)}
							disabled={source.hidden}
						/>
					</>
				)}
			</div>
		</div>
	);
};

export default SourceItem;
