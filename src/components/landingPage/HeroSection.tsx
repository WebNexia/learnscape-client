import { Box, Button, DialogActions, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useContext, useState, useEffect } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import Instructor_Img from '../../assets/instructor-new1.png';
import { ContactPage, PlayCircle } from '@mui/icons-material';
import CustomDialog from '../layouts/dialog/CustomDialog';
import DialogContent from '@mui/material/DialogContent';
import ChatWhatsApp from './ChatWhatsApp';
import { useGeoLocation } from '../../hooks/useGeoLocation';
import axios from 'axios';
import ContactFormDialog from './ContactFormDialog';
import CustomCancelButton from '../forms/customButtons/CustomCancelButton';
import { useRef } from 'react';
import UniversalVideoPlayer from '../video/UniversalVideoPlayer';
import ReactPlayer from 'react-player';

const HeroSection = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { isSmallScreen, isRotatedMedium, isVerySmallScreen } = useContext(MediaQueryContext);
	const [isIntroVideoModalOpen, setIsIntroVideoModalOpen] = useState<boolean>(false);
	const [isGetMoreDetailsModalOpen, setIsGetMoreDetailsModalOpen] = useState<boolean>(false);
	const [videoError, setVideoError] = useState<boolean>(false);
	const location = useGeoLocation();
	const [firstName, setFirstName] = useState<string>('');
	const [lastName, setLastName] = useState<string>('');
	const [email, setEmail] = useState<string>('');
	const [phone, setPhone] = useState<string>('');
	const [message, setMessage] = useState<string>('');
	const [sending, setSending] = useState<boolean>(false);
	const [showSuccess, setShowSuccess] = useState<boolean>(false);

	const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
	const [errorDialogOpen, setErrorDialogOpen] = useState(false);
	const [errorDialogMsg, setErrorDialogMsg] = useState('');

	// Check if user has seen the intro video in this session
	useEffect(() => {
		const hasSeenIntroVideo = sessionStorage.getItem('hasSeenIntroVideo');
		if (!hasSeenIntroVideo) {
			// New tab/window - show the intro video
			setIsIntroVideoModalOpen(true);
		}
	}, []);

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
				category: 'HeroSection',
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
		<Box
			sx={{
				height: '100vh',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				background: '#FDF7F0',
				backgroundImage: `
					linear-gradient(135deg, rgba(44, 62, 80, 0.05), rgba(52, 152, 219, 0.05)),
					radial-gradient(circle, rgba(44,62,80,0.08) 1px, transparent 1px)
				`,
				backgroundSize: 'auto, 30px 30px',
				backgroundRepeat: 'repeat, repeat',
				position: 'relative',
				overflow: 'hidden',
				pt: { xs: isRotatedMedium ? '20vh' : '5vh', md: '6vh' },
				width: '100%',
				px: { xs: '5%', sm: '6%', md: '8%' },
			}}>
			{/* Animated background elements */}
			<Box
				sx={{
					position: 'absolute',
					width: '100%',
					height: '100%',
					opacity: 0.1,
					backgroundSize: '30px 30px',
				}}
			/>

			<Box
				sx={{
					display: 'flex',
					flexDirection: { xs: 'column', md: 'row' },
					justifyContent: 'center',
					alignItems: 'center',
					gap: { xs: 4, sm: 6, md: 13 },
					py: { xs: 4, sm: 6, md: 8 },
					maxWidth: '100rem',
					width: '100%',
				}}>
				{/* Content */}
				<Box sx={{ flex: 2, width: '100%', maxWidth: { md: '65%' } }}>
					<motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} style={{ width: '100%' }}>
						<Typography
							variant='h2'
							className='gradient-text kaizen-title'
							sx={{
								fontSize: isVerySmallScreen || isRotatedMedium ? '1.75rem' : isSmallScreen ? '2rem' : '3rem',
								fontWeight: 600,
								mb: { xs: 1.5, sm: 2 },
								background: 'linear-gradient(45deg, #2C3E50, #3498DB)',
								WebkitBackgroundClip: 'text',
								WebkitTextFillColor: 'transparent',
								backgroundClip: 'text',
								letterSpacing: '-0.02em',
								lineHeight: 1.2,
								fontFamily: 'Varela Round',
							}}>
							10 yıldır tek bir probleme odaklandım:
						</Typography>
						<Typography
							variant='h2'
							sx={{ fontFamily: 'Varela Round', fontSize: isVerySmallScreen || isRotatedMedium ? '1.5rem' : isSmallScreen ? '1.75rem' : '2.25rem' }}>
							Öğrencilerimin İngilizce'yi akıcı konuşamaması
						</Typography>
						<Typography
							variant='h5'
							sx={{
								color: '#34495E',
								opacity: 0.9,
								fontSize: { xs: '0.9rem', sm: '1rem', md: '1.15rem' },
								fontWeight: 400,
								lineHeight: 1.6,
								fontFamily: 'Varela Round',
								margin: '1rem 0',
							}}>
							Bu kurs, duraksamaları, “nasıl söylenecek?” kaygısını, Türkçe'den çeviri yapmayı geride bırakman için tasarlandı
						</Typography>
						<Typography
							sx={{
								mb: { xs: 3, sm: 4 },
								color: '#34495E',
								opacity: 0.9,
								fontSize: { xs: '0.9rem', sm: '1rem', md: '1.15rem' },
								fontWeight: 400,
								lineHeight: 1.6,
								fontFamily: 'Varela Round',
							}}>
							Artık İngilizce konuşmak doğal olacak!
						</Typography>
						<Box
							sx={{
								display: 'flex',
								gap: 2,
								flexWrap: 'wrap',
								justifyContent: { xs: 'center', md: 'flex-start' },
								mb: { xs: 3 },
							}}>
							<Button
								variant='outlined'
								endIcon={<PlayCircle />}
								onClick={() => setIsIntroVideoModalOpen(true)}
								sx={{
									'fontFamily': 'Varela Round',
									'borderColor': '#2C3E50',
									'color': '#2C3E50',
									'borderRadius': { xs: '0.5rem', sm: '0.9rem', md: '1.1rem' },
									'padding': { xs: '0.5rem 1rem', sm: '0.5rem 1rem', md: '0.5rem 1rem' },
									'fontSize': { xs: '0.6rem', sm: '0.8rem', md: '0.9rem' },
									'fontWeight': 400,
									'&:hover': {
										borderColor: '#2C3E50',
										backgroundColor: 'rgba(44, 62, 80, 0.05)',
										transform: 'translateY(-2px)',
									},
									'transition': 'all 0.3s ease',
								}}>
								İzle
							</Button>
							<Button
								variant='outlined'
								endIcon={<ContactPage />}
								onClick={() => setIsGetMoreDetailsModalOpen(true)}
								sx={{
									'borderColor': '#3498DB',
									'color': '#3498DB',
									'borderRadius': { xs: '0.5rem', sm: '0.9rem', md: '1.1rem' },
									'padding': { xs: '0.5rem 1rem', sm: '0.5rem 1rem', md: '0.5rem 1rem' },
									'fontSize': { xs: '0.6rem', sm: '0.8rem', md: '0.9rem' },
									'fontFamily': 'Varela Round',
									'fontWeight': 400,
									'&:hover': {
										borderColor: '#3498DB',
										backgroundColor: 'rgba(52, 152, 219, 0.05)',
										transform: 'translateY(-2px)',
									},
									'transition': 'all 0.3s ease',
								}}>
								Daha Fazla Bİlgİ
							</Button>
						</Box>
					</motion.div>
				</Box>

				{/* Instructor Image */}
				<motion.div
					initial={{ opacity: 0, x: 50 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.8, delay: 0.2 }}
					style={{
						flex: 1,
						width: '100%',
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
					}}>
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'center',
							width: '100%',
							position: 'relative',
						}}>
						<Box
							component='img'
							src={Instructor_Img}
							alt='Instructor'
							sx={{
								'maxHeight': { xs: '25vh', sm: '40vh', md: '60vh' },
								'width': 'auto',
								'borderRadius': '50%',
								'transition': 'all 0.3s ease',
								'&:hover': {
									transform: 'scale(1.05) translateY(-15px) rotate(-1deg)',
									boxShadow: '1px 6px 12px rgba(44, 62, 80, 0.15)',
								},
							}}
						/>
					</Box>
				</motion.div>
			</Box>

			<Box
				sx={{
					position: 'fixed',
					bottom: '2rem',
					right: '2rem',
					zIndex: 1000,
				}}>
				<ChatWhatsApp />
			</Box>

			<CustomDialog
				openModal={isIntroVideoModalOpen}
				closeModal={() => {
					setIsIntroVideoModalOpen(false);
					setVideoError(false); // Reset video error state when closing
					// Mark that user has seen the intro video in this session
					sessionStorage.setItem('hasSeenIntroVideo', 'true');
				}}
				maxWidth='md'
				PaperProps={{
					sx: {
						background: 'transparent',
						overflow: 'hidden',
					},
				}}>
				<DialogContent sx={{ height: '70vh', background: 'transparent', p: 0 }}>
					{!videoError ? (
						<UniversalVideoPlayer
							url='https://www.youtube.com/watch?v=52t241OQ7Ec'
							height='100%'
							width='100%'
							controls={true}
							style={{
								boxShadow: 'none',
								background: 'transparent',
								overflow: 'hidden',
							}}
							onError={(error) => {
								console.error('UniversalVideoPlayer error:', error);
								setVideoError(true);
							}}
						/>
					) : (
						<ReactPlayer
							url='https://www.youtube.com/watch?v=52t241OQ7Ec'
							height='100%'
							width='100%'
							controls={true}
							config={{
								youtube: {
									playerVars: {
										autoplay: 0,
										controls: 1,
										modestbranding: 1,
										rel: 0,
										showinfo: 0,
									},
								},
							}}
							style={{
								boxShadow: 'none',
								background: 'transparent',
								overflow: 'hidden',
							}}
							onError={(error) => {
								console.error('ReactPlayer fallback error:', error);
							}}
						/>
					)}
				</DialogContent>
			</CustomDialog>

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
				title='DETAYLI BİLGİ ALIN'
				description='Kurslarımız hakkında bilgi alın, yeni eğitimlerden öncelikli olarak haberdar olun.'
				handleRecaptchaChange={handleRecaptchaChange}
				resetRecaptcha={resetRecaptcha}
				recaptchaRef={recaptchaRef}
				recaptchaToken={recaptchaToken}
			/>
		</Box>
	);
};

export default HeroSection;
