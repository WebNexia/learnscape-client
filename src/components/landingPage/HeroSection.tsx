import { Box, Button, Typography, Alert } from '@mui/material';
import { motion } from 'framer-motion';
import { useContext, useState } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import Instructor_Img from '../../assets/instructor-new1.png';
import { ContactPage, PlayCircle } from '@mui/icons-material';
import CustomDialog from '../layouts/dialog/CustomDialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import ReactPlayer from 'react-player';
import CustomTextField from '../forms/customFields/CustomTextField';
import PhoneInput from 'react-phone-input-2';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import ChatWhatsApp from './ChatWhatsApp';
import { useGeoLocation } from '../../hooks/useGeoLocation';
import theme from '../../themes';
import axios from 'axios';
import Snackbar from '@mui/material/Snackbar';

const HeroSection = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const [isIntroVideoModalOpen, setIsIntroVideoModalOpen] = useState<boolean>(false);
	const [isGetMoreDetailsModalOpen, setIsGetMoreDetailsModalOpen] = useState<boolean>(false);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const location = useGeoLocation();
	const [firstName, setFirstName] = useState<string>('');
	const [lastName, setLastName] = useState<string>('');
	const [email, setEmail] = useState<string>('');
	const [phone, setPhone] = useState<string>('');
	const [message, setMessage] = useState<string>('');
	const [sending, setSending] = useState<boolean>(false);
	const [showSuccess, setShowSuccess] = useState<boolean>(false);

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
			await axios.post(`${base_url}/course-information-requests`, {
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
				pt: { xs: '5vh', md: '6vh' },
				width: '100%',
				px: '8%',
			}}>
			{/* Animated background elements */}
			<Box
				sx={{
					position: 'absolute',
					width: '100%',
					height: '100%',
					opacity: 0.1,
					// background: 'radial-gradient(circle, #2C3E50 1px, transparent 1px)',
					backgroundSize: '30px 30px',
				}}
			/>

			<Box
				sx={{
					display: 'flex',
					flexDirection: { xs: 'column', md: 'row' },
					justifyContent: 'center',
					alignItems: 'center',
					gap: 13,
					py: 8,
					maxWidth: '100rem',
					width: '100%',
				}}>
				{/* Content */}
				<motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} style={{ flex: 2 }}>
					<Typography
						variant='h2'
						className='gradient-text kaizen-title'
						sx={{
							fontSize: { xs: '2.5rem', md: '3.5rem' },
							fontWeight: 600,
							mb: 2,
							background: 'linear-gradient(45deg, #2C3E50, #3498DB)',
							WebkitBackgroundClip: 'text',
							WebkitTextFillColor: 'transparent',
							backgroundClip: 'text',
							letterSpacing: '-0.02em',
							lineHeight: 1.2,
							fontFamily: 'Varela Round',
						}}>
						{/* Speak with confidence, learn with passion, grow without limits! */}
						Güvenle konuşun, tutkuyla öğrenin, sınırsızca gelişin!
					</Typography>
					<Typography
						variant='h5'
						sx={{
							mb: 4,
							color: '#34495E',
							opacity: 0.9,
							fontSize: { xs: '1.1rem', md: '1.3rem' },
							fontWeight: 400,
							lineHeight: 1.6,
							fontFamily: 'Varela Round',
						}}>
						{/* Access world-class courses, expert instructors, and a supportive community */}
						Dünya standartlarında kurslar, uzman eğitmenler ve destekleyici bir topluluk
					</Typography>
					<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
						<Button
							variant='outlined'
							endIcon={<PlayCircle />}
							onClick={() => setIsIntroVideoModalOpen(true)}
							sx={{
								'fontFamily': 'Varela Round',
								'borderColor': '#2C3E50',
								'color': '#2C3E50',
								'borderRadius': '1.1rem',
								'padding': '0.75rem 1.75rem',
								'fontWeight': 400,
								'&:hover': {
									borderColor: '#2C3E50',
									backgroundColor: 'rgba(44, 62, 80, 0.05)',
									transform: 'translateY(-2px)',
								},
								'transition': 'all 0.3s ease',
							}}>
							{/* Watch */}
							İzle
						</Button>
						<Button
							variant='outlined'
							endIcon={<ContactPage />}
							onClick={() => setIsGetMoreDetailsModalOpen(true)}
							sx={{
								'borderColor': '#3498DB',
								'color': '#3498DB',
								'borderRadius': '1.1rem',
								'padding': '0.75rem 1.75rem',
								'fontFamily': 'Varela Round',
								'fontWeight': 400,
								'&:hover': {
									borderColor: '#3498DB',
									backgroundColor: 'rgba(52, 152, 219, 0.05)',
									transform: 'translateY(-2px)',
								},
								'transition': 'all 0.3s ease',
							}}>
							{/* More Info */}
							Daha Fazla Bİlgİ
						</Button>
					</Box>
				</motion.div>

				{/* Instructor Image */}
				{!isSmallScreen && (
					<motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }} style={{ flex: 1 }}>
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
									'maxHeight': '70vh',
									'borderRadius': '50%',
									// 'backgroundColor': 'rgba(255, 255, 255, 0.1)',
									// 'boxShadow': '0 4px 30px rgba(44, 62, 80, 0.1)',
									// 'backdropFilter': 'blur(5px)',
									// 'border': '1px solid rgba(44, 62, 80, 0.1)',
									'transition': 'all 0.3s ease',
									'&:hover': {
										transform: 'scale(1.05) translateY(-15px) rotate(-1deg)',
										boxShadow: '1px 6px 12px rgba(44, 62, 80, 0.15)',
									},
								}}
							/>
						</Box>
					</motion.div>
				)}
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
				closeModal={() => setIsIntroVideoModalOpen(false)}
				maxWidth='md'
				PaperProps={{
					sx: {
						background: 'transparent',
						overflow: 'hidden',
					},
				}}>
				<DialogContent sx={{ height: '70vh', background: 'transparent', p: 0 }}>
					<ReactPlayer
						url='https://www.youtube.com/watch?v=1QiKcS1MmmU&list=RD1QiKcS1MmmU&start_radio=1'
						height='100%'
						width='100%'
						style={{
							boxShadow: 'none',
							background: 'transparent',
							overflow: 'hidden',
						}}
						controls
					/>
				</DialogContent>
			</CustomDialog>

			<CustomDialog
				title='DETAYLI BİLGİ ALIN'
				openModal={isGetMoreDetailsModalOpen}
				closeModal={() => {
					setIsGetMoreDetailsModalOpen(false);
					resetForm();
					setShowSuccess(false);
				}}
				maxWidth='sm'
				titleSx={{
					fontSize: '1.5rem',
					fontWeight: 600,
					fontFamily: 'Varela Round',
					color: '#2C3E50',
					ml: '0.5rem',
					textAlign: 'center',
					mb: 1,
				}}
				PaperProps={{
					sx: {
						height: 'auto',
						maxHeight: '90vh',
						overflow: 'visible',
						borderRadius: '1.5rem',
						background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.98))',
						boxShadow: '0 8px 32px rgba(44, 62, 80, 0.1)',
						backdropFilter: 'blur(8px)',
						border: '1px solid rgba(255, 255, 255, 0.18)',
					},
				}}>
				<DialogTitle
					sx={{
						color: '#2C3E50',
						fontFamily: 'Varela Round',
						ml: '0.5rem',
						textAlign: 'center',
						fontSize: '1.1rem',
						opacity: 0.9,
						lineHeight: 1.6,
						mb: 2,
					}}>
					Kurslarımız hakkında bilgi alın, yeni eğitimlerden öncelikli olarak haberdar olun.
				</DialogTitle>
				<form onSubmit={handleMoreInfoRequest}>
					<Box
						sx={{
							'margin': '0 2rem',
							'& .MuiOutlinedInput-root': {
								'&:hover fieldset': {
									borderColor: '#3498DB',
								},
								'&.Mui-focused fieldset': {
									borderColor: '#3498DB',
								},
							},
						}}>
						<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
							<CustomTextField
								label='İsim'
								value={firstName}
								onChange={(e) => setFirstName(e.target.value)}
								fullWidth={false}
								sx={{
									'width': '48%',
									'mb': '1.25rem',
									'& .MuiOutlinedInput-root': {
										fontFamily: 'Varela Round',
										borderRadius: '0.5rem',
									},
									'& .MuiInputBase-input': {
										fontFamily: 'Varela Round',
										fontSize: '0.95rem',
									},
									'& .MuiInputBase-input::placeholder': {
										fontFamily: 'Varela Round',
										opacity: 1,
									},
									'& .MuiInputLabel-root': {
										fontFamily: 'Varela Round',
										fontSize: '0.95rem',
									},
								}}
							/>
							<CustomTextField
								label='Soyisim'
								value={lastName}
								onChange={(e) => setLastName(e.target.value)}
								fullWidth={false}
								sx={{
									'width': '48%',
									'mb': '1.25rem',
									'& .MuiOutlinedInput-root': {
										fontFamily: 'Varela Round',
										borderRadius: '0.5rem',
									},
									'& .MuiInputBase-input': {
										fontFamily: 'Varela Round',
										fontSize: '0.95rem',
									},
									'& .MuiInputBase-input::placeholder': {
										fontFamily: 'Varela Round',
										opacity: 1,
									},
									'& .MuiInputLabel-root': {
										fontFamily: 'Varela Round',
										fontSize: '0.95rem',
									},
								}}
							/>
						</Box>
						<Box>
							<CustomTextField
								label='E-posta Adresi'
								type='email'
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								sx={{
									'mb': '1.25rem',
									'& .MuiOutlinedInput-root': {
										fontFamily: 'Varela Round',
										borderRadius: '0.5rem',
									},
									'& .MuiInputBase-input': {
										fontFamily: 'Varela Round',
										fontSize: '0.95rem',
									},
									'& .MuiInputBase-input::placeholder': {
										fontFamily: 'Varela Round',
										opacity: 1,
									},
									'& .MuiInputLabel-root': {
										fontFamily: 'Varela Round',
										fontSize: '0.95rem',
									},
								}}
							/>
						</Box>
						<Box>
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
										borderRadius: '0.5rem',
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
						<CustomTextField
							label='Mesajınız'
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							fullWidth={false}
							multiline
							required={false}
							rows={4}
							sx={{
								'width': '100%',
								'mt': '1.25rem',
								'& .MuiOutlinedInput-root': {
									fontFamily: 'Varela Round',
									borderRadius: '0.5rem',
								},
								'& .MuiInputBase-input': {
									fontFamily: 'Varela Round',
									fontSize: '0.95rem',
								},
								'& .MuiInputBase-input::placeholder': {
									fontFamily: 'Varela Round',
									opacity: 1,
								},
								'& .MuiInputLabel-root': {
									fontFamily: 'Varela Round',
									fontSize: '0.95rem',
								},
							}}
						/>
					</Box>
					<CustomDialogActions
						submitBtnText={sending ? 'Gönderiliyor...' : 'Gönder'}
						cancelBtnText='Kapat'
						onCancel={() => {
							setIsGetMoreDetailsModalOpen(false);
							resetForm();
							setShowSuccess(false);
						}}
						actionSx={{ margin: '1rem 1rem 0.75rem 0' }}
						submitBtnSx={{ fontFamily: 'Varela Round' }}
						cancelBtnSx={{ fontFamily: 'Varela Round' }}
						disableBtn={sending || !isValidPhone(phone)}
					/>
				</form>
			</CustomDialog>

			<Snackbar
				open={showSuccess}
				autoHideDuration={3100}
				anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
				onClose={() => {
					setShowSuccess(false);
					resetForm();
					setIsGetMoreDetailsModalOpen(false);
				}}
				sx={{ mt: '2.5rem' }}>
				<Alert
					severity='success'
					variant='filled'
					sx={{
						width: '100%',
						fontFamily: 'Varela Round',
						fontSize: '1rem',
						letterSpacing: 0,
						color: theme.textColor?.common.main,
					}}>
					Bilgileriniz alınmıştır, lütfen email'inizi kontrol edin
				</Alert>
			</Snackbar>
		</Box>
	);
};

export default HeroSection;
