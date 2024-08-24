export function stripHtml(html: string): string {
	const doc = new DOMParser().parseFromString(html, 'text/html');
	let text = doc?.body.textContent || '';

	// Replace line breaks to make sure they are preserved when rendering
	text = text.replace(/\n/g, '\n');

	return text;
}
