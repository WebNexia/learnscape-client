import { Box, Typography, Container, Paper, Button, Grid, Snackbar, Alert } from '@mui/material';
import LandingPageLayout from '../components/landingPage/LandingPageLayout';
import ChatWhatsApp from '../components/landingPage/ChatWhatsApp';
import ScrollToTopButton from '../components/landingPage/ScrollToTopButton';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import PhoneInput from 'react-phone-input-2';
import theme from '../themes';
import { useGeoLocation } from '../hooks/useGeoLocation';
import { useState } from 'react';
import axios from 'axios';

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

	const isValidPhone = (phone: string) => /^\+\d{8,}$/.test(phone);

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

	const resetForm = () => {
		setFirstName('');
		setLastName('');
		setEmail('');
		setPhone('');
		setMessage('');
	};

	return (
		<LandingPageLayout>
			{/* Hero Section */}
			<Box
				sx={{
					width: '100%',
					minHeight: { xs: '20vh', sm: '25vh', md: '30vh' },
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					background: 'linear-gradient(135deg, #1ec28b 0%, #3498db 100%)',
					color: '#fff',
					textAlign: 'center',
					marginTop: { xs: '10vh', md: '13vh' },
				}}>
				<Container maxWidth='sm' sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
					<Typography variant='h2' sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '1.5rem', md: '2.5rem' }, fontFamily: 'Varela Round' }}>
						İletişim
					</Typography>
					<Typography
						variant='h5'
						sx={{ mb: 3, fontWeight: 400, fontFamily: 'Varela Round', fontSize: { xs: '0.85rem', sm: '0.95rem', md: '1.15rem' } }}>
						Bize ulaşmak için aşağıdaki formu doldurun. Size en kısa sürede geri döneceğiz.
					</Typography>
				</Container>
			</Box>

			{/* Contact Form Section */}
			<Container maxWidth='sm' sx={{ my: { xs: 4, md: 8 } }}>
				<Paper elevation={3} sx={{ p: { xs: 3, md: 5 }, borderRadius: 3 }}>
					<form onSubmit={handleMoreInfoRequest}>
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
								/>
							</Grid>
							<Grid item xs={12}>
								<PhoneInput
									country={location?.countryCode?.toLowerCase() || 'tr'}
									enableSearch={true}
									searchPlaceholder='Ülke arayın...'
									searchNotFound='Ülke bulunamadı'
									enableAreaCodes={false}
									countryCodeEditable={false}
									value={phone}
									onChange={(phoneNumber, _) => {
										const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
										setPhone(formattedNumber);
									}}
									inputProps={{
										required: true,
										style: {
											width: '100%',
											height: '2.25rem',
											fontFamily: 'Varela Round',
											fontSize: '0.9rem',
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
								/>
							</Grid>
							<Grid item xs={12}>
								<Button
									type='submit'
									variant='contained'
									color='primary'
									size='small'
									fullWidth
									disabled={sending || !isValidPhone(phone)}
									sx={{ fontWeight: 600, borderRadius: 2, fontFamily: 'Varela Round', py: 1.2 }}>
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
								resetForm();
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
	);
};

export default ContactUs;
