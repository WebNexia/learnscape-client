import { Box, Container, Grid, Typography } from '@mui/material';
import { School, Psychology, Devices, EmojiEvents } from '@mui/icons-material';
import { useContext } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import { responsiveStyles } from '../../styles/responsiveStyles';

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
	const { isSmallScreen, isRotatedMedium, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	return (
		<Box
			sx={{
				py: responsiveStyles.spacing.section,
				backgroundColor: '#FDF7F0',
				px: responsiveStyles.spacing.container,
			}}>
			<Container maxWidth='lg'>
				<Box
					sx={{
						textAlign: 'center',
						mb: responsiveStyles.spacing.section,
						px: responsiveStyles.spacing.item,
					}}>
					<Typography
						variant='h2'
						sx={{
							mb: responsiveStyles.spacing.item,
							fontSize: responsiveStyles.typography.h2,
							color: '#2D3436',
							fontWeight: 600,
						}}>
						Neden Kaizenglish?
					</Typography>
					<Typography
						variant='h5'
						sx={{
							color: '#636E72',
							fontSize: responsiveStyles.typography.h5,
						}}>
						Öğrenme platformumuzu benzersiz kılan özellikleri keşfedin
					</Typography>
				</Box>
				<Grid container spacing={responsiveStyles.spacing.item} sx={{ px: responsiveStyles.spacing.item }}>
					{features?.map?.((feature, index) => (
						<Grid item xs={12} sm={6} md={3} key={index} sx={{ mb: { xs: 2 } }}>
							<Box
								sx={{
									'display': 'flex',
									'flexDirection': 'column',
									'alignItems': 'center',
									'textAlign': 'center',
									'p': responsiveStyles.components.card.padding,
									'height': '100%',
									'background': 'rgba(255, 255, 255, 0.8)',
									'borderRadius': responsiveStyles.components.card.borderRadius,
									'boxShadow': '0 4px 20px rgba(0, 0, 0, 0.15)',
									'transition': 'all 0.3s ease',
									'&:hover': {
										transform: 'translateY(-5px)',
										boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
									},
									'mb': { xs: 2 },
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
									variant='h5'
									sx={{
										mb: 2,
										minHeight: !isSmallScreen ? '4rem' : !isVerySmallScreen ? '2.5rem' : undefined,
										fontWeight: 600,
										color: '#2D3436',
										fontSize: isMobileSize ? '1.2rem' : '1.4rem',
										fontFamily: 'Varela Round',
									}}>
									{feature.title === 'Expert Instructors'
										? 'Uzman Eğitmenler'
										: feature.title === 'Personalized Learning'
											? 'Kişiselleştirilmiş Öğrenme'
											: feature.title === 'Learn Anywhere'
												? 'Her Yerde Öğren'
												: 'İlerlemeyi Takip Et'}
								</Typography>
								<Typography
									variant='body1'
									sx={{
										color: '#636E72',
										fontSize: isMobileSize ? '0.9rem' : '1rem',
										fontFamily: 'Varela Round',
									}}>
									{feature.description === 'Learn from certified English teachers with years of experience.'
										? 'Yılların deneyimine sahip sertifikalı İngilizce öğretmenlerinden öğrenin.'
										: feature.description === 'Customized lessons tailored to your learning style and goals.'
											? 'Öğrenme tarzınıza ve hedeflerinize uyarlanmış özel dersler.'
											: feature.description === 'Access your courses on any device, anytime, anywhere.'
												? 'Kurslarınıza herhangi bir cihazdan, istediğiniz zaman, istediğiniz yerden erişin.'
												: 'Detaylı ilerleme raporlarıyla gelişiminizi takip edin.'}
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
