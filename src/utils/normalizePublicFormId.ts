/** Instagram / ManyChat often add a trailing space (%20) or tracking junk on the form id. */
export const normalizePublicFormId = (formIdOrPublicLink?: string): string => {
	if (!formIdOrPublicLink) return '';
	let raw = String(formIdOrPublicLink).trim();
	try {
		raw = decodeURIComponent(raw);
	} catch {
		/* keep raw */
	}
	raw = raw.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
	const objectIdMatch = raw.match(/[a-fA-F0-9]{24}/);
	if (objectIdMatch) return objectIdMatch[0].toLowerCase();
	return raw.split(/[?#&/]/)[0].trim();
};
