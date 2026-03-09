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

export function useGeoLocation() {
	const [location, setLocation] = useState<GeoLocation | null>(null);

	useEffect(() => {
		let isMounted = true;
		const browserFallback = getBrowserFallbackLocation();

		// Prefer a local/browser-derived country immediately so forms and pricing
		// keep working even if third-party IP APIs are blocked by the browser.
		if (browserFallback) {
			setLocation(browserFallback);
		}

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
					countryCode: data.country_code,
					country: data.country_name || '',
					city: data.city || '',
					query: data.ip || '',
				};
			},
			async () => {
				const response = await fetch('https://ipwho.is/');
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
			for (const provider of providers) {
				try {
					const result = await provider();
					if (isMounted) {
						setLocation(result);
					}
					return;
				} catch {
					// Try the next provider silently. Public IP services commonly
					// fail due to rate limits, CORS, or regional blocking.
				}
			}

			if (isMounted && !browserFallback) {
				setLocation({
					countryCode: 'US',
					country: '',
					city: '',
					query: '',
				});
			}
		};

		loadLocation();

		return () => {
			isMounted = false;
		};
	}, []);

	return location;
}
