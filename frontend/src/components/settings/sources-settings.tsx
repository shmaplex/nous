import { ExternalLink, Eye, EyeOff, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_SOURCES } from "@/constants/sources";
import { loadSources, saveSources as saveSourcesToBackend } from "@/lib/sources";
import type { Source } from "@/types/sources";
import { OpenURL } from "../../../wailsjs/go/main/App";

interface SourceWithHidden extends Source {
	hidden?: boolean;
	isDefault?: boolean; // mark default sources
}

const SourcesSettings: React.FC = () => {
	const [sources, setSources] = useState<SourceWithHidden[]>([]);

	useEffect(() => {
		async function init() {
			const loadedSources = await loadSources();
			const combined = (loadedSources.length > 0 ? loadedSources : DEFAULT_SOURCES).map((s) => ({
				...s,
				isDefault: DEFAULT_SOURCES.some((d) => d.name === s.name && d.url === s.url),
			}));
			setSources(combined);
		}
		init();
	}, []);

	const saveSources = async (updated: SourceWithHidden[]) => {
		setSources(updated);
		try {
			await saveSourcesToBackend(
				updated.map((s) => ({
					name: s.name,
					url: s.url,
					instructions: s.instructions,
					apiLink: s.apiLink,
				})),
			);
		} catch (err) {
			console.error("Failed to save sources:", err);
		}
	};

	const updateSource = (index: number, key: keyof Source, value: string) => {
		const updated = [...sources];
		updated[index][key] = value;
		saveSources(updated);
	};

	const addSource = () => {
		const newSource: SourceWithHidden = {
			name: "New Source",
			url: "",
			instructions: "",
			apiLink: "",
			isDefault: false,
		};
		saveSources([...sources, newSource]);
	};

	const toggleHidden = (index: number) => {
		const updated = [...sources];
		updated[index].hidden = !updated[index].hidden;
		saveSources(updated);
	};

	const deleteSource = (index: number) => {
		const updated = [...sources];
		if (updated[index].isDefault) return; // safeguard
		updated.splice(index, 1);
		saveSources(updated);
	};

	const handleOpenURL = (url: string) => {
		if (!url) return;
		OpenURL(url).catch((err: any) => console.error("Failed to open URL:", err));
	};

	return (
		<div className="flex flex-col gap-6">
			{sources.map((source, idx) => (
				<div
					key={idx}
					className={`flex flex-col gap-3 p-4 border rounded-lg shadow-sm bg-background relative transition-opacity duration-300 group ${
						source.hidden ? "opacity-50" : "opacity-100"
					}`}
				>
					<div className="flex justify-between items-center gap-2">
						<Label className="font-semibold text-lg">{source.name || "Unnamed Source"}</Label>
						<div className="flex gap-1">
							<Button
								variant="ghost"
								size="icon"
								onClick={() => toggleHidden(idx)}
								className="p-1 hover:bg-muted rounded"
								title={source.hidden ? "Unhide Source" : "Hide Source"}
							>
								{source.hidden ? <Eye size={16} /> : <EyeOff size={16} />}
							</Button>
							{!source.isDefault && (
								<Button
									variant="ghost"
									size="icon"
									onClick={() => deleteSource(idx)}
									className="p-1 hover:bg-red-100 text-red-600 rounded"
									title="Delete Source"
								>
									<Trash2 size={16} />
								</Button>
							)}
						</div>
					</div>

					{/* Name */}
					<div className="flex flex-col gap-1">
						<Label className="text-sm">Name</Label>
						<Input
							placeholder="Source Name"
							value={source.name}
							onChange={(e) => updateSource(idx, "name", e.target.value)}
							disabled={source.hidden}
						/>
					</div>

					{/* URL */}
					<div className="flex flex-col gap-1">
						<Label className="text-sm">URL (RSS/API)</Label>
						<Input
							placeholder="Source URL"
							value={source.url}
							onChange={(e) => updateSource(idx, "url", e.target.value)}
							disabled={source.hidden}
						/>
					</div>

					{/* Instructions */}
					<div className="flex flex-col gap-1">
						<Label className="text-sm">Instructions (optional)</Label>
						<Input
							placeholder="Instructions"
							value={source.instructions || ""}
							onChange={(e) => updateSource(idx, "instructions", e.target.value)}
							disabled={source.hidden}
						/>
					</div>

					{/* API Docs */}
					<div className="flex flex-col gap-1 relative inline-block group">
						<Label className="text-sm">API Documentation Link (optional)</Label>
						<Input
							placeholder="API Link"
							value={source.apiLink || ""}
							onChange={(e) => updateSource(idx, "apiLink", e.target.value)}
							disabled={source.hidden}
						/>
						{source.apiLink && (
							<Button
								variant="link"
								className="text-xs text-accent underline flex items-center gap-1 z-20 relative p-0 mt-1"
								onClick={() => handleOpenURL(source.apiLink!)}
							>
								Open API Docs <ExternalLink size={12} />
							</Button>
						)}
					</div>
				</div>
			))}

			<Button className="mt-4" onClick={addSource}>
				Add New Source
			</Button>
		</div>
	);
};

export default SourcesSettings;
