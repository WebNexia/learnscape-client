import { useEffect, useState } from 'react';

interface GeoLocation {
	countryCode: string;
	country: string;
	city: string;
	query: string; // user's IP
}

export function useGeoLocation() {
	const [location, setLocation] = useState<GeoLocation | null>(null);

	useEffect(() => {
		fetch('https://ipwho.is/')
			.then((res) => res.json())
			.then((data) => {
				if (data.success !== false) {
					setLocation({
						countryCode: data.country_code,
						country: data.country,
						city: data.city,
						query: data.ip,
					});
				} else {
					console.error('Geolocation fetch failed:', data.message);
				}
			})
			.catch((err) => {
				console.error('Geolocation error:', err);
			});
	}, []);

	return location;
}
