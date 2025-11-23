import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/p2p/setup.ts"],
	outDir: "dist/p2p",
	format: ["esm"], // --format esm
	target: "node22", // --target node22
	minify: true, // --minify
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
	sourcemap: false,
	clean: true, // optional: cleans output folder before build
});
