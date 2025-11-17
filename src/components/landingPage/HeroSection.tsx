import { Box, Button, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useContext, useState, useEffect } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import Hero_Img from '../../assets/man-writing-notebook-with-giant-pen.png';
import { PlayCircle } from '@mui/icons-material';
import CustomDialog from '../layouts/dialog/CustomDialog';
import DialogContent from '@mui/material/DialogContent';
import ChatWhatsApp from './ChatWhatsApp';
import { useGeoLocation } from '../../hooks/useGeoLocation';
import axios from 'axios';
import ContactFormDialog from './ContactFormDialog';
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
				background: 'transparent',
				position: 'relative',
				overflow: 'hidden',
				pt: { xs: isRotatedMedium ? '20vh' : '5vh', md: '6vh' },
				width: '100%',
				px: { xs: '5%', sm: '6%', md: '8%' },
			}}>
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
					<motion.div
						initial={{ opacity: 0, x: -50 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.8 }}
						style={{ width: '100%', position: 'relative', zIndex: 2 }}>
						<Typography
							variant='h2'
							className='gradient-text kaizen-title'
							sx={{
								fontSize: isVerySmallScreen || isRotatedMedium ? '1.75rem' : isSmallScreen ? '2rem' : '3rem',
								fontWeight: 700,
								mb: { xs: 1.5, sm: 2 },
								letterSpacing: '-0.02em',
								lineHeight: 1.2,
								fontFamily: 'Varela Round',
							}}>
							Ezber değil, akıcı iletişim
						</Typography>
						<Typography
							variant='h2'
							sx={{
								fontFamily: 'Varela Round',
								fontSize: isVerySmallScreen || isRotatedMedium ? '1.5rem' : isSmallScreen ? '1.75rem' : '2.25rem',
								color: '#1e293b',
								fontWeight: 600,
								lineHeight: 1.3,
							}}>
							Artık konuşurken “nasıl söyleniyordu?” diye düşünmeyeceksin
						</Typography>
						<Typography
							variant='h5'
							sx={{
								color: '#334155',
								fontSize: { xs: '0.9rem', sm: '1rem', md: '1.15rem' },
								fontWeight: 400,
								lineHeight: 1.7,
								fontFamily: 'Varela Round',
								margin: '1rem 0',
							}}>
							Geliştirdiğimiz eğitim modeliyle bir İngiliz gibi düşünecek ve doğal bir şekilde özgüvenle İngilizce konuşacaksın
						</Typography>

						<Box
							sx={{
								display: 'flex',
								gap: 2,
								flexWrap: 'wrap',
								justifyContent: { xs: 'center', md: 'flex-start' },
								mb: { xs: 3 },
								height: '4rem',
								mt: { xs: 2, sm: 2, md: 6 },
							}}>
							<Button
								variant='contained'
								endIcon={<PlayCircle />}
								onClick={() => setIsIntroVideoModalOpen(true)}
								sx={{
									'fontFamily': 'Varela Round',
									'background': 'linear-gradient(135deg, #FF6B3D 0%, #ff7d55 100%)',
									'color': '#FFFFFF',
									'borderRadius': { xs: '0.75rem', sm: '1rem', md: '1.25rem' },
									'padding': isSmallScreen || isRotatedMedium ? '0.4rem 1rem' : '0.5rem 1.75rem',
									'fontSize': isVerySmallScreen ? '0.8rem' : isSmallScreen || isRotatedMedium ? '0.85rem' : '1.05rem',
									'fontWeight': 500,
									'boxShadow': '0 4px 15px rgba(255, 107, 61, 0.35)',
									'&:hover': {
										background: 'linear-gradient(135deg, #ff7d55 0%, #FF6B3D 100%)',
										transform: 'translateY(-3px)',
										boxShadow: '0 6px 20px rgba(255, 107, 61, 0.45)',
									},
									'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
									'textTransform': 'capitalize',
									'height': '3rem',
								}}>
								Tanıtımı İzle
							</Button>
							<Button
								variant='outlined'
								// endIcon={<ContactPage />}
								onClick={() => setIsGetMoreDetailsModalOpen(true)}
								sx={{
									'border': 'none',
									'color': 'white',
									'borderRadius': { xs: '0.75rem', sm: '1rem', md: '1.25rem' },
									'padding': isSmallScreen || isRotatedMedium ? '0.4rem 1rem' : '0.5rem 1.75rem',
									'fontSize': isVerySmallScreen ? '0.8rem' : isSmallScreen || isRotatedMedium ? '0.85rem' : '1rem',
									'fontFamily': 'Varela Round',
									'fontWeight': 800,
									'letterSpacing': '0.03em',
									'textShadow': '0 1px 2px rgba(0, 0, 0, 0.1)',
									'textTransform': 'capitalize',
									'background': 'linear-gradient(135deg, rgba(79, 70, 229, 0.7) 0%, rgba(91, 33, 182, 0.7) 50%, rgba(124, 58, 237, 0.7) 100%)',
									'&:hover': {
										background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, rgba(124, 58, 237, 0.9) 50%, rgba(147, 51, 234, 0.9) 100%)',
										transform: 'translateY(-3px)',
										boxShadow: '0 4px 15px rgba(79, 70, 229, 0.4)',
									},
									'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
									'height': '3rem',
								}}>
								Daha Fazla Bilgi
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
						position: 'relative',
						zIndex: 2,
					}}>
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'center',
							width: '100%',
							position: 'relative',
						}}>
						<Box
							sx={{
								'position': 'absolute',
								'top': '50%',
								'left': '50%',
								'transform': 'translate(-50%, -50%)',
								'width': { xs: '200px', sm: '300px', md: '400px' },
								'height': { xs: '200px', sm: '300px', md: '400px' },
								'borderRadius': '50%',
								'background': 'radial-gradient(circle, rgba(91, 141, 239, 0.15) 0%, transparent 70%)',
								'filter': 'blur(40px)',
								'animation': 'pulseGlow 3s ease-in-out infinite',
								'@keyframes pulseGlow': {
									'0%, 100%': { transform: 'translate(-50%, -50%) scale(1)', opacity: 0.6 },
									'50%': { transform: 'translate(-50%, -50%) scale(1.2)', opacity: 0.8 },
								},
							}}
						/>
						<Box
							component='img'
							src={Hero_Img}
							alt='Student learning'
							sx={{
								'maxHeight': { xs: '40vh', sm: '55vh', md: '75vh' },
								'width': 'auto',
								'borderRadius': '50%',
								'transition': 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
								'position': 'relative',
								'zIndex': 1,
								'&:hover': {
									transform: 'scale(1.05) translateY(-10px)',
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
				errorDialogMsg={errorDialogMsg}
			/>
		</Box>
	);
};

export default HeroSection;
