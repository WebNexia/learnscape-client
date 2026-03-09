import { Consultation, ConsultationPrice } from '../interfaces/consultation';

const countryCurrencyMap: Record<string, 'gbp' | 'usd' | 'eur' | 'try'> = {
	GB: 'gbp',
	US: 'usd',
	EU: 'eur',
	TR: 'try',
};

export function getConsultationPriceForCountry(
	consultation: Consultation,
	countryCode?: string | null
): ConsultationPrice | null {
	if (!consultation?.prices?.length) {
		return null;
	}

	const preferredCurrency = countryCurrencyMap[(countryCode || '').toUpperCase()] || 'usd';

	return (
		consultation.prices.find((price) => price.currency === preferredCurrency) ||
		consultation.prices.find((price) => price.currency === 'usd') ||
		consultation.prices[0]
	);
}
