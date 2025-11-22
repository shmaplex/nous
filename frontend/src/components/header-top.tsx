import type React from "react";
import { LocationSelector } from "./location-selector";
import { TimeDisplay } from "./time-display";

interface HeaderTopProps {
	selectedLocation: string;
	onLocationChange: (value: string) => void;
}

const HeaderTop: React.FC<HeaderTopProps> = ({ selectedLocation, onLocationChange }) => {
	return (
		<div className="flex justify-between items-center px-4 py-2 bg-card text-card-foreground dark:bg-card-dark dark:text-card-foreground rounded-xl shadow-md w-full flex-wrap mb-4">
			{/* Current time display */}
			<TimeDisplay className="text-sm opacity-75" />

			{/* Location selector using ShadCN */}
			<LocationSelector selectedEdition={selectedLocation} onEditionChange={onLocationChange} />
		</div>
	);
};

export default HeaderTop;
