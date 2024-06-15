export function stripHtml(html: string): string {
	let doc = new DOMParser().parseFromString(html, 'text/html');

	// Ignore table content
	if (doc) {
		const tables = doc.querySelectorAll('table');
		tables.forEach((table) => table.parentNode?.removeChild(table));
	}

	return doc?.body.textContent || '';
}
