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

	const {
		isSmallScreen,
		isRotatedMedium,
		isMobileLandscape,
		isMobilePortrait,
		isTabletLandscape,
		isTabletPortrait,
		isDesktopLandscape,
		isDesktopPortrait,
		isSmallMobilePortrait,
		isSmallMobileLandscape,
	} = useContext(MediaQueryContext);

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
				height: isMobileLandscape ? 'auto' : { xs: '100vh', sm: 'auto', md: '100vh', lg: '100vh' },
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				background: 'transparent',
				position: 'relative',
				pt: isSmallMobileLandscape ? '26vh' : isMobileLandscape ? '15vh' : isMobilePortrait ? '10vh' : '10vh',
				overflow: 'hidden',
			}}>
			<Box
				sx={{
					display: 'flex',
					flexDirection: isMobileLandscape
						? 'column'
						: isMobilePortrait
							? 'column'
							: isTabletLandscape
								? 'row'
								: isTabletPortrait
									? 'column'
									: isDesktopLandscape
										? 'row'
										: isDesktopPortrait
											? 'column'
											: 'row',
					justifyContent: 'center',
					alignItems: 'center',
					width: '100%',
					px: '5%',
					py: '5%',
				}}>
				{/* Content */}

				<motion.div
					initial={{ opacity: 0, x: -50 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.8 }}
					style={{
						flex: 3,
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'center',
						alignItems: 'flex-start',
						width: '100%',
						position: 'relative',
						zIndex: 2,
						height: isSmallMobileLandscape ? '100vh' : 'auto',
						marginBottom: isSmallMobilePortrait
							? '1rem'
							: isMobilePortrait
								? '1.75rem'
								: isMobileLandscape
									? '2.25rem'
									: isTabletPortrait
										? '2.5rem'
										: '',
					}}>
					<Box>
						<Typography
							variant='h2'
							className='kaizen-title'
							sx={{
								fontSize: isSmallMobilePortrait
									? '1.35rem'
									: isSmallMobileLandscape
										? '1.75rem'
										: isMobilePortrait
											? '1.85rem'
											: isMobileLandscape
												? '2.25rem'
												: isTabletPortrait
													? '2.75rem'
													: isTabletLandscape
														? '3rem'
														: isDesktopPortrait
															? '2.75rem'
															: isDesktopLandscape
																? '3.25rem'
																: '3rem',
								fontWeight: 700,
								mb: { xs: 1.5, sm: 2 },
								letterSpacing: '-0.02em',
								lineHeight: 1.2,
								fontFamily: 'Varela Round',
								background: 'linear-gradient(135deg, #004c99 0%, #0052a3 100%)',
								WebkitBackgroundClip: 'text',
								WebkitTextFillColor: 'transparent',
								backgroundClip: 'text',
							}}>
							Ezber değil, akıcı iletişim
						</Typography>
						<Typography
							variant='h2'
							sx={{
								fontFamily: 'Varela Round',
								fontSize: isSmallMobilePortrait
									? '0.95rem'
									: isSmallMobileLandscape
										? '1.15rem'
										: isMobilePortrait
											? '1.5rem'
											: isMobileLandscape
												? '1.5rem'
												: isTabletPortrait
													? '2rem'
													: isTabletLandscape
														? '2.15rem'
														: isDesktopPortrait
															? '2.5rem'
															: isDesktopLandscape
																? '2.5rem'
																: '3rem',
								color: '#152238',
								fontWeight: 600,
								lineHeight: 1.3,
							}}>
							Size hayal satmıyoruz. İngilizceyi öğrenirken karşınıza çıkan zorlukları ve problemleri biliyoruz.
						</Typography>
						<Typography
							variant='h5'
							sx={{
								color: '#1e3a5f',
								fontSize: isSmallMobilePortrait
									? '0.8rem'
									: isSmallMobileLandscape
										? '0.85rem'
										: isMobilePortrait
											? '1rem'
											: isMobileLandscape
												? '1.35rem'
												: isTabletPortrait
													? '1.35rem'
													: isTabletLandscape
														? '1.35rem'
														: isDesktopPortrait
															? '1.5rem'
															: isDesktopLandscape
																? '1.5rem'
																: { sm: '1rem', md: '1rem' },
								fontWeight: 400,
								lineHeight: 1.7,
								fontFamily: 'Varela Round',
								margin: isMobilePortrait ? '0.75rem 0 0 0' : '1rem 0',
							}}>
							Bu problemleri çözecek, sizi İngilizce düşündürecek ve akıcı konuşmanızı sağlayacak kurslar geliştirdik.
						</Typography>
						<Typography variant='h6' sx={{
							color: '#1e3a5f',
							fontSize: isSmallMobilePortrait
								? '0.75rem'
								: isSmallMobileLandscape
									? '0.8rem'
									: isMobilePortrait
										? '0.9rem'
										: isMobileLandscape
											? '1.15rem'
											: isTabletPortrait
												? '1.15rem'
												: isTabletLandscape
													? '1.15rem'
													: isDesktopPortrait
														? '1.25rem'
														: isDesktopLandscape
															? '1.25rem'
															: { sm: '1rem', md: '1rem' },
							fontWeight: 400,
							lineHeight: 1.7,
							fontFamily: 'Varela Round',
							margin: isMobilePortrait ? '0.75rem 0 0 0' : '1rem 0 1.5rem 0',
						}}>
							Kurslarımızı keşfedin!
						</Typography>
					</Box>

					<Box
						sx={{
							display: 'flex',
							gap: 2,
							flexWrap: 'wrap',
							justifyContent: { xs: 'center', md: 'flex-start' },
							height: isSmallMobilePortrait
								? '2rem'
								: isSmallMobileLandscape
									? '3.5rem'
									: isMobileLandscape
										? '4rem'
										: isMobilePortrait
											? '3.5rem'
											: '4rem',
							mt: isSmallMobilePortrait ? '1rem' : isMobilePortrait ? '1.5rem' : isMobileLandscape ? '1rem' : '',
						}}>
						<Button
							variant='contained'
							endIcon={<PlayCircle />}
							onClick={() => setIsIntroVideoModalOpen(true)}
							sx={{
								'fontFamily': 'Varela Round',
								'border': '1px solid rgba(0, 76, 153, 0.35)',
								'color': '#FFFFFF',
								'background': '#0052a3',
								'borderRadius': { xs: '0.75rem', sm: '1rem', md: '1.25rem' },
								'padding': isSmallScreen || isRotatedMedium ? '0.4rem 1rem' : '0.5rem 1.75rem',
								'fontSize': { xs: '0.8rem', sm: '0.85rem', md: '0.9rem', lg: '1rem' },
								'fontWeight': 500,
								'boxShadow': '0 4px 14px rgba(0, 76, 153, 0.4)',
								'&:hover': {
									background: '#0066CC',
									borderColor: 'rgba(0, 82, 163, 0.5)',
									transform: 'translateY(-3px)',
									boxShadow: '0 6px 20px rgba(0, 76, 153, 0.5)',
								},
								'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
								'textTransform': 'capitalize',
								'height': isSmallMobilePortrait
									? '2rem'
									: isSmallMobileLandscape
										? '2.25rem'
										: isMobileLandscape
											? '2.5rem'
											: isMobilePortrait
												? '2.75rem'
												: '3rem',
							}}>
							Tanıtımı İzle
						</Button>
						<Button
							variant='contained'
							onClick={() => setIsGetMoreDetailsModalOpen(true)}
							sx={{
								'fontFamily': 'Varela Round',
								'background': '#FF6B3D',
								'color': '#FFFFFF',
								'borderRadius': { xs: '0.75rem', sm: '1rem', md: '1.25rem' },
								'padding': isSmallScreen || isRotatedMedium ? '0.4rem 1rem' : '0.5rem 1.75rem',
								'fontSize': { xs: '0.8rem', sm: '0.85rem', md: '0.9rem', lg: '1rem' },
								'fontWeight': 700,
								'letterSpacing': '0.02em',
								'textTransform': 'capitalize',
								'boxShadow': '0 4px 15px rgba(255, 107, 61, 0.35)',
								'&:hover': {
									background: '#ff7d55',
									transform: 'translateY(-2px)',
									boxShadow: '0 6px 20px rgba(255, 107, 61, 0.45)',
								},
								'transition': 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
								'height': isSmallMobilePortrait
									? '2rem'
									: isSmallMobileLandscape
										? '2.25rem'
										: isMobileLandscape
											? '2.5rem'
											: isMobilePortrait
												? '2.75rem'
												: '3rem',
							}}>
							Daha Fazla Bilgi
						</Button>
					</Box>
				</motion.div>

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
					{/* <Box
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
								'width': { xs: '250px', sm: '250px', md: '400px' },
								'height': { xs: '250px', sm: '250px', md: '400px' },
								'borderRadius': '50%',
								'background': 'radial-gradient(circle, rgba(0, 204, 255, 0.12) 0%, transparent 70%)',
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
								'maxHeight': isSmallMobilePortrait
									? '42.5vh'
									: isSmallMobileLandscape
										? '20rem'
										: isMobilePortrait
											? '40vh'
											: isMobileLandscape
												? '25rem'
												: isTabletPortrait
													? '27.5rem'
													: isTabletLandscape
														? '30rem'
														: isDesktopPortrait
															? '35rem'
															: isDesktopLandscape
																? '35rem'
																: { xs: 'auto', sm: 'auto', md: '25rem', lg: 'auto' },
								'borderRadius': '50%',
								'transition': 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
								'position': 'relative',
								'objectFit': 'contain',
								'zIndex': 1,
								'&:hover': {
									transform: 'scale(1.05) translateY(-10px)',
								},
							}}
						/>
					</Box> */}
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
				setErrorDialogMsg={setErrorDialogMsg}
			/>
		</Box>
	);
};

export default HeroSection;
