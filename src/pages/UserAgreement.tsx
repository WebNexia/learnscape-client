import { Box, Container, Typography, Paper, Divider, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { Link } from 'react-router-dom';
import { useContext, useState, useEffect } from 'react';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import LandingPageLayout from '../components/landingPage/LandingPageLayout';
import theme from '../themes';

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
			lastUpdated: 'Son güncelleme:',
			intro:
				'Bu Kullanıcı Sözleşmesi, platformumuzu ve hizmetlerimizi kullanırken sizinle aramızdaki hak ve yükümlülükleri düzenler. Hizmete kayıt olarak, hesap oluşturarak veya platformu kullanmaya devam ederek bu sözleşmeyi kabul etmiş sayılırsınız. Sözleşme, kaydınızın onaylandığı veya hizmeti ilk kullandığınız tarihte yürürlüğe girer.',
			section1Title: '1. Tanımlar ve Hizmetin Tanımı',
			section1Content:
				'"Platform" veya "Site", bu web sitesini ifade eder. "Hizmetler", platform üzerinden sunulan tüm içerik ve hizmetleri kapsar. "İçerik", metin, görsel, video, ses ve yazılım dahil platformdaki tüm materyalleri ifade eder. "Kullanıcı", platformu kullanan gerçek veya tüzel kişidir. Hizmet, bu web sitesini işleten tüzel kişi tarafından sunulmakta olup; eğitim içerikleri, kurslar, kaynaklar (dökümanlar), danışmanlık randevuları ve ilgili ödeme işlemlerini kapsar.',
			section2Title: '2. Uygunluk, Hesap ve Kayıt',
			section2Content:
				'Hizmetler, reşit ve ayırt etme gücüne sahip kullanıcılar içindir; kayıt olmakla bu şartlara haiz olduğunuzu kabul etmiş sayılırsınız. Kayıt sırasında verdiğiniz bilgilerin doğru ve güncel olması sizin sorumluluğunuzdadır. Hesap giriş bilgilerinizi (şifre vb.) gizli tutmanız ve üçüncü kişilerle paylaşmamanız gerekir. Hesabınızın güvenliğinden ve hesabınız üzerinden yapılan işlemlerden siz sorumlusunuz. Yetkisiz erişim veya güvenlik tehdidi fark etmeniz halinde derhal bizi bilgilendirmeniz gerekir. Giriş bilgilerinizin gizliliğini sağlamamanız nedeniyle üçüncü kişilerce kullanılmasından doğan kayıp veya zararlardan biz sorumlu değiliz.',
			section3Title: '3. Hizmetin Kullanımı ve Yasaklı Davranışlar',
			section3Content:
				'Platformu yalnızca yürürlükteki yasalara ve bu sözleşmeye uygun şekilde kullanmalısınız. Yasaktır: başkası adına yetkisiz kullanım; içeriği izinsiz kopyalama, dağıtma veya ticari kullanım; tersine mühendislik, spam veya zararlı faaliyet; başka bir kişi veya kuruluşu taklit etmek; hesabı üçüncü kişilerle paylaşmak veya başka kullanıcıların giriş bilgilerini talep etmek; platform üzerinde izinsiz ticari veya reklam amaçlı kullanım; yasaya, genel ahlaka veya üçüncü kişilerin haklarına aykırı içerik paylaşmak. Bu sözleşmeyi ihlal etmeniz durumunda hizmete erişiminiz tek taraflı olarak sonlandırılabilir.',
			section4Title: '4. Kurslar, Kaynaklar ve Danışmanlık',
			section4Content:
				'Satın aldığınız kurslar ve kaynaklar yalnızca kişisel, ticari olmayan kullanım içindir. İçeriklerin üçüncü kişilerle paylaşılması, kopyalanması veya ticari amaçla kullanılması yasaktır. Danışmanlık randevuları, belirlenen tarih ve saatte gerçekleştirilir; katılım ve iptal koşulları ilgili sayfalarda veya randevu onayında belirtilir. Belirtilen süre dışında yapılan iptal veya katılmama durumlarında ücret iadesi yapılmayabilir. İçerikler ve hizmetler "olduğu gibi" sunulur; belirli bir sonuç garantisi verilmez.',
			section5Title: '5. Ödeme ve İade',
			section5Content:
				'Ödemeler, platformda belirtilen yöntemler ve güvenli ödeme altyapısı üzerinden alınır. Fiyatlar, ilgili sayfada gösterilen para birimi ve vergi dahil/hariç durumuna göre geçerlidir. Dijital ürünler (kurs, kaynak erişimi) ve danışmanlık hizmeti satın alımlarında, yasal zorunluluklar dışında genel iade politikası uygulanmaz; iade talepleri ilgili mevzuat ve platform politikası çerçevesinde değerlendirilir. Kullanıcı, dijital içeriklere erişimin sözleşmenin kurulmasının hemen ardından başlatılmasını açıkça talep ettiğini ve bu erişimin başlamasıyla birlikte yasal cayma hakkını kaybedeceği konusunda bilgilendirildiğini kabul eder.',
			section6Title: '6. Gizlilik',
			section6Content:
				'Kişisel verileriniz, Gizlilik Politikamızda açıklandığı şekilde işlenir. Gizlilik Politikasına burada atıfta bulunulmakta olup, metnin tamamı için ',
			section6Link: 'Gizlilik Politikası',
			section6End: ' sayfamızı inceleyebilirsiniz.',
			section7Title: '7. Fikri Mülkiyet ve Telif',
			section7Content:
				'Platform ve içerikler (metin, görsel, video, yazılım vb.) telif hakkı ve diğer fikri mülkiyet hakları ile korunmaktadır. İzinsiz kopyalama, dağıtma, yayma veya türev çalışma oluşturma yasaktır. Size tanınan, yalnızca kişisel kullanım için sınırlı erişim hakkıdır.',
			section8Title: '8. Sorumluluk Sınırı',
			section8Content:
				'Hizmet "olduğu gibi" sunulmaktadır. Yürürlükteki yasaların izin verdiği ölçüde, dolaylı zarar, veri kaybı, iş kaybı veya kâr kaybı dahil olmak üzere belirli türdeki zararlardan sorumluluk kabul edilmemektedir. Zorunlu yasal garanti ve tüketici hakları saklıdır.',
			section9Title: '9. Hizmete Erişimin Sona Ermesi',
			section9Content:
				'İstediğiniz zaman hesabınızı kapatarak üyeliğinizi sonlandırabilirsiniz. Fesih veya hesap kapatma halinde kullanılmayan döneme ait ücret iadesi yapılmaz. Bu sözleşmeyi veya kullanım koşullarını ihlal etmeniz halinde, önceden bildirimde bulunmaksızın hesabınızı askıya alma veya sonlandırma hakkımız saklıdır. Sözleşmenin feshi veya hesabın kapatılması durumunda, doğası gereği devam etmesi gereken hükümler (sorumluluk sınırı, fikri mülkiyet, uygulanacak hukuk vb.) yürürlükte kalmaya devam eder.',
			section10Title: '10. Uygulanacak Hukuk ve Uyuşmazlık',
			section10Content:
				'Bu sözleşme, hizmet sağlayıcının merkezinin bulunduğu ülke (ör. İngiltere) hukukuna tabidir. Bu sözleşmeden doğan uyuşmazlıklarda, ilgili ülkenin mahkemeleri yetkilidir.',
			section11Title: '11. Değişiklikler',
			section11Content:
				'Bu sözleşmeyi zaman zaman güncelleme hakkımız saklıdır. Önemli değişiklikler bu sayfada ve "Son güncelleme" tarihi ile yansıtılacaktır. Değişikliklerden sonra hizmeti kullanmaya devam etmeniz, güncel sözleşmeyi kabul ettiğiniz anlamına gelir.',
			section12Title: '12. Bildirimler',
			section12Content:
				'Bu sözleşme kapsamındaki bildirimler e-posta veya platform üzerinden yapılabilir. İletişim bilgilerinizi güncel tutmanız sizin sorumluluğunuzdadır; güncel olmayan bilgi nedeniyle bildirimlere ulaşamamanız yükümlülüklerinizi ortadan kaldırmaz.',
			section13Title: '13. İletişim',
			section13Content: 'Bu sözleşme hakkında sorularınız için lütfen ',
			contactLink: 'İletişim',
			section13End: ' sayfamızdan bizimle iletişime geçin.',
		},
		en: {
			title: 'User Agreement',
			lastUpdated: 'Last updated:',
			intro:
				'This User Agreement governs the rights and obligations between you and us when you use our platform and services. By registering, creating an account, or continuing to use the platform, you are deemed to have accepted this agreement. The agreement enters into force when your registration is confirmed or when you first use the service.',
			section1Title: '1. Definitions and Description of the Service',
			section1Content:
				'"Platform" or "Site" means this website. "Services" means all content and services offered through the platform. "Content" means all materials on the platform, including text, images, video, audio and software. "User" means any natural or legal person using the platform. The service is provided by the legal entity that operates this website and includes educational content, courses, resources (documents), consultation appointments and related payment processing.',
			section2Title: '2. Eligibility, Account and Registration',
			section2Content:
				'The services are intended for users who have reached the age of majority and have legal capacity; by registering you are deemed to meet these requirements. You are responsible for ensuring that the information you provide when registering is accurate and up to date. You must keep your account credentials (including password) confidential and not share them with third parties. You are responsible for the security of your account and for any activity carried out through it. You must inform us without delay if you become aware of any unauthorised access or security threat. We are not liable for any loss arising from use of your credentials by third parties due to your failure to keep them confidential.',
			section3Title: '3. Use of the Service and Prohibited Conduct',
			section3Content:
				'You must use the platform only in accordance with applicable laws and this agreement. The following are prohibited: unauthorised use on behalf of others; copying, distributing or commercial use of content without permission; reverse engineering, spam or harmful activity; impersonating another person or organisation; sharing your account with third parties or requesting other users’ credentials; unauthorised commercial or advertising use of the platform; sharing content that is unlawful, contrary to public morality or infringes third-party rights. We reserve the right to terminate or restrict your access to the service if you breach this agreement.',
			section4Title: '4. Courses, Resources and Consultations',
			section4Content:
				'Courses and resources you purchase are for personal, non-commercial use only. Sharing, copying, or using content for commercial purposes is prohibited. Consultation appointments take place at the agreed date and time; participation and cancellation terms are set out on the relevant pages or in the appointment confirmation. Cancellations or non-attendance outside the specified period may not qualify for a refund. Content and services are provided "as is"; no specific outcome is guaranteed.',
			section5Title: '5. Payment and Refunds',
			section5Content:
				'Payments are taken via the methods and secure payment infrastructure indicated on the platform. Prices are as shown on the relevant page, in the stated currency and including or excluding tax as indicated. For digital products (course or resource access) and consultation purchases, no general refund policy applies except where required by law; refund requests are considered in line with applicable law and platform policy. You acknowledge that you have expressly requested that access to digital content be started immediately after the conclusion of the contract and that you have been informed that you will lose your statutory right of withdrawal once such access has begun.',
			section6Title: '6. Privacy',
			section6Content:
				'Your personal data is processed as set out in our Privacy Policy. We refer to the Privacy Policy here; for the full text please see our ',
			section6Link: 'Privacy Policy',
			section6End: ' page.',
			section7Title: '7. Intellectual Property and Copyright',
			section7Content:
				'The platform and its content (text, images, video, software, etc.) are protected by copyright and other intellectual property rights. Unauthorised copying, distribution, publication, or creation of derivative works is prohibited. You are granted only a limited right of access for personal use.',
			section8Title: '8. Limitation of Liability',
			section8Content:
				'The service is provided "as is". To the extent permitted by applicable law, we do not accept liability for certain types of loss, including indirect loss, data loss, loss of business, or loss of profit. Mandatory legal warranties and consumer rights remain unaffected.',
			section9Title: '9. Termination of Access',
			section9Content:
				'You may close your account and end your membership at any time. No refund is due for any unused period upon termination or account closure. We reserve the right to suspend or terminate your account without prior notice if you breach this agreement or the terms of use. Provisions that by their nature should survive (such as limitation of liability, intellectual property, governing law) will continue to apply after termination or closure of your account.',
			section10Title: '10. Governing Law and Disputes',
			section10Content:
				'This agreement is governed by the law of the country where the service provider is established (e.g. England). Disputes arising from this agreement are subject to the exclusive jurisdiction of the courts of that country.',
			section11Title: '11. Changes',
			section11Content:
				'We reserve the right to update this agreement from time to time. Material changes will be reflected on this page and the "Last updated" date. Your continued use of the service after changes constitutes acceptance of the updated agreement.',
			section12Title: '12. Notices',
			section12Content:
				'Notices under this agreement may be sent by email or through the platform. You are responsible for keeping your contact details up to date; failure to receive a notice due to outdated information does not relieve you of your obligations.',
			section13Title: '13. Contact',
			section13Content: 'For questions about this agreement, please contact us via our ',
			contactLink: 'Contact',
			section13End: ' page.',
		},
	};

	const currentContent = content[language];
	const dateLocale = language === 'tr' ? 'tr-TR' : 'en-GB';

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
							mb: '1rem',
							textAlign: 'center',
							fontFamily: fontFamilyLandingPage,
						}}>
						{currentContent.title}
					</Typography>

					<Typography variant='body2' sx={{ ...bodySx, mb: '2rem' }}>
						{currentContent.lastUpdated}{' '}
						{new Date().toLocaleDateString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric' })}
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
					<Typography variant='body2' sx={bodySx}>
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
					<Typography variant='body2' sx={{ ...bodySx, mb: '2rem' }}>
						{currentContent.section13Content}
						<Link to='/contact-us' style={{ color: theme.palette.primary.main, textDecoration: 'underline', fontFamily: fontFamilyLandingPage }}>
							{currentContent.contactLink}
						</Link>
						{currentContent.section13End}
					</Typography>
				</Paper>
			</Container>
		</LandingPageLayout>
	);
};

export default UserAgreement;
