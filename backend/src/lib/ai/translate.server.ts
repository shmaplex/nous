// backend/src/lib/ai/translate.server.ts
import { getPipeline } from "./models.server";

const DEFAULT_LANG = "en_XX";

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

export function getTranslatorLang(lang?: string): string {
	if (!lang || typeof lang !== "string") return DEFAULT_LANG;
	const mapped = LANG_MAP[lang.toLowerCase().trim()];
	if (!mapped) {
		console.warn(`Language "${lang}" not found in LANG_MAP, defaulting to ${DEFAULT_LANG}`);
		return DEFAULT_LANG;
	}
	return mapped;
}

// Hold the resolved pipelines
let detectorPipeline: ReturnType<typeof getPipeline> | null = null;
let translatorPipeline: ReturnType<typeof getPipeline> | null = null;

async function getDetectorPipeline() {
	if (!detectorPipeline) {
		console.log("Loading language detector pipeline...");
		detectorPipeline = await getPipeline(
			"text-classification",
			"dnouv/xlm-roberta-base-language-detection-tfjs",
		);
		console.log("Language detector pipeline loaded.");
	}
	return detectorPipeline;
}

async function getTranslatorPipeline() {
	if (!translatorPipeline) {
		console.log("Loading translator pipeline...");
		translatorPipeline = await getPipeline("translation", "Xenova/mbart-large-50-many-to-many-mmt");
		console.log("Translator pipeline loaded.");
	}
	return translatorPipeline;
}

/**
 * Detect language of given text using AI.
 * @param content The text to detect the language of
 * @returns Detected language code
 */
export async function detectLanguage(content: string): Promise<string> {
	if (!content) return "en";

	try {
		console.log("Detecting language...");
		const detector = await getDetectorPipeline();
		const result = await detector(content.slice(0, 5000));
		const detectedLang = result[0]?.label?.toLowerCase() ?? "en";
		console.log(`Detected language: ${detectedLang}`);
		return detectedLang;
	} catch (err) {
		console.warn("Language detection failed:", (err as Error).message);
		return "en";
	}
}

/**
 * Translate text content into a specified language using AI.
 * Skips translation if content is already in the target language.
 * @param content Text to translate
 * @param targetLanguage Target language code
 * @returns Translated text
 */
export async function translateContentAI(
	content: string,
	targetLanguage?: string,
): Promise<string> {
	if (!content) return content;

	const tgtLang = getTranslatorLang(targetLanguage);
	console.log(`Target language: ${tgtLang}`);

	const detected = await detectLanguage(content);
	const srcLang = getTranslatorLang(detected);

	if (srcLang === tgtLang) {
		console.log("Source and target languages are the same. Skipping translation.");
		return content;
	}

	try {
		console.log(`Translating content from ${srcLang} to ${tgtLang}...`);
		const translator = await getTranslatorPipeline();
		const result = await translator(content.slice(0, 5000), {
			src_lang: srcLang,
			tgt_lang: tgtLang,
		});
		const translatedText = result[0]?.translation_text ?? content;
		console.log("Translation complete.");
		return translatedText;
	} catch (err) {
		console.warn(`Translation AI failed for language ${tgtLang}:`, (err as Error).message);
		return content;
	}
}

/**
 * Translate multiple titles in parallel using AI in memory-efficient batches.
 * @param titles Array of text titles to translate
 * @param targetLanguage Target language code
 * @param batchSize Number of titles to process at once (default 10)
 * @returns Array of translated titles
 */
export async function translateMultipleTitlesAI(
	titles: string[],
	targetLanguage?: string,
	batchSize = 10,
): Promise<string[]> {
	if (!titles?.length) return [];

	console.log(`Translating ${titles.length} titles in batches of ${batchSize}...`);
	const translatedTitles: string[] = [];

	for (let i = 0; i < titles.length; i += batchSize) {
		const batch = titles.slice(i, i + batchSize);

		// Translate all titles in the batch in parallel
		const batchResults = await Promise.all(
			batch.map((title, j) =>
				translateContentAI(title, targetLanguage).then((translated) => {
					console.log(`Translated title ${i + j + 1}/${titles.length}`);
					return translated;
				}),
			),
		);

		translatedTitles.push(...batchResults);
	}

	console.log("All titles translated.");
	return translatedTitles;
}
