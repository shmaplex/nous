import type React from "react";
import logo from "../assets/images/logo-universal.png";
import HeaderTop from "./header-top";

interface HeaderProps {
	location: string;
	onLocationChange: (val: string) => void;
	onUpdateLocation?: () => void; // optional if using top selector
}

const Header: React.FC<HeaderProps> = ({ location, onLocationChange }) => {
	return (
		<header className="flex flex-col space-y-4 mb-6">
			{/* Top bar with time + location selector */}
			<HeaderTop selectedLocation={location} onLocationChange={onLocationChange} />

			{/* Logo and title */}
			<div className="flex items-center space-x-4">
				<img src={logo} alt="Nous" className="h-12 w-12 rounded-md shadow-sm" />
				<h1 className="text-2xl font-serif font-bold text-card-foreground dark:text-card-dark">
					Nous - P2P News Dashboard
				</h1>
			</div>
		</header>
	);
};

export default Header;
