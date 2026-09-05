import {
	ANALYTICS_SESSION_KEY,
	ANALYTICS_VISITOR_KEY,
	hasOptionalCookieConsent,
} from './cookieConsentStorage';

function randomId() {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID().replace(/-/g, '');
	}
	return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 18)}`;
}

export function getAnalyticsVisitorId(): string | null {
	if (typeof window === 'undefined' || !hasOptionalCookieConsent()) return null;
	try {
		const existing = localStorage.getItem(ANALYTICS_VISITOR_KEY);
		if (existing) return existing;
		const created = randomId();
		localStorage.setItem(ANALYTICS_VISITOR_KEY, created);
		return created;
	} catch {
		return null;
	}
}

export function getAnalyticsSessionId(): string | null {
	if (typeof window === 'undefined' || !hasOptionalCookieConsent()) return null;
	try {
		const existing = sessionStorage.getItem(ANALYTICS_SESSION_KEY);
		if (existing) return existing;
		const created = randomId();
		sessionStorage.setItem(ANALYTICS_SESSION_KEY, created);
		return created;
	} catch {
		return null;
	}
}

export function readUtmParams(search: string) {
	const params = new URLSearchParams(search);
	return {
		utmSource: params.get('utm_source') || '',
		utmMedium: params.get('utm_medium') || '',
		utmCampaign: params.get('utm_campaign') || '',
	};
}

const SKIP_PATHS = ['/admin/payments/analytics', '/rate-limit-error'];

export function shouldTrackPath(pathname: string) {
	return !SKIP_PATHS.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
