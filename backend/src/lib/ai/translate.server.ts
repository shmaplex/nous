// backend/src/lib/ai/translate.server.ts
import { getPipeline } from "./models.server";

const DEFAULT_LANG = "en_XX";

/**
 * Mapping of friendly BCP-47 codes to Xenova MBart model target codes.
 */
const LANG_MAP: Record<string, string> = {
	ar: "ar_AR",
	cs: "cs_CZ",
	de: "de_DE",
	en: "en_XX",
	es: "es_XX",
	et: "et_EE",
	fi: "fi_FI",
	fr: "fr_XX",
	gu: "gu_IN",
	hi: "hi_IN",
	it: "it_IT",
	ja: "ja_XX",
	kk: "kk_KZ",
	ko: "ko_KR",
	lt: "lt_LT",
	lv: "lv_LV",
	my: "my_MM",
	ne: "ne_NP",
	nl: "nl_XX",
	ro: "ro_RO",
	ru: "ru_RU",
	si: "si_LK",
	tr: "tr_TR",
	vi: "vi_VN",
	zh: "zh_CN",
	af: "af_ZA",
	az: "az_AZ",
	bn: "bn_IN",
	fa: "fa_IR",
	he: "he_IL",
	hr: "hr_HR",
	id: "id_ID",
	ka: "ka_GE",
	km: "km_KH",
	mk: "mk_MK",
	ml: "ml_IN",
	mn: "mn_MN",
	mr: "mr_IN",
	pl: "pl_PL",
	ps: "ps_AF",
	pt: "pt_XX",
	sv: "sv_SE",
	sw: "sw_KE",
	ta: "ta_IN",
	te: "te_IN",
	th: "th_TH",
	tl: "tl_XX",
	uk: "uk_UA",
	ur: "ur_PK",
	xh: "xh_ZA",
	gl: "gl_ES",
	sl: "sl_SI",
};

/**
 * Get the Xenova MBart target language code for a given BCP-47 code.
 * Falls back to DEFAULT_LANG if not found.
 */
export function getTranslatorLang(lang?: string): string {
	if (!lang) return DEFAULT_LANG;
	return LANG_MAP[lang.toLowerCase()] ?? DEFAULT_LANG;
}

/**
 * Translate text content into a specified language using AI.
 * Falls back to original text if translation fails.
 *
 * @param content - The text to translate
 * @param targetLanguage - BCP-47 language code, e.g., "ko" for Korean, "en" for English
 * @returns Translated content as string
 */
export async function translateContentAI(
	content: string,
	targetLanguage?: string,
): Promise<string> {
	if (!content) return content;

	const modelLang = getTranslatorLang(targetLanguage);

	try {
		const translator = await getPipeline("translation", "Xenova/mbart-large-50-many-to-many-mmt");
		const result = await translator(content.slice(0, 5000), { target_lang: modelLang });
		return result[0]?.translation_text ?? content;
	} catch (err) {
		console.warn(`Translation AI failed for language ${modelLang}:`, (err as Error).message);
		return content;
	}
}
