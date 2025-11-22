// src/components/SourcesSettings.tsx
import { ExternalLink, Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_SOURCES } from "@/constants/sources";
import { loadSources, saveSources as saveSourcesToBackend } from "@/lib/sources";
import type { Source } from "@/types/sources";

// Import Wails OpenURL function
import { OpenURL } from "../../../wailsjs/go/main/App";

interface SourceWithHidden extends Source {
	hidden?: boolean;
}

const SourcesSettings: React.FC = () => {
	const [sources, setSources] = useState<SourceWithHidden[]>([]);

	useEffect(() => {
		async function init() {
			const loadedSources = await loadSources();
			setSources(loadedSources.length > 0 ? loadedSources : DEFAULT_SOURCES);
		}
		init();
	}, []);

	const saveSources = async (updated: SourceWithHidden[]) => {
		setSources(updated);
		try {
			await saveSourcesToBackend(updated);
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
		const newSource: SourceWithHidden = { name: "New Source", url: "" };
		saveSources([...sources, newSource]);
	};

	const toggleHidden = (index: number) => {
		const updated = [...sources];
		updated[index].hidden = !updated[index].hidden;
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
						<Label className="font-semibold text-lg">{source.name}</Label>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => toggleHidden(idx)}
							className="p-1 hover:bg-muted rounded"
							title={source.hidden ? "Unhide Source" : "Hide Source"}
						>
							{source.hidden ? <Eye size={16} /> : <EyeOff size={16} />}
						</Button>
					</div>

					<div className="flex flex-col gap-1">
						<Label className="text-sm">URL (RSS/API)</Label>
						<Input
							placeholder="Source URL"
							value={source.url}
							onChange={(e) => updateSource(idx, "url", e.target.value)}
							className="w-full"
							disabled={source.hidden}
						/>
					</div>

					{source.instructions && (
						<span className="text-xs text-muted-foreground">{source.instructions}</span>
					)}

					{source.apiLink && (
						<div className="relative inline-block group">
							<Button
								variant="link"
								className="text-xs text-accent underline flex items-center gap-1 z-20 relative p-0"
								onClick={() => handleOpenURL(source.apiLink!)}
							>
								API Docs <ExternalLink size={12} />
							</Button>
							<div className="absolute left-0 top-full mt-1 opacity-0 group-hover:opacity-100 transition-opacity bg-muted rounded shadow-md px-2 py-1 text-xs whitespace-nowrap z-10 pointer-events-none">
								{source.apiLink}
							</div>
						</div>
					)}
				</div>
			))}

			<Button className="mt-4" onClick={addSource}>
				Add New Source
			</Button>
		</div>
	);
};

export default SourcesSettings;
