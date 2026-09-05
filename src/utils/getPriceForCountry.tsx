import { Price, SingleCourse } from '../interfaces/course';

export type CourseCurrency = 'gbp' | 'usd' | 'eur' | 'try';

const countryCurrencyMap: { [key: string]: CourseCurrency } = {
	GB: 'gbp',
	US: 'usd',
	EU: 'eur',
	TR: 'try',
};

export function getCurrencyForCountry(countryCode: string): CourseCurrency {
	return countryCurrencyMap[(countryCode || '').toUpperCase()] || 'usd';
}

export function getPriceFromList(prices: Price[] | undefined, countryCode: string): Price | undefined {
	if (!prices?.length) return undefined;

	const preferredCurrency = getCurrencyForCountry(countryCode);
	return (
		prices.find((p) => (p.currency || '').toLowerCase() === preferredCurrency) ||
		prices.find((p) => (p.currency || '').toLowerCase() === 'usd')
	);
}

export function getPriceForCountry(course: SingleCourse, countryCode: string): Price {
	return getPriceFromList(course.prices, countryCode)!;
}

export function getOriginalPriceForCountry(
	course: Pick<SingleCourse, 'originalPrices'>,
	countryCode: string
): Price | undefined {
	return getPriceFromList(course.originalPrices, countryCode);
}

function isEmptyPriceAmount(amount?: string): boolean {
	const raw = String(amount ?? '').trim();
	return raw === '' || raw.toLowerCase() === 'free' || raw === '0';
}

/** List / "normal" price when it differs from the selling price for this country. */
export function getListPriceIfDifferent(
	course: Pick<SingleCourse, 'prices' | 'originalPrices'>,
	countryCode: string
): Price | undefined {
	const selling = getPriceFromList(course.prices, countryCode);
	const original = getOriginalPriceForCountry(course, countryCode);
	if (!original || isEmptyPriceAmount(original.amount)) return undefined;
	if (selling && original.amount === selling.amount) return undefined;
	return original;
}
