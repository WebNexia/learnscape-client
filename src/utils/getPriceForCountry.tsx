import { Price, SingleCourse } from '../interfaces/course';

export function getPriceForCountry(course: SingleCourse, countryCode: string): Price {
	// Define a mapping for user country codes to currencies
	const countryCurrencyMap: { [key: string]: 'gbp' | 'usd' | 'eur' | 'try' } = {
		GB: 'gbp', // United Kingdom
		US: 'usd', // United States
		EU: 'eur', // Eurozone
		TR: 'try', // Turkey
	};

	// Determine the currency based on the country code, defaulting to USD
	const preferredCurrency = countryCurrencyMap[countryCode] || 'USD';

	// Retrieve the appropriate price from the course prices
	const price = course.prices?.find((p) => p.currency === preferredCurrency);
	return price || course.prices?.find((p) => p.currency === 'usd')!;
}
