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

/** One shared in-flight / resolved lookup for the whole app (many components use this hook). */
let geoLocationPromise: Promise<GeoLocation> | null = null;

function fetchGeoLocationOnce(): Promise<GeoLocation> {
	if (geoLocationPromise) {
		return geoLocationPromise;
	}

	geoLocationPromise = (async () => {
		const providers = [
			async () => {
				const response = await fetch('https://ipapi.co/json/');
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
				const response = await fetch('https://get.geojs.io/v1/ip/geo.json');
				if (!response.ok) {
					throw new Error(`geojs failed with status ${response.status}`);
				}

				const data = await response.json();
				const code = data?.country_code;
				if (!code || typeof code !== 'string') {
					throw new Error('geojs returned no country code');
				}

				return {
					countryCode: code.toUpperCase(),
					country: data.country || '',
					city: data.city || '',
					query: data.ip || '',
				};
			},
		];

		for (const provider of providers) {
			try {
				return await provider();
			} catch {
				// Try the next provider silently. Public IP services commonly
				// fail due to rate limits, CORS, or regional blocking.
			}
		}

		return getBrowserFallbackLocation() ?? defaultGeo;
	})();

	return geoLocationPromise;
}

export function useGeoLocation() {
	const [location, setLocation] = useState<GeoLocation | null>(null);

	useEffect(() => {
		let isMounted = true;
		const browserFallback = getBrowserFallbackLocation();

		if (browserFallback) {
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
