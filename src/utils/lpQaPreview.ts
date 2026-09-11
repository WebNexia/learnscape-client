/** Manual LP visual preview suffix — not linked from nav; append by hand. */
export const LP_QA_PREVIEW_SEGMENT = 'qa-test';

export function isLpQaPreviewPath(pathname: string | null | undefined): boolean {
	if (!pathname) return false;
	const normalized = pathname.replace(/\/+$/, '') || '/';
	if (normalized === `/${LP_QA_PREVIEW_SEGMENT}`) return true;
	return normalized.endsWith(`/${LP_QA_PREVIEW_SEGMENT}`);
}

/** Strip `/qa-test` for canonical SEO URLs. */
export function stripLpQaPreviewPath(pathname: string): string {
	const normalized = pathname.replace(/\/+$/, '') || '/';
	if (normalized === `/${LP_QA_PREVIEW_SEGMENT}`) return '/';
	if (normalized.endsWith(`/${LP_QA_PREVIEW_SEGMENT}`)) {
		const stripped = normalized.slice(0, -(LP_QA_PREVIEW_SEGMENT.length + 1));
		return stripped || '/';
	}
	return pathname;
}

export function withLpQaPreviewQuery(params?: URLSearchParams | Record<string, string>): string {
	const search = params instanceof URLSearchParams ? new URLSearchParams(params) : new URLSearchParams(params || {});
	search.set('qaPreview', '1');
	return search.toString();
}
