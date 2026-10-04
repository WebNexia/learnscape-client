import fs from 'fs';
import path from 'path';
import type { Plugin } from 'vite';
import { loadEnv } from 'vite';

type PublicPageMeta = {
	path: string;
	seoTitle: string;
	description: string;
};

function fullSeoTitle(seoTitle: string) {
	return seoTitle.includes('Aden Academy') ? seoTitle : `${seoTitle} | Aden Academy`;
}

function loadPages(root: string) {
	const filePath = path.resolve(root, 'src/seo/publicPageMeta.json');
	const pages = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Record<string, PublicPageMeta>;
	return Object.values(pages);
}

function publicCanonicalOrigin(envUrl: string | undefined) {
	const fallback = 'https://adenacademy.co.uk';
	if (!envUrl) return fallback;
	try {
		const url = new URL(envUrl);
		if (url.protocol !== 'https:' || url.hostname === 'localhost' || url.hostname === '127.0.0.1') return fallback;
		return envUrl.replace(/\/$/, '');
	} catch {
		return fallback;
	}
}

function pageForPath(pages: PublicPageMeta[], pathname: string) {
	const clean = pathname.split('?')[0].replace(/\/index\.html$/, '').replace(/\/$/, '') || '/';
	return pages.find((page) => page.path === clean);
}

function escapeHtml(value: string) {
	return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function seoBlock(page: PublicPageMeta, siteUrl: string) {
	const title = fullSeoTitle(page.seoTitle);
	const url = page.path === '/' ? `${siteUrl}/` : `${siteUrl}${page.path}`;
	return [
		'<!-- public-seo -->',
		`<link rel="canonical" href="${escapeHtml(url)}" />`,
		'<meta property="og:type" content="website" />',
		`<meta property="og:title" content="${escapeHtml(title)}" />`,
		`<meta property="og:description" content="${escapeHtml(page.description)}" />`,
		`<meta property="og:url" content="${escapeHtml(url)}" />`,
		'<meta property="og:site_name" content="Aden Academy" />',
		'<meta property="og:locale" content="tr_TR" />',
		'<!-- /public-seo -->',
	].join('\n\t\t');
}

export function applyPublicPageMeta(html: string, page: PublicPageMeta, siteUrl: string) {
	const title = fullSeoTitle(page.seoTitle);
	const withTitle = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`);
	const withDescription = withTitle.replace(
		/<meta\b[^>]*\bname="description"[^>]*>/,
		`<meta name="description" content="${escapeHtml(page.description)}" />`,
	);
	const block = seoBlock(page, siteUrl);
	if (withDescription.includes('<!-- public-seo -->')) {
		return withDescription.replace(/<!-- public-seo -->[\s\S]*?<!-- \/public-seo -->/, block);
	}
	return withDescription.replace('</head>', `\t\t${block}\n\t</head>`);
}

export function publicPageMetaPlugin(): Plugin {
	let siteUrl = 'https://adenacademy.co.uk';
	let indexHtmlPath = '';
	let builtIndexPath = '';
	let pages: PublicPageMeta[] = [];

	return {
		name: 'public-page-meta',
		configResolved(config) {
			const env = loadEnv(config.mode, config.root, '');
			siteUrl = publicCanonicalOrigin(env.VITE_SITE_URL);
			indexHtmlPath = path.resolve(config.root, 'index.html');
			builtIndexPath = path.resolve(config.root, config.build.outDir, 'index.html');
			pages = loadPages(config.root);
		},
		transformIndexHtml: {
			order: 'pre',
			handler(html, ctx) {
				const home = pages.find((page) => page.path === '/') ?? pages[0];
				const page = pageForPath(pages, ctx.path || ctx.filename || '/') ?? home;
				return applyPublicPageMeta(html, page, siteUrl);
			},
		},
		configureServer(server) {
			server.middlewares.use(async (req, res, next) => {
				const page = pageForPath(pages, req.url || '/');
				if (!page || page.path === '/') {
					next();
					return;
				}
				try {
					const raw = fs.readFileSync(indexHtmlPath, 'utf8');
					const html = await server.transformIndexHtml(page.path, raw);
					res.statusCode = 200;
					res.setHeader('Content-Type', 'text/html');
					res.end(html);
				} catch (error) {
					next(error);
				}
			});
		},
		closeBundle() {
			if (!fs.existsSync(builtIndexPath)) return;
			const source = fs.readFileSync(builtIndexPath, 'utf8');
			for (const page of pages) {
				if (page.path === '/') continue;
				const filePath = path.resolve(path.dirname(builtIndexPath), page.path.slice(1), 'index.html');
				fs.mkdirSync(path.dirname(filePath), { recursive: true });
				fs.writeFileSync(filePath, applyPublicPageMeta(source, page, siteUrl));
			}
		},
	};
}
