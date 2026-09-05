import { Box, Container, Typography, Paper, Divider, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { useContext, useState, useEffect } from 'react';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import LandingPageLayout from '../components/landingPage/LandingPageLayout';
import theme from '../themes';
import {
	COMPANY_ADDRESS,
	COMPANY_BRAND,
	COMPANY_NAME,
	COMPANY_REGISTRATION_EN,
	COMPANY_REGISTRATION_TR,
	formatLegalLastUpdated,
} from '../constants/legalConstants';

const CONTACT_EMAIL = 'info@adenacademy.co.uk';

const CookiePolicy = () => {
	const { isRotatedMedium, isSmallScreen, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotatedMedium;

	const fontFamilyLandingPage = "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important";

	const [language, setLanguage] = useState<'tr' | 'en'>('tr');

	useEffect(() => {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}, []);

	const handleLanguageChange = (_event: React.MouseEvent<HTMLElement>, newLanguage: 'tr' | 'en' | null) => {
		if (newLanguage !== null) {
			setLanguage(newLanguage);
		}
	};

	const content = {
		tr: {
			title: 'Çerez Politikası',
			subtitle: 'Aden Academy',
			business: `İşletme: ${COMPANY_NAME}`,
			address: COMPANY_ADDRESS,
			registration: COMPANY_REGISTRATION_TR,
			brand: `Marka: ${COMPANY_BRAND}`,
			lastUpdated: 'Son güncelleme:',
			section1Title: '1. Çerezler Nedir?',
			section1Content:
				'Çerezler, web sitemizi ziyaret ettiğinizde cihazınıza yerleştirilen küçük metin dosyalarıdır. Tercihlerinizi hatırlayarak ve belirli özellikleri etkinleştirerek size daha iyi bir deneyim sunmamıza yardımcı olurlar.',
			section2Title: '2. Kullandığımız Çerez Türleri',
			section2_1Title: '2.1 Zorunlu Çerezler (Gerekli)',
			section2_1Content:
				'Bu çerezler web sitesinin düzgün çalışması için gereklidir. Kimlik doğrulama, güvenlik ve ödeme işleme gibi temel işlevleri etkinleştirirler. Bu çerezler web sitesinin çalışması için zorunlu olduğundan devre dışı bırakılamaz.',
			essentialCookies: [
				{
					title: 'Firebase Kimlik Doğrulama:',
					description:
						'Giriş oturumunuzu sürdürmek ve kimliğinizin doğrulanmış kalmasını sağlamak için kullanılır. Hesabınıza ve ders materyallerinize erişmek için gereklidir.',
				},
				{
					title: 'Stripe Güvenlik Çerezleri:',
					description:
						'Güvenli ödeme işleme ve dolandırıcılık önleme için kullanılır. Ödemelerinizin güvenli bir şekilde işlenmesi için bu çerezler gereklidir.',
				},
				{
					title: 'Google reCAPTCHA:',
					description:
						'Web sitemizi spam ve kötüye kullanımdan korumak için kullanılır. Bu hizmet, bir insan kullanıcı olduğunuzu doğrulamaya yardımcı olur.',
				},
				{
					title: 'Oturum Yönetimi:',
					description:
						'Sorunsuz bir öğrenme deneyimi sağlamak için oturum zaman damgalarını ve geçici quiz cevaplarını saklamak üzere localStorage kullanıyoruz.',
				},
			],
			section2_2Title: '2.2 İşlevsel Çerezler (İsteğe Bağlı)',
			section2_2Content:
				'Bu çerezler ve localStorage verileri, tercihlerinizi ve ayarlarınızı hatırlayarak deneyiminizi geliştirir. Web sitesinin çalışması için gerekli değillerdir ancak daha kişiselleştirilmiş bir deneyim sunarlar.',
			functionalCookies: [
				{
					title: 'Zoom Meeting SDK:',
					description:
						'Platformumuz aracılığıyla Zoom toplantılarına katıldığınızda toplantı tercihlerinizi, UI ayarlarınızı ve araç çubuğu yapılandırmalarınızı saklar. Bu, sohbet ayarları, katılımcı listesi tercihleri ve kolaylaştırma araçlarını içerir.',
				},
				{
					title: 'TinyMCE Editör:',
					description: 'Dersler ve kurs materyallerinde kullanılan zengin metin editörü için özel renk tercihlerinizi saklar.',
				},
				{
					title: 'Form Gönderim Takibi:',
					description: 'Tekrarlayan form gönderimlerini önler ve form tamamlama durumunuzu hatırlar.',
				},
				{
					title: 'Konum Önbelleği (sessionStorage):',
					description: 'Ülke ve para birimi tercihlerinizi iyileştirmek için IP tabanlı konum bilgisini geçici olarak saklar.',
				},
				{
					title: 'Gömülü Video Platformları:',
					description: 'YouTube, Vimeo ve Dailymotion gibi gömülü videolar kendi çerezlerini ayarlayabilir.',
				},
			],
			section2_3Title: '2.3 Analitik (Birinci Taraf)',
			section2_3Content:
				'Platformda Google Analytics, Meta Pixel veya benzeri reklam/pazarlama izleme araçları kullanılmamaktadır. Trafik ölçümü birinci taraf olarak, kendi sunucumuzda yapılır:',
			analyticsCookies: [
				{
					title: 'Çerezsiz trafik ölçümü (isteğe bağlı çerez gerektirmez):',
					description:
						'Sayfa yolu, yönlendiren site, cihaz türü ve yaklaşık konum (ülke/şehir) kaydedilir. Ham IP adresi saklanmaz; yalnızca hash’lenmiş bir değer kullanılır. Cihazınıza analitik çerezi veya kalıcı ziyaretçi kimliği yazılmaz. Ziyaretçi kimliği her gün yenilenen, sunucu tarafı bir tahmindir. Bu veriler en fazla 180 gün saklanır ve reklam amacıyla paylaşılmaz.',
				},
				{
					title: 'Kalıcı ziyaretçi kimliği (isteğe bağlı):',
					description:
						'İsteğe bağlı çerezleri kabul ederseniz, aynı ziyaretçiyi oturumlar arasında daha doğru ayırt edebilmek için cihazınızda anonim bir kimlik saklanabilir. Reddetmeniz halinde çerezsiz ölçüm devam eder.',
				},
				{
					title: 'Stripe Analitik:',
					description: 'Ödeme kalıplarını analiz etmek ve ödeme hizmetlerimizi iyileştirmek için kullanılır (etkinleştirilmişse).',
				},
			],
			section3Title: '3. Üçüncü Taraf Hizmetler',
			section3Content:
				'Web sitemiz cihazınızda çerez ayarlayabilecek üçüncü taraf hizmetler kullanmaktadır. Bu çerezler üzerinde kontrolümüz yoktur. Daha fazla bilgi için lütfen gizlilik politikalarına bakın:',
			thirdPartyServices: [
				{
					name: 'Firebase (Google):',
					description: 'Kimlik doğrulama ve veritabanı hizmetleri.',
					linkText: 'Firebase Gizlilik Politikası',
					url: 'https://firebase.google.com/support/privacy',
				},
				{
					name: 'Stripe:',
					description: 'Ödeme işleme ve güvenlik.',
					linkText: 'Stripe Gizlilik Politikası',
					url: 'https://stripe.com/privacy',
				},
				{
					name: 'Google reCAPTCHA:',
					description: 'Spam koruması ve güvenlik doğrulaması.',
					linkText: 'Google Gizlilik Politikası',
					url: 'https://policies.google.com/privacy',
				},
				{
					name: 'Zoom Meeting SDK:',
					description: 'Video konferans ve toplantı araçları. Toplantı tercihlerini ve UI ayarlarını saklar.',
					linkText: 'Zoom Gizlilik Politikası',
					url: 'https://explore.zoom.us/en/privacy/',
				},
				{
					name: 'TinyMCE:',
					description: 'Kurs içeriği oluşturma için zengin metin editörü. Özel renk tercihlerini saklar.',
					linkText: 'TinyMCE Gizlilik Politikası',
					url: 'https://www.tiny.cloud/legal/privacy/',
				},
				{
					name: 'YouTube (Google):',
					description: 'Gömülü video oynatma ve etkinlik kayıtları.',
					linkText: 'Google Gizlilik Politikası',
					url: 'https://policies.google.com/privacy',
				},
				{
					name: 'Vimeo:',
					description: 'Gömülü kurs ve ders videoları.',
					linkText: 'Vimeo Gizlilik Politikası',
					url: 'https://vimeo.com/privacy',
				},
				{
					name: 'Dailymotion:',
					description: 'Gömülü video içerikleri.',
					linkText: 'Dailymotion Gizlilik Politikası',
					url: 'https://www.dailymotion.com/legal/privacy',
				},
				{
					name: 'Google Fonts:',
					description: 'Web sitesi tipografisi için font dosyalarının yüklenmesi.',
					linkText: 'Google Gizlilik Politikası',
					url: 'https://policies.google.com/privacy',
				},
				{
					name: 'ipapi.co / ipwho.is:',
					description: 'IP tabanlı konum tespiti (ülke/şehir).',
					linkText: 'ipapi.co Gizlilik Politikası',
					url: 'https://ipapi.co/privacy/',
				},
			],
			section4Title: '4. Çerez Tercihlerinizi Yönetme',
			section4Content: 'Çerez tercihlerinizi şu şekillerde yönetebilirsiniz:',
			managementOptions: [
				"Çerez izin banner'ı göründüğünde çerezleri kabul ederek veya reddederek",
				'Tarayıcınızın çerez ayarlarını temizleyerek (not: bu web sitesi işlevselliğini etkileyebilir)',
				'Tercihlerinizi güncellemek için bizimle iletişime geçerek',
			],
			note: 'İsteğe bağlı çerezleri reddederseniz, web sitesinin düzgün çalışmasını sağlamak için zorunlu çerezler hâlâ kullanılacaktır. Reddetme; Zoom/TinyMCE tercihleri, form gönderim takibi, IP tabanlı konum önbelleği, analitik ziyaretçi kimliği ve tanıtım videosu tercihleri gibi isteğe bağlı verileri temizler. Çerezsiz birinci taraf trafik ölçümü (cihaza analitik kimliği yazmadan) devam edebilir. Gömülü video platformları ve ödeme güvenliği için gerekli üçüncü taraf çerezleri devam edebilir; ancak kurslara erişme, ders alma veya ödeme yapma gibi temel hizmetlerimizi kullanmanızı engellemez.',
			section5Title: '5. Bu Çerez Politikasındaki Değişiklikler',
			section5Content:
				'Bu Çerez Politikasını zaman zaman güncelleyebiliriz. Yeni Çerez Politikasını bu sayfaya yayınlayarak ve "Son güncelleme" tarihini güncelleyerek size herhangi bir değişiklikten haberdar edeceğiz.',
			section6Title: '6. İletişim',
			section6Content: 'Çerez Politikamız hakkında herhangi bir sorunuz varsa bizimle iletişime geçin:',
		},
		en: {
			title: 'Cookie Policy',
			subtitle: 'Aden Academy',
			business: `Business: ${COMPANY_NAME}`,
			address: COMPANY_ADDRESS,
			registration: COMPANY_REGISTRATION_EN,
			brand: `Brand: ${COMPANY_BRAND}`,
			lastUpdated: 'Last updated:',
			section1Title: '1. What Are Cookies?',
			section1Content:
				'Cookies are small text files that are placed on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and enabling certain features.',
			section2Title: '2. Types of Cookies We Use',
			section2_1Title: '2.1 Essential Cookies (Required)',
			section2_1Content:
				'These cookies are necessary for the website to function properly. They enable core functionality such as authentication, security, and payment processing. You cannot disable these cookies as they are essential for the website to work.',
			essentialCookies: [
				{
					title: 'Firebase Authentication:',
					description:
						'Used to maintain your login session and keep you authenticated. This is essential for accessing your account and course materials.',
				},
				{
					title: 'Stripe Security Cookies:',
					description: 'Used for secure payment processing and fraud prevention. These cookies are necessary to process your payments safely.',
				},
				{
					title: 'Google reCAPTCHA:',
					description: 'Used to protect our website from spam and abuse. This service helps verify that you are a human user.',
				},
				{
					title: 'Session Management:',
					description: 'We use localStorage to store session timestamps and temporary quiz answers to ensure a smooth learning experience.',
				},
			],
			section2_2Title: '2.2 Functional Cookies (Optional)',
			section2_2Content:
				'These cookies and localStorage data enhance your experience by remembering your preferences and settings. They are not essential for the website to function but provide a more personalized experience.',
			functionalCookies: [
				{
					title: 'Zoom Meeting SDK:',
					description:
						'Stores your meeting preferences, UI settings, and toolbar configurations when you join Zoom meetings through our platform. This includes chat settings, participant list preferences, and facilitation tools.',
				},
				{
					title: 'TinyMCE Editor:',
					description: 'Stores your custom color preferences for the rich text editor used in lessons and course materials.',
				},
				{
					title: 'Form Submission Tracking:',
					description: 'Prevents duplicate form submissions and remembers your form completion status.',
				},
				{
					title: 'Location Cache (sessionStorage):',
					description: 'Temporarily stores IP-based location information to improve country and currency preferences.',
				},
				{
					title: 'Embedded Video Platforms:',
					description: 'Embedded videos from YouTube, Vimeo, and Dailymotion may set their own cookies.',
				},
			],
			section2_3Title: '2.3 Analytics (First-Party)',
			section2_3Content:
				'The platform does not use Google Analytics, Meta Pixel, or similar advertising/marketing tracking tools. Traffic measurement is first-party and processed on our own servers:',
			analyticsCookies: [
				{
					title: 'Cookieless traffic measurement (no optional cookie required):',
					description:
						'We record the page path, referring site, device type, and approximate location (country/city). The raw IP address is not stored; only a hashed value is kept. We do not write an analytics cookie or a persistent visitor ID to your device. Visitor identity is an on-server estimate that rotates daily. This data is kept for up to 180 days and is not shared for advertising.',
				},
				{
					title: 'Persistent visitor ID (optional):',
					description:
						'If you accept optional cookies, an anonymous identifier may be stored on your device so returning visitors can be distinguished more accurately across sessions. If you decline, cookieless measurement continues.',
				},
				{
					title: 'Stripe Analytics:',
					description: 'Used to analyze payment patterns and improve our payment services (if enabled).',
				},
			],
			section3Title: '3. Third-Party Services',
			section3Content:
				'Our website uses third-party services that may set cookies on your device. We have no control over these cookies. Please refer to their privacy policies for more information:',
			thirdPartyServices: [
				{
					name: 'Firebase (Google):',
					description: 'Authentication and database services.',
					linkText: 'Firebase Privacy Policy',
					url: 'https://firebase.google.com/support/privacy',
				},
				{
					name: 'Stripe:',
					description: 'Payment processing and security.',
					linkText: 'Stripe Privacy Policy',
					url: 'https://stripe.com/privacy',
				},
				{
					name: 'Google reCAPTCHA:',
					description: 'Spam protection and security verification.',
					linkText: 'Google Privacy Policy',
					url: 'https://policies.google.com/privacy',
				},
				{
					name: 'Zoom Meeting SDK:',
					description: 'Video conferencing and meeting tools. Stores meeting preferences and UI settings.',
					linkText: 'Zoom Privacy Policy',
					url: 'https://explore.zoom.us/en/privacy/',
				},
				{
					name: 'TinyMCE:',
					description: 'Rich text editor for course content creation. Stores custom color preferences.',
					linkText: 'TinyMCE Privacy Policy',
					url: 'https://www.tiny.cloud/legal/privacy/',
				},
				{
					name: 'YouTube (Google):',
					description: 'Embedded video playback and event recordings.',
					linkText: 'Google Privacy Policy',
					url: 'https://policies.google.com/privacy',
				},
				{
					name: 'Vimeo:',
					description: 'Embedded course and lesson videos.',
					linkText: 'Vimeo Privacy Policy',
					url: 'https://vimeo.com/privacy',
				},
				{
					name: 'Dailymotion:',
					description: 'Embedded video content.',
					linkText: 'Dailymotion Privacy Policy',
					url: 'https://www.dailymotion.com/legal/privacy',
				},
				{
					name: 'Google Fonts:',
					description: 'Loading font files for website typography.',
					linkText: 'Google Privacy Policy',
					url: 'https://policies.google.com/privacy',
				},
				{
					name: 'ipapi.co / ipwho.is:',
					description: 'IP-based location detection (country/city).',
					linkText: 'ipapi.co Privacy Policy',
					url: 'https://ipapi.co/privacy/',
				},
			],
			section4Title: '4. Managing Your Cookie Preferences',
			section4Content: 'You can manage your cookie preferences at any time by:',
			managementOptions: [
				'Accepting or declining cookies when the cookie consent banner appears',
				"Clearing your browser's cookie settings (note: this may affect website functionality)",
				'Contacting us to update your preferences',
			],
			note: 'If you decline optional cookies, essential cookies will still be used to ensure the website functions properly. Declining clears optional data such as Zoom/TinyMCE preferences, form submission tracking, IP-based location cache, analytics visitor identifiers, and intro video preferences. First-party cookieless traffic measurement (without writing an analytics ID to your device) may continue. Third-party cookies required for embedded video platforms and payment security may still apply; however, this will not prevent you from using our core services such as accessing courses, taking lessons, or making payments.',
			section5Title: '5. Changes to This Cookie Policy',
			section5Content:
				'We may update this Cookie Policy from time to time. We will notify you of any changes by posting the new Cookie Policy on this page and updating the "Last updated" date.',
			section6Title: '6. Contact Us',
			section6Content: 'If you have any questions about our Cookie Policy, please contact us at:',
		},
	};

	const currentContent = content[language];

	return (
		<LandingPageLayout>
			<Container maxWidth='md' sx={{ mt: isMobileSize ? '6rem' : '8rem', mb: '4rem', px: isMobileSize ? '1rem' : '2rem' }}>
				<Paper
					elevation={3}
					sx={{
						padding: isMobileSize ? '1.5rem' : '3rem',
						borderRadius: '0.5rem',
						backgroundColor: theme.bgColor?.common,
						fontFamily: fontFamilyLandingPage,
					}}>
					{/* Language Selector */}
					<Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: '1.5rem' }}>
						<ToggleButtonGroup value={language} exclusive onChange={handleLanguageChange} aria-label='language selection' size='small'>
							<ToggleButton
								value='tr'
								aria-label='turkish'
								sx={{ fontFamily: fontFamilyLandingPage, fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								TR
							</ToggleButton>
							<ToggleButton
								value='en'
								aria-label='english'
								sx={{ fontFamily: fontFamilyLandingPage, fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								EN
							</ToggleButton>
						</ToggleButtonGroup>
					</Box>

					<Typography
						variant='h4'
						sx={{
							fontSize: isMobileSizeSmall ? '1.25rem' : isMobileSize ? '1.5rem' : '2rem',
							fontWeight: 700,
							mb: '0.5rem',
							textAlign: 'center',
							fontFamily: fontFamilyLandingPage,
						}}>
						{currentContent.title}
					</Typography>

					<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.9rem', mb: '0.25rem', lineHeight: 1.8, fontFamily: fontFamilyLandingPage, textAlign: 'center' }}>
						{currentContent.subtitle}
					</Typography>
					<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.9rem', mb: '0.25rem', lineHeight: 1.8, fontFamily: fontFamilyLandingPage, textAlign: 'center' }}>
						{currentContent.business}
					</Typography>
					<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.9rem', mb: '0.25rem', lineHeight: 1.8, fontFamily: fontFamilyLandingPage, textAlign: 'center' }}>
						{currentContent.address}
					</Typography>
					<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.9rem', mb: '0.25rem', lineHeight: 1.8, fontFamily: fontFamilyLandingPage, textAlign: 'center' }}>
						{currentContent.registration}
					</Typography>
					<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.9rem', mb: '1rem', lineHeight: 1.8, fontFamily: fontFamilyLandingPage, textAlign: 'center' }}>
						{currentContent.brand}
					</Typography>

					<Typography
						variant='body2'
						sx={{ fontSize: isMobileSize ? '0.75rem' : '0.9rem', mb: '2rem', lineHeight: 1.8, fontFamily: fontFamilyLandingPage }}>
						{currentContent.lastUpdated} {formatLegalLastUpdated(language)}
					</Typography>

					<Divider sx={{ mb: '2rem' }} />

					<Typography
						variant='h6'
						sx={{ fontSize: isMobileSize ? '0.9rem' : '1.1rem', fontWeight: 600, mb: '1rem', mt: '2rem', fontFamily: fontFamilyLandingPage }}>
						{currentContent.section1Title}
					</Typography>
					<Typography
						variant='body2'
						sx={{ fontSize: isMobileSize ? '0.75rem' : '0.9rem', mb: '1.5rem', lineHeight: 1.8, fontFamily: fontFamilyLandingPage }}>
						{currentContent.section1Content}
					</Typography>

					<Typography
						variant='h6'
						sx={{ fontSize: isMobileSize ? '0.9rem' : '1.1rem', fontWeight: 600, mb: '1rem', mt: '2rem', fontFamily: fontFamilyLandingPage }}>
						{currentContent.section2Title}
					</Typography>

					<Typography
						variant='h6'
						sx={{ fontSize: isMobileSize ? '0.85rem' : '1rem', fontWeight: 600, mb: '0.75rem', mt: '1.5rem', fontFamily: fontFamilyLandingPage }}>
						{currentContent.section2_1Title}
					</Typography>
					<Typography
						variant='body2'
						sx={{ fontSize: isMobileSize ? '0.75rem' : '0.9rem', mb: '1rem', lineHeight: 1.8, fontFamily: fontFamilyLandingPage }}>
						{currentContent.section2_1Content}
					</Typography>
					<Box component='ul' sx={{ pl: '1.5rem', mb: '1rem' }}>
						{currentContent.essentialCookies.map((cookie, index) => (
							<Box
								key={index}
								component='li'
								sx={{ fontSize: isMobileSize ? '0.75rem' : '0.9rem', mb: '0.75rem', lineHeight: 1.8, fontFamily: fontFamilyLandingPage }}>
								<strong>{cookie.title}</strong> {cookie.description}
							</Box>
						))}
					</Box>

					<Typography
						variant='h6'
						sx={{ fontSize: isMobileSize ? '0.85rem' : '1rem', fontWeight: 600, mb: '0.75rem', mt: '1.5rem', fontFamily: fontFamilyLandingPage }}>
						{currentContent.section2_2Title}
					</Typography>
					<Typography
						variant='body2'
						sx={{ fontSize: isMobileSize ? '0.75rem' : '0.9rem', mb: '1rem', lineHeight: 1.8, fontFamily: fontFamilyLandingPage }}>
						{currentContent.section2_2Content}
					</Typography>
					<Box component='ul' sx={{ pl: '1.5rem', mb: '1rem' }}>
						{currentContent.functionalCookies.map((cookie, index) => (
							<Box
								key={index}
								component='li'
								sx={{ fontSize: isMobileSize ? '0.75rem' : '0.9rem', mb: '0.75rem', lineHeight: 1.8, fontFamily: fontFamilyLandingPage }}>
								<strong>{cookie.title}</strong> {cookie.description}
							</Box>
						))}
					</Box>

					<Typography
						variant='h6'
						sx={{ fontSize: isMobileSize ? '0.85rem' : '1rem', fontWeight: 600, mb: '0.75rem', mt: '1.5rem', fontFamily: fontFamilyLandingPage }}>
						{currentContent.section2_3Title}
					</Typography>
					<Typography
						variant='body2'
						sx={{ fontSize: isMobileSize ? '0.75rem' : '0.9rem', mb: '1rem', lineHeight: 1.8, fontFamily: fontFamilyLandingPage }}>
						{currentContent.section2_3Content}
					</Typography>
					<Box component='ul' sx={{ pl: '1.5rem', mb: '1rem' }}>
						{currentContent.analyticsCookies.map((cookie, index) => (
							<Box
								key={index}
								component='li'
								sx={{ fontSize: isMobileSize ? '0.75rem' : '0.9rem', mb: '0.75rem', lineHeight: 1.8, fontFamily: fontFamilyLandingPage }}>
								<strong>{cookie.title}</strong> {cookie.description}
							</Box>
						))}
					</Box>

					<Typography
						variant='h6'
						sx={{ fontSize: isMobileSize ? '0.9rem' : '1.1rem', fontWeight: 600, mb: '1rem', mt: '2rem', fontFamily: fontFamilyLandingPage }}>
						{currentContent.section3Title}
					</Typography>
					<Typography
						variant='body2'
						sx={{ fontSize: isMobileSize ? '0.75rem' : '0.9rem', mb: '1.5rem', lineHeight: 1.8, fontFamily: fontFamilyLandingPage }}>
						{currentContent.section3Content}
					</Typography>
					<Box component='ul' sx={{ pl: '1.5rem', mb: '1rem' }}>
						{currentContent.thirdPartyServices.map((service, index) => (
							<Box
								key={index}
								component='li'
								sx={{ fontSize: isMobileSize ? '0.75rem' : '0.9rem', mb: '0.75rem', lineHeight: 1.8, fontFamily: fontFamilyLandingPage }}>
								<strong>{service.name}</strong> {service.description}{' '}
								<a
									href={service.url}
									target='_blank'
									rel='noopener noreferrer'
									style={{ color: theme.palette.primary.main, textDecoration: 'underline', fontFamily: fontFamilyLandingPage }}>
									{service.linkText}
								</a>
							</Box>
						))}
					</Box>

					<Typography
						variant='h6'
						sx={{ fontSize: isMobileSize ? '0.9rem' : '1.1rem', fontWeight: 600, mb: '1rem', mt: '2rem', fontFamily: fontFamilyLandingPage }}>
						{currentContent.section4Title}
					</Typography>
					<Typography
						variant='body2'
						sx={{ fontSize: isMobileSize ? '0.75rem' : '0.9rem', mb: '1.5rem', lineHeight: 1.8, fontFamily: fontFamilyLandingPage }}>
						{currentContent.section4Content}
					</Typography>
					<Box component='ul' sx={{ pl: '1.5rem', mb: '1rem' }}>
						{currentContent.managementOptions.map((option, index) => (
							<Box
								key={index}
								component='li'
								sx={{ fontSize: isMobileSize ? '0.75rem' : '0.9rem', mb: '0.75rem', lineHeight: 1.8, fontFamily: fontFamilyLandingPage }}>
								{option}
							</Box>
						))}
					</Box>

					<Typography
						variant='body2'
						sx={{
							fontSize: isMobileSize ? '0.75rem' : '0.9rem',
							mb: '1.5rem',
							lineHeight: 1.8,
							fontStyle: 'italic',
							fontFamily: fontFamilyLandingPage,
						}}>
						<strong>{language === 'tr' ? 'Not:' : 'Note:'}</strong> {currentContent.note}
					</Typography>

					<Typography
						variant='h6'
						sx={{ fontSize: isMobileSize ? '0.9rem' : '1.1rem', fontWeight: 600, mb: '1rem', mt: '2rem', fontFamily: fontFamilyLandingPage }}>
						{currentContent.section5Title}
					</Typography>
					<Typography
						variant='body2'
						sx={{ fontSize: isMobileSize ? '0.75rem' : '0.9rem', mb: '1.5rem', lineHeight: 1.8, fontFamily: fontFamilyLandingPage }}>
						{currentContent.section5Content}
					</Typography>

					<Typography
						variant='h6'
						sx={{ fontSize: isMobileSize ? '0.9rem' : '1.1rem', fontWeight: 600, mb: '1rem', mt: '2rem', fontFamily: fontFamilyLandingPage }}>
						{currentContent.section6Title}
					</Typography>
					<Typography
						variant='body2'
						sx={{ fontSize: isMobileSize ? '0.75rem' : '0.9rem', mb: '2rem', lineHeight: 1.8, fontFamily: fontFamilyLandingPage }}>
						{currentContent.section6Content}{' '}
						<a href={`mailto:${CONTACT_EMAIL}`} style={{ color: theme.palette.primary.main, textDecoration: 'underline', fontFamily: fontFamilyLandingPage }}>
							{CONTACT_EMAIL}
						</a>
					</Typography>
				</Paper>
			</Container>
		</LandingPageLayout>
	);
};

export default CookiePolicy;
