import DOMPurify from 'dompurify';

export function sanitizeHtml(html: string): string {
	const sanitizedHtml = DOMPurify.sanitize(html, {
		ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'u', 'a', 'p', 'br', 'div', 'span', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
		ALLOWED_ATTR: ['href', 'title', 'class'],
		FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button'],
		FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'onmouseout', 'onfocus', 'onblur', 'onchange', 'onsubmit', 'style'],
		KEEP_CONTENT: true,
		RETURN_DOM: false,
		RETURN_DOM_FRAGMENT: false,
		RETURN_TRUSTED_TYPE: false,
	});

	// Enhanced regex to remove any empty <p> tags, including those with attributes
	return sanitizedHtml.replace(/<p[^>]*>(\s|&nbsp;)*<\/p>/g, '<br>');
}

/**
 * Sanitize text input for form fields
 * More restrictive than HTML sanitization - removes all HTML tags
 * @param text - The text to sanitize
 * @returns Sanitized text with HTML tags removed
 */
export function sanitizeTextInput(text: string): string {
	if (typeof text !== 'string') {
		return '';
	}

	const clean = DOMPurify.sanitize(text, {
		ALLOWED_TAGS: [],
		ALLOWED_ATTR: [],
		FORBID_TAGS: ['*'],
		FORBID_ATTR: ['*'],
	});
	return clean;
}

/**
 * Sanitize email input specifically
 * Removes HTML tags while preserving valid email characters
 * @param email - The email to sanitize
 * @returns Sanitized email with HTML tags removed
 */
export function sanitizeEmailInput(email: string): string {
	if (typeof email !== 'string') {
		return '';
	}

	const clean = DOMPurify.sanitize(email, {
		ALLOWED_TAGS: [],
		ALLOWED_ATTR: [],
		FORBID_TAGS: ['*'],
		FORBID_ATTR: ['*'],
	});

	// Return sanitized email without format validation during typing
	// Format validation should be done on form submission, not during input
	return clean;
}

/**
 * Validate and sanitize input length
 * @param input - The input to validate
 * @param maxLength - Maximum allowed length
 * @returns Sanitized input within length limits
 */
export function validateInputLength(input: string, maxLength: number): string {
	if (typeof input !== 'string' || typeof maxLength !== 'number' || maxLength <= 0) {
		return '';
	}

	const sanitized = sanitizeTextInput(input);
	return sanitized.length > maxLength ? sanitized.substring(0, maxLength) : sanitized;
}
