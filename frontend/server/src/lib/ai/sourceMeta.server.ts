/**
 * @file sourceMeta.server.ts
 * Main unified interface for external source metadata.
 */

import { DEFAULT_SOURCES } from "@/constants/sources";
import { fetchAdFontes } from "@/lib/ai/sources/adfontes.server";
import { fetchAllSides } from "@/lib/ai/sources/allsides.server";
import { fetchMBFC } from "@/lib/ai/sources/mbfc.server";
import { computeUnifiedBias } from "@/lib/ai/sources/helpers";
import { SourceMetaFull } from "@/types";

export async function getSourceMeta(
  name: string
): Promise<SourceMetaFull> {
  const defaults = DEFAULT_SOURCES.find((s) => s.name === name);

  const [adf, alls, mbfc] = await Promise.all([
    fetchAdFontes(name),
    fetchAllSides(name),
    fetchMBFC(name),
  ]);

  return {
    name: name,
    adFontes: adf.adFontes,
    adFontesReliability: adf.adFontesReliability,

    allSides: alls.allSides,

    mbfc: mbfc.mbfc,
    mbfcFactuality: mbfc.mbfcFactuality,

    unifiedBias: computeUnifiedBias(
      adf.adFontes,
      alls.allSides,
      mbfc.mbfc
    ),

    ownership: defaults?.ownership,
    lastUpdated: new Date().toISOString(),
  };
}