/** Shared typography for learner-facing lesson & question rich text. */
export const LEARNER_TEXT_FONT_FAMILY = "'Varela Round', sans-serif";

/** Bold/italic face — Varela Round has no weight cuts; Nunito does. */
export const LEARNER_EMPHASIS_FONT_FAMILY = "'Nunito', sans-serif";

export const LEARNER_RICH_TEXT_CLASS = 'learner-rich-text';

/** Strip editor inline font-family so Varela Round / Nunito apply consistently. */
export function stripInlineFontFamily(html: string): string {
	if (!html) return '';

	let result = html.replace(/font-family\s*:\s*[^;"']+;?/gi, '');
	result = result.replace(/\s*style="\s*"/gi, '');
	result = result.replace(/\s*style='\s*'/gi, '');

	return result;
}

/**
 * Normalize editor bold/italic that ships as styled <span>s into semantic tags
 * so learner CSS can apply a real bold/italic face.
 */
export function normalizeEmphasisSpans(html: string): string {
	if (!html) return '';

	let result = html;

	// <span style="...font-weight: bold|700..."> → <strong>
	result = result.replace(
		/<span([^>]*?)\sstyle=(["'])([^"']*)\2([^>]*)>([\s\S]*?)<\/span>/gi,
		(match, before, _q, style, after, inner) => {
			const hasBold = /font-weight\s*:\s*(bold|[6-9]00)\b/i.test(style);
			const hasItalic = /font-style\s*:\s*italic\b/i.test(style);
			if (!hasBold && !hasItalic) return match;

			const cleanedStyle = style
				.replace(/font-weight\s*:\s*[^;]+;?/gi, '')
				.replace(/font-style\s*:\s*[^;]+;?/gi, '')
				.replace(/;\s*;/g, ';')
				.replace(/^\s*;\s*|\s*;\s*$/g, '')
				.trim();

			const attrs = `${before || ''}${cleanedStyle ? ` style="${cleanedStyle}"` : ''}${after || ''}`.trim();
			let wrapped = inner;
			if (hasItalic) wrapped = `<em>${wrapped}</em>`;
			if (hasBold) wrapped = `<strong>${wrapped}</strong>`;
			return attrs ? `<span ${attrs}>${wrapped}</span>` : wrapped;
		}
	);

	return result;
}

export function prepareLearnerRichTextHtml(html: string): string {
	return normalizeEmphasisSpans(stripInlineFontFamily(html));
}
