import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(() => {
	const port = Number.parseInt(process.env.VITE_PORT || "5173", 10);

	return {
		server: {
			host: "localhost",
			port,
			hmr: {
				host: "localhost",
				protocol: "ws",
			},
		},
		plugins: [tsconfigPaths(), tailwindcss(), react()],
	};
});
