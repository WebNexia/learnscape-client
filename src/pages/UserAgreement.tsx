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

const UserAgreement = () => {
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
			title: 'Kullanıcı Sözleşmesi',
			subtitle: 'Aden Academy',
			business: `İşletme: ${COMPANY_NAME}`,
			address: COMPANY_ADDRESS,
			registration: COMPANY_REGISTRATION_TR,
			brand: `Marka: ${COMPANY_BRAND}`,
			lastUpdated: 'Son Güncelleme:',
			intro:
				'Bu Kullanıcı Sözleşmesi, Aden Academy platformunu kullanırken sizin ile NEXTEDU LTD arasındaki hak ve yükümlülükleri düzenler. Platforma kayıt olarak, hesap oluşturarak, satın alma yaparak veya hizmetleri kullanmaya devam ederek bu sözleşmeyi kabul etmiş sayılırsınız.\n\nBu sözleşme; Birleşik Krallık (UK), Avrupa Birliği (AB) ve Türkiye kapsamındaki kullanıcılar için hazırlanmış olup UK GDPR, EU GDPR, KVKK (6698 Sayılı Kişisel Verilerin Korunması Kanunu) ve Birleşik Krallık tüketici mevzuatı ile uyumludur.',
			section1Title: '1. Tanımlar',
			section1Content:
				'Platform / Site: Aden Academy internet sitesi ve dijital altyapılarıdır.\n\nŞirket: NEXTEDU LTD (Aden Academy markası altında faaliyet gösterir).\n\nKullanıcı: Platformu kullanan gerçek veya tüzel kişidir.\n\nHizmetler: Online kurslar, canlı dersler, dijital kitaplar ve kaynaklar (dökümanlar), eğitim materyalleri, quiz ve pratik dersler, danışmanlık randevuları, topluluk ve mesajlaşma hizmetleri ile ilgili dijital hizmetlerdir.\n\nİçerik: Video, metin, ses, PDF, görsel, yazılım ve tüm eğitim materyallerini ifade eder.\n\nSürekli Erişimli Kurs (evergreen): Satın alma sonrasında derslere ve dijital içeriğe derhal erişim sağlayan online kurstur.\n\nPlanlı Kurs (cohort): Belirlenen bir başlangıç tarihi olan ve ders erişiminin bu tarihe kadar kilitli kalabildiği online kurstur.\n\nHizmetin Başlaması: Sürekli erişimli kurslarda satın alma sonrası ilk ders veya dijital içeriğe erişimin açılması; planlı kurslarda ise planlanan başlangıç tarihinde ders erişiminin fiilen açılması anlamına gelir.',
			section2Title: '2. Hesap ve Üyelik',
			section2Content:
				'Hizmetler yalnızca 18 yaş ve üzeri kullanıcılar içindir. Kayıt olmakla bu şartlara uygun olduğunuzu kabul etmiş sayılırsınız.\n\nKullanıcı, kayıt sırasında verdiği bilgilerin doğru ve güncel olduğunu kabul eder. Hesap giriş bilgilerinizi (şifre vb.) gizli tutmanız, üçüncü kişilerle paylaşmamanız ve hesabınız üzerinden yapılan işlemlerden sorumlu olmanız gerekir. Hesap paylaşımı yasaktır.\n\nYetkisiz erişim veya güvenlik tehdidi fark etmeniz halinde derhal bizi bilgilendirmeniz gerekir. Giriş bilgilerinizin gizliliğini sağlamamanız nedeniyle üçüncü kişilerce kullanılmasından doğan kayıp veya zararlardan Şirket sorumlu değildir.\n\nŞirket, güvenlik, kötüye kullanım veya sözleşme ihlali durumlarında hesabı askıya alma veya sonlandırma hakkına sahiptir.',
			section3Title: '3. Hizmetin Kullanımı ve Yasaklı Davranışlar',
			section3Content:
				'Kullanıcı, platformu yalnızca yasal amaçlarla ve bu sözleşmeye uygun şekilde kullanacağını kabul eder.\n\nAşağıdaki davranışlar yasaktır:\n• Başkası adına yetkisiz kullanım veya başka bir kişi/kuruluşu taklit etmek\n• Hesap paylaşımı veya başka kullanıcıların giriş bilgilerini talep etmek\n• İçerikleri izinsiz kopyalamak, dağıtmak, satmak veya ticari amaçla kullanmak\n• Tersine mühendislik, spam, zararlı faaliyet veya platform güvenliğini tehdit eden müdahaleler\n• Platform üzerinde izinsiz ticari veya reklam amaçlı kullanım\n• Yasaya, genel ahlaka veya üçüncü kişilerin haklarına aykırı içerik paylaşmak\n\nİhlal durumunda hizmete erişiminiz askıya alınabilir veya kalıcı olarak sonlandırılabilir.',
			section4Title: '4. Kurslar, Canlı Dersler, Dijital Ürünler ve Danışmanlık',
			section4Content:
				'4.1 Online Kurslar — Genel\n• Satın alınan kurslar yalnızca kişisel, ticari olmayan kullanım içindir.\n• Kurs içerikleri üçüncü kişilerle paylaşılamaz, kopyalanamaz veya dağıtılamaz.\n• Satın alınan tüm online kurslarda erişim süresi en fazla 1 (bir) yıldır; aksi açıkça belirtilmedikçe erişim süresiz değildir. Sürekli erişimli kurslarda 1 yıllık süre satın alma tarihinden itibaren; planlı kurslarda ise kursun planlanan başlangıç tarihinden itibaren başlar (ayrıntılar Bölüm 4.1.1 ve 4.1.2).\n• Şirket belirli bir başarı, gelir artışı veya akademik sonuç garantisi vermez.\n\n4.1.1 Sürekli Erişimli Kurslar\n• Satın alma tamamlandığında kurs içeriğine ve derslere derhal erişim sağlanır.\n• Hizmet, satın alma ile birlikte ifa edilmeye başlar.\n• Erişim süresi satın alma tarihinden itibaren 1 (bir) yıldır.\n• Bu kurs tipinde, ödeme adımında dijital içeriğe hemen erişim talep edildiği ve cayma hakkından feragat edildiği açıkça onaylanmalıdır.\n\n4.1.2 Planlı Kurslar\n• Planlı kursların başlangıç tarihi kurs sayfasında ve kayıt sırasında belirtilir.\n• Başlangıç tarihinden önce kayıt olabilirsiniz; ders erişimi planlanan başlangıç tarihine kadar kilitli kalabilir.\n• Hizmet, planlı kurslarda planlanan başlangıç tarihinde fiilen başlar.\n• Erişim süresi, kursun planlanan başlangıç tarihinden itibaren 1 (bir) yıldır.\n• Başlangıç tarihinden önce yapılan kayıtlarda, sözleşmeden itibaren 14 gün içinde ve kurs başlamadan önce iptal hakkınız saklıdır (Bölüm 5.2).\n\n4.2 Canlı Dersler ve Programlı Eğitimler\n• Canlı dersler belirlenen tarih ve saatlerde gerçekleştirilir; katılım kullanıcının sorumluluğundadır.\n• Teknik sorunlardan kaynaklanan gecikmeler yaşanabilir.\n• Şirket, gerekli durumlarda eğitmen veya program değişikliği yapma hakkını saklı tutar.\n\n4.3 Dijital Kitaplar ve Kaynaklar\n• Dijital kitaplar ve kaynaklar satın alma sonrasında anında erişime açılır.\n• Kullanıcı, dijital içeriğin hemen sağlanmasını talep ettiğini ve hizmetin başlamasıyla birlikte cayma hakkından feragat ettiğini kabul eder.\n• Dijital kitaplar ve kaynaklar için genel kural olarak iade yapılmaz; ancak teknik erişim problemi, mükerrer ödeme veya sistemsel hata durumlarında iade değerlendirilebilir.\n\n4.4 Danışmanlık Randevuları\n• Danışmanlık randevuları belirlenen tarih ve saatte gerçekleştirilir; katılım ve iptal koşulları ilgili sayfalarda veya randevu onayında belirtilir.\n• Belirtilen süre dışında yapılan iptal veya katılmama durumlarında ücret iadesi yapılmayabilir.\n\nTüm içerikler ve hizmetler "olduğu gibi" sunulur.',
			section5Title: '5. Ödeme, İade ve Cayma Hakkı',
			section5Content:
				'5.1 Ödemeler\n• Tüm ödemeler satın alma sırasında tahsil edilir.\n• Ödemeler Stripe veya benzeri güvenli ödeme altyapıları üzerinden gerçekleştirilir; kart bilgileri Şirket tarafından saklanmaz.\n• Fiyatlar, ilgili sayfada gösterilen para birimi ve vergi dahil/hariç durumuna göre geçerlidir.\n\n5.2 Online Kurslar İçin Cayma Hakkı\n\n5.2.1 Sürekli Erişimli Kurslar\n• Satın alma sonrasında kurs erişimi derhal başlar.\n• Kullanıcı, dijital içeriğe hemen erişim talep ettiğini ve hizmetin başlamasıyla birlikte 14 günlük cayma hakkından feragat ettiğini kabul eder.\n• Bu nedenle sürekli erişimli kurslarda erişim başladıktan sonra iade yapılmaz.\n\n5.2.2 Planlı Kurslar\n• Planlı kurslarda hizmet, planlanan başlangıç tarihinde fiilen başlar.\n• Kullanıcı, sözleşmenin kurulmasından itibaren 14 gün içinde ve kurs başlangıç tarihinden önce iptal talebinde bulunabilir.\n• Bu süre içinde iptal hakkı, kurs başlamadan önce kullanılabilir; kurs başlangıcından sonra cayma hakkı sona erer.\n• Örneğin kurs başlangıcına 9 gün kala kayıt olunduysa, kurs başlamadan önce kalan süre boyunca (ve 14 günlük cayma süresi dolmadan) iptal hakkı kullanılabilir.\n• Şirket, oluşabilecek idari ve operasyonel maliyetler nedeniyle £25\'yi aşmamak kaydıyla makul bir iptal ücreti uygulayabilir; kalan tutar kullanıcıya iade edilir.\n\n5.2.3 Hizmetin Erken Başlatılması\n• Kullanıcı, planlı kursun 14 günlük cayma süresi dolmadan veya planlanan başlangıç tarihinden önce erişim talep ederse, hizmetin başlamasıyla birlikte cayma hakkının ortadan kalkacağını kabul eder.\n\n5.3 Ters İbraz (Chargeback) Politikası\n• Kullanıcı, haksız ters ibraz (chargeback) işlemleri başlatmamayı kabul eder.\n• Herhangi bir uyuşmazlık durumunda öncelikle Şirket ile iletişime geçilmelidir.\n• Haksız ters ibraz durumunda kullanıcı hesabı askıya alınabilir veya sonlandırılabilir.',
			section6Title: '6. Gizlilik',
			section6Content:
				'Kişisel verileriniz, Gizlilik Politikamızda açıklandığı şekilde işlenir. Gizlilik Politikasına burada atıfta bulunulmakta olup, metnin tamamı için ',
			section6Link: 'Gizlilik Politikası',
			section6End: ' sayfamızı inceleyebilirsiniz.',
			section7Title: '7. Fikri Mülkiyet',
			section7Content:
				'Platformda yer alan tüm içerikler NEXTEDU LTD mülkiyetindedir ve telif hakkı ile diğer fikri mülkiyet hakları ile korunmaktadır.\n\nİzinsiz kopyalama, yayma, satış, ticari kullanım veya türev çalışma oluşturma yasaktır. Size tanınan hak, yalnızca kişisel kullanım için sınırlı erişim hakkıdır.',
			section8Title: '8. Sorumluluk Sınırı',
			section8Content:
				'Hizmetler "olduğu gibi" sunulmaktadır. Şirket belirli bir başarı, gelir artışı veya akademik sonuç garantisi vermez.\n\nYürürlükteki yasaların izin verdiği ölçüde, dolaylı zarar, veri kaybı, iş kaybı veya kâr kaybı dahil olmak üzere belirli türdeki zararlardan sorumluluk kabul edilmemektedir. Zorunlu tüketici hakları saklıdır.',
			section9Title: '9. Üçüncü Taraf Hizmetler ve Bağlantılar',
			section9Content:
				'Platform, Stripe, Firebase, Zoom, YouTube, Vimeo, Dailymotion gibi üçüncü taraf hizmet sağlayıcılarına ve üçüncü taraf web sitelerine yönlendirme içerebilir. Şirket, bu platformların içeriklerinden, hizmetlerinden veya gizlilik uygulamalarından sorumlu değildir.',
			section10Title: '10. Hesabın Sonlandırılması',
			section10Content:
				'Kullanıcı hesabını istediği zaman kapatabilir. Fesih veya hesap kapatma halinde kullanılmayan döneme ait ücret iadesi yapılmaz.\n\nŞirket aşağıdaki durumlarda hesabı askıya alma veya sonlandırma hakkına sahiptir: sözleşme ihlali, hesap paylaşımı, kötüye kullanım, güvenlik ihlalleri ve yasadışı faaliyetler.\n\nFesih sonrasında doğası gereği yürürlükte kalması gereken hükümler (sorumluluk sınırı, fikri mülkiyet, uygulanacak hukuk vb.) geçerliliğini sürdürür.',
			section11Title: '11. Uygulanacak Hukuk ve Uyuşmazlık',
			section11Content:
				'Bu sözleşme Birleşik Krallık hukukuna tabidir. Bu sözleşmeden doğan uyuşmazlıklarda İngiltere ve Galler mahkemeleri yetkilidir. Zorunlu tüketici koruma hükümleri saklıdır.',
			section12Title: '12. Değişiklikler',
			section12Content:
				'Şirket bu sözleşmeyi zaman zaman güncelleyebilir. Önemli değişiklikler bu sayfada ve "Son Güncelleme" tarihi ile yansıtılacaktır. Güncellemeler web sitesinde yayınlandığı tarihten itibaren geçerli olur. Değişikliklerden sonra hizmeti kullanmaya devam etmeniz, güncel sözleşmeyi kabul ettiğiniz anlamına gelir.',
			section13Title: '13. Bildirimler',
			section13Content:
				'Bu sözleşme kapsamındaki bildirimler e-posta veya platform üzerinden yapılabilir. İletişim bilgilerinizi güncel tutmanız sizin sorumluluğunuzdadır; güncel olmayan bilgi nedeniyle bildirimlere ulaşamamanız yükümlülüklerinizi ortadan kaldırmaz.',
			section14Title: '14. İletişim',
			section14Content: 'Bu sözleşme hakkında sorularınız için:',
			contactName: 'Aden Academy (NEXTEDU LTD)',
			contactAddress: COMPANY_ADDRESS,
			contactPagePrefix: 'Ayrıca ',
			contactLink: 'İletişim',
			contactPageSuffix: ' sayfamızdan bizimle iletişime geçebilirsiniz.',
		},
		en: {
			title: 'User Agreement',
			subtitle: 'Aden Academy',
			business: `Business: ${COMPANY_NAME}`,
			address: COMPANY_ADDRESS,
			registration: COMPANY_REGISTRATION_EN,
			brand: `Brand: ${COMPANY_BRAND}`,
			lastUpdated: 'Last Updated:',
			intro:
				'This User Agreement governs the rights and obligations between you and NEXTEDU LTD when you use the Aden Academy platform. By registering, creating an account, making a purchase, or continuing to use the services, you are deemed to have accepted this agreement.\n\nThis agreement has been prepared for users in the United Kingdom (UK), the European Union (EU), and Turkey, and is consistent with UK GDPR, EU GDPR, the Personal Data Protection Law (KVKK No. 6698), and UK consumer legislation.',
			section1Title: '1. Definitions',
			section1Content:
				'Platform / Site: The Aden Academy website and its digital infrastructure.\n\nCompany: NEXTEDU LTD (operating under the Aden Academy brand).\n\nUser: Any natural or legal person using the platform.\n\nServices: Online courses, live lessons, digital books and resources (documents), educational materials, quizzes and practice lessons, consultation appointments, community and messaging services, and related digital services.\n\nContent: Video, text, audio, PDF, images, software, and all educational materials.\n\nEvergreen Course: An online course that provides immediate access to lessons and digital content after purchase.\n\nCohort (Scheduled) Course: An online course with a fixed start date; lesson access may remain locked until that date.\n\nCommencement of Service: For evergreen courses, when access to the first lesson or digital content opens after purchase; for cohort courses, when lesson access actually opens on the scheduled start date.',
			section2Title: '2. Account and Membership',
			section2Content:
				'Services are intended for users aged 18 and over only. By registering, you confirm that you meet this requirement.\n\nYou must ensure that the information you provide when registering is accurate and up to date. You must keep your account credentials (including password) confidential, not share them with third parties, and are responsible for any activity carried out through your account. Account sharing is prohibited.\n\nYou must inform us without delay if you become aware of any unauthorised access or security threat. The Company is not liable for any loss arising from use of your credentials by third parties due to your failure to keep them confidential.\n\nThe Company may suspend or terminate accounts in cases of security concerns, misuse, or breach of this agreement.',
			section3Title: '3. Use of the Service and Prohibited Conduct',
			section3Content:
				'You agree to use the platform only for lawful purposes and in accordance with this agreement.\n\nThe following are prohibited:\n• Unauthorised use on behalf of others or impersonating another person or organisation\n• Account sharing or requesting other users\' credentials\n• Copying, distributing, selling, or commercially using content without permission\n• Reverse engineering, spam, harmful activity, or technical interference that threatens platform security\n• Unauthorised commercial or advertising use of the platform\n• Sharing content that is unlawful, contrary to public morality, or infringes third-party rights\n\nIn case of breach, your access may be suspended or permanently terminated.',
			section4Title: '4. Courses, Live Lessons, Digital Products, and Consultations',
			section4Content:
				'4.1 Online Courses — General\n• Purchased courses are for personal, non-commercial use only.\n• Course content may not be shared, copied, or distributed to third parties.\n• All purchased online courses include access for a maximum of 1 (one) year; unless expressly stated otherwise, access is not indefinite. For evergreen courses, the 1-year period starts from the purchase date; for cohort courses, it starts from the scheduled course start date (see Sections 4.1.1 and 4.1.2).\n• The Company does not guarantee any specific outcome, income increase, or academic result.\n\n4.1.1 Evergreen Courses\n• Access to course content and lessons is granted immediately after purchase is completed.\n• The service begins upon purchase.\n• Access lasts for 1 (one) year from the purchase date.\n• For this course type, you must expressly confirm at checkout that you request immediate access to digital content and waive your right of withdrawal.\n\n4.1.2 Cohort (Scheduled) Courses\n• The start date of cohort courses is shown on the course page and at registration.\n• You may register before the start date; lesson access may remain locked until the scheduled start date.\n• For cohort courses, the service actually begins on the scheduled start date.\n• Access lasts for 1 (one) year from the scheduled course start date.\n• For registrations before the start date, you retain the right to cancel within 14 days of concluding the contract and before the course starts (Section 5.2).\n\n4.2 Live Lessons and Scheduled Programmes\n• Live lessons take place at the scheduled date and time; participation is the user\'s responsibility.\n• Delays due to technical issues may occur.\n• The Company reserves the right to change instructors or programmes where necessary.\n\n4.3 Digital Books and Resources\n• Digital books and resources become available immediately after purchase.\n• You acknowledge that you have requested immediate provision of digital content and waive your right of withdrawal once the service has begun.\n• As a general rule, digital books and resources are non-refundable; however, refunds may be considered in cases of technical access problems, duplicate payment, or system error.\n\n4.4 Consultation Appointments\n• Consultation appointments take place at the agreed date and time; participation and cancellation terms are set out on the relevant pages or in the appointment confirmation.\n• Cancellations or non-attendance outside the specified period may not qualify for a refund.\n\nAll content and services are provided "as is".',
			section5Title: '5. Payment, Refunds, and Right of Withdrawal',
			section5Content:
				'5.1 Payments\n• All payments are collected at the time of purchase.\n• Payments are processed via Stripe or similar secure payment infrastructure; card details are not stored by the Company.\n• Prices are as shown on the relevant page, in the stated currency and including or excluding tax as indicated.\n\n5.2 Right of Withdrawal for Online Courses\n\n5.2.1 Evergreen Courses\n• Course access begins immediately after purchase.\n• You acknowledge that you have requested immediate access to digital content and waive your 14-day right of withdrawal once the service has begun.\n• No refund is available for evergreen courses after access has started.\n\n5.2.2 Cohort (Scheduled) Courses\n• For cohort courses, the service actually begins on the scheduled start date.\n• You may request cancellation within 14 days of concluding the contract and before the course start date.\n• This right may be exercised before the course starts; once the course has started, the right of withdrawal ends.\n• For example, if you register 9 days before the course start date, you may cancel during the remaining time before the course starts (and within the 14-day withdrawal period).\n• The Company may apply a reasonable cancellation fee not exceeding £25 for administrative and operational costs; the remaining amount will be refunded.\n\n5.2.3 Early Start of Service\n• If you request access to a cohort course before the 14-day withdrawal period expires or before the scheduled start date, you accept that your right of withdrawal will end once the service has started.\n\n5.3 Chargeback Policy\n• You agree not to initiate unjustified chargeback transactions.\n• In any dispute, you must contact the Company first.\n• Unjustified chargebacks may result in suspension or termination of your account.',
			section6Title: '6. Privacy',
			section6Content:
				'Your personal data is processed as set out in our Privacy Policy. We refer to the Privacy Policy here; for the full text please see our ',
			section6Link: 'Privacy Policy',
			section6End: ' page.',
			section7Title: '7. Intellectual Property',
			section7Content:
				'All content on the platform is owned by NEXTEDU LTD and is protected by copyright and other intellectual property rights.\n\nUnauthorised copying, publication, sale, commercial use, or creation of derivative works is prohibited. You are granted only a limited right of access for personal use.',
			section8Title: '8. Limitation of Liability',
			section8Content:
				'Services are provided "as is". The Company does not guarantee any specific outcome, income increase, or academic result.\n\nTo the extent permitted by applicable law, we do not accept liability for certain types of loss, including indirect loss, data loss, loss of business, or loss of profit. Mandatory consumer rights remain unaffected.',
			section9Title: '9. Third-Party Services and Links',
			section9Content:
				'The platform may include third-party service providers such as Stripe, Firebase, Zoom, YouTube, Vimeo, and Dailymotion, as well as links to third-party websites. The Company is not responsible for the content, services, or privacy practices of these platforms.',
			section10Title: '10. Termination of Account',
			section10Content:
				'You may close your account at any time. No refund is due for any unused period upon termination or account closure.\n\nThe Company may suspend or terminate accounts in cases of: breach of agreement, account sharing, misuse, security violations, and unlawful activity.\n\nProvisions that by their nature should survive (such as limitation of liability, intellectual property, and governing law) will continue to apply after termination.',
			section11Title: '11. Governing Law and Disputes',
			section11Content:
				'This agreement is governed by the law of the United Kingdom. Disputes arising from this agreement are subject to the exclusive jurisdiction of the courts of England and Wales. Mandatory consumer protection provisions remain unaffected.',
			section12Title: '12. Changes',
			section12Content:
				'The Company may update this agreement from time to time. Material changes will be reflected on this page and the "Last Updated" date. Updates take effect from the date they are published on the website. Your continued use of the service after changes constitutes acceptance of the updated agreement.',
			section13Title: '13. Notices',
			section13Content:
				'Notices under this agreement may be sent by email or through the platform. You are responsible for keeping your contact details up to date; failure to receive a notice due to outdated information does not relieve you of your obligations.',
			section14Title: '14. Contact',
			section14Content: 'For questions about this agreement:',
			contactName: 'Aden Academy (NEXTEDU LTD)',
			contactAddress: COMPANY_ADDRESS,
			contactPagePrefix: 'You may also contact us via our ',
			contactLink: 'Contact',
			contactPageSuffix: ' page.',
		},
	};

	const currentContent = content[language];

	const bodySx = {
		fontSize: isMobileSize ? '0.75rem' : '0.9rem',
		mb: '1rem',
		lineHeight: 1.8,
		fontFamily: fontFamilyLandingPage,
		whiteSpace: 'pre-line' as const,
	};
	const headingSx = {
		fontSize: isMobileSize ? '0.9rem' : '1.1rem',
		fontWeight: 600,
		mb: '1rem',
		mt: '2rem',
		fontFamily: fontFamilyLandingPage,
	};

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

					<Typography variant='body2' sx={{ ...bodySx, textAlign: 'center', mb: '0.25rem', whiteSpace: 'normal' }}>
						{currentContent.subtitle}
					</Typography>
					<Typography variant='body2' sx={{ ...bodySx, textAlign: 'center', mb: '0.25rem', whiteSpace: 'normal' }}>
						{currentContent.business}
					</Typography>
					<Typography variant='body2' sx={{ ...bodySx, textAlign: 'center', mb: '0.25rem', whiteSpace: 'normal' }}>
						{currentContent.address}
					</Typography>
					<Typography variant='body2' sx={{ ...bodySx, textAlign: 'center', mb: '0.25rem', whiteSpace: 'normal' }}>
						{currentContent.registration}
					</Typography>
					<Typography variant='body2' sx={{ ...bodySx, textAlign: 'center', mb: '1rem', whiteSpace: 'normal' }}>
						{currentContent.brand}
					</Typography>

					<Typography variant='body2' sx={{ ...bodySx, mb: '2rem', whiteSpace: 'normal' }}>
						{currentContent.lastUpdated} {formatLegalLastUpdated(language)}
					</Typography>

					<Divider sx={{ mb: '2rem' }} />

					<Typography variant='body2' sx={bodySx}>{currentContent.intro}</Typography>

					<Typography variant='h6' sx={headingSx}>{currentContent.section1Title}</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.section1Content}</Typography>

					<Typography variant='h6' sx={headingSx}>{currentContent.section2Title}</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.section2Content}</Typography>

					<Typography variant='h6' sx={headingSx}>{currentContent.section3Title}</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.section3Content}</Typography>

					<Typography variant='h6' sx={headingSx}>{currentContent.section4Title}</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.section4Content}</Typography>

					<Typography variant='h6' sx={headingSx}>{currentContent.section5Title}</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.section5Content}</Typography>

					<Typography variant='h6' sx={headingSx}>{currentContent.section6Title}</Typography>
					<Typography variant='body2' sx={{ ...bodySx, whiteSpace: 'normal' }}>
						{currentContent.section6Content}
						<Link to='/privacy-policy' style={{ color: theme.palette.primary.main, textDecoration: 'underline', fontFamily: fontFamilyLandingPage }}>
							{currentContent.section6Link}
						</Link>
						{currentContent.section6End}
					</Typography>

					<Typography variant='h6' sx={headingSx}>{currentContent.section7Title}</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.section7Content}</Typography>

					<Typography variant='h6' sx={headingSx}>{currentContent.section8Title}</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.section8Content}</Typography>

					<Typography variant='h6' sx={headingSx}>{currentContent.section9Title}</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.section9Content}</Typography>

					<Typography variant='h6' sx={headingSx}>{currentContent.section10Title}</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.section10Content}</Typography>

					<Typography variant='h6' sx={headingSx}>{currentContent.section11Title}</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.section11Content}</Typography>

					<Typography variant='h6' sx={headingSx}>{currentContent.section12Title}</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.section12Content}</Typography>

					<Typography variant='h6' sx={headingSx}>{currentContent.section13Title}</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.section13Content}</Typography>

					<Typography variant='h6' sx={headingSx}>{currentContent.section14Title}</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.section14Content}</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.contactName}</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.contactAddress}</Typography>
					<Typography variant='body2' sx={{ ...bodySx, whiteSpace: 'normal' }}>
						<a href={`mailto:${CONTACT_EMAIL}`} style={{ color: theme.palette.primary.main, textDecoration: 'underline', fontFamily: fontFamilyLandingPage }}>
							{CONTACT_EMAIL}
						</a>
					</Typography>
					<Typography variant='body2' sx={{ ...bodySx, mb: '2rem', whiteSpace: 'normal' }}>
						{currentContent.contactPagePrefix}
						<Link to='/contact-us' style={{ color: theme.palette.primary.main, textDecoration: 'underline', fontFamily: fontFamilyLandingPage }}>
							{currentContent.contactLink}
						</Link>
						{currentContent.contactPageSuffix}
					</Typography>
				</Paper>
			</Container>
		</LandingPageLayout>
	);
};

export default UserAgreement;
