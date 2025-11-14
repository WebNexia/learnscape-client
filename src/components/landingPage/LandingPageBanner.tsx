import { ContactPage, PlayCircle } from '@mui/icons-material';
import { Box, Button, DialogContent, DialogTitle, Typography } from '@mui/material';
import theme from '../../themes';
import { useContext, useState } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import Instructor_Img from '../../assets/home-page-instructor.png';
import CustomDialog from '../layouts/dialog/CustomDialog';
import ReactPlayer from 'react-player';
import CustomTextField from '../forms/customFields/CustomTextField';
import PhoneInput from 'react-phone-input-2';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import ChatWhatsApp from './ChatWhatsApp';

const LandingPageBanner = () => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);

	const [isIntroVideoModalOpen, setIsIntroVideoModalOpen] = useState<boolean>(false);
	const [isGetMoreDetailsModalOpen, setIsGetMoreDetailsModalOpen] = useState<boolean>(false);

	const isMobileSize = isSmallScreen || isRotatedMedium;
	// const isMobileSizeSmall = isVerySmallScreen || isRotated;
	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'center',
				alignItems: 'center',
				width: '100%',
			}}>
			<Box
				sx={{
					display: 'flex',
					height: isMobileSize ? '90vh' : '87vh',
					overflow: 'hidden',
					marginTop: isMobileSize ? '10vh' : '13vh',
					width: '100%',
				}}>
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'space-around',
						alignItems: 'center',
						width: '100%',
						padding: '5rem 3rem',
						flex: 2,
					}}>
					<Box>
						<Typography sx={{ fontSize: '2.5rem', color: theme.textColor?.secondary.main }}>
							{/* Speak with confidence, learn with passion, grow without limits! */}
							Kendine güvenle konuş, tutkuyla öğren, sınır tanıma!
						</Typography>
					</Box>

					<Box sx={{ mt: '2rem' }}>
						<Button
							variant='outlined'
							endIcon={<PlayCircle />}
							sx={{ 'mr': '2rem', 'borderRadius': '5rem', 'padding': '0.75rem 1.75rem', ':hover': { backgroundColor: ' #4D7B8B', color: '#ffff' } }}
							onClick={() => setIsIntroVideoModalOpen(true)}>
							{/* Watch */}
							İzle
						</Button>
						<Button
							variant='outlined'
							endIcon={<ContactPage />}
							sx={{ 'borderRadius': '5rem', 'padding': '0.75rem 1.75rem', ':hover': { backgroundColor: ' #4D7B8B', color: '#ffff' } }}
							onClick={() => setIsGetMoreDetailsModalOpen(true)}>
							{/* More Info */}
							Daha Fazla Bilgi
						</Button>
					</Box>
					<ChatWhatsApp />
				</Box>
				<Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', padding: '2rem', flex: 1 }}>
					<img src={Instructor_Img} alt='img' style={{ height: '95%', borderRadius: '50%', backgroundColor: 'lightcoral', padding: '1rem 5rem' }} />
				</Box>
			</Box>
			<CustomDialog openModal={isIntroVideoModalOpen} closeModal={() => setIsIntroVideoModalOpen(false)} maxWidth='sm'>
				<DialogContent sx={{ height: '60vh' }}>
					<ReactPlayer
						url='https://www.youtube.com/watch?v=1QiKcS1MmmU&list=RD1QiKcS1MmmU&start_radio=1'
						height='100%'
						width='100%'
						style={{
							boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
						}}
						controls
					/>
				</DialogContent>
			</CustomDialog>
			<CustomDialog openModal={isGetMoreDetailsModalOpen} closeModal={() => setIsGetMoreDetailsModalOpen(false)} maxWidth='sm'>
				<DialogTitle sx={{ paddingTop: '0rem' }}>
					{/* Get more details about courses */}
					Kurslar hakkında daha fazla bilgi alın
				</DialogTitle>
				<form>
					<Box sx={{ margin: '0 2rem' }}>
						<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
							<CustomTextField label={/* 'First Name' */ 'Ad'} fullWidth={false} sx={{ width: '48%' }} />
							<CustomTextField label={/* 'Last Name' */ 'Soyad'} fullWidth={false} sx={{ width: '48%' }} />
						</Box>
						<Box>
							<CustomTextField label={/* 'Email Address' */ 'E-posta Adresi'} type='email' />
						</Box>
						<Box>
							<PhoneInput
								country={'tr'} // Default country code (change as needed)
								enableSearch={false} // Allows searching for countries
								inputStyle={{ width: '100%', height: '40px' }} // Styling for the input
								containerStyle={{ marginTop: '1rem' }}
							/>
						</Box>
					</Box>
					<CustomDialogActions
						submitBtnText={/* 'Send' */ 'Gönder'}
						submitBtnSx={{
							'background': 'linear-gradient(135deg, #FF6B3D 0%, #ff7d55 100%)',
							'fontFamily': 'Varela Round',
							'&:hover': {
								background: 'linear-gradient(135deg, #ff7d55 0%, #FF6B3D 100%)',
							},
							'&.Mui-disabled': {
								background: 'rgba(0, 0, 0, 0.12)',
								color: 'rgba(0, 0, 0, 0.26)',
							},
						}}
					/>
				</form>
			</CustomDialog>
		</Box>
	);
};

export default LandingPageBanner;
