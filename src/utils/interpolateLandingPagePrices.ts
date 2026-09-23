import { Price, SingleCourse } from '../interfaces/course';
import { getOriginalPriceForCountry, getPriceFromList } from './getPriceForCountry';
import { setCurrencySymbol } from './setCurrencySymbol';

const FROM_COUNTRY_PHRASE: Record<string, string> = {
	TR: "Türkiye'den katılanlar",
	GB: "Birleşik Krallık'tan katılanlar",
	US: "ABD'den katılanlar",
};

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function isEmptyAmount(amount?: string): boolean {
	const raw = String(amount ?? '').trim();
	return raw === '' || raw.toLowerCase() === 'free' || raw === '0';
}

/** Landing-page display: 15.000 TL / £1,200 / $490 */
export function formatLandingPagePrice(price: Price | undefined): string {
	if (!price || isEmptyAmount(price.amount)) return '';

	const numeric = parseFloat(String(price.amount).replace(/,/g, ''));
	if (!Number.isFinite(numeric)) {
		return `${setCurrencySymbol(price.currency)}${price.amount}`;
	}

	const currency = (price.currency || '').toLowerCase();
	if (currency === 'try') {
		return `${Math.round(numeric).toLocaleString('tr-TR')} TL`;
	}

	return `${setCurrencySymbol(currency)}${numeric.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export function getFromCountryPhrase(countryCode?: string | null, countryName?: string | null): string {
	const code = (countryCode || '').toUpperCase();
	if (FROM_COUNTRY_PHRASE[code]) return FROM_COUNTRY_PHRASE[code];
	if (countryName) return `${countryName}'den katılanlar`;
	return 'yurtdışından katılanlar';
}

const HIDDEN_CURRENCY_AMOUNT_RE = /(?:£|\$|€|₺)\s*[\d.,]+|[\d.]+\s*(?:TL|GBP|USD|EUR)\b/gi;

export function interpolateLandingPagePricePlaceholders(
	html: string,
	course: Pick<SingleCourse, 'prices' | 'originalPrices' | 'hidePrices'>,
	countryCode?: string | null,
	countryName?: string | null
): string {
	if (typeof html !== 'string') return html;

	const hidePrices = Boolean(course.hidePrices);
	let result = html;

	if (html.includes('{{')) {
		const selling = hidePrices ? '' : formatLandingPagePrice(getPriceFromList(course.prices, countryCode || 'US'));
		const original = hidePrices ? '' : formatLandingPagePrice(getOriginalPriceForCountry(course, countryCode || 'US'));
		const fromCountry = getFromCountryPhrase(countryCode, countryName);

		const values: Record<string, string> = {
			originalprice: original,
			launchprice: selling,
			price: selling,
			fromcountry: fromCountry,
		};

		result = html.replace(/\{\{\s*(originalPrice|launchPrice|price|fromCountry)\s*\}\}/gi, (_match, token: string) =>
			escapeHtml(values[token.toLowerCase()] ?? '')
		);
	}

	if (hidePrices) {
		result = result.replace(HIDDEN_CURRENCY_AMOUNT_RE, '');
	}

	return result;
}
