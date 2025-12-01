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

// Limits for safe processing
const LANG_TRANSLATION_BOUNDS = 4000;
const LANG_DETECTOR_BOUNDS = 500;

/** Map short code to translator code */
export function getTranslatorLang(lang?: string): string {
	if (!lang || typeof lang !== "string") return DEFAULT_LANG;
	const mapped = LANG_MAP[lang.toLowerCase().trim()];
	if (!mapped) {
		console.warn(`[LangMap] Language "${lang}" not found, defaulting to ${DEFAULT_LANG}`);
		return DEFAULT_LANG;
	}
	return mapped;
}

// Cached pipelines
let detectorPipeline: ReturnType<typeof getPipeline> | null = null;
let translatorPipeline: ReturnType<typeof getPipeline> | null = null;

/** Load language detector pipeline using model key */
async function getDetectorPipeline() {
	if (!detectorPipeline) {
		console.log("[Pipeline] Loading language detector pipeline...");
		detectorPipeline = await getPipeline("text-classification", "xlm-lang-detector");
		console.log("[Pipeline] Language detector loaded.");
	}
	return detectorPipeline;
}

/** Load translator pipeline using model key */
async function getTranslatorPipeline() {
	if (!translatorPipeline) {
		console.log("[Pipeline] Loading translator pipeline...");
		translatorPipeline = await getPipeline("translation", "mbart-translate");
		console.log("[Pipeline] Translator loaded.");
	}
	return translatorPipeline;
}

/** Detect language of text */
export async function detectLanguage(content: string): Promise<string> {
	if (!content) return "en";
	try {
		const detector = await getDetectorPipeline();
		const result = await detector(content.slice(0, LANG_DETECTOR_BOUNDS));
		const detectedLang = result[0]?.label?.toLowerCase() ?? "en";
		console.log(`[Detect] Language detected: ${detectedLang}`);
		return detectedLang;
	} catch (err) {
		console.warn("[Detect] Language detection failed:", (err as Error).message);
		return "en";
	}
}

/** Translate text in safe chunks */
export async function translateContentAI(
	content: string,
	targetLanguage?: string,
): Promise<string> {
	if (!content) return content;

	const tgtLang = getTranslatorLang(targetLanguage);
	const detected = await detectLanguage(content);
	const srcLang = getTranslatorLang(detected);

	if (srcLang === tgtLang) {
		console.log("[Translate] Source and target are the same. Skipping translation.");
		return content;
	}

	const translator = await getTranslatorPipeline();
	const chunks: string[] = [];
	for (let i = 0; i < content.length; i += LANG_TRANSLATION_BOUNDS) {
		chunks.push(content.slice(i, i + LANG_TRANSLATION_BOUNDS));
	}

	const translatedChunks: string[] = [];
	for (let i = 0; i < chunks.length; i++) {
		try {
			const result = await translator(chunks[i], { src_lang: srcLang, tgt_lang: tgtLang });
			const translated = result[0]?.translation_text ?? chunks[i];
			console.log(`[Translate] Chunk ${i + 1}/${chunks.length} translated`);
			translatedChunks.push(translated);
		} catch (err) {
			console.warn(`[Translate] Chunk ${i + 1} failed: ${(err as Error).message}`);
			translatedChunks.push(chunks[i]); // fallback
		}
	}

	console.log("[Translate] Translation complete.");
	return translatedChunks.join(" ");
}

/** Translate multiple titles in batches */
export async function translateMultipleTitlesAI(
	titles: string[],
	targetLanguage?: string,
	batchSize = 10,
): Promise<string[]> {
	if (!titles?.length) return [];

	const translatedTitles: string[] = [];

	for (let i = 0; i < titles.length; i += batchSize) {
		const batch = titles.slice(i, i + batchSize);
		const batchResults = await Promise.all(
			batch.map((title, j) =>
				translateContentAI(title, targetLanguage).then((translated) => {
					console.log(`[BatchTranslate] Title ${i + j + 1}/${titles.length} translated`);
					return translated;
				}),
			),
		);
		translatedTitles.push(...batchResults);
	}

	console.log("[BatchTranslate] All titles translated.");
	return translatedTitles;
}
