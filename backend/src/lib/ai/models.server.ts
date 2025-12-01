import fs from "node:fs";
import path from "node:path";
import { env, type PipelineType, pipeline } from "@xenova/transformers";

// ------------------------------------------------------
// Transformer Model Loader (Node.js)
// Uses Transformers.js for local inference (WASM / ONNX / WebGPU).
// ------------------------------------------------------

// Allow local and remote model loading
env.allowLocalModels = true;
env.allowRemoteModels = true;

// Base directory: where downloaded model files are cached
const MODEL_DIR = path.resolve("./backend/.models");

/**
 * Map of human‑readable model keys → HuggingFace repo IDs
 */
export const MODELS: Record<string, string> = {
	"distilbert-sst2": "Xenova/distilbert-base-uncased-finetuned-sst-2-english",
	"bert-ner": "dslim/distilbert-NER", // NER model
	"distilbart-cnn": "Xenova/distilbart-cnn-6-6", // summarization
	"minilm-embed": "Xenova/all-MiniLM-L6-v2", // embeddings (default)
	"xlm-lang-detector": "dnouv/xlm-roberta-base-language-detection-tfjs",
	"mbart-translate": "Xenova/mbart-large-50-many-to-many-mmt",
	gpt2: "Xenova/gpt2", // text generation
};

/**
 * Cache for loaded pipelines (task + modelKey → Promise<pipeline instance>)
 */
const PIPELINE_CACHE: Record<string, Promise<any> | undefined> = {};

/**
 * Check if local model folder exists
 */
function localModelExists(modelKey: string) {
	const modelPath = path.join(MODEL_DIR, modelKey);
	return fs.existsSync(modelPath) && fs.statSync(modelPath).isDirectory();
}

/**
 * Load or retrieve a cached pipeline.
 *
 * @param task Pipeline task (e.g. "text-classification", "feature-extraction", "text-generation", ...)
 * @param modelKey Key from MODELS, or a full repo string
 * @param localFilesOnly Whether or not to use local model files (./models/*) only
 * @returns A ready-to-use pipeline instance
 */
export async function getPipeline(
	task: PipelineType,
	modelKey: string,
	localFilesOnly = true,
): Promise<any> {
	const cacheKey = `${task}:${modelKey}`;
	if (PIPELINE_CACHE[cacheKey]) return await PIPELINE_CACHE[cacheKey];

	const modelRepo = MODELS[modelKey] ?? modelKey;

	// Determine whether we can use local files
	const useLocal = localFilesOnly && localModelExists(modelKey);

	if (localFilesOnly && !useLocal) {
		throw new Error(
			`Local model for '${modelKey}' not found in ${MODEL_DIR}. Please download it first.`,
		);
	}

	const pipelinePromise = pipeline(task, modelRepo, {
		cache_dir: MODEL_DIR,
		local_files_only: useLocal,
	});

	PIPELINE_CACHE[cacheKey] = pipelinePromise;
	return await pipelinePromise;
}

/**
 * Prefetch all known models into memory at startup.
 * Useful to warm up pipelines so subsequent inferences are faster.
 */
export async function prefetchModels(): Promise<void> {
	for (const key of Object.keys(MODELS)) {
		try {
			console.log(`Prefetching model '${key}'...`);

			let task: PipelineType = "feature-extraction";
			if (key.includes("sst2")) task = "text-classification";
			else if (key.includes("ner")) task = "token-classification";
			else if (key.includes("bart") || key.includes("cnn")) task = "summarization";
			else if (key.includes("translate") || key.includes("mbart")) task = "translation";
			else if (key === "gpt2") task = "text-generation";

			// Only prefetch if model exists locally
			if (localModelExists(key)) {
				await getPipeline(task, key, true);
				console.log(`Model '${key}' prefetched successfully.`);
			} else {
				console.warn(`Local model for '${key}' not found. Skipping prefetch.`);
			}
		} catch (err) {
			console.error(`Failed to prefetch model '${key}':`, err);
		}
	}
}
