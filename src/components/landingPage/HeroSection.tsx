import { Box, Button, Container, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useContext, useState } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import Instructor_Img from '../../assets/instructor-new.png';
import { ContactPage, PlayCircle } from '@mui/icons-material';
import CustomDialog from '../layouts/dialog/CustomDialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import ReactPlayer from 'react-player';
import CustomTextField from '../forms/customFields/CustomTextField';
import PhoneInput from 'react-phone-input-2';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import ChatWhatsApp from './ChatWhatsApp';

const HeroSection = () => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const [isIntroVideoModalOpen, setIsIntroVideoModalOpen] = useState<boolean>(false);
	const [isGetMoreDetailsModalOpen, setIsGetMoreDetailsModalOpen] = useState<boolean>(false);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	return (
		<Box
			sx={{
				height: '100vh',
				display: 'flex',
				alignItems: 'center',
				background: 'linear-gradient(135deg, rgba(44, 62, 80, 0.05), rgba(52, 152, 219, 0.05))',
				position: 'relative',
				overflow: 'hidden',
				pt: { xs: '7vh', md: '9vh' },
				width:'100%',
				px:'7.5%'
			}}>
			{/* Animated background elements */}
			<Box
				sx={{
					position: 'absolute',
					width: '100%',
					height: '100%',
					opacity: 0.1,
					background: 'radial-gradient(circle, #2C3E50 1px, transparent 1px)',
					backgroundSize: '30px 30px',
				}}
			/>

			<Box sx={{width:'100%'}}>
				<Box
					sx={{
						display: 'flex',
						flexDirection: { xs: 'column', md: 'row' },
						justifyContent: 'space-between',
						alignItems: 'center',
						gap: 15,
						py: 8,
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
										'height': '95%',
										'maxHeight': '75vh',
										'borderRadius': '50%',
										// 'backgroundColor': 'rgba(255, 255, 255, 0.1)',
										// 'boxShadow': '0 4px 30px rgba(44, 62, 80, 0.1)',
										// 'backdropFilter': 'blur(5px)',
										// 'border': '1px solid rgba(44, 62, 80, 0.1)',
										'transition': 'all 0.3s ease',
										'&:hover': {
											transform: 'scale(1.02)',
											boxShadow: '0 8px 40px rgba(44, 62, 80, 0.15)',
										},
									}}
								/>
							</Box>
						</motion.div>
					)}
				</Box>
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

			<CustomDialog openModal={isGetMoreDetailsModalOpen} closeModal={() => setIsGetMoreDetailsModalOpen(false)} maxWidth='sm'>
				<DialogTitle sx={{ color: '#2C3E50', mt:'1rem' }}>Kurslar hakkında daha fazla bilgi alın</DialogTitle>
				<form>
					<Box sx={{ margin: '0 2rem' }}>
						<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
							<CustomTextField label='Ad' fullWidth={false} sx={{ width: '48%' }} />
							<CustomTextField label='Soyad' fullWidth={false} sx={{ width: '48%' }} />
						</Box>
						<Box>
							<CustomTextField label='E-posta Adresi' type='email' />
						</Box>
						<Box>
							<PhoneInput country={'tr'} enableSearch={false} inputStyle={{ width: '100%', height: '40px' }} containerStyle={{ marginTop: '1rem' }} />
						</Box>
					</Box>
					<CustomDialogActions submitBtnText='Gönder' cancelBtnText='Kapat' onCancel={() => setIsGetMoreDetailsModalOpen(false)} actionSx={{margin:'1rem 1rem 0.75rem 0'}}/>
				</form>
			</CustomDialog>
		</Box>
	);
};

export default HeroSection;
