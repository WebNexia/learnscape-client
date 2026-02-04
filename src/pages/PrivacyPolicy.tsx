import { Box, Container, Typography, Paper, Divider, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { Link } from 'react-router-dom';
import { useContext, useState, useEffect } from 'react';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import LandingPageLayout from '../components/landingPage/LandingPageLayout';
import theme from '../themes';

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
			lastUpdated: 'Son güncelleme:',
			intro:
				'Bu Gizlilik Politikası, Birleşik Krallık (UK), Avrupa Birliği (AB) ve Türkiye\'deki kullanıcılarımız dahil olmak üzere kişisel verilerinizi nasıl topladığımızı, kullandığımızı ve koruduğumuzu açıklar. AB Genel Veri Koruma Yönetmeliği (GDPR), UK GDPR ve ilgili veri koruma yasalarına uygun olarak hazırlanmıştır. Türkiye\'de bulunan kullanıcılar için kişisel veriler, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında da işlenmektedir.',
			section1Title: '1. Veri Sorumlusu',
			section1Content:
				'Kişisel verilerinizin sorumlusu (veri sorumlusu), hizmeti sunan ve bu web sitesini işleten tüzel kişidir. Veri sorumlusu Birleşik Krallık\'ta yerleşiktir. İletişim bilgileri ve hak talepleriniz için aşağıdaki "İletişim" bölümüne bakın.',
			section2Title: '2. Topladığımız Veriler',
			section2Content:
				'Hizmet sunumu, ödeme işlemleri, danışmanlık randevuları ve iletişim amacıyla aşağıdaki kategorilerde kişisel veri toplayabiliriz:',
			dataTypes: [
				{ title: 'Kimlik ve iletişim bilgileri:', desc: 'Ad, soyad, e-posta adresi, telefon numarası, ülke.' },
				{ title: 'Hesap bilgileri:', desc: 'Kayıt ve giriş için kullandığınız e-posta ve kimlik doğrulama bilgileri (örn. Firebase).' },
				{ title: 'Ödeme bilgileri:', desc: 'Ödeme işlemleri Stripe üzerinden yapılır; kart numarası bizde saklanmaz. Fatura/ödeme kayıtları (alıcı adı, e-posta, tutar, tarih) saklanabilir.' },
				{ title: 'Randevu ve danışmanlık verileri:', desc: 'Danışmanlık randevu tarihleri, seçilen danışman, anket/form cevapları (randevuya bağlı).' },
				{ title: 'Kullanım verileri:', desc: 'Oturum, çerez ve benzeri teknolojilerle toplanan veriler; Çerez Politikamızda ayrıntılı açıklanmıştır.' },
			],
			section3Title: '3. Hukuki Dayanak ve Amaçlar',
			section3Content:
				'Verilerinizi şu hukuki dayanaklarla işliyoruz:',
			legalBasis: [
				{ basis: 'Sözleşmenin ifası:', desc: 'Hesap oluşturma, kurs/kaynak satışı, danışmanlık randevuları ve ödeme işlemleri için gerekli veriler.' },
				{ basis: 'Yasal yükümlülük:', desc: 'Vergi, muhasebe ve yasal saklama süreleri (örn. ödeme kayıtları).' },
				{ basis: 'Meşru menfaat:', desc: 'Güvenlik, dolandırıcılık önleme ve hizmet iyileştirmesi (hakkınızda şikayette bulunma hakkınız saklıdır).' },
				{ basis: 'Rıza:', desc: 'İsteğe bağlı çerezler veya pazarlama iletişimi gibi, açık rıza gerektiren işlemler.' },
			],
			section4Title: '4. Verilerin Saklama Süresi',
			section4Content:
				'Kişisel verilerinizi yalnızca gerekli süre boyunca saklarız. Hesap ve iletişim verileri hesap silinene veya erişim talep edilene kadar; ödeme ve fatura kayıtları yasal zorunluluklar nedeniyle daha uzun (örn. 6–7 yıl) saklanabilir. Danışmanlık ve anket verileri, hizmetin sunulması süresince ve ilgili yasal yükümlülükler doğrultusunda saklanır; bu süreler kategori bazında talep üzerine kullanıcılarla paylaşılır.',
			section5Title: '5. Haklarınız',
			section5Content:
				'GDPR ve UK GDPR kapsamında aşağıdaki haklara sahipsiniz:',
			rights: [
				'Erişim: Verilerinize erişim talep etme.',
				'Düzeltme: Yanlış veya eksik verilerin düzeltilmesini isteme.',
				'Silme: Belirli koşullarda verilerinizin silinmesini talep etme ("unutulma hakkı").',
				'Veri taşınabilirliği: Verilerinizi yapılandırılmış, yaygın kullanılan bir formatta alma.',
				'İtiraz ve kısıtlama: Belirli işlemlere itiraz etme veya işlemeyi kısıtlama talep etme.',
				'Rızayı geri çekme: Rızaya dayalı işlemlerde rızanızı geri çekme.',
			],
			section5Note:
				'Bu hakları kullanmak için iletişim bölümündeki adres üzerinden bize yazabilirsiniz. Ayrıca Birleşik Krallık\'ta ICO (ico.org.uk), AB\'de ilgili veri koruma otoritesine şikayette bulunma hakkınız vardır.',
			section5Extra:
				'Türkiye\'de bulunan kullanıcılar için KVKK kapsamında yapılan başvurular, yasalarca öngörülen süre içinde (ör. 30 gün) yanıtlanır. Kişisel veriler, KVKK\'da sayılan ilkelere (hukuka ve dürüstlük kurallarına uygunluk, doğruluk, belirli açık meşru amaçla işleme, amaçla bağlantılı sınırlı ve ölçülü olma, gerekli süre kadar muhafaza) uygun işlenmektedir. Bizimle üçüncü kişilerin kişisel verilerini paylaşıyorsanız, bu kişileri aydınlatma ve kanunen gerekliyse açık rıza alma yükümlülüğü size aittir.',
			section6Title: '6. Otomatik Karar Verme ve Profil Oluşturma',
			section6Content:
				'Platformumuzda, kullanıcılar üzerinde hukuki veya benzeri önemli etkiler doğuran otomatik karar verme veya profil çıkarma işlemleri yapılmamaktadır.',
			section7Title: '7. Güvenlik',
			section7Content:
				'Verilerinizi kayıp, yetkisiz erişim veya değişiklikten korumak için uygun teknik ve idari önlemler kullanıyoruz. Ödemeler Stripe gibi güvenli altyapılar üzerinden işlenir; kart detayları doğrudan bizde tutulmaz. Kişisel verileri etkileyen bir veri ihlali durumunda, yasal yükümlülükler çerçevesinde ilgili denetim otoriteleri ve etkilenen kullanıcılar bilgilendirilir.',
			section8Title: '8. Veri Paylaşımı ve İşleyenler',
			section8Content:
				'Kişisel verilerinizi yalnızca hizmet sunumu, ödeme ve altyapı için gerekli olduğu ölçüde aşağıdaki gibi işleyenlerle (processor) paylaşıyoruz. Bu taraflar kendi gizlilik politikalarına tabidir:',
			processors: [
				{ name: 'Firebase (Google):', desc: 'Kimlik doğrulama ve veritabanı.', linkText: 'Firebase Gizlilik', url: 'https://firebase.google.com/support/privacy' },
				{ name: 'Stripe:', desc: 'Ödeme işleme.', linkText: 'Stripe Gizlilik', url: 'https://stripe.com/privacy' },
				{ name: 'Zoom:', desc: 'Danışmanlık görüşmeleri (video).', linkText: 'Zoom Gizlilik', url: 'https://explore.zoom.us/en/privacy/' },
				{ name: 'Google (reCAPTCHA vb.):', desc: 'Güvenlik ve spam önleme.', linkText: 'Google Gizlilik', url: 'https://policies.google.com/privacy' },
			],
			section9Title: '9. Uluslararası Aktarım',
			section9Content:
				'Verileriniz UK, AB ve Türkiye dışındaki ülkelere (ör. ABD) aktarılabilir. Bu durumda, yasal gerekliliklere uygun olarak standart sözleşme hükümleri veya benzeri garantiler kullanılır. Detaylar talep üzerine verilebilir.',
			section10Title: '10. Politika Değişiklikleri',
			section10Content:
				'Bu Gizlilik Politikasını zaman zaman güncelleyebiliriz. Önemli değişiklikler bu sayfada ve "Son güncelleme" tarihi ile yansıtılacaktır. Değişiklikler yayımlandıktan sonra hizmeti kullanmaya devam etmeniz, güncel politikayı kabul ettiğiniz anlamına gelir.',
			section11Title: '11. İletişim',
			section11Content: 'Gizlilik ile ilgili sorularınız veya hak talepleriniz için lütfen',
			contactLink: 'İletişim',
			section11End: 'sayfamızdan bizimle iletişime geçin.',
		},
		en: {
			title: 'Privacy Policy',
			lastUpdated: 'Last updated:',
			intro:
				'This Privacy Policy describes how we collect, use, and protect your personal data, including for users in the United Kingdom (UK), the European Union (EU), and Turkey. It is prepared in line with the EU General Data Protection Regulation (GDPR), UK GDPR, and applicable data protection laws. For users located in Turkey, personal data is also processed within the scope of Law No. 6698 on the Protection of Personal Data (KVKK).',
			section1Title: '1. Data Controller',
			section1Content:
				'The controller of your personal data is the legal entity that provides the service and operates this website. The controller is established in the United Kingdom. For contact details and to exercise your rights, see the "Contact" section below.',
			section2Title: '2. Data We Collect',
			section2Content:
				'We may collect personal data in the following categories for providing our services, processing payments, managing consultation appointments, and communication:',
			dataTypes: [
				{ title: 'Identity and contact details:', desc: 'First and last name, email address, phone number, country.' },
				{ title: 'Account information:', desc: 'Email and authentication details used for registration and login (e.g. Firebase).' },
				{ title: 'Payment information:', desc: 'Payments are processed via Stripe; we do not store card numbers. Transaction records (payee name, email, amount, date) may be retained.' },
				{ title: 'Appointment and consultation data:', desc: 'Consultation dates, chosen consultant, and survey/form responses linked to the appointment.' },
				{ title: 'Usage data:', desc: 'Data collected via session, cookies, and similar technologies, as described in our Cookie Policy.' },
			],
			section3Title: '3. Legal Basis and Purposes',
			section3Content:
				'We process your data on the following legal bases:',
			legalBasis: [
				{ basis: 'Performance of contract:', desc: 'Data necessary for account creation, course/resource purchases, consultation bookings, and payments.' },
				{ basis: 'Legal obligation:', desc: 'Tax, accounting, and legal retention requirements (e.g. payment records).' },
				{ basis: 'Legitimate interest:', desc: 'Security, fraud prevention, and service improvement (you have the right to object).' },
				{ basis: 'Consent:', desc: 'Where required, e.g. optional cookies or marketing communications.' },
			],
			section4Title: '4. Retention',
			section4Content:
				'We keep your personal data only as long as necessary. Account and contact data are retained until you delete your account or request erasure; payment and invoice records may be kept longer for legal obligations (e.g. 6–7 years). Consultation and survey data are retained for the duration of the provision of the service and in line with applicable legal obligations; these periods are shared with users on request, by category.',
			section5Title: '5. Your Rights',
			section5Content:
				'Under GDPR and UK GDPR you have the following rights:',
			rights: [
				'Access: Request access to your data.',
				'Rectification: Request correction of inaccurate or incomplete data.',
				'Erasure: Request deletion of your data in certain circumstances ("right to be forgotten").',
				'Data portability: Receive your data in a structured, commonly used format.',
				'Objection and restriction: Object to certain processing or request restriction of processing.',
				'Withdraw consent: Withdraw consent where processing is based on consent.',
			],
			section5Note:
				'To exercise these rights, please contact us using the details in the Contact section. You also have the right to lodge a complaint with the ICO in the UK (ico.org.uk) or the relevant data protection authority in the EU.',
			section5Extra:
				'Requests made under KVKK by users in Turkey will be answered within the period required by law (e.g. 30 days). Personal data is processed in accordance with the principles set out in KVKK (lawfulness and fairness, accuracy, purpose limitation, data minimisation, storage limitation). If you share with us personal data of third parties, you are responsible for informing them and, where required by law, obtaining their consent.',
			section6Title: '6. Automated Decision-Making and Profiling',
			section6Content:
				'We do not carry out automated decision-making or profiling that has legal or similarly significant effects on users on our platform.',
			section7Title: '7. Security',
			section7Content:
				'We use appropriate technical and organisational measures to protect your data from loss, unauthorised access, or alteration. Payments are processed through secure providers such as Stripe; we do not store full card details. In the event of a data breach affecting personal data, the relevant supervisory authorities and affected users are informed in accordance with legal obligations.',
			section8Title: '8. Data Sharing and Processors',
			section8Content:
				'We share your personal data only with processors necessary for delivering our service, payments, and infrastructure. These parties are subject to their own privacy policies:',
			processors: [
				{ name: 'Firebase (Google):', desc: 'Authentication and database.', linkText: 'Firebase Privacy', url: 'https://firebase.google.com/support/privacy' },
				{ name: 'Stripe:', desc: 'Payment processing.', linkText: 'Stripe Privacy', url: 'https://stripe.com/privacy' },
				{ name: 'Zoom:', desc: 'Consultation video calls.', linkText: 'Zoom Privacy', url: 'https://explore.zoom.us/en/privacy/' },
				{ name: 'Google (reCAPTCHA etc.):', desc: 'Security and spam prevention.', linkText: 'Google Privacy', url: 'https://policies.google.com/privacy' },
			],
			section9Title: '9. International Transfers',
			section9Content:
				'Your data may be transferred to countries outside the UK, EU, and Turkey (e.g. the USA). Where this happens, we use appropriate safeguards such as standard contractual clauses. Details can be provided on request.',
			section10Title: '10. Changes to This Policy',
			section10Content:
				'We may update this Privacy Policy from time to time. Material changes will be reflected on this page and the "Last updated" date. Continued use of the service after changes constitutes acceptance of the updated policy.',
			section11Title: '11. Contact',
			section11Content: 'For any questions about privacy or to exercise your rights, please contact us via our',
			contactLink: 'Contact',
			section11End: 'page.',
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
					<Box component='ul' sx={{ pl: '1.5rem', mb: '1rem' }}>
						{currentContent.dataTypes.map((item, index) => (
							<Box key={index} component='li' sx={{ ...bodySx, mb: '0.75rem' }}>
								<strong>{item.title}</strong> {item.desc}
							</Box>
						))}
					</Box>

					<Typography variant='h6' sx={headingSx}>{currentContent.section3Title}</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.section3Content}</Typography>
					<Box component='ul' sx={{ pl: '1.5rem', mb: '1rem' }}>
						{currentContent.legalBasis.map((item, index) => (
							<Box key={index} component='li' sx={{ ...bodySx, mb: '0.75rem' }}>
								<strong>{item.basis}</strong> {item.desc}
							</Box>
						))}
					</Box>

					<Typography variant='h6' sx={headingSx}>{currentContent.section4Title}</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.section4Content}</Typography>

					<Typography variant='h6' sx={headingSx}>{currentContent.section5Title}</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.section5Content}</Typography>
					<Box component='ul' sx={{ pl: '1.5rem', mb: '1rem' }}>
						{currentContent.rights.map((right, index) => (
							<Box key={index} component='li' sx={{ ...bodySx, mb: '0.5rem' }}>
								{right}
							</Box>
						))}
					</Box>
					<Typography variant='body2' sx={{ ...bodySx, fontStyle: 'italic' }}>{currentContent.section5Note}</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.section5Extra}</Typography>

					<Typography variant='h6' sx={headingSx}>{currentContent.section6Title}</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.section6Content}</Typography>

					<Typography variant='h6' sx={headingSx}>{currentContent.section7Title}</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.section7Content}</Typography>

					<Typography variant='h6' sx={headingSx}>{currentContent.section8Title}</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.section8Content}</Typography>
					<Box component='ul' sx={{ pl: '1.5rem', mb: '1rem' }}>
						{currentContent.processors.map((p, index) => (
							<Box key={index} component='li' sx={{ ...bodySx, mb: '0.75rem' }}>
								<strong>{p.name}</strong> {p.desc}{' '}
								<a href={p.url} target='_blank' rel='noopener noreferrer' style={{ color: theme.palette.primary.main, textDecoration: 'underline', fontFamily: fontFamilyLandingPage }}>
									{p.linkText}
								</a>
							</Box>
						))}
					</Box>

					<Typography variant='h6' sx={headingSx}>{currentContent.section9Title}</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.section9Content}</Typography>

					<Typography variant='h6' sx={headingSx}>{currentContent.section10Title}</Typography>
					<Typography variant='body2' sx={bodySx}>{currentContent.section10Content}</Typography>

					<Typography variant='h6' sx={headingSx}>{currentContent.section11Title}</Typography>
					<Typography variant='body2' sx={{ ...bodySx, mb: '2rem' }}>
						{currentContent.section11Content}{' '}
						<Link to='/contact-us' style={{ color: theme.palette.primary.main, textDecoration: 'underline', fontFamily: fontFamilyLandingPage }}>
							{currentContent.contactLink}
						</Link>{' '}
						{currentContent.section11End}
					</Typography>
				</Paper>
			</Container>
		</LandingPageLayout>
	);
};

export default PrivacyPolicy;
