var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import fs from 'fs';
import path from 'path';
import { loadEnv } from 'vite';
function fullSeoTitle(seoTitle) {
    return seoTitle.includes('Aden Academy') ? seoTitle : "".concat(seoTitle, " | Aden Academy");
}
function loadPages(root) {
    var filePath = path.resolve(root, 'src/seo/publicPageMeta.json');
    var pages = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return Object.values(pages);
}
function publicCanonicalOrigin(envUrl) {
    var fallback = 'https://adenacademy.co.uk';
    if (!envUrl)
        return fallback;
    try {
        var url = new URL(envUrl);
        if (url.protocol !== 'https:' || url.hostname === 'localhost' || url.hostname === '127.0.0.1')
            return fallback;
        return envUrl.replace(/\/$/, '');
    }
    catch (_a) {
        return fallback;
    }
}
function pageForPath(pages, pathname) {
    var clean = pathname.split('?')[0].replace(/\/index\.html$/, '').replace(/\/$/, '') || '/';
    return pages.find(function (page) { return page.path === clean; });
}
function escapeHtml(value) {
    return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
function seoBlock(page, siteUrl) {
    var title = fullSeoTitle(page.seoTitle);
    var url = page.path === '/' ? "".concat(siteUrl, "/") : "".concat(siteUrl).concat(page.path);
    return [
        '<!-- public-seo -->',
        "<link rel=\"canonical\" href=\"".concat(escapeHtml(url), "\" />"),
        '<meta property="og:type" content="website" />',
        "<meta property=\"og:title\" content=\"".concat(escapeHtml(title), "\" />"),
        "<meta property=\"og:description\" content=\"".concat(escapeHtml(page.description), "\" />"),
        "<meta property=\"og:url\" content=\"".concat(escapeHtml(url), "\" />"),
        '<meta property="og:site_name" content="Aden Academy" />',
        '<meta property="og:locale" content="tr_TR" />',
        '<!-- /public-seo -->',
    ].join('\n\t\t');
}
export function applyPublicPageMeta(html, page, siteUrl) {
    var title = fullSeoTitle(page.seoTitle);
    var withTitle = html.replace(/<title>[\s\S]*?<\/title>/, "<title>".concat(escapeHtml(title), "</title>"));
    var withDescription = withTitle.replace(/<meta\b[^>]*\bname="description"[^>]*>/, "<meta name=\"description\" content=\"".concat(escapeHtml(page.description), "\" />"));
    var block = seoBlock(page, siteUrl);
    if (withDescription.includes('<!-- public-seo -->')) {
        return withDescription.replace(/<!-- public-seo -->[\s\S]*?<!-- \/public-seo -->/, block);
    }
    return withDescription.replace('</head>', "\t\t".concat(block, "\n\t</head>"));
}
export function publicPageMetaPlugin() {
    var siteUrl = 'https://adenacademy.co.uk';
    var indexHtmlPath = '';
    var builtIndexPath = '';
    var pages = [];
    return {
        name: 'public-page-meta',
        configResolved: function (config) {
            var env = loadEnv(config.mode, config.root, '');
            siteUrl = publicCanonicalOrigin(env.VITE_SITE_URL);
            indexHtmlPath = path.resolve(config.root, 'index.html');
            builtIndexPath = path.resolve(config.root, config.build.outDir, 'index.html');
            pages = loadPages(config.root);
        },
        transformIndexHtml: {
            order: 'pre',
            handler: function (html, ctx) {
                var _a, _b;
                var home = (_a = pages.find(function (page) { return page.path === '/'; })) !== null && _a !== void 0 ? _a : pages[0];
                var page = (_b = pageForPath(pages, ctx.path || ctx.filename || '/')) !== null && _b !== void 0 ? _b : home;
                return applyPublicPageMeta(html, page, siteUrl);
            },
        },
        configureServer: function (server) {
            var _this = this;
            server.middlewares.use(function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
                var page, raw, html, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            page = pageForPath(pages, req.url || '/');
                            if (!page || page.path === '/') {
                                next();
                                return [2 /*return*/];
                            }
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            raw = fs.readFileSync(indexHtmlPath, 'utf8');
                            return [4 /*yield*/, server.transformIndexHtml(page.path, raw)];
                        case 2:
                            html = _a.sent();
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'text/html');
                            res.end(html);
                            return [3 /*break*/, 4];
                        case 3:
                            error_1 = _a.sent();
                            next(error_1);
                            return [3 /*break*/, 4];
                        case 4: return [2 /*return*/];
                    }
                });
            }); });
        },
        closeBundle: function () {
            if (!fs.existsSync(builtIndexPath))
                return;
            var source = fs.readFileSync(builtIndexPath, 'utf8');
            for (var _i = 0, pages_1 = pages; _i < pages_1.length; _i++) {
                var page = pages_1[_i];
                if (page.path === '/')
                    continue;
                var filePath = path.resolve(path.dirname(builtIndexPath), page.path.slice(1), 'index.html');
                fs.mkdirSync(path.dirname(filePath), { recursive: true });
                fs.writeFileSync(filePath, applyPublicPageMeta(source, page, siteUrl));
            }
        },
    };
}
