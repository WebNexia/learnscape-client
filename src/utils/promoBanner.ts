export const PROMO_BANNER_LIMITS = {
	title: 100,
	body: 600,
	buttonLabel: 40,
	buttonUrl: 500,
} as const;

export interface PromoBanner {
	enabled: boolean;
	title: string;
	body: string;
	buttonLabel: string;
	buttonUrl: string;
}

export const emptyPromoBanner = (): PromoBanner => ({
	enabled: false,
	title: '',
	body: '',
	buttonLabel: '',
	buttonUrl: '',
});

export const coercePromoBanner = (value?: Partial<PromoBanner> | null): PromoBanner => ({
	enabled: value?.enabled === true,
	title: value?.title || '',
	body: value?.body || '',
	buttonLabel: value?.buttonLabel || '',
	buttonUrl: value?.buttonUrl || '',
});

export const isPromoBannerActive = (value?: Partial<PromoBanner> | null): boolean => {
	if (!value || value.enabled !== true) return false;
	return Boolean((value.title || '').trim() || (value.body || '').trim());
};

const isSafePromoUrl = (url: string) => {
	if (!url) return true;
	if (url.startsWith('/')) {
		return url.length > 1 && !url.startsWith('//') && !/[\s\\]/.test(url);
	}
	try {
		const parsed = new URL(url);
		return parsed.protocol === 'http:' || parsed.protocol === 'https:';
	} catch {
		return false;
	}
};

export const promoBannerError = (value: PromoBanner): string | null => {
	const title = value.title.trim();
	const body = value.body.trim();
	const buttonLabel = value.buttonLabel.trim();
	const buttonUrl = value.buttonUrl.trim();

	if (title.length > PROMO_BANNER_LIMITS.title) {
		return `Announcement title cannot exceed ${PROMO_BANNER_LIMITS.title} characters`;
	}
	if (body.length > PROMO_BANNER_LIMITS.body) {
		return `Announcement text cannot exceed ${PROMO_BANNER_LIMITS.body} characters`;
	}
	if (buttonLabel.length > PROMO_BANNER_LIMITS.buttonLabel) {
		return `Button label cannot exceed ${PROMO_BANNER_LIMITS.buttonLabel} characters`;
	}
	if (buttonUrl.length > PROMO_BANNER_LIMITS.buttonUrl) {
		return `Button link cannot exceed ${PROMO_BANNER_LIMITS.buttonUrl} characters`;
	}
	if (buttonLabel && !buttonUrl) return 'Announcement button needs a link';
	if (buttonUrl && !buttonLabel) return 'Announcement link needs a button label';
	if (!isSafePromoUrl(buttonUrl)) {
		return 'Announcement link must be an http(s) URL or a site path starting with /';
	}
	return null;
};

export const promoBannerVersion = (value?: Partial<PromoBanner> | null) =>
	[value?.title || '', value?.body || '', value?.buttonLabel || '', value?.buttonUrl || '', value?.enabled ? '1' : '0'].join('\u0001');

export const promoDismissStorageKey = (scope: string, version: string) => {
	let hash = 0;
	for (let i = 0; i < version.length; i++) {
		hash = (Math.imul(31, hash) + version.charCodeAt(i)) | 0;
	}
	return `ls-promo:${scope}:${hash}`;
};
