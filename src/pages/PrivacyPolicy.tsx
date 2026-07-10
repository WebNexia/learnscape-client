import { Box, Container, Typography, Paper, Divider, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { Link } from 'react-router-dom';
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

const PrivacyPolicy = () => {
	const { isRotatedMedium, isSmallScreen, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotatedMedium;

	const fontFamilyLandingPage = "'Varela Round', 'Segoe UI', Arial, sans-serif";

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
			title: 'Gizlilik Politikası',
			subtitle: 'Aden Academy',
			business: `İşletme: ${COMPANY_NAME}`,
			address: COMPANY_ADDRESS,
			registration: COMPANY_REGISTRATION_TR,
			brand: `Marka: ${COMPANY_BRAND}`,
			lastUpdated: 'Son Güncelleme:',
			section1Title: '1. Giriş',
			section1Content:
				'Bu Gizlilik Politikası, Aden Academy üzerinden hizmet alan kullanıcıların kişisel verilerinin nasıl toplandığını, kullanıldığını, saklandığını ve korunduğunu açıklar. Platform kullanımına ilişkin genel şartlar için ',
			section1UserAgreementLink: 'Kullanıcı Sözleşmesi',
			section1ContentEnd: ' incelenmelidir.',
			section1Note:
				'Bu politika; Birleşik Krallık (UK), Avrupa Birliği (AB) ve Türkiye\'de bulunan kullanıcılar dahil olmak üzere UK GDPR, General Data Protection Regulation ve Kişisel Verilerin Korunması Kanunu (KVKK No. 6698) kapsamında hazırlanmıştır.',
			section1Acceptance: 'Platformu kullanarak bu politikayı kabul etmiş sayılırsınız.',
			section2Title: '2. Veri Sorumlusu',
			section2Content:
				'Kişisel verilerinizin veri sorumlusu NEXTEDU LTD\'dir (Aden Academy markası altında faaliyet göstermektedir). İngiltere ve Galler\'de kayıtlıdır.',
			section2Note: 'Veri koruma talepleriniz için aşağıdaki iletişim bilgilerini kullanabilirsiniz.',
			section3Title: '3. Toplanan Veriler',
			section3Content:
				'Hizmet sunumu, ödeme işlemleri ve iletişim amacıyla aşağıdaki kategorilerde kişisel veriler toplanabilir:',
			dataCategories: [
				{
					title: '3.1 Kimlik ve İletişim Bilgileri',
					items: [
						'Ad ve soyad',
						'Kullanıcı adı (username)',
						'E-posta adresi',
						'Telefon numarası (varsa)',
						'Ülke ve şehir bilgisi (IP tabanlı konum servisleri aracılığıyla)',
						'Profil görseli (varsa)',
					],
				},
				{
					title: '3.2 Hesap Bilgileri',
					items: [
						'Giriş ve kimlik doğrulama bilgileri (Firebase)',
						'Şifre (şifrelenmiş şekilde saklanır)',
						'Platform içi kullanım ve aktivite bilgileri',
						'Oturum ve cihaz tanımlayıcıları',
						'Pazarlama e-posta onayı (varsa)',
					],
				},
				{
					title: '3.3 Ödeme Bilgileri',
					items: [
						'Ödemeler Stripe üzerinden işlenir; kart bilgileri tarafımızda saklanmaz',
						'Fatura, işlem kayıtları ve ödeme onay bilgileri',
						'Stripe Connect kapsamında organizasyon/satıcı hesap bilgileri (varsa)',
						'Komisyon ve ödeme denetim kayıtları',
					],
				},
				{
					title: '3.4 Danışmanlık ve Randevu Verileri',
					items: [
						'Randevu tarihleri ve danışman tercihleri',
						'Form ve anket yanıtları',
						'Zoom toplantı bağlantı bilgileri (varsa)',
						'Misafir ödeme ve iletişim bilgileri (varsa)',
					],
				},
				{
					title: '3.5 Eğitim, Quiz ve Geri Bildirim Verileri',
					items: [
						'Kurs ilerleme, ders tamamlama ve platform etkileşim bilgileri',
						'Quiz cevapları ve teslim kayıtları',
						'Eğitmen geri bildirimleri (quiz değerlendirmeleri)',
						'Pratik ders cevapları ve isteğe bağlı anlık AI geri bildirimi (yalnızca pratik derslerde)',
					],
				},
				{
					title: '3.6 Mesajlaşma, Topluluk ve Bildirimler',
					items: [
						'Kullanıcılar arası mesajlaşma içerikleri (metin, görsel, ses)',
						'Topluluk forumu gönderileri ve yorumları',
						'Platform içi bildirimler',
						'Kullanıcı engelleme kayıtları',
					],
				},
				{
					title: '3.7 Kullanıcı Tarafından Yüklenen İçerik',
					items: [
						'Profil görselleri',
						'Quiz, pratik ders veya topluluk bağlamında yüklenen ses, video ve görseller',
					],
				},
				{
					title: '3.8 Form, Etkinlik ve Destek Verileri',
					items: [
						'İletişim, hakkımızda ve etkinlik kayıt formları',
						'Geri bildirim formu yanıtları (IP adresi ve tarayıcı bilgisi dahil)',
						'Hata raporları',
						'Kaynak indirme ve misafir pazarlama onay kayıtları (varsa)',
					],
				},
				{
					title: '3.9 Teknik ve Kullanım Verileri',
					items: [
						'IP adresi',
						'Tarayıcı ve cihaz bilgileri',
						'Çerez ve localStorage verileri',
						'Rate limit ve güvenlik logları',
					],
				},
			],
			section4Title: '4. Verilerin İşlenme Amaçları ve Hukuki Dayanak',
			section4Content: 'Kişisel verileriniz aşağıdaki amaçlarla ve hukuki dayanaklarla işlenir:',
			legalBasis: [
				{
					title: '4.1 Sözleşmenin İfası',
					items: [
						'Hesap oluşturma ve yönetimi',
						'Kurs, döküman ve ürün erişimi',
						'Danışmanlık hizmetlerinin sağlanması',
						'Ödeme işlemleri ve Stripe Connect ödemeleri',
						'Quiz değerlendirmesi ve eğitmen geri bildirimi',
						'Mesajlaşma ve topluluk hizmetleri',
					],
				},
				{
					title: '4.2 Yasal Yükümlülükler',
					items: ['Vergi ve muhasebe işlemleri', 'Yasal kayıt saklama yükümlülükleri'],
				},
				{
					title: '4.3 Meşru Menfaat',
					items: [
						'Platform güvenliği',
						'Dolandırıcılık önleme',
						'Hizmet kalitesini geliştirme',
						'Pratik derslerde eğitim amaçlı AI geri bildirimi',
					],
				},
				{
					title: '4.4 Açık Rıza',
					items: ['Pazarlama e-posta iletişimleri', 'Opsiyonel çerez kullanımı'],
				},
			],
			section5Title: '5. Verilerin Paylaşımı',
			section5Intro: 'Kişisel verileriniz satılmaz ve izinsiz üçüncü taraflarla paylaşılmaz.',
			section5Note: 'Ancak aşağıdaki durumlarda paylaşılabilir:',
			sharingCategories: [
				{
					title: '5.1 Hizmet Sağlayıcılar (Veri İşleyenler)',
					items: [
						'Stripe ve Stripe Connect (ödeme işlemleri ve organizasyon ödemeleri)',
						'Firebase / Google Cloud (kimlik doğrulama, veritabanı, dosya depolama, bulut fonksiyonları)',
						'Google reCAPTCHA (güvenlik ve spam önleme)',
						'Zoom (canlı ders, danışmanlık ve görüşmeler)',
						'YouTube, Vimeo ve Dailymotion (gömülü video içerikleri)',
						'OpenAI (yalnızca pratik ders AI geri bildirimi ve yönetici içerik oluşturma araçları)',
						'MongoDB (uygulama veritabanı)',
						'Redis (oturum, önbellek ve rate limit)',
						'Netlify (web sitesi barındırma)',
						'ipapi.co ve ipwho.is (IP tabanlı konum tespiti)',
						'Frankfurter API (döviz kuru dönüşümü)',
						'TinyMCE (içerik düzenleme)',
						'Google Fonts (tipografi)',
						'SMTP tabanlı e-posta servis sağlayıcıları (Nodemailer)',
					],
					note: 'Bu sağlayıcılar yalnızca hizmet sunumu amacıyla veri işler.',
				},
				{
					title: '5.2 Yasal Yükümlülükler',
					items: ['Mahkeme kararları', 'Resmi kurum talepleri'],
				},
			],
			section6Title: '6. Uluslararası Veri Aktarımı',
			section6Content:
				'Verileriniz, Birleşik Krallık dışındaki ülkelere (örneğin ABD ve AB ülkeleri) aktarılabilir. Bu durumlarda uygun güvenlik önlemleri alınır ve standart sözleşme hükümleri (SCCs) gibi yasal mekanizmalar uygulanır.',
			section7Title: '7. Veri Saklama Süresi',
			section7Content: 'Kişisel veriler aşağıdaki süreler boyunca saklanır:',
			retentionItems: [
				'Hesap aktif olduğu sürece',
				'Hizmetin sunulması için gerekli süre boyunca',
				'Yasal yükümlülükler kapsamında (örneğin 6–7 yıl)',
				'Ödeme, fatura, muhasebe, vergi ve denetim kayıtları yasal saklama süreleri boyunca',
				'Mesajlaşma ve bildirim verileri, hizmet gereksinimlerine göre sınırlı sürelerle (ör. 14–30 gün)',
			],
			section8Title: '8. Kullanıcı Hakları',
			section8Content: 'Kullanıcılar aşağıdaki haklara sahiptir:',
			rights: [
				'Verilere erişim talep etme',
				'Yanlış verileri düzeltme',
				'Verilerin silinmesini talep etme',
				'İşlemeyi kısıtlama',
				'Veri taşınabilirliği',
				'İşlemeye itiraz etme',
				'Rızayı geri çekme',
			],
			section8ComplaintTitle: 'Şikayet hakkı:',
			complaintRights: [
				'UK kullanıcıları: Information Commissioner\'s Office (ICO)',
				'AB kullanıcıları: ilgili veri koruma otoritesi',
				'Türkiye kullanıcıları: Kişisel Verileri Koruma Kurumu (KVKK)',
			],
			section8ErasureTitle: 'Silme hakkının istisnaları:',
			section8ErasureContent:
				'Silme talebiniz, yürürlükteki mevzuat kapsamındaki yasal saklama yükümlülükleri ile sınırlı olabilir. Ödeme, fatura, muhasebe, vergi, komisyon ve dolandırıcılık önleme kayıtları ile uyuşmazlık/audit amaçlı kayıtlar uygun süre boyunca saklanabilir. Kayıt veya erişim kaldırma işlemlerinde eğitim ilerlemesi silinebilir; ancak yasal ve mali kayıtlar (ör. ödeme geçmişi) korunabilir.',
			section8KvkkNote: 'Türkiye\'deki kullanıcılar için başvurular KVKK kapsamında 30 gün içinde yanıtlanır.',
			section9Title: '9. Otomatik Karar Verme',
			section9Content:
				'Platformda, kullanıcılar üzerinde önemli hukuki sonuç doğuran otomatik karar verme veya profil oluşturma yapılmamaktadır.',
			section9Note:
				'Pratik derslerde eğitim amaçlı AI geri bildirimi kullanılabilir; bu işlem hukuki sonuç doğurmaz ve quiz değerlendirmelerinde eğitmen geri bildirimi esas alınır.',
			section10Title: '10. Veri Güvenliği',
			section10Intro: 'Aden Academy:',
			securityMeasures: [
				'SSL şifreleme kullanır',
				'Güvenli ödeme altyapıları ile çalışır',
				'Yetkisiz erişimi önleyici teknik ve idari önlemler uygular',
			],
			section10Note: 'Ancak internet üzerinden veri iletimi tamamen güvenli olmayabilir.',
			section11Title: '11. Çerezler (Cookies)',
			section11Content: 'Çerezler ve benzeri teknolojiler aşağıdaki amaçlarla kullanılır:',
			cookiePurposes: [
				'Oturum yönetimi ve kimlik doğrulama',
				'Güvenlik (reCAPTCHA) ve ödeme işlemleri',
				'Kullanıcı tercihlerinin hatırlanması',
				'Gömülü video platformları (YouTube, Vimeo, Dailymotion) tarafından ayarlanan çerezler',
			],
			section11Note:
				'Platformda üçüncü taraf reklam veya pazarlama izleme pikselleri (Meta Pixel, Google Analytics vb.) kullanılmamaktadır. Pazarlama iletişimleri yalnızca açık e-posta onayınız ile yapılır.',
			section11LinkPrefix: 'Detaylı bilgi için',
			section11Link: 'Çerez Politikası',
			section11LinkSuffix: 'incelenmelidir.',
			section12Title: '12. Üçüncü Taraf Bağlantılar ve Gömülü İçerikler',
			section12Content:
				'Platform, üçüncü taraf web sitelerine yönlendirme ve YouTube, Vimeo, Dailymotion gibi gömülü video içerikleri içerebilir. Bu sitelerin veri koruma uygulamalarından Aden Academy sorumlu değildir.',
			section13Title: '13. Çocukların Gizliliği',
			section13Content:
				'Hizmetler 18 yaş ve üzeri kullanıcılar içindir. Bilerek 18 yaş altı bireylerden veri toplanmaz.',
			section14Title: '14. Politika Değişiklikleri',
			section14Content: 'Bu politika zaman zaman güncellenebilir. Güncellemeler:',
			policyChanges: ['Web sitesinde yayınlanır', '"Son Güncelleme" tarihi ile belirtilir'],
			section14Note:
				'Platformu kullanmaya devam etmeniz, güncellenmiş politikayı kabul ettiğiniz anlamına gelir.',
			section15Title: '15. İletişim',
			section15Content: 'Kişisel verilerinizle ilgili talepleriniz için:',
			contactName: 'Aden Academy (NEXTEDU LTD)',
			contactAddress: COMPANY_ADDRESS,
		},
		en: {
			title: 'Privacy Policy',
			subtitle: 'Aden Academy',
			business: `Business: ${COMPANY_NAME}`,
			address: COMPANY_ADDRESS,
			registration: COMPANY_REGISTRATION_EN,
			brand: `Brand: ${COMPANY_BRAND}`,
			lastUpdated: 'Last Updated:',
			section1Title: '1. Introduction',
			section1Content:
				'This Privacy Policy explains how personal data of users receiving services through Aden Academy is collected, used, stored, and protected. For general terms of platform use, please see the ',
			section1UserAgreementLink: 'User Agreement',
			section1ContentEnd: '.',
			section1Note:
				'This policy has been prepared in accordance with UK GDPR, the General Data Protection Regulation, and the Personal Data Protection Law (KVKK No. 6698), including for users located in the United Kingdom (UK), the European Union (EU), and Turkey.',
			section1Acceptance: 'By using the platform, you are deemed to have accepted this policy.',
			section2Title: '2. Data Controller',
			section2Content:
				'The data controller of your personal data is NEXTEDU LTD (operating under the Aden Academy brand). It is registered in England and Wales.',
			section2Note: 'You may use the contact details below for data protection requests.',
			section3Title: '3. Data Collected',
			section3Content:
				'Personal data in the following categories may be collected for the provision of services, payment processing, and communication:',
			dataCategories: [
				{
					title: '3.1 Identity and Contact Information',
					items: [
						'First and last name',
						'Username',
						'Email address',
						'Phone number (if provided)',
						'Country and city information (via IP-based location services)',
						'Profile image (if provided)',
					],
				},
				{
					title: '3.2 Account Information',
					items: [
						'Login and authentication details (Firebase)',
						'Password (stored in encrypted form)',
						'In-platform usage and activity information',
						'Session and device identifiers',
						'Marketing email consent (if provided)',
					],
				},
				{
					title: '3.3 Payment Information',
					items: [
						'Payments are processed via Stripe; card details are not stored by us',
						'Invoice, transaction records, and payment confirmation details',
						'Organisation/seller account information under Stripe Connect (if applicable)',
						'Commission and payment audit records',
					],
				},
				{
					title: '3.4 Consultation and Appointment Data',
					items: [
						'Appointment dates and consultant preferences',
						'Form and survey responses',
						'Zoom meeting link details (if applicable)',
						'Guest checkout and contact details (if applicable)',
					],
				},
				{
					title: '3.5 Education, Quiz, and Feedback Data',
					items: [
						'Course progress, lesson completion, and platform interaction information',
						'Quiz answers and submission records',
						'Instructor feedback on quiz assessments',
						'Practice lesson answers and optional instant AI feedback (practice lessons only)',
					],
				},
				{
					title: '3.6 Messaging, Community, and Notifications',
					items: [
						'Direct messaging content between users (text, images, audio)',
						'Community forum posts and comments',
						'In-platform notifications',
						'User block records',
					],
				},
				{
					title: '3.7 User-Uploaded Content',
					items: [
						'Profile images',
						'Audio, video, and images uploaded in quiz, practice, or community contexts',
					],
				},
				{
					title: '3.8 Form, Event, and Support Data',
					items: [
						'Contact, about, and event registration forms',
						'Feedback form responses (including IP address and browser information)',
						'Bug reports',
						'Resource download and guest marketing consent records (if applicable)',
					],
				},
				{
					title: '3.9 Technical and Usage Data',
					items: [
						'IP address',
						'Browser and device information',
						'Cookie and localStorage data',
						'Rate limit and security logs',
					],
				},
			],
			section4Title: '4. Purposes and Legal Basis for Processing',
			section4Content: 'Your personal data is processed for the following purposes and on the following legal bases:',
			legalBasis: [
				{
					title: '4.1 Performance of Contract',
					items: [
						'Account creation and management',
						'Access to courses, documents, and products',
						'Provision of consultation services',
						'Payment processing and Stripe Connect payouts',
						'Quiz assessment and instructor feedback',
						'Messaging and community services',
					],
				},
				{
					title: '4.2 Legal Obligations',
					items: ['Tax and accounting operations', 'Legal record retention obligations'],
				},
				{
					title: '4.3 Legitimate Interest',
					items: [
						'Platform security',
						'Fraud prevention',
						'Improving service quality',
						'Educational AI feedback in practice lessons',
					],
				},
				{
					title: '4.4 Explicit Consent',
					items: ['Marketing email communications', 'Optional cookie usage'],
				},
			],
			section5Title: '5. Data Sharing',
			section5Intro: 'Your personal data is not sold and is not shared with third parties without permission.',
			section5Note: 'However, it may be shared in the following circumstances:',
			sharingCategories: [
				{
					title: '5.1 Service Providers (Data Processors)',
					items: [
						'Stripe and Stripe Connect (payments and organisation payouts)',
						'Firebase / Google Cloud (authentication, database, file storage, cloud functions)',
						'Google reCAPTCHA (security and spam prevention)',
						'Zoom (live lessons, consultations, and meetings)',
						'YouTube, Vimeo, and Dailymotion (embedded video content)',
						'OpenAI (practice lesson AI feedback and admin content creation tools only)',
						'MongoDB (application database)',
						'Redis (session, cache, and rate limiting)',
						'Netlify (website hosting)',
						'ipapi.co and ipwho.is (IP-based location detection)',
						'Frankfurter API (currency conversion)',
						'TinyMCE (content editing)',
						'Google Fonts (typography)',
						'SMTP-based email service providers (Nodemailer)',
					],
					note: 'These providers process data solely for the purpose of delivering services.',
				},
				{
					title: '5.2 Legal Obligations',
					items: ['Court orders', 'Requests from official authorities'],
				},
			],
			section6Title: '6. International Data Transfers',
			section6Content:
				'Your data may be transferred to countries outside the United Kingdom (e.g. the USA and EU countries). In such cases, appropriate security measures are taken and legal mechanisms such as Standard Contractual Clauses (SCCs) are applied.',
			section7Title: '7. Data Retention Period',
			section7Content: 'Personal data is retained for the following periods:',
			retentionItems: [
				'While the account remains active',
				'For as long as necessary to provide the service',
				'Within the scope of legal obligations (e.g. 6–7 years)',
				'Payment, invoice, accounting, tax, and audit records for applicable legal retention periods',
				'Messaging and notification data for limited periods as required by the service (e.g. 14–30 days)',
			],
			section8Title: '8. User Rights',
			section8Content: 'Users have the following rights:',
			rights: [
				'Request access to their data',
				'Rectify inaccurate data',
				'Request deletion of their data',
				'Restrict processing',
				'Data portability',
				'Object to processing',
				'Withdraw consent',
			],
			section8ComplaintTitle: 'Right to lodge a complaint:',
			complaintRights: [
				'UK users: Information Commissioner\'s Office (ICO)',
				'EU users: the relevant data protection authority',
				'Turkey users: Personal Data Protection Authority (KVKK)',
			],
			section8ErasureTitle: 'Exceptions to the right of erasure:',
			section8ErasureContent:
				'Your erasure request may be limited by legal retention obligations under applicable law. Payment, invoice, accounting, tax, commission, and fraud-prevention records, as well as dispute and audit records, may be retained for appropriate periods. When an enrollment or access record is removed, learning progress may be deleted, but legal and financial records (such as payment history) may be retained.',
			section8KvkkNote: 'Applications from users in Turkey are responded to within 30 days under KVKK.',
			section9Title: '9. Automated Decision-Making',
			section9Content:
				'The platform does not carry out automated decision-making or profiling that produces significant legal effects on users.',
			section9Note:
				'Educational AI feedback may be used in practice lessons; this does not produce legal effects, and quiz assessments rely on instructor feedback.',
			section10Title: '10. Data Security',
			section10Intro: 'Aden Academy:',
			securityMeasures: [
				'Uses SSL encryption',
				'Works with secure payment infrastructures',
				'Applies technical and administrative measures to prevent unauthorised access',
			],
			section10Note: 'However, data transmission over the internet may not be completely secure.',
			section11Title: '11. Cookies',
			section11Content: 'Cookies and similar technologies are used for the following purposes:',
			cookiePurposes: [
				'Session management and authentication',
				'Security (reCAPTCHA) and payment processing',
				'Remembering user preferences',
				'Cookies set by embedded video platforms (YouTube, Vimeo, Dailymotion)',
			],
			section11Note:
				'The platform does not use third-party advertising or marketing tracking pixels (Meta Pixel, Google Analytics, etc.). Marketing communications are sent only with your explicit email consent.',
			section11LinkPrefix: 'For detailed information, please refer to the',
			section11Link: 'Cookie Policy',
			section11LinkSuffix: '.',
			section12Title: '12. Third-Party Links and Embedded Content',
			section12Content:
				'The platform may contain links to third-party websites and embedded video content from YouTube, Vimeo, and Dailymotion. Aden Academy is not responsible for the data protection practices of these sites.',
			section13Title: '13. Children\'s Privacy',
			section13Content:
				'Services are intended for users aged 18 and over. Data is not knowingly collected from individuals under the age of 18.',
			section14Title: '14. Policy Changes',
			section14Content: 'This policy may be updated from time to time. Updates will:',
			policyChanges: ['Be published on the website', 'Be indicated with a "Last Updated" date'],
			section14Note:
				'Your continued use of the platform constitutes acceptance of the updated policy.',
			section15Title: '15. Contact',
			section15Content: 'For requests regarding your personal data:',
			contactName: 'Aden Academy (NEXTEDU LTD)',
			contactAddress: COMPANY_ADDRESS,
		},
	};

	const currentContent = content[language];

	const bodySx = {
		fontSize: isMobileSize ? '0.75rem' : '0.9rem',
		mb: '1rem',
		lineHeight: 1.8,
		fontFamily: fontFamilyLandingPage,
	};
	const headingSx = {
		fontSize: isMobileSize ? '0.9rem' : '1.1rem',
		fontWeight: 600,
		mb: '1rem',
		mt: '2rem',
		fontFamily: fontFamilyLandingPage,
	};
	const subHeadingSx = {
		fontSize: isMobileSize ? '0.8rem' : '0.95rem',
		fontWeight: 600,
		mb: '0.5rem',
		mt: '1rem',
		fontFamily: fontFamilyLandingPage,
	};
	const listSx = { pl: '1.5rem', mb: '1rem' };
	const listItemSx = { ...bodySx, mb: '0.5rem' };

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
					<Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: '1.5rem' }}>
						<ToggleButtonGroup value={language} exclusive onChange={handleLanguageChange} aria-label='language selection' size='small'>
							<ToggleButton value='tr' aria-label='turkish' sx={{ fontFamily: fontFamilyLandingPage, fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								TR
							</ToggleButton>
							<ToggleButton value='en' aria-label='english' sx={{ fontFamily: fontFamilyLandingPage, fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
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

					<Typography variant='body2' sx={{ ...bodySx, textAlign: 'center', mb: '0.25rem' }}>
						{currentContent.subtitle}
					</Typography>
					<Typography variant='body2' sx={{ ...bodySx, textAlign: 'center', mb: '0.25rem' }}>
						{currentContent.business}
					</Typography>
					<Typography variant='body2' sx={{ ...bodySx, textAlign: 'center', mb: '0.25rem' }}>
						{currentContent.address}
					</Typography>
					<Typography variant='body2' sx={{ ...bodySx, textAlign: 'center', mb: '0.25rem' }}>
						{currentContent.registration}
					</Typography>
					<Typography variant='body2' sx={{ ...bodySx, textAlign: 'center', mb: '1rem' }}>
						{currentContent.brand}
					</Typography>

					<Typography variant='body2' sx={{ ...bodySx, mb: '2rem' }}>
						{currentContent.lastUpdated} {formatLegalLastUpdated(language)}
					</Typography>

					<Divider sx={{ mb: '2rem' }} />

					<Typography variant='h6' sx={headingSx}>{currentContent.section1Title}</Typography>
					<Typography variant='body2' sx={bodySx}>
						{currentContent.section1Content}
						<Link to='/terms' style={{ color: theme.palette.primary.main, textDecoration: 'underline', fontFamily: fontFamilyLandingPage }}>
							{currentContent.section1UserAgreementLink}
						</Link>
						{currentContent.section1ContentEnd}
					</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.section1Note}</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.section1Acceptance}</Typography>

					<Typography variant='h6' sx={headingSx}>{currentContent.section2Title}</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.section2Content}</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.section2Note}</Typography>

					<Typography variant='h6' sx={headingSx}>{currentContent.section3Title}</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.section3Content}</Typography>
					{currentContent.dataCategories.map((category, index) => (
						<Box key={index}>
							<Typography variant='body2' sx={subHeadingSx}>{category.title}</Typography>
							<Box component='ul' sx={listSx}>
								{category.items.map((item, itemIndex) => (
									<Box key={itemIndex} component='li' sx={listItemSx}>{item}</Box>
								))}
							</Box>
						</Box>
					))}

					<Typography variant='h6' sx={headingSx}>{currentContent.section4Title}</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.section4Content}</Typography>
					{currentContent.legalBasis.map((basis, index) => (
						<Box key={index}>
							<Typography variant='body2' sx={subHeadingSx}>{basis.title}</Typography>
							<Box component='ul' sx={listSx}>
								{basis.items.map((item, itemIndex) => (
									<Box key={itemIndex} component='li' sx={listItemSx}>{item}</Box>
								))}
							</Box>
						</Box>
					))}

					<Typography variant='h6' sx={headingSx}>{currentContent.section5Title}</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.section5Intro}</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.section5Note}</Typography>
					{currentContent.sharingCategories.map((category, index) => (
						<Box key={index}>
							<Typography variant='body2' sx={subHeadingSx}>{category.title}</Typography>
							<Box component='ul' sx={listSx}>
								{category.items.map((item, itemIndex) => (
									<Box key={itemIndex} component='li' sx={listItemSx}>{item}</Box>
								))}
							</Box>
							{category.note && <Typography variant='body2' sx={bodySx}>{category.note}</Typography>}
						</Box>
					))}

					<Typography variant='h6' sx={headingSx}>{currentContent.section6Title}</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.section6Content}</Typography>

					<Typography variant='h6' sx={headingSx}>{currentContent.section7Title}</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.section7Content}</Typography>
					<Box component='ul' sx={listSx}>
						{currentContent.retentionItems.map((item, index) => (
							<Box key={index} component='li' sx={listItemSx}>{item}</Box>
						))}
					</Box>

					<Typography variant='h6' sx={headingSx}>{currentContent.section8Title}</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.section8Content}</Typography>
					<Box component='ul' sx={listSx}>
						{currentContent.rights.map((right, index) => (
							<Box key={index} component='li' sx={listItemSx}>{right}</Box>
						))}
					</Box>
					<Typography variant='body2' sx={{ ...subHeadingSx, mt: '1rem' }}>{currentContent.section8ComplaintTitle}</Typography>
					<Box component='ul' sx={listSx}>
						{currentContent.complaintRights.map((item, index) => (
							<Box key={index} component='li' sx={listItemSx}>{item}</Box>
						))}
					</Box>
					<Typography variant='body2' sx={{ ...subHeadingSx, mt: '1rem' }}>{currentContent.section8ErasureTitle}</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.section8ErasureContent}</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.section8KvkkNote}</Typography>

					<Typography variant='h6' sx={headingSx}>{currentContent.section9Title}</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.section9Content}</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.section9Note}</Typography>

					<Typography variant='h6' sx={headingSx}>{currentContent.section10Title}</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.section10Intro}</Typography>
					<Box component='ul' sx={listSx}>
						{currentContent.securityMeasures.map((item, index) => (
							<Box key={index} component='li' sx={listItemSx}>{item}</Box>
						))}
					</Box>
					<Typography variant='body2' sx={bodySx}>{currentContent.section10Note}</Typography>

					<Typography variant='h6' sx={headingSx}>{currentContent.section11Title}</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.section11Content}</Typography>
					<Box component='ul' sx={listSx}>
						{currentContent.cookiePurposes.map((item, index) => (
							<Box key={index} component='li' sx={listItemSx}>{item}</Box>
						))}
					</Box>
					<Typography variant='body2' sx={bodySx}>{currentContent.section11Note}</Typography>
					<Typography variant='body2' sx={{ ...bodySx, mb: '2rem' }}>
						{currentContent.section11LinkPrefix}{' '}
						<Link to='/cookie-policy' style={{ color: theme.palette.primary.main, textDecoration: 'underline', fontFamily: fontFamilyLandingPage }}>
							{currentContent.section11Link}
						</Link>{' '}
						{currentContent.section11LinkSuffix}
					</Typography>

					<Typography variant='h6' sx={headingSx}>{currentContent.section12Title}</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.section12Content}</Typography>

					<Typography variant='h6' sx={headingSx}>{currentContent.section13Title}</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.section13Content}</Typography>

					<Typography variant='h6' sx={headingSx}>{currentContent.section14Title}</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.section14Content}</Typography>
					<Box component='ul' sx={listSx}>
						{currentContent.policyChanges.map((item, index) => (
							<Box key={index} component='li' sx={listItemSx}>{item}</Box>
						))}
					</Box>
					<Typography variant='body2' sx={bodySx}>{currentContent.section14Note}</Typography>

					<Typography variant='h6' sx={headingSx}>{currentContent.section15Title}</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.section15Content}</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.contactName}</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.contactAddress}</Typography>
					<Typography variant='body2' sx={{ ...bodySx, mb: '2rem' }}>
						<a href={`mailto:${CONTACT_EMAIL}`} style={{ color: theme.palette.primary.main, textDecoration: 'underline', fontFamily: fontFamilyLandingPage }}>
							{CONTACT_EMAIL}
						</a>
					</Typography>
				</Paper>
			</Container>
		</LandingPageLayout>
	);
};

export default PrivacyPolicy;
