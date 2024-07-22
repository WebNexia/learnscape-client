import DOMPurify from 'dompurify';

export function sanitizeHtml(html: string): string {
	return DOMPurify.sanitize(html, {
		ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'u', 'a', 'p', 'br', 'div', 'span', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
		ALLOWED_ATTR: ['href', 'title', 'style', 'class'],
	});
}
