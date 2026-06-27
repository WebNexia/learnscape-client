import { useEffect, useState } from 'react';

interface GeoLocation {
	countryCode: string;
	country: string;
	city: string;
	query: string; // user's IP
}

function getBrowserFallbackLocation(): GeoLocation | null {
	try {
		const locale = Intl.DateTimeFormat().resolvedOptions().locale || '';
		const localeParts = locale.split('-');
		const countryCode = (localeParts[1] || '').toUpperCase();

		if (!countryCode || countryCode.length !== 2) {
			return null;
		}

		return {
			countryCode,
			country: '',
			city: '',
			query: '',
		};
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

const GEO_CACHE_KEY = 'learnscape_geo_v1';
const GEO_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function readGeoCache(): GeoLocation | null {
	if (typeof window === 'undefined') return null;
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
	if (typeof window === 'undefined') return;
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
