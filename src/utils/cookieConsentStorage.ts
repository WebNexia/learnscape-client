export const COOKIE_CONSENT_KEY = 'cookieConsent';

export type CookieConsentValue = 'accepted' | 'declined';

const ESSENTIAL_LOCAL_STORAGE_KEYS = new Set([
	COOKIE_CONSENT_KEY,
	'sessionTimestamp',
	'learnerSessionId',
	'rateLimitInfo',
]);

const OPTIONAL_LOCAL_STORAGE_PATTERNS = [
	/^zm-/,
	/^zoom-/i,
	/^Zoom-/,
	/^tinymce-/i,
	/^TinyMCE-/,
	/^form_submitted_/,
];

export const GEO_CACHE_SESSION_KEY = 'learnscape_geo_v1';

export function getCookieConsent(): CookieConsentValue | null {
	if (typeof window === 'undefined') return null;
	const value = localStorage.getItem(COOKIE_CONSENT_KEY);
	if (value === 'accepted' || value === 'declined') return value;
	return null;
}

export function hasOptionalCookieConsent(): boolean {
	return getCookieConsent() === 'accepted';
}

export function setCookieConsent(value: CookieConsentValue): void {
	localStorage.setItem(COOKIE_CONSENT_KEY, value);
	if (value === 'declined') {
		clearOptionalStorageOnDecline();
	}
}

export function clearOptionalStorageOnDecline(): void {
	if (typeof window === 'undefined') return;

	try {
		Object.keys(localStorage).forEach((key) => {
			if (ESSENTIAL_LOCAL_STORAGE_KEYS.has(key)) return;
			const isOptional = OPTIONAL_LOCAL_STORAGE_PATTERNS.some((pattern) => pattern.test(key));
			if (isOptional) {
				localStorage.removeItem(key);
			}
		});

		sessionStorage.removeItem(GEO_CACHE_SESSION_KEY);
		sessionStorage.removeItem('hasSeenIntroVideo');
	} catch (error) {
		console.error('Error clearing optional storage on cookie decline:', error);
	}
}
