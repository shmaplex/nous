import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogPortal,
	DialogTitle,
} from "@/components/ui/dialog";
import NetworkSettings from "./settings/network-settings";
import SourcesSettings from "./settings/sources-settings";
import StorageSettings from "./settings/storage-settings";
import ThemeSettings from "./settings/theme-settings";

interface SettingsPanelProps {
	isOpen: boolean;
	onClose: () => void;
}

const SECTIONS = ["Theme", "Network", "Storage", "News Sources"] as const;
type Section = (typeof SECTIONS)[number];

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
	const [activeSection, setActiveSection] = useState<Section>("Theme");

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogPortal>
				{/* Full-screen overlay */}
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
					{/* Scalable grid panel: sidebar + content */}
					<DialogContent className="grid grid-cols-[220px_minmax(0,1fr)] w-full max-w-[95vw] h-[90vh] bg-background text-foreground rounded-xl shadow-lg overflow-hidden">
						{/* Sidebar */}
						<nav className="flex flex-col border-r border-border p-6 gap-3">
							{SECTIONS.map((section) => (
								<Button
									key={section}
									variant={activeSection === section ? "default" : "outline"}
									className="text-left"
									onClick={() => setActiveSection(section)}
								>
									{section}
								</Button>
							))}
						</nav>

						{/* Main content */}
						<div className="flex flex-col overflow-y-auto p-6">
							<DialogHeader>
								<DialogTitle>{activeSection} Settings</DialogTitle>
							</DialogHeader>

							<div className="mt-4 flex-1 overflow-y-auto">
								{activeSection === "Theme" && <ThemeSettings />}
								{activeSection === "Network" && <NetworkSettings />}
								{activeSection === "Storage" && <StorageSettings />}
								{activeSection === "News Sources" && <SourcesSettings />}
							</div>
						</div>
					</DialogContent>
				</div>
			</DialogPortal>
		</Dialog>
	);
};

export default SettingsPanel;
