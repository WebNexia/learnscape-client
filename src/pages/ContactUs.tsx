import { Box, Typography, Container, Paper, Button, Grid, Snackbar, Alert } from '@mui/material';
import LandingPageLayout from '../components/landingPage/LandingPageLayout';
import ChatWhatsApp from '../components/landingPage/ChatWhatsApp';
import ScrollToTopButton from '../components/landingPage/ScrollToTopButton';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import PhoneInput from 'react-phone-input-2';
import theme from '../themes';
import { useGeoLocation } from '../hooks/useGeoLocation';
import { useContext, useState, useRef } from 'react';
import axios from 'axios';
import ReCAPTCHA from 'react-google-recaptcha';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import { SEO, StructuredData } from '../components/seo';
import LondonBg from '../assets/london-bg.jpg';
import CustomErrorMessage from '../components/forms/customFields/CustomErrorMessage';

const ContactUs = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const [firstName, setFirstName] = useState<string>('');
	const [lastName, setLastName] = useState<string>('');
	const [email, setEmail] = useState<string>('');
	const [message, setMessage] = useState<string>('');
	const location = useGeoLocation();
	const [phone, setPhone] = useState<string>('');
	const [sending, setSending] = useState<boolean>(false);
	const [showSuccess, setShowSuccess] = useState<boolean>(false);

	const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
	const [errorDialogMsg, setErrorDialogMsg] = useState('');
	const [recaptchaKey, setRecaptchaKey] = useState(0);

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

	const { isVerySmallScreen, isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const isValidPhone = (phone: string) => /^\+\d{8,}$/.test(phone);

	const handleInquiry = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!isValidPhone(phone)) {
			setErrorDialogMsg('Lütfen geçerli bir telefon numarası girin.');
			return;
		}
		if (!recaptchaToken) {
			setErrorDialogMsg('Lütfen reCAPTCHA doğrulamasını tamamlayın.');
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
				category: 'ContactUs',
				recaptchaToken,
			});
			setShowSuccess(true);
			resetForm();
			// Do not close modal or reset form yet
		} catch (error) {
			console.log(error);
		} finally {
			setSending(false);
		}
	};

	const resetForm = () => {
		setFirstName('');
		setLastName('');
		setEmail('');
		setPhone('');
		setMessage('');
		resetRecaptcha();
		setRecaptchaKey((prev) => prev + 1);
	};

	const baseUrl = import.meta.env.VITE_SITE_URL || 'https://learnscape-qa.netlify.app';

	return (
		<>
			<SEO
				title='Contact LearnScape - Get in Touch'
				description='Contact LearnScape for support, inquiries, or partnerships. Reach out to our team for assistance with courses, technical issues, or business opportunities.'
				keywords='contact LearnScape, customer support, technical support, business inquiries, LearnScape help, customer service, contact form'
				type='website'
			/>
			<StructuredData type='Organization' />
			<StructuredData type='ContactPage' />
			<StructuredData
				type='BreadcrumbList'
				data={{
					breadcrumbs: [
						{ name: 'Home', url: baseUrl },
						{ name: 'Contact Us', url: `${baseUrl}/contact-us` },
					],
				}}
			/>
			<StructuredData
				type='WebPage'
				data={{
					url: `${baseUrl}/contact-us`,
					name: 'Contact LearnScape - Get in Touch',
					description:
						'Contact LearnScape for support, inquiries, or partnerships. Reach out to our team for assistance with courses, technical issues, or business opportunities.',
				}}
			/>
			<Box
				sx={{
					'position': 'relative',
					'overflow': 'hidden',
					'minHeight': '100vh',
					// Fixed background image - London cityscape
					'backgroundImage': `url(${LondonBg})`,
					'backgroundSize': 'cover',
					'backgroundPosition': 'center',
					'backgroundRepeat': 'no-repeat',
					'backgroundAttachment': 'fixed',
					// Overlay for better content readability
					'&::before': {
						content: '""',
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.75) 100%)',
						zIndex: 0,
						pointerEvents: 'none',
					},
					// Subtle gradient accent overlay
					'&::after': {
						content: '""',
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background:
							'radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.08) 0%, transparent 50%)',
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
						'background': 'linear-gradient(135deg, #4f46e5 0%, #5b21b6 50%, #7c3aed 100%)',
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
						color: '#6366f1',
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
						{/* Hero Section */}
						<Box
							sx={{
								display: 'flex',
								width: '100%',
								minHeight: { xs: '10vh', sm: '10vh', md: '10vh' },
								alignItems: 'center',
								justifyContent: 'center',
								background: 'transparent',
								color: '#fff',
								textAlign: 'center',
								marginTop: { xs: '10vh', md: '13vh' },
							}}>
							<Container maxWidth='md' sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', mt: '1rem' }}>
								<Typography
									variant='h5'
									sx={{
										fontFamily: 'Varela Round',
										fontSize: { xs: '0.85rem', sm: '0.95rem', md: '1.15rem' },
									}}>
									Bize ulaşmak için aşağıdaki formu doldurun. Size en kısa sürede geri döneceğiz.
								</Typography>
							</Container>
						</Box>

						{/* Contact Form Section */}
						<Container maxWidth='sm' sx={{ mt: 2, mb: 4 }}>
							<Paper elevation={3} sx={{ p: { xs: 3, md: 5 }, borderRadius: '0.75rem' }}>
								<form onSubmit={handleInquiry}>
									<Grid container spacing={1}>
										<Grid item xs={12}>
											<CustomTextField
												fullWidth
												label='İsminiz'
												variant='outlined'
												value={firstName}
												onChange={(e) => setFirstName(e.target.value)}
												sx={{ fontFamily: 'Varela Round' }}
												InputLabelProps={{ sx: { fontFamily: 'Varela Round' } }}
												placeholder='İsminizi girin'
												InputProps={{
													inputProps: {
														maxLength: 50,
													},
												}}
											/>
										</Grid>
										<Grid item xs={12}>
											<CustomTextField
												fullWidth
												label='Soy İsminiz'
												variant='outlined'
												value={lastName}
												onChange={(e) => setLastName(e.target.value)}
												sx={{ fontFamily: 'Varela Round' }}
												InputLabelProps={{ sx: { fontFamily: 'Varela Round' } }}
												placeholder='Soy isminizi girin'
												InputProps={{
													inputProps: {
														maxLength: 50,
													},
												}}
											/>
										</Grid>
										<Grid item xs={12}>
											<CustomTextField
												fullWidth
												label='E-posta'
												variant='outlined'
												value={email}
												onChange={(e) => setEmail(e.target.value)}
												sx={{ fontFamily: 'Varela Round' }}
												InputLabelProps={{ sx: { fontFamily: 'Varela Round' } }}
												placeholder='E-posta adresinizi girin'
												type='email'
												InputProps={{
													inputProps: {
														maxLength: 254,
													},
												}}
											/>
										</Grid>
										<Grid item xs={12}>
											<Typography
												variant='body2'
												sx={{ marginBottom: '0.25rem', fontFamily: 'Varela Round', color: theme.textColor?.secondary.main }}>
												Telefon Numarası *
											</Typography>
											<Box
												component='div'
												sx={{
													'& > label': {
														display: 'none !important',
														visibility: 'hidden !important',
														height: '0 !important',
														width: '0 !important',
														overflow: 'hidden !important',
													},
													'& label': {
														display: 'none !important',
														visibility: 'hidden !important',
														height: '0 !important',
														width: '0 !important',
														overflow: 'hidden !important',
													},
													'& .react-tel-input label': {
														display: 'none !important',
														visibility: 'hidden !important',
														height: '0 !important',
														width: '0 !important',
														overflow: 'hidden !important',
													},
													'& .flag-dropdown + label': {
														display: 'none !important',
														visibility: 'hidden !important',
														height: '0 !important',
														width: '0 !important',
														overflow: 'hidden !important',
													},
													'& .react-tel-input > label': {
														display: 'none !important',
														visibility: 'hidden !important',
														height: '0 !important',
														width: '0 !important',
														overflow: 'hidden !important',
													},
													'& [for*="phone"]': {
														display: 'none !important',
														visibility: 'hidden !important',
														height: '0 !important',
														width: '0 !important',
														overflow: 'hidden !important',
													},
													'& [aria-label*="Phone"]': {
														display: 'none !important',
														visibility: 'hidden !important',
														height: '0 !important',
														width: '0 !important',
														overflow: 'hidden !important',
													},
													'& .react-tel-input::before': {
														display: 'none !important',
														content: '""',
													},
													'& .react-tel-input > *:first-child:not(.flag-dropdown):not(input)': {
														display: 'none !important',
														visibility: 'hidden !important',
														height: '0 !important',
														width: '0 !important',
														overflow: 'hidden !important',
													},
												}}>
												<PhoneInput
													country={location?.countryCode?.toLowerCase() || 'tr'}
													enableSearch={true}
													searchPlaceholder='Ülke arayın...'
													searchNotFound='Ülke bulunamadı'
													enableAreaCodes={false}
													countryCodeEditable={false}
													specialLabel=''
													value={phone}
													onChange={(phoneNumber, _) => {
														const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
														setPhone(formattedNumber);
														setErrorDialogMsg('');
													}}
													inputProps={{
														required: true,
														maxLength: 20,
														style: {
															width: '100%',
															height: '2.25rem',
															fontFamily: 'Varela Round',
															fontSize: isVerySmallScreen ? '0.7rem' : '0.85rem',
															borderRadius: '0.25rem',
															border: '1px solid rgba(0, 0, 0, 0.23)',
															transition: 'all 0.2s ease',
														},
													}}
													containerStyle={{
														marginBottom: '0.5rem',
														color: theme.textColor?.secondary.main,
														fontFamily: 'Varela Round',
														transition: 'all 0.2s ease',
													}}
													buttonStyle={{
														borderRadius: '0.35rem 0 0 0.35rem',
														border: '1px solid rgba(0, 0, 0, 0.23)',
														backgroundColor: 'transparent',
													}}
													dropdownStyle={{
														borderRadius: '0.35rem',
														border: '1px solid rgba(0, 0, 0, 0.23)',
														boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
														fontFamily: 'Varela Round',
													}}
													searchStyle={{
														width: '100%',
														height: '2rem',
														fontFamily: 'Varela Round',
														fontSize: '0.85rem',
														borderRadius: '0.5rem',
														border: '1px solid rgba(0, 0, 0, 0.23)',
														margin: '0.5rem 0',
													}}
												/>
											</Box>
										</Grid>
										<Grid item xs={12}>
											<CustomTextField
												fullWidth
												multiline
												required
												rows={5}
												label='Mesajınız'
												variant='outlined'
												value={message}
												onChange={(e) => setMessage(e.target.value)}
												sx={{ fontFamily: 'Varela Round' }}
												InputLabelProps={{ sx: { fontFamily: 'Varela Round' } }}
												placeholder='Mesajınızı yazın'
												InputProps={{
													inputProps: {
														maxLength: 500,
													},
												}}
											/>
											<Typography
												variant='body2'
												sx={{
													fontSize: isMobileSize ? '0.7rem' : '0.8rem',
													fontFamily: 'Varela Round',
													color: theme.textColor?.secondary.main,
													textAlign: 'right',
													mb: '0.5rem',
												}}>
												{message.length}/500
											</Typography>
										</Grid>
										<Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
											<ReCAPTCHA
												key={recaptchaKey}
												ref={recaptchaRef}
												sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
												onChange={handleRecaptchaChange}
												onExpired={() => resetRecaptcha()}
											/>
										</Grid>
										{errorDialogMsg && (
											<Grid item xs={12}>
												<CustomErrorMessage
													sx={{ width: '100%', fontSize: isMobileSize ? '0.7rem' : '0.8rem', fontFamily: 'Varela Round', mb: '1rem' }}>
													{errorDialogMsg}
												</CustomErrorMessage>
											</Grid>
										)}
										<Grid item xs={12}>
											<Button
												type='submit'
												variant='contained'
												fullWidth
												disabled={sending}
												sx={{
													'fontFamily': 'Varela Round',
													'textTransform': 'capitalize',
													'fontSize': { xs: '0.75rem', sm: '0.9rem', md: '0.9rem' },
													'color': '#FFFFFF',
													'background': 'linear-gradient(135deg, #FF6B3D 0%, #ff7d55 100%)',
													'padding': '0.5rem 1.75rem',
													'borderRadius': { xs: '0.75rem', sm: '1rem', md: '1.25rem' },
													'fontWeight': 500,
													'boxShadow': '0 4px 15px rgba(255, 107, 61, 0.35)',
													'py': 1.2,
													'&:hover': {
														background: 'linear-gradient(135deg, #ff7d55 0%, #FF6B3D 100%)',
														transform: 'translateY(-2px)',
														boxShadow: '0 6px 20px rgba(255, 107, 61, 0.45)',
													},
													'&:disabled': {
														backgroundColor: '#ccc',
														color: '#666',
														background: '#ccc',
													},
													'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
													'height': '2.25rem',
												}}>
												{sending ? 'Gönderiliyor...' : 'Gönder'}
											</Button>
										</Grid>
									</Grid>

									<Snackbar
										open={showSuccess}
										autoHideDuration={3100}
										anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
										onClose={() => {
											setShowSuccess(false);
										}}
										sx={{ mt: { xs: '1.5rem', sm: '1.5rem', md: '2.5rem', lg: '2.5rem' } }}>
										<Alert
											severity='success'
											variant='filled'
											sx={{
												width: '100%',
												fontFamily: 'Varela Round',
												fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem', lg: '1rem' },
												letterSpacing: 0,
												color: theme.textColor?.common.main,
											}}>
											Bilgileriniz alınmıştır, lütfen email'inizi kontrol edin
										</Alert>
									</Snackbar>
								</form>
							</Paper>
						</Container>
						<ChatWhatsApp />
						<ScrollToTopButton />
					</LandingPageLayout>
				</Box>
			</Box>
		</>
	);
};

export default ContactUs;
