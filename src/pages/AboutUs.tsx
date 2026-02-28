import {
	Box,
	Typography,
	Avatar,
	Grid,
	Paper,
	Button,
	Container,
	DialogContent,
	DialogActions,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
} from '@mui/material';
import { CheckCircle, Cancel, Star } from '@mui/icons-material';
import LandingPageLayout from '../components/landingPage/LandingPageLayout';
import { useGeoLocation } from '../hooks/useGeoLocation';
import { SEO, StructuredData } from '../components/seo';
import { useContext, useState } from 'react';
import ContactFormDialog from '../components/landingPage/ContactFormDialog';
import axios from 'axios';
import ChatWhatsApp from '../components/landingPage/ChatWhatsApp';
import ScrollToTopButton from '../components/landingPage/ScrollToTopButton';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomCancelButton from '../components/forms/customButtons/CustomCancelButton';
import { useRef } from 'react';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';

const team = [
	{ name: 'John Doe', role: 'Founder & CEO', img: 'https://randomuser.me/api/portraits/men/32.jpg' },
	{ name: 'Jane Doe', role: 'Lead Developer', img: 'https://randomuser.me/api/portraits/women/44.jpg' },
	{ name: 'John Smith', role: 'Product Designer', img: 'https://randomuser.me/api/portraits/men/65.jpg' },
	{ name: 'Emily Chen', role: 'Marketing Lead', img: 'https://randomuser.me/api/portraits/women/68.jpg' },
];

const comparisonData = [
	{
		feature: 'Kişiselleştirilmiş Öğrenme',
		ourApp: true,
		otherApps: false,
		conventionalCourses: false,
	},
	{
		feature: '7/24 Erişim',
		ourApp: true,
		otherApps: true,
		conventionalCourses: false,
	},
	{
		feature: 'İnteraktif İçerik',
		ourApp: true,
		otherApps: true,
		conventionalCourses: false,
	},
	{
		feature: 'Uzman Eğitmen Desteği',
		ourApp: true,
		otherApps: false,
		conventionalCourses: true,
	},
	{
		feature: 'Topluluk Etkileşimi',
		ourApp: true,
		otherApps: true,
		conventionalCourses: true,
	},
	{
		feature: 'İlerleme Takibi',
		ourApp: true,
		otherApps: true,
		conventionalCourses: false,
	},
	{
		feature: 'Mobil Uyumluluk',
		ourApp: true,
		otherApps: true,
		conventionalCourses: false,
	},
	{
		feature: 'Maliyet Etkinliği',
		ourApp: true,
		otherApps: true,
		conventionalCourses: false,
	},
	{
		feature: 'Esnek Zamanlama',
		ourApp: true,
		otherApps: true,
		conventionalCourses: false,
	},
	{
		feature: 'Sertifika Programı',
		ourApp: true,
		otherApps: false,
		conventionalCourses: true,
	},
	{
		feature: 'AI Destekli Öğrenme',
		ourApp: true,
		otherApps: false,
		conventionalCourses: false,
	},
	{
		feature: 'Canlı Dersler',
		ourApp: true,
		otherApps: false,
		conventionalCourses: true,
	},
];

const AboutUs = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { isSmallScreen, isRotatedMedium, isVerySmallScreen, isRotated } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const location = useGeoLocation();
	const [firstName, setFirstName] = useState<string>('');
	const [lastName, setLastName] = useState<string>('');
	const [email, setEmail] = useState<string>('');
	const [phone, setPhone] = useState<string>('');
	const [message, setMessage] = useState<string>('');
	const [sending, setSending] = useState<boolean>(false);
	const [showSuccess, setShowSuccess] = useState<boolean>(false);
	const [isGetMoreDetailsModalOpen, setIsGetMoreDetailsModalOpen] = useState<boolean>(false);

	const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
	const [errorDialogOpen, setErrorDialogOpen] = useState(false);
	const [errorDialogMsg, setErrorDialogMsg] = useState<string>('');

	const handleRecaptchaChange = (token: string | null) => {
		setRecaptchaToken(token);
		setErrorDialogMsg('');
	};

	const recaptchaRef = useRef<any>(null);

	const resetRecaptcha = () => {
		setRecaptchaToken(null);
		if (recaptchaRef.current) {
			recaptchaRef.current.reset();
		}
	};

	const isValidPhone = (phone: string) => /^\+\d{8,}$/.test(phone);

	const resetForm = () => {
		setFirstName('');
		setLastName('');
		setEmail('');
		setPhone('');
		setMessage('');
		resetRecaptcha();
	};

	const handleInquiry = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!isValidPhone(phone)) {
			setErrorDialogMsg('Lütfen geçerli bir telefon numarası girin.');
			setErrorDialogOpen(true);
			return;
		}
		if (!recaptchaToken) {
			setErrorDialogMsg('Lütfen reCAPTCHA doğrulamasını tamamlayın.');
			setErrorDialogOpen(true);
			return;
		}
		setSending(true);
		try {
			await axios.post(`${base_url}/inquiries`, {
				firstName,
				lastName,
				email,
				phone,
				countryCode: location?.countryCode?.toUpperCase() || 'tr',
				orgId: import.meta.env.VITE_ORG_ID,
				message,
				category: 'AboutUs',
				recaptchaToken,
			});
			setShowSuccess(true);
			resetForm();
			setIsGetMoreDetailsModalOpen(false);
		} catch (error) {
			console.log(error);
		} finally {
			setSending(false);
		}
	};
	const baseUrl = import.meta.env.VITE_SITE_URL || 'https://learnscape-qa.netlify.app';

	return (
		<>
			<SEO
				title='About LearnScape - Online Learning Platform'
				description="Learn about LearnScape's mission to revolutionize online education. Discover our team, values, and commitment to providing quality learning experiences for students worldwide."
				keywords='about LearnScape, online education company, learning platform team, educational technology, e-learning mission, LearnScape values'
				type='website'
			/>
			<StructuredData type='Organization' />
			<StructuredData
				type='BreadcrumbList'
				data={{
					breadcrumbs: [
						{ name: 'Home', url: baseUrl },
						{ name: 'About Us', url: `${baseUrl}/about-us` },
					],
				}}
			/>
			<StructuredData
				type='WebPage'
				data={{
					url: `${baseUrl}/about-us`,
					name: 'About LearnScape - Online Learning Platform',
					description:
						"Learn about LearnScape's mission to revolutionize online education. Discover our team, values, and commitment to providing quality learning experiences for students worldwide.",
				}}
			/>
			<Box
				sx={{
					'position': 'relative',
					'minHeight': '100vh',
					// Aden solid gradient (no image - cleaner UX)
					'background':
						'linear-gradient(180deg, #ffffff 0%, #f8fafc 40%, rgba(0, 82, 163, 0.05) 100%)',
					'&::before': {
						content: '""',
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background:
							'radial-gradient(circle at 20% 30%, rgba(0, 82, 163, 0.06) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(0, 102, 204, 0.04) 0%, transparent 50%)',
						zIndex: 0,
						pointerEvents: 'none',
					},
					'& h1, h2, h3, h4, h5, h6': {
						fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
						fontWeight: 500,
					},
					'& button': {
						fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
						fontWeight: 400,
					},
					'& .gradient-text': {
						'background': 'linear-gradient(135deg, #004c99 0%, #0052a3 50%, #0066CC 100%)',
						'WebkitBackgroundClip': 'text',
						'WebkitTextFillColor': 'transparent',
						'backgroundClip': 'text',
						'backgroundSize': '200% 200%',
						'animation': 'gradientShift 6s ease infinite',
						'@keyframes gradientShift': {
							'0%': { backgroundPosition: '0% 50%' },
							'50%': { backgroundPosition: '100% 50%' },
							'100%': { backgroundPosition: '0% 50%' },
						},
					},
					'& .accent-color': {
						color: '#1e293b',
					},
					'& .secondary-color': {
						color: '#0052a3',
					},
					'& .tertiary-color': {
						color: '#64748b',
					},
					'& .kaizen-title': {
						fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
						fontWeight: 600,
					},
				}}>
				<Box sx={{ position: 'relative', zIndex: 2 }}>
					<LandingPageLayout>
						{/* Mission & Vision Section */}
						<Container maxWidth='md' sx={{ marginTop: { xs: '13vh', md: '20vh' } }}>
							<Grid container spacing={4}>
								<Grid item xs={12} md={6}>
									<Paper
										elevation={0}
										sx={{
											p: { xs: 2, md: 4 },
											borderRadius: '0.75rem',
											height: '100%',
											background: 'linear-gradient(135deg, #0052a3 0%, #0066CC 100%)',
											border: '1px solid rgba(0, 82, 163, 0.2)',
											boxShadow: '0 12px 30px rgba(0, 82, 163, 0.15)',
										}}>
										<Typography variant='h6' sx={{ color: '#0A1A2F', fontWeight: 700, mb: 1, fontFamily: 'Varela Round', textAlign: 'center' }}>
											Misyonumuz
										</Typography>
										<Typography sx={{ fontFamily: 'Varela Round', color: '#fff', fontSize: { xs: '0.85rem', sm: '0.95rem', md: '1rem' } }}>
											Herkesin kaliteli eğitime ulaşabilmesi için yenilikçi, erişilebilir ve etkileşimli öğrenme deneyimleri sunmak.
										</Typography>
									</Paper>
								</Grid>
								<Grid item xs={12} md={6}>
									<Paper
										elevation={0}
										sx={{
											p: { xs: 2, md: 4 },
											borderRadius: '0.75rem',
											height: '100%',
											background: 'linear-gradient(135deg, #4ECDC4 0%, #2c9c94 100%)',
											border: '1px solid rgba(78, 205, 196, 0.3)',
											boxShadow: '0 12px 30px rgba(78, 205, 196, 0.2)',
										}}>
										<Typography variant='h6' sx={{ color: '#0A1A2F', fontWeight: 700, mb: 1, fontFamily: 'Varela Round', textAlign: 'center' }}>
											Vizyonumuz
										</Typography>
										<Typography sx={{ fontFamily: 'Varela Round', color: '#fff', fontSize: { xs: '0.85rem', sm: '0.95rem', md: '1rem' } }}>
											Dijital eğitimde öncü olarak, bireylerin yaşam boyu öğrenme yolculuklarında ilham kaynağı olmak.
										</Typography>
									</Paper>
								</Grid>
							</Grid>
						</Container>

						{/* Comparison Table Section */}
						<Box sx={{ background: 'transparent', py: { xs: 5, md: 8 } }}>
							<Container maxWidth='lg'>
								<Typography
									variant={isMobileSize ? 'h4' : 'h3'}
									sx={{
										mb: 3,
										textAlign: 'center',
										fontFamily: 'Varela Round',
										color: '#0A1A2F',
									}}>
									Neden Bizimle Öğrenmelisiniz?
								</Typography>

								<TableContainer
									component={Paper}
									elevation={0}
									sx={{
										borderRadius: '0.75rem',
										overflow: 'hidden',
										border: '1px solid rgba(0, 82, 163, 0.12)',
										boxShadow: '0 12px 30px rgba(0, 82, 163, 0.08)',
									}}>
									<Table sx={{ minWidth: 200 }}>
										<TableHead>
											<TableRow sx={{ background: 'linear-gradient(135deg, #0052a3 0%, #4ECDC4 100%)' }}>
												<TableCell
													sx={{
														color: 'white',
														fontWeight: 700,
														fontSize: { xs: '0.8rem', sm: '0.95rem', md: '1rem' },
														fontFamily: 'Varela Round',
														border: 'none',
													}}>
													Özellikler
												</TableCell>
												<TableCell
													align='center'
													sx={{
														color: 'white',
														fontWeight: 700,
														fontSize: { xs: '0.7rem', sm: '0.95rem', md: '1rem' },
														fontFamily: 'Varela Round',
														border: 'none',
														position: 'relative',
													}}>
													<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
														{!isMobileSize && <Star sx={{ color: '#ffd700' }} fontSize='small' />}
														Bizim Platformumuz
													</Box>
												</TableCell>
												<TableCell
													align='center'
													sx={{
														color: 'white',
														fontWeight: 700,
														fontSize: { xs: '0.7rem', sm: '0.95rem', md: '1rem' },
														fontFamily: 'Varela Round',
														border: 'none',
													}}>
													Diğer Uygulamalar
												</TableCell>
												<TableCell
													align='center'
													sx={{
														color: 'white',
														fontWeight: 700,
														fontSize: { xs: '0.7rem', sm: '0.95rem', md: '1rem' },
														fontFamily: 'Varela Round',
														border: 'none',
													}}>
													Geleneksel Kurslar
												</TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											{comparisonData.map((row) => (
												<TableRow
													key={row.feature}
													sx={{
														'&:nth-of-type(odd)': {
															backgroundColor: '#f8fafc',
														},
														'&:hover': {
															backgroundColor: 'rgba(0, 82, 163, 0.04)',
															transform: 'scale(1.01)',
															transition: 'all 0.2s ease-in-out',
														},
													}}>
													<TableCell
														component='th'
														scope='row'
														sx={{
															fontWeight: 600,
															fontFamily: 'Varela Round',
															fontSize: { xs: '0.65rem', sm: '0.95rem', md: '1rem' },
															color: '#2c3e50',
														}}>
														{row.feature}
													</TableCell>
													<TableCell align='center' sx={{ border: 'none' }}>
														{row.ourApp ? (
															<CheckCircle sx={{ color: '#27ae60', fontSize: isMobileSize ? '1.15rem' : '1.65rem' }} />
														) : (
															<Cancel sx={{ color: '#e74c3c', fontSize: isMobileSize ? '1.15rem' : '1.65rem' }} />
														)}
													</TableCell>
													<TableCell align='center' sx={{ border: 'none' }}>
														{row.otherApps ? (
															<CheckCircle sx={{ color: '#27ae60', fontSize: isMobileSize ? '1.15rem' : '1.65rem' }} />
														) : (
															<Cancel sx={{ color: '#e74c3c', fontSize: isMobileSize ? '1.15rem' : '1.65rem' }} />
														)}
													</TableCell>
													<TableCell align='center' sx={{ border: 'none' }}>
														{row.conventionalCourses ? (
															<CheckCircle sx={{ color: '#27ae60', fontSize: isMobileSize ? '1.15rem' : '1.65rem' }} />
														) : (
															<Cancel sx={{ color: '#e74c3c', fontSize: isMobileSize ? '1.15rem' : '1.65rem' }} />
														)}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</TableContainer>
							</Container>
						</Box>

						{/* CTA Section */}
						<Container maxWidth='md' sx={{ textAlign: 'center', py: { xs: 5, md: 8 } }}>
							<Paper
								elevation={0}
								sx={{
									p: { xs: 3, md: 5 },
									borderRadius: '0.75rem',
									border: '1px solid rgba(0, 82, 163, 0.15)',
									background: 'rgba(0, 82, 163, 0.08)',
									boxShadow: '0 12px 30px rgba(0, 82, 163, 0.08)',
									color: '#fff',
								}}>
								<Typography variant='h5' sx={{ fontWeight: 700, mb: 2, fontFamily: 'Varela Round', color: '#1E293B' }}>
									Bizimle İletişime Geçin
								</Typography>
								<Typography sx={{ mb: 3, fontFamily: 'Varela Round', color: '#334155', fontSize: { xs: '0.85rem', sm: '0.95rem', md: '1rem' } }}>
									Sorularınız, önerileriniz veya işbirliği talepleriniz için bize ulaşmaktan çekinmeyin.
								</Typography>
								<Button
									variant='contained'
									size='large'
									sx={{
										'fontFamily': 'Varela Round',
										'fontWeight': 700,
										'letterSpacing': '0.03em',
										'textTransform': 'capitalize',
										'background': '#FF6B3D',
										'color': '#FFFFFF',
										'borderRadius': { xs: '0.75rem', sm: '1rem', md: '1.25rem' },
										'boxShadow': '0 4px 15px rgba(255, 107, 61, 0.35)',
										'&:hover': {
											background: '#ff7d55',
											transform: 'translateY(-3px)',
											boxShadow: '0 6px 20px rgba(255, 107, 61, 0.45)',
										},
										'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
										'height': '3rem',
									}}
									onClick={() => setIsGetMoreDetailsModalOpen(true)}>
									İletişim Formu
								</Button>
							</Paper>
						</Container>

						{/* Error Dialog */}
						<CustomDialog openModal={errorDialogOpen} closeModal={() => setErrorDialogOpen(false)} title='' maxWidth='xs'>
							<DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
								<Typography variant='body2' sx={{ mb: 1, mt: '1rem', fontFamily: 'Varela Round' }}>
									{errorDialogMsg}
								</Typography>
								<DialogActions sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
									<CustomCancelButton onClick={() => setErrorDialogOpen(false)} sx={{ fontFamily: 'Varela Round' }}>
										Kapat
									</CustomCancelButton>
								</DialogActions>
							</DialogContent>
						</CustomDialog>

						<ContactFormDialog
							isGetMoreDetailsModalOpen={isGetMoreDetailsModalOpen}
							setIsGetMoreDetailsModalOpen={setIsGetMoreDetailsModalOpen}
							resetForm={resetForm}
							setShowSuccess={setShowSuccess}
							showSuccess={showSuccess}
							firstName={firstName}
							setFirstName={setFirstName}
							lastName={lastName}
							setLastName={setLastName}
							email={email}
							setEmail={setEmail}
							phone={phone}
							setPhone={setPhone}
							message={message}
							setMessage={setMessage}
							location={location || { countryCode: 'TR' }}
							handleInquiry={handleInquiry}
							sending={sending}
							title='BİZE ULAŞIN'
							description='Sorularınız, önerileriniz veya işbirliği talepleriniz için bize ulaşmaktan çekinmeyin.'
							handleRecaptchaChange={handleRecaptchaChange}
							resetRecaptcha={resetRecaptcha}
							recaptchaRef={recaptchaRef}
							errorDialogMsg={errorDialogMsg}
							setErrorDialogMsg={setErrorDialogMsg}
						/>
						<ChatWhatsApp />
						<ScrollToTopButton />
					</LandingPageLayout>
				</Box>
			</Box>
		</>
	);
};

export default AboutUs;
