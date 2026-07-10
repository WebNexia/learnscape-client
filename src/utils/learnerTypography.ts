/** Shared typography for learner-facing lesson & question rich text. */
export const LEARNER_TEXT_FONT_FAMILY = "'Varela Round', sans-serif";

export const LEARNER_RICH_TEXT_CLASS = 'learner-rich-text';

/** Strip editor inline font-family so Varela Round applies consistently. */
export function stripInlineFontFamily(html: string): string {
	if (!html) return '';

	let result = html.replace(/font-family\s*:\s*[^;"']+;?/gi, '');
	result = result.replace(/\s*style="\s*"/gi, '');
	result = result.replace(/\s*style='\s*'/gi, '');

	return result;
}

export function prepareLearnerRichTextHtml(html: string): string {
	return stripInlineFontFamily(html);
}
