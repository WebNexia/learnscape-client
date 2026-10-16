export const DEFAULT_PROCESSING_FEE_PERCENT = 4;

export function resolveProcessingFeePercent(stored: number | string | null | undefined) {
	if (stored === null || stored === undefined || stored === '') return DEFAULT_PROCESSING_FEE_PERCENT;
	const parsed = typeof stored === 'number' ? stored : parseFloat(String(stored).replace(',', '.'));
	if (!Number.isFinite(parsed) || parsed < 0) return DEFAULT_PROCESSING_FEE_PERCENT;
	return parsed;
}

export function applyProcessingFee(baseAmount: number, storedPercent?: number | string | null) {
	const base = Math.round(Math.max(0, Number(baseAmount) || 0) * 100) / 100;
	const processingFeePercent = resolveProcessingFeePercent(storedPercent);
	const processingFee = base <= 0 ? 0 : Math.round(((base * processingFeePercent) / 100) * 100) / 100;
	return {
		baseAmount: base,
		processingFeePercent,
		processingFee,
		total: Math.round((base + processingFee) * 100) / 100,
	};
}

export function formatMoneyAmount(value: number) {
	const rounded = Math.round(value * 100) / 100;
	return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}
