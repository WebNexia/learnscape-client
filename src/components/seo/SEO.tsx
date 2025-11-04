import { Helmet } from 'react-helmet-async';

interface SEOProps {
	title?: string;
	description?: string;
	keywords?: string;
	image?: string;
	url?: string;
	type?: 'website' | 'article';
	author?: string;
	publishedTime?: string;
	modifiedTime?: string;
	section?: string;
	tags?: string[];
}

// Helper function to get base URL from environment variable
const getBaseUrl = (): string => {
	return import.meta.env.VITE_SITE_URL || 'https://learnscape-qa.netlify.app';
};

// Helper function to convert relative URLs to absolute URLs
const getAbsoluteUrl = (url: string): string => {
	if (!url) return '';
	// If already absolute, return as is
	if (url.startsWith('http://') || url.startsWith('https://')) {
		return url;
	}
	// If relative, prepend base URL
	const baseUrl = getBaseUrl();
	return url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
};

const SEO = ({
	title = 'LearnScape - Online Learning Platform',
	description = 'LearnScape is a comprehensive online learning platform offering courses, quizzes, and interactive content for students and professionals.',
	keywords = 'online learning, courses, education, e-learning, LearnScape, interactive learning, online education',
	image = '/og-image.jpg',
	url,
	type = 'website',
	author = 'LearnScape',
	publishedTime,
	modifiedTime,
	section,
	tags = [],
}: SEOProps) => {
	const baseUrl = getBaseUrl();
	const fullTitle = title.includes('LearnScape') ? title : `${title} | LearnScape`;
	// Cleaner fullKeywords (no trailing comma if tags=[])
	const fullKeywords = tags.length ? `${keywords}, ${tags.join(', ')}` : keywords;

	// Use provided URL or default to base URL with current path
	const canonicalUrl = url || (typeof window !== 'undefined' ? `${baseUrl}${window.location.pathname}` : baseUrl);

	// Ensure image URL is absolute
	const absoluteImageUrl = getAbsoluteUrl(image);

	return (
		<Helmet>
			{/* Basic Meta Tags */}
			<title>{fullTitle}</title>
			<meta name='description' content={description} />
			<meta name='keywords' content={fullKeywords} />
			<meta name='author' content={author} />
			<meta name='robots' content='index, follow' />
			<link rel='canonical' href={canonicalUrl} />

			{/* Open Graph / Facebook */}
			<meta property='og:type' content={type} />
			<meta property='og:title' content={fullTitle} />
			<meta property='og:description' content={description} />
			<meta property='og:image' content={absoluteImageUrl} />
			<meta property='og:url' content={canonicalUrl} />
			<meta property='og:site_name' content='LearnScape' />
			<meta property='og:locale' content='en_US' />

			{/* Twitter */}
			<meta name='twitter:card' content='summary_large_image' />
			<meta name='twitter:title' content={fullTitle} />
			<meta name='twitter:description' content={description} />
			<meta name='twitter:image' content={absoluteImageUrl} />
			<meta name='twitter:site' content='@learnscape' />
			<meta name='twitter:creator' content='@learnscape' />

			{/* Optional but nice: accessibility + richer preview */}
			<meta property='og:image:alt' content={`${fullTitle} preview image`} />
			<meta name='twitter:image:alt' content={`${fullTitle} preview image`} />

			{/* Additional Meta Tags */}
			<meta name='viewport' content='width=device-width, initial-scale=1.0' />
			<meta name='theme-color' content='#2C3E50' />
			<meta name='msapplication-TileColor' content='#2C3E50' />

			{/* Article specific meta tags */}
			{type === 'article' && publishedTime && <meta property='article:published_time' content={publishedTime} />}
			{type === 'article' && modifiedTime && <meta property='article:modified_time' content={modifiedTime} />}
			{type === 'article' && author && <meta property='article:author' content={author} />}
			{type === 'article' && section && <meta property='article:section' content={section} />}
			{type === 'article' && tags.length > 0 && tags.map((tag, index) => <meta key={index} property='article:tag' content={tag} />)}
		</Helmet>
	);
};

export default SEO;
