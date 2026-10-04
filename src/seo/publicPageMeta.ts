import pageMeta from './publicPageMeta.json';

export type PublicPageMeta = {
	path: string;
	seoTitle: string;
	description: string;
};

export const PUBLIC_PAGE_META = pageMeta;

export const PUBLIC_PAGES = Object.values(PUBLIC_PAGE_META);

export function fullSeoTitle(seoTitle: string) {
	return seoTitle.includes('Aden Academy') ? seoTitle : `${seoTitle} | Aden Academy`;
}

export function publicPageForPath(pathname: string) {
	const path = pathname.split('?')[0].replace(/\/index\.html$/, '').replace(/\/$/, '') || '/';
	return PUBLIC_PAGES.find((page) => page.path === path);
}
