export function stripHtml(html: string): string {
	// Decode HTML entities first
	const txt = document.createElement('textarea');
	txt.innerHTML = html;
	const decoded = txt.value;

	// Now strip HTML tags
	const doc = new DOMParser().parseFromString(decoded, 'text/html');
	let text = doc?.body.textContent || '';

	return text;
}
