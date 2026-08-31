import { Box, Button, Typography, useMediaQuery } from '@mui/material';
import { motion } from 'framer-motion';
import { useContext, useState, useEffect } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import Hero_Img from '../../assets/HeroSecImage.png';
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

	const { isSmallScreen, isRotatedMedium, isRotated } = useContext(MediaQueryContext);

	/** Stack text + image: narrow, portrait, or short landscape (rotate / phone sideways) */
	const stackHeroLayout = useMediaQuery(
		'(max-width: 899px), (orientation: portrait), (max-height: 550px) and (orientation: landscape)',
	);
	const compactControls = isSmallScreen || isRotatedMedium || isRotated;

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
				display: 'flex',
				justifyContent: 'center',
				alignItems: stackHeroLayout ? 'center' : 'stretch',
				background: 'transparent',
				position: 'relative',
				width: '100%',
				minHeight: stackHeroLayout ? 'auto' : { xs: 'auto', md: 'min(100vh, 920px)' },
				pt: {
					xs: 'clamp(4.25rem, 11vh, 6.5rem)',
					md: 'clamp(4.75rem, 10vh, 7rem)',
				},
				pb: { xs: 2, sm: 3, md: 0 },
				overflow: 'hidden',
				boxSizing: 'border-box',
			}}>
			<Box
				sx={{
					display: 'grid',
					width: '100%',
					maxWidth: '1400px',
					mx: 'auto',
					px: { xs: '4%', sm: '5%', md: '4%', lg: '3.5%' },
					py: { xs: 1.5, sm: 2.5, md: 0 },
					flex: stackHeroLayout ? 'none' : 1,
					gap: stackHeroLayout ? { xs: 5.5, sm: 6.5 } : { md: 2, lg: 3 },
					alignItems: stackHeroLayout ? 'center' : 'stretch',
					gridTemplateColumns: stackHeroLayout ? '1fr' : { md: 'minmax(0, 1.25fr) minmax(0, 0.75fr)' },
					gridTemplateAreas: stackHeroLayout
						? '"copy" "visual"'
						: { md: '"copy visual"' },
				}}>
				<motion.div
					initial={{ opacity: 0, x: -50 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.8 }}
					style={{
						gridArea: 'copy',
						width: '100%',
						minWidth: 0,
						height: '100%',
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'center',
						alignItems: stackHeroLayout ? 'center' : 'flex-start',
						textAlign: stackHeroLayout ? 'center' : 'left',
						position: 'relative',
						zIndex: 2,
					}}>
					<Box sx={{ width: '100%', maxWidth: stackHeroLayout ? '36rem' : { md: '42rem', lg: '48rem' } }}>
						<Typography
							variant='h2'
							className='kaizen-title'
							sx={{
								fontSize: {
									xs: 'clamp(1.45rem, 2.35vw + 0.9rem, 3rem)',
									md: 'clamp(1.95rem, 2.5vw + 0.85rem, 3.7rem)',
									lg: 'clamp(2.15rem, 2.3vw + 1.05rem, 4.1rem)',
								},
								fontWeight: 700,
								mb: { xs: 1, sm: 1.5, md: 2, lg: 2.5 },
								letterSpacing: '-0.02em',
								lineHeight: 1.15,
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
								fontSize: {
									xs: 'clamp(1rem, 1.45vw + 0.58rem, 2.4rem)',
									md: 'clamp(1.2rem, 1.6vw + 0.55rem, 2.95rem)',
									lg: 'clamp(1.35rem, 1.5vw + 0.62rem, 3.25rem)',
								},
								color: '#152238',
								fontWeight: 600,
								lineHeight: 1.35,
							}}>
							Size hayal satmıyoruz. İngilizceyi öğrenirken karşınıza çıkan zorlukları ve problemleri biliyoruz
						</Typography>
						<Typography
							variant='h5'
							sx={{
								color: '#1e3a5f',
								fontSize: {
									xs: 'clamp(0.86rem, 0.58vw + 0.68rem, 1.45rem)',
									md: 'clamp(1rem, 0.65vw + 0.66rem, 1.8rem)',
									lg: 'clamp(1.1rem, 0.58vw + 0.75rem, 2rem)',
								},
								fontWeight: 400,
								lineHeight: 1.65,
								fontFamily: 'Varela Round',
								mt: { xs: 1, md: 1.75 },
							}}>
							Bu problemleri çözecek, sizi İngilizce düşündürecek ve akıcı konuşmanızı sağlayacak kurslar geliştirdik
						</Typography>
						<Typography
							variant='h6'
							sx={{
								color: '#1e3a5f',
								fontSize: {
									xs: 'clamp(0.8rem, 0.44vw + 0.65rem, 1.22rem)',
									md: 'clamp(0.92rem, 0.48vw + 0.65rem, 1.52rem)',
									lg: 'clamp(1rem, 0.45vw + 0.72rem, 1.68rem)',
								},
								fontWeight: 400,
								lineHeight: 1.65,
								fontFamily: 'Varela Round',
								mt: { xs: 0.75, md: 1.5 },
								mb: { xs: 0.5, md: 0.75 },
							}}>
							Kurslarımızı keşfedin!
						</Typography>
					</Box>

					<Box
						sx={{
							display: 'flex',
							gap: { xs: 1, sm: 1.5, md: 2 },
							flexWrap: 'wrap',
							justifyContent: stackHeroLayout ? 'center' : 'flex-start',
							width: '100%',
							mt: { xs: 1.25, sm: 1.75, md: 1.75 },
						}}>
						<Button
							variant='contained'
							endIcon={<PlayCircle />}
							onClick={() => setIsIntroVideoModalOpen(true)}
							sx={{
								fontFamily: 'Varela Round',
								border: '1px solid rgba(0, 76, 153, 0.35)',
								color: '#FFFFFF',
								background: '#0052a3',
								borderRadius: { xs: '0.65rem', sm: '0.75rem', md: '0.9rem' },
								px: compactControls ? { xs: 1, sm: 1.15 } : { xs: 1.15, sm: 1.35, md: 1.65 },
								py: compactControls ? 0.35 : { xs: 0.4, md: 0.45 },
								fontSize: {
									xs: 'clamp(0.72rem, 0.3vw + 0.58rem, 0.88rem)',
									md: 'clamp(0.78rem, 0.28vw + 0.6rem, 0.95rem)',
									lg: 'clamp(0.85rem, 0.25vw + 0.65rem, 1.05rem)',
								},
								fontWeight: 500,
								minHeight: { xs: '2rem', sm: '2.1rem', md: '2.5rem', lg: '2.75rem' },
								'& .MuiButton-endIcon': {
									marginLeft: { xs: 0.5, md: 0.65 },
									'& svg': { fontSize: { xs: '1.05rem', md: '1.15rem' } },
								},
								boxShadow: '0 4px 14px rgba(0, 76, 153, 0.4)',
								textTransform: 'capitalize',
								'&:hover': {
									background: '#0066CC',
									borderColor: 'rgba(0, 82, 163, 0.5)',
									transform: 'translateY(-3px)',
									boxShadow: '0 6px 20px rgba(0, 76, 153, 0.5)',
								},
								transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
							}}>
							Tanıtımı İzle
						</Button>
						<Button
							variant='contained'
							onClick={() => setIsGetMoreDetailsModalOpen(true)}
							sx={{
								fontFamily: 'Varela Round',
								background: '#FF6B3D',
								color: '#FFFFFF',
								borderRadius: { xs: '0.65rem', sm: '0.75rem', md: '0.9rem' },
								px: compactControls ? { xs: 1, sm: 1.15 } : { xs: 1.15, sm: 1.35, md: 1.65 },
								py: compactControls ? 0.35 : { xs: 0.4, md: 0.45 },
								fontSize: {
									xs: 'clamp(0.72rem, 0.3vw + 0.58rem, 0.88rem)',
									md: 'clamp(0.78rem, 0.28vw + 0.6rem, 0.95rem)',
									lg: 'clamp(0.85rem, 0.25vw + 0.65rem, 1.05rem)',
								},
								fontWeight: 700,
								letterSpacing: '0.02em',
								textTransform: 'capitalize',
								minHeight: { xs: '2rem', sm: '2.1rem', md: '2.35rem', lg: '2.45rem' },
								boxShadow: '0 4px 15px rgba(255, 107, 61, 0.35)',
								'&:hover': {
									background: '#ff7d55',
									transform: 'translateY(-2px)',
									boxShadow: '0 6px 20px rgba(255, 107, 61, 0.45)',
								},
								transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
							}}>
							Daha Fazla Bilgi
						</Button>
					</Box>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, x: 50 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.8, delay: 0.2 }}
					style={{
						gridArea: 'visual',
						width: '100%',
						minWidth: 0,
						height: '100%',
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
							alignItems: 'center',
							width: '100%',
							maxWidth: stackHeroLayout
								? { xs: 'min(100%, 18.5rem)', sm: 'min(100%, 21.5rem)' }
								: { md: 'min(100%, 40rem)', lg: 'min(100%, 48rem)', xl: 'min(100%, 52rem)' },
							position: 'relative',
							mx: 'auto',
						}}>
						{/* Soft organic Aden-blue wash — blurred blobs, no hard bands */}
						<Box
							aria-hidden
							sx={{
								position: 'absolute',
								zIndex: 0,
								pointerEvents: 'none',
								inset: stackHeroLayout ? '-12% -30% -8% -32%' : '-16% -38% -14% -40%',
								overflow: 'visible',
							}}>
							{/* Deep swell — lower left → center */}
							<Box
								sx={{
									position: 'absolute',
									left: '2%',
									bottom: '4%',
									width: '78%',
									height: '62%',
									borderRadius: '62% 38% 48% 52% / 48% 55% 45% 52%',
									background:
										'radial-gradient(ellipse 75% 70% at 42% 58%, rgba(0, 61, 122, 0.28) 0%, rgba(0, 82, 163, 0.16) 42%, transparent 72%)',
									filter: 'blur(28px)',
									transform: 'rotate(-8deg)',
								}}
							/>
							{/* Mid curl — behind figure */}
							<Box
								sx={{
									position: 'absolute',
									left: '18%',
									bottom: '10%',
									width: '88%',
									height: '78%',
									borderRadius: '48% 52% 42% 58% / 55% 42% 58% 45%',
									background:
										'radial-gradient(ellipse 70% 65% at 55% 48%, rgba(0, 102, 204, 0.22) 0%, rgba(77, 163, 232, 0.14) 40%, transparent 70%)',
									filter: 'blur(36px)',
									transform: 'rotate(6deg)',
								}}
							/>
							{/* Soft crest — upper right lift */}
							<Box
								sx={{
									position: 'absolute',
									right: '-4%',
									top: '6%',
									width: '70%',
									height: '58%',
									borderRadius: '55% 45% 60% 40% / 42% 58% 42% 58%',
									background:
										'radial-gradient(ellipse 68% 62% at 48% 52%, rgba(182, 224, 254, 0.45) 0%, rgba(159, 208, 240, 0.2) 38%, transparent 68%)',
									filter: 'blur(32px)',
									transform: 'rotate(12deg)',
								}}
							/>
							{/* Light foam highlight */}
							<Box
								sx={{
									position: 'absolute',
									left: '28%',
									bottom: '18%',
									width: '55%',
									height: '42%',
									borderRadius: '50% 50% 45% 55% / 60% 40% 60% 40%',
									background:
										'radial-gradient(ellipse 60% 55% at 50% 50%, rgba(255, 255, 255, 0.42) 0%, rgba(232, 244, 252, 0.18) 45%, transparent 72%)',
									filter: 'blur(24px)',
								}}
							/>
						</Box>
						<Box
							component='img'
							src={Hero_Img}
							alt='Student learning'
							sx={{
								width: '100%',
								height: 'auto',
								maxHeight: stackHeroLayout
									? { xs: 'clamp(10rem, 34vh, 17.5rem)', sm: 'clamp(12rem, 38vh, 20.5rem)' }
									: {
										md: 'clamp(22rem, 64vh, 40rem)',
										lg: 'clamp(26rem, 72vh, 48rem)',
										xl: 'clamp(28rem, 76vh, 52rem)',
									},
								objectFit: 'contain',
								objectPosition: 'center center',
								display: 'block',
								position: 'relative',
								zIndex: 1,
								transform: stackHeroLayout ? 'scale(1.08)' : 'scale(1.18)',
								transformOrigin: 'center center',
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
				setErrorDialogMsg={setErrorDialogMsg}
			/>
		</Box>
	);
};

export default HeroSection;
