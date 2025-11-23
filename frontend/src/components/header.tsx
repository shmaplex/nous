import type React from "react";

interface HeaderProps {
	location: string;
}

const Header: React.FC<HeaderProps> = () => {
	return (
		<header className="flex flex-col space-y-4 mb-6">
			{/* Logo and title */}
			<div className="flex items-center space-x-4">
				{/* <img src={logo} alt="Nous" className="h-12 w-12 rounded-md shadow-sm" /> */}
				<h1 className="text-2xl font-serif font-bold text-card-foreground dark:text-card-dark">
					News Dashboard
				</h1>
			</div>
		</header>
	);
};

export default Header;
