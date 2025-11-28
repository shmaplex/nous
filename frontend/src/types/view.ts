/**
 * @file view.ts
 * @description
 * Shared view mode types + safe Zod schema validation for UI mode switching.
 */

import { z } from "zod";

/**
 * Allowed UI view modes within the Nous Desktop client.
 *
 *  - `workbench` — Raw article ingestion, analysis tools, data work.
 *  - `reading` — Clean reading mode showing analyzed articles only.
 */
export type ViewMode = "workbench" | "reading";

/**
 * Zod schema for validating a `ViewMode` string safely.
 *
 * @example
 * ViewModeSchema.parse("reading")  // OK
 * ViewModeSchema.parse("invalid")  // ❌ throws
 */
export const ViewModeSchema = z.enum(["workbench", "reading"]);

/**
 * Default view mode used on first launch or if corrupted data is loaded.
 */
export const DEFAULT_VIEW_MODE: ViewMode = "workbench";