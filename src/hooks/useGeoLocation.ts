import { useEffect, useState } from 'react';
import { GEO_CACHE_SESSION_KEY, hasOptionalCookieConsent } from '../utils/cookieConsentStorage';

interface GeoLocation {
	countryCode: string;
	country: string;
	city: string;
	query: string; // user's IP
}

/** Language-only locales (e.g. `tr`) have no region; map unambiguous ones to a country. */
const LANGUAGE_TO_COUNTRY: Record<string, string> = {
	tr: 'TR',
	ja: 'JP',
	ko: 'KR',
	ar: 'SA',
	he: 'IL',
	th: 'TH',
	vi: 'VN',
	id: 'ID',
	ms: 'MY',
	hi: 'IN',
	bn: 'BD',
	uk: 'UA',
	ru: 'RU',
	pl: 'PL',
	nl: 'NL',
	sv: 'SE',
	da: 'DK',
	fi: 'FI',
	nb: 'NO',
	nn: 'NO',
	no: 'NO',
	cs: 'CZ',
	hu: 'HU',
	ro: 'RO',
	bg: 'BG',
	el: 'GR',
	pt: 'PT',
};

function countryFromLocaleTag(tag: string): string | null {
	const normalized = String(tag || '')
		.trim()
		.replace('_', '-');
	if (!normalized) return null;

	const parts = normalized.split('-');
	const region = (parts[1] || '').toUpperCase();
	if (region.length === 2 && /^[A-Z]{2}$/.test(region)) {
		return region;
	}

	const lang = (parts[0] || '').toLowerCase();
	return LANGUAGE_TO_COUNTRY[lang] || null;
}

function getBrowserFallbackLocation(): GeoLocation | null {
	try {
		const candidates = [
			Intl.DateTimeFormat().resolvedOptions().locale,
			typeof navigator !== 'undefined' ? navigator.language : '',
			...(typeof navigator !== 'undefined' && Array.isArray(navigator.languages) ? navigator.languages : []),
		];

		for (const tag of candidates) {
			const countryCode = countryFromLocaleTag(tag || '');
			if (countryCode) {
				return {
					countryCode,
					country: '',
					city: '',
					query: '',
				};
			}
		}

		return null;
	} catch {
		return null;
	}
}

const defaultGeo: GeoLocation = {
	countryCode: 'US',
	country: '',
	city: '',
	query: '',
};

const GEO_CACHE_KEY = GEO_CACHE_SESSION_KEY;
const GEO_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function readGeoCache(): GeoLocation | null {
	if (typeof window === 'undefined' || !hasOptionalCookieConsent()) return null;
	try {
		const raw = sessionStorage.getItem(GEO_CACHE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as { location?: GeoLocation; cachedAt?: number };
		if (!parsed.location || !parsed.cachedAt || Date.now() - parsed.cachedAt > GEO_CACHE_TTL_MS) {
			return null;
		}
		return parsed.location;
	} catch {
		return null;
	}
}

function writeGeoCache(location: GeoLocation) {
	if (typeof window === 'undefined' || !hasOptionalCookieConsent()) return;
	try {
		sessionStorage.setItem(GEO_CACHE_KEY, JSON.stringify({ location, cachedAt: Date.now() }));
	} catch {
		// Ignore quota / private mode errors
	}
}

/** One shared in-flight / resolved lookup for the whole app (many components use this hook). */
let geoLocationPromise: Promise<GeoLocation> | null = null;

async function fetchWithTimeout(url: string, timeoutMs = 1500): Promise<Response> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), timeoutMs);
	try {
		return await fetch(url, { signal: controller.signal });
	} finally {
		clearTimeout(timeout);
	}
}

function fetchGeoLocationOnce(): Promise<GeoLocation> {
	if (geoLocationPromise) {
		return geoLocationPromise;
	}

	const cached = readGeoCache();
	if (cached) {
		geoLocationPromise = Promise.resolve(cached);
		return geoLocationPromise;
	}

	geoLocationPromise = (async () => {
		if (!hasOptionalCookieConsent()) {
			return getBrowserFallbackLocation() ?? defaultGeo;
		}

		const isLocalhost =
			typeof window !== 'undefined' &&
			(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

		if (isLocalhost) {
			const result = getBrowserFallbackLocation() ?? defaultGeo;
			writeGeoCache(result);
			return result;
		}

		const providers = [
			async () => {
				const response = await fetchWithTimeout('https://ipapi.co/json/');
				if (!response.ok) {
					throw new Error(`ipapi failed with status ${response.status}`);
				}

				const data = await response.json();
				if (!data?.country_code) {
					throw new Error('ipapi returned no country code');
				}

				return {
					countryCode: String(data.country_code).toUpperCase(),
					country: data.country_name || '',
					city: data.city || '',
					query: data.ip || '',
				};
			},
			async () => {
				const response = await fetchWithTimeout('https://ipwho.is/');
				if (!response.ok) {
					throw new Error(`ipwho failed with status ${response.status}`);
				}

				const data = await response.json();
				if (data?.success === false) {
					throw new Error('ipwho returned success: false');
				}
				const code = data?.country_code;
				if (!code || typeof code !== 'string') {
					throw new Error('ipwho returned no country code');
				}

				return {
					countryCode: code.toUpperCase(),
					country: data.country || '',
					city: data.city || '',
					query: typeof data.ip === 'string' ? data.ip : '',
				};
			},
		];

		for (const provider of providers) {
			try {
				const result = await provider();
				writeGeoCache(result);
				return result;
			} catch {
				// Try the next provider silently. Public IP services commonly
				// fail due to rate limits, CORS, or regional blocking.
			}
		}

		const fallback = getBrowserFallbackLocation() ?? defaultGeo;
		writeGeoCache(fallback);
		return fallback;
	})();

	return geoLocationPromise;
}

export function useGeoLocation() {
	const [location, setLocation] = useState<GeoLocation | null>(null);

	useEffect(() => {
		let isMounted = true;
		const cached = readGeoCache();
		const browserFallback = getBrowserFallbackLocation();

		if (cached) {
			setLocation(cached);
		} else if (browserFallback) {
			setLocation(browserFallback);
		}

		fetchGeoLocationOnce().then((result) => {
			if (isMounted) {
				setLocation(result);
			}
		});

		return () => {
			isMounted = false;
		};
	}, []);

	return location;
}
