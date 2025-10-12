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
import { useState } from 'react';
import ContactFormDialog from '../components/landingPage/ContactFormDialog';
import axios from 'axios';
import ChatWhatsApp from '../components/landingPage/ChatWhatsApp';
import ScrollToTopButton from '../components/landingPage/ScrollToTopButton';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomCancelButton from '../components/forms/customButtons/CustomCancelButton';
import { useRef } from 'react';

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
	const [errorDialogMsg, setErrorDialogMsg] = useState('');

	const handleRecaptchaChange = (token: string | null) => {
		setRecaptchaToken(token);
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
	return (
		<LandingPageLayout>
			{/* Hero Section */}
			<Box
				sx={{
					width: '100%',
					minHeight: { xs: '25vh', sm: '25vh', md: '30vh' },
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					background: 'linear-gradient(135deg, #1ec28b 0%, #3498db 100%)',
					color: '#fff',
					textAlign: 'center',
					marginTop: { xs: '10vh', md: '13vh' },
				}}>
				<Container maxWidth='md' sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
					<Typography variant='h2' sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '1.5rem', md: '2.5rem' }, fontFamily: 'Varela Round' }}>
						Hakkımızda
					</Typography>
					<Typography
						variant='h5'
						sx={{ mb: 3, fontWeight: 400, fontFamily: 'Varela Round', fontSize: { xs: '0.85rem', sm: '0.95rem', md: '1.15rem' } }}>
						Biz, öğrenmeyi herkes için erişilebilir ve ilham verici kılmak isteyen bir ekibiz. Modern eğitim teknolojileriyle, öğrencilerin ve
						eğitmenlerin potansiyellerini ortaya çıkarmalarına yardımcı oluyoruz.
					</Typography>
				</Container>
			</Box>

			{/* Mission & Vision Section */}
			<Container maxWidth='md' sx={{ my: { xs: 5, md: 8 } }}>
				<Grid container spacing={4}>
					<Grid item xs={12} md={6}>
						<Paper elevation={3} sx={{ p: 4, borderRadius: 3, height: '100%' }}>
							<Typography variant='h6' sx={{ color: 'primary.main', fontWeight: 700, mb: 1, fontFamily: 'Varela Round' }}>
								Misyonumuz
							</Typography>
							<Typography sx={{ fontFamily: 'Varela Round' }}>
								Herkesin kaliteli eğitime ulaşabilmesi için yenilikçi, erişilebilir ve etkileşimli öğrenme deneyimleri sunmak.
							</Typography>
						</Paper>
					</Grid>
					<Grid item xs={12} md={6}>
						<Paper elevation={3} sx={{ p: 4, borderRadius: 3, height: '100%' }}>
							<Typography variant='h6' sx={{ color: 'primary.main', fontWeight: 700, mb: 1, fontFamily: 'Varela Round' }}>
								Vizyonumuz
							</Typography>
							<Typography sx={{ fontFamily: 'Varela Round' }}>
								Dijital eğitimde öncü olarak, bireylerin yaşam boyu öğrenme yolculuklarında ilham kaynağı olmak.
							</Typography>
						</Paper>
					</Grid>
				</Grid>
			</Container>

			{/* Comparison Table Section */}
			<Box sx={{ background: '#f8fafc', py: { xs: 5, md: 8 } }}>
				<Container maxWidth='lg'>
					<Typography
						variant='h4'
						sx={{
							fontWeight: 700,
							mb: 2,
							textAlign: 'center',
							fontFamily: 'Varela Round',
							color: '#2c3e50',
						}}>
						Neden Bizimle Öğrenmelisiniz?
					</Typography>
					<Typography
						variant='h6'
						sx={{
							mb: 4,
							textAlign: 'center',
							fontFamily: 'Varela Round',
							color: '#7f8c8d',
							fontWeight: 400,
						}}>
						Diğer platformlarla karşılaştırın
					</Typography>

					<TableContainer
						component={Paper}
						elevation={8}
						sx={{
							borderRadius: 3,
							overflow: 'hidden',
							boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
						}}>
						<Table sx={{ minWidth: 650 }}>
							<TableHead>
								<TableRow sx={{ background: 'linear-gradient(135deg, #1ec28b 0%, #3498db 100%)' }}>
									<TableCell
										sx={{
											color: 'white',
											fontWeight: 700,
											fontSize: '1.1rem',
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
											fontSize: '1.1rem',
											fontFamily: 'Varela Round',
											border: 'none',
											position: 'relative',
										}}>
										<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
											<Star sx={{ color: '#ffd700' }} />
											Bizim Platformumuz
										</Box>
									</TableCell>
									<TableCell
										align='center'
										sx={{
											color: 'white',
											fontWeight: 700,
											fontSize: '1.1rem',
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
											fontSize: '1.1rem',
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
												backgroundColor: '#e8f4fd',
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
												fontSize: '1rem',
												color: '#2c3e50',
											}}>
											{row.feature}
										</TableCell>
										<TableCell align='center' sx={{ border: 'none' }}>
											{row.ourApp ? (
												<CheckCircle sx={{ color: '#27ae60', fontSize: '2rem' }} />
											) : (
												<Cancel sx={{ color: '#e74c3c', fontSize: '2rem' }} />
											)}
										</TableCell>
										<TableCell align='center' sx={{ border: 'none' }}>
											{row.otherApps ? (
												<CheckCircle sx={{ color: '#27ae60', fontSize: '2rem' }} />
											) : (
												<Cancel sx={{ color: '#e74c3c', fontSize: '2rem' }} />
											)}
										</TableCell>
										<TableCell align='center' sx={{ border: 'none' }}>
											{row.conventionalCourses ? (
												<CheckCircle sx={{ color: '#27ae60', fontSize: '2rem' }} />
											) : (
												<Cancel sx={{ color: '#e74c3c', fontSize: '2rem' }} />
											)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>

					{/* Summary Cards */}
					<Grid container spacing={3} sx={{ mt: 4 }}>
						<Grid item xs={12} md={4}>
							<Paper
								elevation={4}
								sx={{
									p: 3,
									borderRadius: 3,
									textAlign: 'center',
									background: 'linear-gradient(135deg, #1ec28b 0%, #27ae60 100%)',
									color: 'white',
									height: '100%',
								}}>
								<Star sx={{ fontSize: '3rem', mb: 2, color: '#ffd700' }} />
								<Typography variant='h6' sx={{ fontWeight: 700, mb: 1, fontFamily: 'Varela Round' }}>
									En Kapsamlı
								</Typography>
								<Typography sx={{ fontFamily: 'Varela Round', opacity: 0.9 }}>Tüm özelliklerin bir arada olduğu tek platform</Typography>
							</Paper>
						</Grid>
						<Grid item xs={12} md={4}>
							<Paper
								elevation={4}
								sx={{
									p: 3,
									borderRadius: 3,
									textAlign: 'center',
									background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
									color: 'white',
									height: '100%',
								}}>
								<CheckCircle sx={{ fontSize: '3rem', mb: 2 }} />
								<Typography variant='h6' sx={{ fontWeight: 700, mb: 1, fontFamily: 'Varela Round' }}>
									En Yenilikçi
								</Typography>
								<Typography sx={{ fontFamily: 'Varela Round', opacity: 0.9 }}>AI destekli öğrenme ve kişiselleştirme</Typography>
							</Paper>
						</Grid>
						<Grid item xs={12} md={4}>
							<Paper
								elevation={4}
								sx={{
									p: 3,
									borderRadius: 3,
									textAlign: 'center',
									background: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)',
									color: 'white',
									height: '100%',
								}}>
								<CheckCircle sx={{ fontSize: '3rem', mb: 2 }} />
								<Typography variant='h6' sx={{ fontWeight: 700, mb: 1, fontFamily: 'Varela Round' }}>
									En Esnek
								</Typography>
								<Typography sx={{ fontFamily: 'Varela Round', opacity: 0.9 }}>7/24 erişim ve esnek zamanlama</Typography>
							</Paper>
						</Grid>
					</Grid>
				</Container>
			</Box>

			{/* Team Section */}
			<Box sx={{ background: '#f7fafc', py: { xs: 5, md: 8 } }}>
				<Container maxWidth='md'>
					<Typography variant='h4' sx={{ fontWeight: 700, mb: 4, textAlign: 'center', fontFamily: 'Varela Round' }}>
						Ekibimiz
					</Typography>
					<Grid container spacing={4} justifyContent='center'>
						{team?.map((member) => (
							<Grid item xs={12} sm={6} md={3} key={member.name} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
								<Avatar src={member.img} alt={member.name} sx={{ width: 90, height: 90, mb: 2, boxShadow: 2 }} />
								<Typography variant='subtitle1' sx={{ fontWeight: 600, fontFamily: 'Varela Round' }}>
									{member.name}
								</Typography>
								<Typography variant='body2' color='text.secondary' sx={{ fontFamily: 'Varela Round' }}>
									{member.role}
								</Typography>
							</Grid>
						))}
					</Grid>
				</Container>
			</Box>

			{/* CTA Section */}
			<Container maxWidth='md' sx={{ textAlign: 'center', py: { xs: 5, md: 8 } }}>
				<Paper
					elevation={2}
					sx={{ p: { xs: 3, md: 5 }, borderRadius: 3, background: 'linear-gradient(90deg, #1ec28b 0%, #3498db 100%)', color: '#fff' }}>
					<Typography variant='h5' sx={{ fontWeight: 700, mb: 2, fontFamily: 'Varela Round' }}>
						Bizimle İletişime Geçin
					</Typography>
					<Typography sx={{ mb: 3, fontFamily: 'Varela Round' }}>
						Sorularınız, önerileriniz veya işbirliği talepleriniz için bize ulaşmaktan çekinmeyin.
					</Typography>
					<Button
						variant='contained'
						color='secondary'
						size='large'
						sx={{ 'fontWeight': 600, 'borderRadius': 2, ':hover': { backgroundColor: 'primary.main', color: 'white' }, 'fontFamily': 'Varela Round' }}
						onClick={() => setIsGetMoreDetailsModalOpen(true)}>
						İletİşİm Formu
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
				recaptchaToken={recaptchaToken}
			/>
			<ChatWhatsApp />
			<ScrollToTopButton />
		</LandingPageLayout>
	);
};

export default AboutUs;
