// src/lib/ai/models.server.ts

import { pipeline, env } from "@xenova/transformers";
import type { PipelineType } from "@xenova/transformers";

// ------------------------------------------------------
//    Transformer Model Loader (Node.js)
//    Uses @xenova/transformers for local / browser-safe
//    inference with WebAssembly, ONNX and WebGPU support.
// ------------------------------------------------------

// Configure environment:
// - allowLocalModels: enable loading local files (filesystem, IPFS mount, etc.)
// - allowRemoteModels: if true, auto-download from HuggingFace Hub
env.allowLocalModels = true;
env.allowRemoteModels = true;

/**
 * Internal model cache to avoid reloading pipelines.
 * Keyed by "task:model".
 */
const modelCache: Record<string, any> = {};

/**
 * Load or retrieve a cached Transformers.js pipeline.
 *
 * @param task - The pipeline task type, e.g.:
 *   "sentiment-analysis"
 *   "text-classification"
 *   "summarization"
 *   "feature-extraction"
 *   "token-classification"
 *   "translation"
 *   "question-answering"
 *   etc...
 *
 *   This must be one of the PipelineType union provided by @xenova/transformers.
 *
 * @param model - The model ID or local path. Accepts:
 *   - HuggingFace model IDs, e.g. "Xenova/distilbert-base-uncased-finetuned-sst-2"
 *   - Local model folder paths
 *   - IPFS-mounted paths (e.g. `/ipfs/Qm...`)
 *
 * The function automatically caches the pipeline after the first load.
 *
 * @returns A ready-to-use pipeline instance for inference.
 *
 * @example
 * const pipe = await getPipeline("sentiment-analysis", "Xenova/distilbert-base");
 * const result = await pipe("I love this!");
 */
export async function getPipeline(task: PipelineType, model: string) {
  const key = `${task}:${model}`;

  // Reuse if already loaded
  if (modelCache[key]) {
    return modelCache[key];
  }

  // Create and cache the pipeline
  const pipe = await pipeline(task, model);
  modelCache[key] = pipe;
  return pipe;
}