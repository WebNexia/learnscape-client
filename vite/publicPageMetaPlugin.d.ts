import type { Plugin } from 'vite';
type PublicPageMeta = {
    path: string;
    seoTitle: string;
    description: string;
};
export declare function applyPublicPageMeta(html: string, page: PublicPageMeta, siteUrl: string): string;
export declare function publicPageMetaPlugin(): Plugin;
export {};
