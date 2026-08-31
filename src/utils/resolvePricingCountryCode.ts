/**
 * Resolve which country drives course/document pricing.
 * Prefer persisted user country, then geo, then fallback.
 */
export function resolvePricingCountryCode(
	userCountryCode?: string | null,
	geoCountryCode?: string | null,
	fallback: string = 'US'
): string {
	const raw = (userCountryCode || geoCountryCode || fallback || 'US').trim();
	return raw.toUpperCase();
}
