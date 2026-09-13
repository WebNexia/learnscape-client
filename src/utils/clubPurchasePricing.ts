import { ClubPack } from '../interfaces/club';
import { setCurrencySymbol } from './setCurrencySymbol';
import { LP_QA_PREVIEW_SEGMENT } from './lpQaPreview';

const countryCurrencyMap: Record<string, string> = {
	GB: 'gbp',
	US: 'usd',
	EU: 'eur',
	TR: 'try',
};

export function pickPackPrice(pack: ClubPack, countryCode?: string | null) {
	const preferred = countryCurrencyMap[(countryCode || '').toUpperCase()] || 'usd';
	return (
		pack.prices.find((p) => p.currency?.toLowerCase() === preferred) ||
		pack.prices.find((p) => p.currency?.toLowerCase() === 'usd') ||
		pack.prices[0]
	);
}

export function resolveClientPurchasePrice(packs: ClubPack[] | undefined, sessionCount: number, countryCode?: string | null) {
	const count = Math.floor(Number(sessionCount));
	if (!Number.isFinite(count) || count < 1) {
		return { ok: false as const, message: 'En az 1 oturum seçin.' };
	}
	const list = packs || [];
	const exact = list.find((p) => p.sessionCount === count);
	if (exact) {
		const price = pickPackPrice(exact, countryCode);
		if (!price) return { ok: false as const, message: 'Bu paket için fiyat yok.' };
		const amount = parseFloat(String(price.amount).replace(',', '.'));
		if (!Number.isFinite(amount) || amount <= 0) return { ok: false as const, message: 'Geçersiz fiyat.' };
		return {
			ok: true as const,
			amount,
			currency: price.currency,
			pricingMode: 'exact_pack' as const,
			label: exact.label || `${count} oturum paketi`,
		};
	}
	const unit = list.find((p) => p.sessionCount === 1);
	if (!unit) {
		return { ok: false as const, message: '1 oturum fiyatı tanımlı değil.' };
	}
	const unitPrice = pickPackPrice(unit, countryCode);
	if (!unitPrice) return { ok: false as const, message: '1 oturum fiyatı yok.' };
	const unitAmount = parseFloat(String(unitPrice.amount).replace(',', '.'));
	if (!Number.isFinite(unitAmount) || unitAmount <= 0) return { ok: false as const, message: 'Geçersiz birim fiyat.' };
	return {
		ok: true as const,
		amount: Math.round(unitAmount * count * 100) / 100,
		currency: unitPrice.currency,
		pricingMode: 'unit_times_count' as const,
		label: `${count} × ${setCurrencySymbol(unitPrice.currency)}${unitPrice.amount}`,
		unitAmount,
	};
}

export function clubPaymentPath(club: { title?: string; _id: string }, isQaPreview?: boolean) {
	const base = `/landing-page-clubs/${encodeURIComponent(club.title || '')}/${club._id}/payment`;
	return isQaPreview ? `${base}/${LP_QA_PREVIEW_SEGMENT}` : base;
}

export function clubDetailPath(club: { title?: string; _id: string }, isQaPreview?: boolean) {
	const base = `/landing-page-clubs/${encodeURIComponent(club.title || '')}/${club._id}`;
	return isQaPreview ? `${base}/${LP_QA_PREVIEW_SEGMENT}` : base;
}
