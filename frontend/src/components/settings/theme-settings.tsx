import { useContext } from "react";
import { Button } from "@/components/ui/button";
import { ThemeContext } from "../../context/ThemeContext";

const ThemeSettings: React.FC = () => {
	const { theme, setTheme } = useContext(ThemeContext);

	return (
		<div className="mb-6">
			<h3 className="mb-2 font-medium">Theme Mode</h3>
			<div className="flex flex-wrap">
				{["auto", "light", "dark"].map((mode) => (
					<Button
						key={mode}
						variant={theme === mode ? "default" : "outline"}
						className="mr-2 mb-2"
						onClick={() => setTheme(mode as "auto" | "light" | "dark")}
					>
						{mode.charAt(0).toUpperCase() + mode.slice(1)}
					</Button>
				))}
			</div>
		</div>
	);
};

export default ThemeSettings;
