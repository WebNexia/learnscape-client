import { Box, Container, Grid, Typography } from '@mui/material';
import { School, Psychology, Devices, EmojiEvents } from '@mui/icons-material';
import { useContext } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import { responsiveStyles } from '../../styles/responsiveStyles';
import LandingPageSectionHeader from './LandingPageSectionHeader';

const cardOuterRadius = responsiveStyles.components.card.borderRadius;

/** Eski üst kenar şeridi ile aynı renk geçişi — kart bazında (mavi / mint sırayla) */
const cardHoverBorderGradient = (hex: string) => `linear-gradient(90deg, ${hex} 0%, ${hex}80 100%)`;
/** Dış padding (çerçeve kalınlığı) ile uyumlu iç köşe */
const cardInnerRadius = { xs: 'calc(0.5rem - 4px)', sm: 'calc(0.75rem - 4px)', md: 'calc(1rem - 4px)' };

const features = [
	{
		icon: <School sx={{ fontSize: '3rem', fontWeight: 600 }} />,
		title: 'Uzman Eğitmenler',
		description: 'Alanında deneyimli öğretmenlerimizle birebir ilgi ve güçlü akademik rehberlik.',
		color: '#004c99',
	},
	{
		icon: <Psychology sx={{ fontSize: '3rem', fontWeight: 600 }} />,
		title: 'Sistemli Öğrenme',
		description: 'Seviyenize uygun müfredat ve düzenli ilerleme takibiyle verimli çalışın.',
		color: '#4ECDC4',
	},
	{
		icon: <Devices sx={{ fontSize: '3rem', fontWeight: 700, strokeWidth: 1.5 }} />,
		title: 'Canlı Dersler',
		description: 'İnteraktif canlı oturumlarla konuları pekiştirin, sorularınızı anında yanıtlayın.',
		color: '#0066CC',
	},
	{
		icon: <EmojiEvents sx={{ fontSize: '3rem', fontWeight: 600 }} />,
		title: 'Etüt Programları',
		description: 'Etüt saatlerinde ek destek, tekrar ve sınav hazırlığı için planlı çalışma.',
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
				<LandingPageSectionHeader
					title='Neden Aden Academy?'
					subtitle='İngilizce ve sınav hazırlığında canlı ders, etüt ve dijital öğrenmeyi bir arada sunuyoruz. Hedefinize odaklı, destekleyici bir eğitim ortamı.'
					sx={{ mb: responsiveStyles.spacing.section }}
				/>
				<Grid container spacing={responsiveStyles.spacing.item} sx={{ px: responsiveStyles.spacing.item }}>
					{features?.map((feature, index) => (
						<Grid item xs={12} sm={6} md={3} key={index} sx={{ mb: { xs: 2 } }}>
							<Box
								sx={{
									height: '100%',
									p: '4px',
									borderRadius: cardOuterRadius,
									backgroundColor: 'transparent',
									boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
									position: 'relative',
									transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out',
									'&::before': {
										content: '""',
										position: 'absolute',
										inset: 0,
										borderRadius: cardOuterRadius,
										background: cardHoverBorderGradient(feature.color),
										opacity: 0,
										transition: 'opacity 0.25s ease-out',
										pointerEvents: 'none',
										zIndex: 0,
									},
									'&:hover': {
										transform: 'translate3d(0, -4px, 0)',
										boxShadow: `0 8px 24px ${feature.color}28`,
										'&::before': {
											opacity: 1,
										},
									},
									mb: { xs: 2 },
								}}>
								<Box
									sx={{
										position: 'relative',
										zIndex: 1,
										display: 'flex',
										flexDirection: 'column',
										alignItems: 'center',
										textAlign: 'center',
										p: responsiveStyles.components.card.padding,
										height: '100%',
										backgroundColor: '#FFFFFF',
										borderRadius: cardInnerRadius,
										border: 'none',
									}}>
									<Box
										sx={{
											color: feature.color,
											mb: 2,
											p: 3,
											borderRadius: '50%',
										background:
											feature.title === 'Canlı Dersler'
												? `linear-gradient(135deg, ${feature.color}50, ${feature.color}40)`
												: `linear-gradient(135deg, ${feature.color}30, ${feature.color}20)`,
										boxShadow: feature.title === 'Canlı Dersler' ? `0 4px 20px ${feature.color}60` : `0 4px 20px ${feature.color}35`,
											transition: 'transform 0.2s ease-out',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											'& svg': {
												filter:
													feature.title === 'Canlı Dersler'
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
										{feature.title}
									</Typography>
									<Typography
										variant='body1'
										sx={{
											color: '#0066CC',
											fontSize: isMobileSize ? '0.9rem' : '1rem',
											fontFamily: 'Varela Round',
											lineHeight: 1.6,
										}}>
										{feature.description}
									</Typography>
								</Box>
							</Box>
						</Grid>
					))}
				</Grid>
			</Container>
		</Box>
	);
};

export default FeaturesSection;
