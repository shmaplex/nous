import { Button } from "@/components/ui/button";

const NetworkSettings: React.FC = () => {
	const showPeerID = () => alert("Your Peer ID: QmXYZ123... (stub)");
	const toggleSync = () => alert("Sync toggled (stub)");

	return (
		<div className="mb-6">
			<h3 className="mb-2 font-medium">Network / P2P</h3>
			<div className="flex flex-wrap">
				<Button className="mr-2 mb-2" onClick={showPeerID}>
					Show Peer ID
				</Button>
				<Button className="mr-2 mb-2" onClick={toggleSync}>
					Toggle Sync
				</Button>
			</div>
		</div>
	);
};

export default NetworkSettings;
