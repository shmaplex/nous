// src/types/sources.ts
import { z } from "zod";

export const SourceSchema = z.object({
	name: z.string(),
	url: z.url(), // enforce valid URL
	instructions: z.string().optional(), // optional
	apiLink: z.url().optional(), // optional, must be valid URL if present
});

// TypeScript type inferred from Zod
export type Source = z.infer<typeof SourceSchema>;

// If you want an array of sources:
export const SourcesSchema = z.array(SourceSchema);
export type Sources = z.infer<typeof SourcesSchema>;
