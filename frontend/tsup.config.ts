import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["server/src/setup.ts"],
	outDir: "dist/p2p",
	format: ["esm"],
	target: "node22",
	minify: true,
	sourcemap: false,
	clean: true,
	external: [
		"node_datachannel",
		"libp2p",
		"@libp2p/*",
		"@helia/*",
		"@chainsafe/*",
		"@multiformats/*",
		"@orbitdb/*",
		"datastore-core",
		"helia",
		"uuid",
	],
	tsconfig: "tsconfig.server.json",
});
