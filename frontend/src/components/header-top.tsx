import type React from "react";
import logo from "../assets/images/logo-universal.png";
import { LocationSelector } from "./location-selector";
import { TimeDisplay } from "./time-display";

interface HeaderTopProps {
	selectedLocation: string;
	onLocationChange: (value: string) => void;
}

const HeaderTop: React.FC<HeaderTopProps> = ({ selectedLocation, onLocationChange }) => {
	return (
		<div className="sticky top-0 left-0 flex items-center px-4 py-3 bg-card text-card-foreground rounded-b-xl shadow-md w-full flex-wrap mb-4 z-infinity">
			{/* Left: Current time */}
			<div className="flex-1">
				<TimeDisplay className="text-xs opacity-75" />
			</div>

			{/* Center: Logo */}
			<div className="absolute left-1/2 transform -translate-x-1/2">
				<img src={logo} alt="Nous" className="h-10 w-10 rounded-md" />
			</div>

			{/* Right: Location selector */}
			<div className="flex-1 flex justify-end">
				<LocationSelector selectedEdition={selectedLocation} onEditionChange={onLocationChange} />
			</div>
		</div>
	);
};

export default HeaderTop;
