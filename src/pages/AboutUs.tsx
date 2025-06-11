import { Box, Typography, Avatar, Grid, Paper, Button, Container } from '@mui/material';
import LandingPageLayout from '../components/landingPage/LandingPageLayout';
import { useGeoLocation } from '../hooks/useGeoLocation';
import { useState } from 'react';
import ContactFormDialog from '../components/landingPage/ContactFormDialog';
import axios from 'axios';
import ChatWhatsApp from '../components/landingPage/ChatWhatsApp';
import ScrollToTopButton from '../components/landingPage/ScrollToTopButton';

const team = [
	{ name: 'John Doe', role: 'Founder & CEO', img: 'https://randomuser.me/api/portraits/men/32.jpg' },
	{ name: 'Jane Doe', role: 'Lead Developer', img: 'https://randomuser.me/api/portraits/women/44.jpg' },
	{ name: 'John Smith', role: 'Product Designer', img: 'https://randomuser.me/api/portraits/men/65.jpg' },
	{ name: 'Emily Chen', role: 'Marketing Lead', img: 'https://randomuser.me/api/portraits/women/68.jpg' },
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

	const isValidPhone = (phone: string) => /^\+\d{8,}$/.test(phone);

	const resetForm = () => {
		setFirstName('');
		setLastName('');
		setEmail('');
		setPhone('');
		setMessage('');
	};

	const handleMoreInfoRequest = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!isValidPhone(phone)) {
			alert('Lütfen geçerli bir telefon numarası girin.');
			return;
		}
		setSending(true);
		try {
			await axios.post(`${base_url}/contact-requests`, {
				firstName,
				lastName,
				email,
				phone,
				countryCode: location?.countryCode?.toUpperCase() || 'tr',
				orgId: import.meta.env.VITE_ORG_ID,
				message,
			});
			setShowSuccess(true);
			// Do not close modal or reset form yet
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

			{/* Team Section */}
			<Box sx={{ background: '#f7fafc', py: { xs: 5, md: 8 } }}>
				<Container maxWidth='md'>
					<Typography variant='h4' sx={{ fontWeight: 700, mb: 4, textAlign: 'center', fontFamily: 'Varela Round' }}>
						Ekibimiz
					</Typography>
					<Grid container spacing={4} justifyContent='center'>
						{team.map((member) => (
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
				handleMoreInfoRequest={handleMoreInfoRequest}
				sending={sending}
				title='BİZE ULAŞIN'
				description='Sorularınız, önerileriniz veya işbirliği talepleriniz için bize ulaşmaktan çekinmeyin.'
			/>
			<ChatWhatsApp />
			<ScrollToTopButton />
		</LandingPageLayout>
	);
};

export default AboutUs;
