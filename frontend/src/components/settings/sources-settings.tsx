import { useEffect, useState } from "react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { SourceItem } from "./source-item";
import { initSources, type SourceWithHidden, saveSources } from "./utils/sources";

export const SourcesSettings: React.FC = () => {
	const [sources, setSources] = useState<SourceWithHidden[]>([]);
	const [expandedCustomId, setExpandedCustomId] = useState<string | null>(null);

	useEffect(() => {
		initSources().then(setSources);
	}, []);

	const handleSave = (updated: SourceWithHidden[]) => {
		setSources(updated);
		saveSources(updated);
	};

	const handleUpdate = (index: number, key: keyof SourceWithHidden, value: string | boolean) => {
		const updated = [...sources];
		(updated[index] as any)[key] = value;

		// Only auto-toggle hidden for sources that do NOT require an API key
		if (!updated[index].requiresApiKey) {
			updated[index].hidden = !(updated[index].enabled ?? true);
		}

		// Do NOT force enable/disable when typing API key
		// if (key === "apiKey" && updated[index].requiresApiKey) {
		//   (updated[index] as any).enabled = !!value;
		//   updated[index].hidden = false;
		// }

		handleSave(updated);
	};

	const handleToggleHidden = (index: number) => {
		const updated = [...sources];
		updated[index].hidden = !updated[index].hidden;
		handleSave(updated);
	};

	const handleDelete = (index: number) => {
		const updated = [...sources];
		if (updated[index].isDefault) return;
		updated.splice(index, 1);
		handleSave(updated);

		if (expandedCustomId === `custom-${index}`) setExpandedCustomId(null);
	};

	const handleAddSource = (requiresApiKey = false) => {
		const newSource: SourceWithHidden = {
			name: "",
			endpoint: "",
			apiKey: "",
			instructions: "",
			apiLink: "",
			enabled: true,
			requiresApiKey,
			hidden: false,
			isDefault: false,
		};
		const updatedSources = [...sources, newSource];
		handleSave(updatedSources);

		// Expand newly added custom source
		setExpandedCustomId(`custom-${updatedSources.length - 1}`);
	};

	// Separate sources
	const apiKeySources = sources
		.map((s, idx) => ({ source: s, index: idx }))
		.filter((x) => x.source.requiresApiKey && x.source.isDefault);

	const noKeySources = sources
		.map((s, idx) => ({ source: s, index: idx }))
		.filter((x) => !x.source.requiresApiKey && x.source.isDefault);

	const customSources = sources
		.map((s, idx) => ({ source: s, index: idx }))
		.filter((x) => !x.source.isDefault);

	return (
		<div className="flex flex-col gap-4">
			<Accordion type="single" collapsible className="pr-4">
				{/* Sources That Require API Key */}
				<AccordionItem value="requiresApiKey">
					<AccordionTrigger>Sources That Require API Key ({apiKeySources.length})</AccordionTrigger>
					<AccordionContent className="flex flex-col gap-2 mt-2">
						{apiKeySources.map(({ source, index }) => (
							<SourceItem
								key={index}
								source={source}
								index={index}
								onUpdate={handleUpdate}
								onToggleHidden={handleToggleHidden}
								onDelete={handleDelete}
							/>
						))}
					</AccordionContent>
				</AccordionItem>

				{/* Sources That Don’t Require API Key */}
				<AccordionItem value="noApiKey">
					<AccordionTrigger>
						Sources That Don’t Require API Key ({noKeySources.length})
					</AccordionTrigger>
					<AccordionContent className="flex flex-col gap-2 mt-2">
						{noKeySources.map(({ source, index }) => (
							<SourceItem
								key={index}
								source={source}
								index={index}
								onUpdate={handleUpdate}
								onToggleHidden={handleToggleHidden}
								onDelete={handleDelete}
							/>
						))}
					</AccordionContent>
				</AccordionItem>

				{/* Custom Sources */}
				<AccordionItem value="customSources">
					<AccordionTrigger>Custom Sources ({customSources.length})</AccordionTrigger>
					<AccordionContent className="flex flex-col gap-2 mt-2">
						{customSources.map(({ source, index }) => (
							<SourceItem
								key={index}
								source={source}
								index={index}
								onUpdate={handleUpdate}
								onToggleHidden={handleToggleHidden}
								onDelete={handleDelete}
								isNew={true}
							/>
						))}

						{/* Add new buttons inside Custom Sources */}
						<div className="flex gap-2 mt-2">
							<Button onClick={() => handleAddSource(true)}>Add New API Key Source</Button>
							<Button onClick={() => handleAddSource(false)}>Add New Public Source</Button>
						</div>
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</div>
	);
};

export default SourcesSettings;
