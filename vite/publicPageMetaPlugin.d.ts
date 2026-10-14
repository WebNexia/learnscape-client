import type { Plugin } from 'vite';
type PublicPageMeta = {
    path: string;
    seoTitle: string;
    description: string;
    paragraphs?: string[];
};
export declare function applyPublicPageMeta(html: string, page: PublicPageMeta, siteUrl: string, pages?: PublicPageMeta[]): string;
export declare function publicPageMetaPlugin(): Plugin;
export {};
