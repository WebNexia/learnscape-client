import { Box, Container, Grid, Typography } from '@mui/material';
import { School, Psychology, Devices, EmojiEvents } from '@mui/icons-material';
import { useContext } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';

const features = [
	{
		icon: <School sx={{ fontSize: '2.5rem' }} />,
		title: 'Expert Instructors',
		description: 'Learn from certified English teachers with years of experience.',
		color: '#FF6B6B',
	},
	{
		icon: <Psychology sx={{ fontSize: '2.5rem' }} />,
		title: 'Personalized Learning',
		description: 'Customized lessons tailored to your learning style and goals.',
		color: '#4ECDC4',
	},
	{
		icon: <Devices sx={{ fontSize: '2.5rem' }} />,
		title: 'Learn Anywhere',
		description: 'Access your courses on any device, anytime, anywhere.',
		color: '#FFE66D',
	},
	{
		icon: <EmojiEvents sx={{ fontSize: '2.5rem' }} />,
		title: 'Track Progress',
		description: 'Monitor your improvement with detailed progress reports.',
		color: '#FF6B6B',
	},
];

const FeaturesSection = () => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	return (
		<Box sx={{ py: 8, backgroundColor: '#FDF7F0' }}>
			<Container>
				<Box sx={{ textAlign: 'center', mb: 6 }}>
					<Typography
						variant="h2"
						sx={{
							mb: 2,
							color: '#2D3436',
							fontWeight: 600,
							fontSize: isMobileSize ? '2rem' : '2.5rem',
						}}>
						{/* Our Features */}
						Özelliklerimiz
					</Typography>
					<Typography
						variant="h5"
						sx={{
							color: '#636E72',
							fontSize: isMobileSize ? '1rem' : '1.2rem',
						}}>
						{/* Discover what makes our learning platform unique */}
						Öğrenme platformumuzu benzersiz kılan özellikleri keşfedin
					</Typography>
				</Box>
				<Grid container spacing={4}>
					{features.map((feature, index) => (
						<Grid item xs={12} sm={6} md={3} key={index}>
							<Box
								sx={{
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									textAlign: 'center',
									p: 3,
									height: '100%',
									background: 'rgba(255, 255, 255, 0.8)',
									borderRadius: '1rem',
									boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
									transition: 'all 0.3s ease',
									'&:hover': {
										transform: 'translateY(-5px)',
										boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
									},
								}}>
								<Box
									sx={{
										color: feature.color,
										mb: 2,
										p: 2,
										borderRadius: '50%',
										background: 'rgba(255, 255, 255, 0.9)',
										boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
									}}>
									{feature.icon}
								</Box>
								<Typography
									variant="h5"
									sx={{
										mb: 2,
										fontWeight: 600,
										color: '#2D3436',
										fontSize: isMobileSize ? '1.2rem' : '1.4rem',
									}}>
									{feature.title === 'Expert Instructors' ? 'Uzman Eğitmenler' :
										feature.title === 'Personalized Learning' ? 'Kişiselleştirilmiş Öğrenme' :
										feature.title === 'Learn Anywhere' ? 'Her Yerde Öğren' :
										'İlerlemeyi Takip Et'}
								</Typography>
								<Typography
									variant="body1"
									sx={{
										color: '#636E72',
										fontSize: isMobileSize ? '0.9rem' : '1rem',
									}}>
									{feature.description === 'Learn from certified English teachers with years of experience.' ? 'Yılların deneyimine sahip sertifikalı İngilizce öğretmenlerinden öğrenin.' :
										feature.description === 'Customized lessons tailored to your learning style and goals.' ? 'Öğrenme tarzınıza ve hedeflerinize uyarlanmış özel dersler.' :
										feature.description === 'Access your courses on any device, anytime, anywhere.' ? 'Kurslarınıza herhangi bir cihazdan, istediğiniz zaman, istediğiniz yerden erişin.' :
										'Detaylı ilerleme raporlarıyla gelişiminizi takip edin.'}
								</Typography>
							</Box>
						</Grid>
					))}
				</Grid>
			</Container>
		</Box>
	);
};

export default FeaturesSection; 