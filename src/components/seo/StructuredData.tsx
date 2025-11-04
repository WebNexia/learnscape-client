interface StructuredDataProps {
	type: 'Organization' | 'Course' | 'WebSite' | 'BreadcrumbList' | 'FAQPage' | 'ContactPage' | 'WebPage';
	data?: any;
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

const StructuredData = ({ type, data }: StructuredDataProps) => {
	const getStructuredData = () => {
		const baseUrl = getBaseUrl();

		switch (type) {
			case 'Organization':
				return {
					'@context': 'https://schema.org',
					'@type': 'Organization',
					'name': 'LearnScape',
					'url': baseUrl,
					'logo': `${baseUrl}/logo.png`,
					'description':
						'LearnScape is a comprehensive online learning platform offering courses, quizzes, and interactive content for students and professionals.',
					'foundingDate': '2024',
					'contactPoint': {
						'@type': 'ContactPoint',
						'telephone': '+1-555-LEARN',
						'contactType': 'customer service',
						'availableLanguage': 'English',
					},
					'sameAs': ['https://twitter.com/learnscape', 'https://linkedin.com/company/learnscape', 'https://facebook.com/learnscape'],
				};

			case 'WebSite':
				return {
					'@context': 'https://schema.org',
					'@type': 'WebSite',
					'name': 'LearnScape',
					'url': baseUrl,
					'description': 'Online learning platform with courses, quizzes, and interactive content',
					'potentialAction': {
						'@type': 'SearchAction',
						'target': {
							'@type': 'EntryPoint',
							'urlTemplate': `${baseUrl}/search?q={search_term_string}`,
						},
						'query-input': 'required name=search_term_string',
					},
				};

			case 'Course':
				return {
					'@context': 'https://schema.org',
					'@type': 'Course',
					'@id': data?.url || `${baseUrl}/course/${data?.slug}`,
					'name': data?.title || 'Course',
					'description': data?.description || 'Online course on LearnScape',
					'provider': {
						'@type': 'Organization',
						'name': 'LearnScape',
						'url': baseUrl,
					},
					'courseCode': data?.courseCode,
					'educationalLevel': data?.level || 'Beginner',
					'inLanguage': 'en-US',
					'isAccessibleForFree': data?.isFree || false,
					'url': data?.url || baseUrl,
					'image': data?.image ? getAbsoluteUrl(data.image) : `${baseUrl}/course-default.jpg`,
					'dateCreated': data?.createdAt,
					'dateModified': data?.updatedAt,
					'author': {
						'@type': 'Person',
						'name': data?.instructor || 'LearnScape Instructor',
					},
					'sameAs': data?.extraLinks || [],
				};

			case 'BreadcrumbList':
				return {
					'@context': 'https://schema.org',
					'@type': 'BreadcrumbList',
					'@id': data?.url || `${baseUrl}${typeof window !== 'undefined' ? window.location.pathname : ''}`,
					'itemListElement':
						data?.breadcrumbs?.map((item: any, index: number) => ({
							'@type': 'ListItem',
							'position': index + 1,
							'name': item.name,
							'item': item.url ? getAbsoluteUrl(item.url) : item.url,
						})) || [],
				};

			case 'FAQPage':
				return {
					'@context': 'https://schema.org',
					'@type': 'FAQPage',
					'mainEntity':
						data?.faqs?.map((faq: any) => ({
							'@type': 'Question',
							'name': faq.question,
							'acceptedAnswer': {
								'@type': 'Answer',
								'text': faq.answer,
							},
						})) || [],
				};

			case 'ContactPage':
				return {
					'@context': 'https://schema.org',
					'@type': 'ContactPage',
					'@id': data?.url || `${baseUrl}/contact-us`,
					'name': 'Contact LearnScape',
					'description':
						'Get in touch with LearnScape for support, inquiries, or partnerships. Reach out to our team for assistance with courses, technical issues, or business opportunities.',
					'url': data?.url || `${baseUrl}/contact-us`,
					'mainEntity': {
						'@type': 'Organization',
						'name': 'LearnScape',
						'url': baseUrl,
						'contactPoint': [
							{
								'@type': 'ContactPoint',
								'telephone': '+1-555-LEARN',
								'contactType': 'customer service',
								'availableLanguage': 'English',
								'areaServed': 'Worldwide',
							},
							{
								'@type': 'ContactPoint',
								'contactType': 'technical support',
								'availableLanguage': 'English',
								'areaServed': 'Worldwide',
							},
						],
						'address': {
							'@type': 'PostalAddress',
							'addressCountry': 'US',
						},
					},
				};

			case 'WebPage':
				return {
					'@context': 'https://schema.org',
					'@type': 'WebPage',
					'@id': data?.url || baseUrl,
					'name': data?.name || 'LearnScape Page',
					'description': data?.description || 'LearnScape online learning platform',
					'url': data?.url || baseUrl,
					'isPartOf': {
						'@type': 'WebSite',
						'name': 'LearnScape',
						'url': baseUrl,
					},
					'datePublished': data?.datePublished,
					'dateModified': data?.dateModified,
					'author': {
						'@type': 'Organization',
						'name': 'LearnScape',
					},
				};

			default:
				return null;
		}
	};

	const structuredData = getStructuredData();

	if (!structuredData) return null;

	return <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />;
};

export default StructuredData;
