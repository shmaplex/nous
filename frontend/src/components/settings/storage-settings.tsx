import { Button } from "@/components/ui/button";

const StorageSettings: React.FC = () => {
	const purgeCache = () => alert("Local cache purged (stub)");

	return (
		<div className="mb-6">
			<h3 className="mb-2 font-medium">Local Storage</h3>
			<Button variant="destructive" onClick={purgeCache}>
				Purge Local Cache
			</Button>
		</div>
	);
};

export default StorageSettings;
