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
		color: '#FF6B6B',
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
		color: '#FF8C42',
	},
	{
		icon: <EmojiEvents sx={{ fontSize: '3rem', fontWeight: 600 }} />,
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
				backgroundColor: 'transparent',
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
							'mb': responsiveStyles.spacing.item,
							'fontSize': responsiveStyles.typography.h2,
							'background': 'linear-gradient(135deg, #4f46e5 0%, #5b21b6 25%, #7c3aed 50%, #3b82f6 75%, #2563eb 100%)',
							'WebkitBackgroundClip': 'text',
							'WebkitTextFillColor': 'transparent',
							'backgroundClip': 'text',
							'backgroundSize': '200% 200%',
							'animation': 'gradientShift 5s ease infinite',
							'fontWeight': 700,
							'fontFamily': 'Varela Round',
							'@keyframes gradientShift': {
								'0%': { backgroundPosition: '0% 50%' },
								'50%': { backgroundPosition: '100% 50%' },
								'100%': { backgroundPosition: '0% 50%' },
							},
						}}>
						Neden Kaizenglish?
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
									'display': 'flex',
									'flexDirection': 'column',
									'alignItems': 'center',
									'textAlign': 'center',
									'p': responsiveStyles.components.card.padding,
									'height': '100%',
									'background': 'rgba(255, 255, 255, 0.9)',
									'backdropFilter': 'blur(10px)',
									'borderRadius': responsiveStyles.components.card.borderRadius,
									'border': `2px solid ${feature.color}20`,
									'boxShadow': '0 4px 20px rgba(91, 141, 239, 0.1)',
									'transition': 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
									'position': 'relative',
									'overflow': 'hidden',
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
										transition: 'transform 0.4s ease',
									},
									'&:hover': {
										'transform': 'translateY(-8px)',
										'boxShadow': `0 8px 30px ${feature.color}25`,
										'borderColor': `${feature.color}40`,
										'&::before': {
											transform: 'scaleX(1)',
										},
									},
									'mb': { xs: 2 },
								}}>
								<Box
									sx={{
										'color': feature.color,
										'mb': 2,
										'p': 3,
										'borderRadius': '50%',
										'background': feature.title === 'Learn Anywhere' 
											? `linear-gradient(135deg, ${feature.color}50, ${feature.color}40)`
											: `linear-gradient(135deg, ${feature.color}30, ${feature.color}20)`,
										'boxShadow': feature.title === 'Learn Anywhere'
											? `0 4px 20px ${feature.color}60`
											: `0 4px 20px ${feature.color}35`,
										'transition': 'all 0.4s ease',
										'display': 'flex',
										'alignItems': 'center',
										'justifyContent': 'center',
										'& svg': {
											filter: feature.title === 'Learn Anywhere'
												? 'drop-shadow(0 3px 6px rgba(0, 0, 0, 0.5))'
												: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))',
										},
										'&:hover': {
											transform: 'scale(1.1) rotate(5deg)',
											boxShadow: feature.title === 'Learn Anywhere'
												? `0 6px 25px ${feature.color}70`
												: `0 6px 25px ${feature.color}45`,
											background: feature.title === 'Learn Anywhere'
												? `linear-gradient(135deg, ${feature.color}60, ${feature.color}50)`
												: `linear-gradient(135deg, ${feature.color}40, ${feature.color}30)`,
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
											? 'Kişiselleştirilmiş Öğrenme'
											: feature.title === 'Learn Anywhere'
												? 'Her Yerde Öğren'
												: 'İlerlemeyi Takip Et'}
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
