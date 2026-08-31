import { Price, SingleCourse } from '../interfaces/course';

const countryCurrencyMap: { [key: string]: 'gbp' | 'usd' | 'eur' | 'try' } = {
	GB: 'gbp',
	US: 'usd',
	EU: 'eur',
	TR: 'try',
};

export function getPriceForCountry(course: SingleCourse, countryCode: string): Price {
	const preferredCurrency = countryCurrencyMap[(countryCode || '').toUpperCase()] || 'usd';

	const price = course.prices?.find((p) => (p.currency || '').toLowerCase() === preferredCurrency);
	return price || course.prices?.find((p) => (p.currency || '').toLowerCase() === 'usd')!;
}
