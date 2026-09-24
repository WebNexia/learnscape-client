interface StructuredDataProps {
	type: 'Organization' | 'Course' | 'WebSite' | 'BreadcrumbList' | 'FAQPage' | 'ContactPage' | 'WebPage';
	data?: any;
}

// Helper function to get base URL from environment variable
const getBaseUrl = (): string => {
	return import.meta.env.VITE_SITE_URL || 'https://adenacademy.co.uk';
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
					'name': 'Aden Academy',
					'url': baseUrl,
					'logo': `${baseUrl}/logo.png`,
					'description':
						'Aden Academy ile online İngilizce eğitiminin ayrıcalıklarını keşfedin. Uzman eğitmenler ve esnek programlarla İngilizce becerilerinizi hızla geliştirin.',
					'foundingDate': '2024',
					'email': 'info@adenacademy.co.uk',
					'contactPoint': {
						'@type': 'ContactPoint',
						'telephone': '+44-7864-813752',
						'email': 'info@adenacademy.co.uk',
						'contactType': 'customer service',
						'availableLanguage': ['Turkish', 'English'],
					},
					'address': {
						'@type': 'PostalAddress',
						'streetAddress': '124 City Road',
						'addressLocality': 'London',
						'postalCode': 'EC1V 2NX',
						'addressCountry': 'GB',
					},
					'sameAs': ['https://www.instagram.com/learnwithlondoner/'],
				};

			case 'WebSite':
				return {
					'@context': 'https://schema.org',
					'@type': 'WebSite',
					'name': 'Aden Academy',
					'url': baseUrl,
					'description':
						'Aden Academy ile online İngilizce eğitiminin ayrıcalıklarını keşfedin. Uzman eğitmenler ve esnek programlarla İngilizce becerilerinizi hızla geliştirin.',
					'inLanguage': 'tr',
					'publisher': {
						'@type': 'Organization',
						'name': 'Aden Academy',
						'url': baseUrl,
					},
				};

			case 'Course':
				return {
					'@context': 'https://schema.org',
					'@type': 'Course',
					'@id': data?.url || `${baseUrl}/course/${data?.slug}`,
					'name': data?.title || 'Course',
					'description': data?.description || 'Online course on Aden Academy',
					'provider': {
						'@type': 'Organization',
						'name': 'Aden Academy',
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
						'name': data?.instructor || 'Aden Academy Instructor',
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
					'name': 'İletişim',
					'description':
						'Aden Academy ile iletişime geçin. Kurslar, kayıt ve destek için formu doldurun veya info@adenacademy.co.uk adresine yazın.',
					'url': data?.url || `${baseUrl}/contact-us`,
					'mainEntity': {
						'@type': 'Organization',
						'name': 'Aden Academy',
						'url': baseUrl,
						'email': 'info@adenacademy.co.uk',
						'contactPoint': [
							{
								'@type': 'ContactPoint',
								'telephone': '+44-7864-813752',
								'email': 'info@adenacademy.co.uk',
								'contactType': 'customer service',
								'availableLanguage': ['Turkish', 'English'],
								'areaServed': 'Worldwide',
							},
						],
						'address': {
							'@type': 'PostalAddress',
							'streetAddress': '124 City Road',
							'addressLocality': 'London',
							'postalCode': 'EC1V 2NX',
							'addressCountry': 'GB',
						},
					},
				};

			case 'WebPage':
				return {
					'@context': 'https://schema.org',
					'@type': 'WebPage',
					'@id': data?.url || baseUrl,
					'name': data?.name || 'Aden Academy Page',
					'description': data?.description || 'Aden Academy online learning platform',
					'url': data?.url || baseUrl,
					'isPartOf': {
						'@type': 'WebSite',
						'name': 'Aden Academy',
						'url': baseUrl,
					},
					'datePublished': data?.datePublished,
					'dateModified': data?.dateModified,
					'author': {
						'@type': 'Organization',
						'name': 'Aden Academy',
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
