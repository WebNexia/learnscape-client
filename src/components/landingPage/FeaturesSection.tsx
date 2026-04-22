import { Box, Container, Grid, Typography } from '@mui/material';
import { School, Psychology, Devices, EmojiEvents } from '@mui/icons-material';
import { useContext } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import { responsiveStyles } from '../../styles/responsiveStyles';

const features = [
	{
		icon: <School sx={{ fontSize: '3rem', fontWeight: 600 }} />,
		title: 'Expert Instructors',
		description: 'Learn from certified English teachers with years of experience.',
		color: '#004c99',
	},
	{
		icon: <Psychology sx={{ fontSize: '3rem', fontWeight: 600 }} />,
		title: 'Personalized Learning',
		description: 'Customized lessons tailored to your learning style and goals.',
		color: '#4ECDC4',
	},
	{
		icon: <Devices sx={{ fontSize: '3rem', fontWeight: 700, strokeWidth: 1.5 }} />,
		title: 'Learn Anywhere',
		description: 'Access your courses on any device, anytime, anywhere.',
		color: '#0066CC',
	},
	{
		icon: <EmojiEvents sx={{ fontSize: '3rem', fontWeight: 600 }} />,
		title: 'Track Progress',
		description: 'Monitor your improvement with detailed progress reports.',
		color: '#4ECDC4',
	},
];

const FeaturesSection = () => {
	const { isSmallScreen, isRotatedMedium, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	return (
		<Box
			sx={{
				py: responsiveStyles.spacing.section,
				backgroundColor: '#E8EEF4',
				px: responsiveStyles.spacing.container,
				position: 'relative',
			}}>
			<Container maxWidth='lg'>
				<Box
					sx={{
						textAlign: 'center',
						mb: responsiveStyles.spacing.section,
						px: responsiveStyles.spacing.item,
					}}>
					<Typography
						sx={{
							mb: responsiveStyles.spacing.item,
							fontSize: responsiveStyles.typography.h2,
							background: 'linear-gradient(135deg, #004c99 0%, #0052a3 50%, #0066CC 100%)',
							WebkitBackgroundClip: 'text',
							WebkitTextFillColor: 'transparent',
							backgroundClip: 'text',
							fontWeight: 700,
							fontFamily: 'Varela Round',
						}}>
						Neden Aden Academy?
					</Typography>
					<Typography
						variant='h5'
						sx={{
							color: '#334155',
							fontSize: responsiveStyles.typography.h5,
							fontFamily: 'Varela Round',
							fontWeight: 400,
						}}>
						Öğrenme platformumuzu benzersiz kılan özellikleri keşfedin
					</Typography>
				</Box>
				<Grid container spacing={responsiveStyles.spacing.item} sx={{ px: responsiveStyles.spacing.item }}>
					{features?.map((feature, index) => (
						<Grid item xs={12} sm={6} md={3} key={index} sx={{ mb: { xs: 2 } }}>
							<Box
								sx={{
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									textAlign: 'center',
									p: responsiveStyles.components.card.padding,
									height: '100%',
									backgroundColor: '#FFFFFF',
									borderRadius: responsiveStyles.components.card.borderRadius,
									border: `2px solid ${feature.color}20`,
									boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
									transition: 'transform 0.2s ease-out',
									position: 'relative',
									overflow: 'hidden',
									'&::before': {
										content: '""',
										position: 'absolute',
										top: 0,
										left: 0,
										right: 0,
										height: '4px',
										background: `linear-gradient(90deg, ${feature.color} 0%, ${feature.color}80 100%)`,
										transform: 'scaleX(0)',
										transformOrigin: 'left',
										transition: 'transform 0.2s ease-out',
										zIndex: 1,
									},
									'&:hover': {
										transform: 'translate3d(0, -4px, 0)',
										'&::before': { transform: 'scaleX(1)' },
									},
									mb: { xs: 2 },
								}}>
								<Box
									sx={{
										color: feature.color,
										mb: 2,
										p: 3,
										borderRadius: '50%',
										background:
											feature.title === 'Learn Anywhere'
												? `linear-gradient(135deg, ${feature.color}50, ${feature.color}40)`
												: `linear-gradient(135deg, ${feature.color}30, ${feature.color}20)`,
										boxShadow: feature.title === 'Learn Anywhere' ? `0 4px 20px ${feature.color}60` : `0 4px 20px ${feature.color}35`,
										transition: 'transform 0.2s ease-out',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										'& svg': {
											filter:
												feature.title === 'Learn Anywhere'
													? 'drop-shadow(0 3px 6px rgba(0, 0, 0, 0.5))'
													: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))',
										},
										'&:hover': {
											transform: 'scale(1.05)',
										},
									}}>
									{feature.icon}
								</Box>
								<Typography
									variant='h5'
									sx={{
										mb: 2,
										minHeight: !isSmallScreen ? '4rem' : !isVerySmallScreen ? '2.5rem' : undefined,
										fontWeight: 600,
										color: '#1e293b',
										fontSize: isMobileSize ? '1.2rem' : '1.4rem',
										fontFamily: 'Varela Round',
									}}>
									{feature.title === 'Expert Instructors'
										? 'Uzman Eğitmenler'
										: feature.title === 'Personalized Learning'
											? 'Sistemli Öğrenme'
											: feature.title === 'Learn Anywhere'
												? 'Canlı Dersler'
												: 'Etüt Programları'}
								</Typography>
								<Typography
									variant='body1'
									sx={{
										color: '#334155',
										fontSize: isMobileSize ? '0.9rem' : '1rem',
										fontFamily: 'Varela Round',
										lineHeight: 1.6,
									}}>
									{feature.description === 'Learn from certified English teachers with years of experience.'
										? 'Yılların deneyimine sahip İngilizce öğretmenlerinden öğrenin'
										: feature.description === 'Customized lessons tailored to your learning style and goals.'
											? 'Kendi hızınızda interaktif öğrenme deneyimi'
											: feature.description === 'Access your courses on any device, anytime, anywhere.'
												? 'İnteraktif derslerle öğrendiklerinizi pekiştirme ve canlı pratik fırsatı'
												: 'Etüt saatlerinde ders çalışma fırsatı ve ders planlama desteği'}
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
