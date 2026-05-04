import { useEffect, useState } from 'react';

interface GeoLocation {
	countryCode: string;
	country: string;
	city: string;
	query: string; // user's IP
}

let cachedLocation: GeoLocation | null = null;
let inFlightLookup: Promise<GeoLocation | null> | null = null;

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

export function useGeoLocation() {
	const [location, setLocation] = useState<GeoLocation | null>(null);

	useEffect(() => {
		let isMounted = true;
		const browserFallback = getBrowserFallbackLocation();
		const isLocalhost =
			typeof window !== 'undefined' &&
			(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

		// Prefer a local/browser-derived country immediately so forms and pricing
		// keep working even if third-party IP APIs are blocked by the browser.
		if (browserFallback) {
			setLocation(browserFallback);
		}
		if (cachedLocation) {
			setLocation(cachedLocation);
		}

		// Avoid third-party geo calls in local development because
		// CORS/rate-limit errors from public APIs can add delay and console noise.
		if (isLocalhost) {
			return () => {
				isMounted = false;
			};
		}

		const fetchWithTimeout = async (url: string, timeoutMs = 1500) => {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), timeoutMs);
			try {
				const response = await fetch(url, { signal: controller.signal });
				return response;
			} finally {
				clearTimeout(timeout);
			}
		};

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
					countryCode: data.country_code,
					country: data.country_name || '',
					city: data.city || '',
					query: data.ip || '',
				};
			},
			async () => {
				const response = await fetchWithTimeout('https://ipwho.is/');
				if (!response.ok) {
					throw new Error(`ipwho.is failed with status ${response.status}`);
				}

				const data = await response.json();
				if (data.success === false || !data.country_code) {
					throw new Error(data.message || 'ipwho.is returned no country code');
				}

				return {
					countryCode: data.country_code,
					country: data.country || '',
					city: data.city || '',
					query: data.ip || '',
				};
			},
		];

		const loadLocation = async () => {
			if (inFlightLookup) {
				const sharedResult = await inFlightLookup;
				if (isMounted && sharedResult) {
					setLocation(sharedResult);
				}
				return;
			}

			inFlightLookup = (async () => {
				for (const provider of providers) {
					try {
						const result = await provider();
						cachedLocation = result;
						return result;
					} catch {
						// Try the next provider silently. Public IP services commonly
						// fail due to rate limits, CORS, or regional blocking.
					}
				}
				return null;
			})();

			const result = await inFlightLookup;
			inFlightLookup = null;

			if (result) {
				if (isMounted) {
					setLocation(result);
				}
				return;
			}

			if (isMounted && !browserFallback) {
				const fallback = {
					countryCode: 'US',
					country: '',
					city: '',
					query: '',
				};
				cachedLocation = fallback;
				setLocation(fallback);
			}
		};

		loadLocation();

		return () => {
			isMounted = false;
		};
	}, []);

	return location;
}
