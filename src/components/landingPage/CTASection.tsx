import { Box, Button, Container, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { responsiveStyles } from '../../styles/responsiveStyles';
import { useContext } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';

const colorScheme = {
	primary: '#2C3E50',
	secondary: '#3498DB',
	accent: '#FFFF',
	text: '#34495E',
};

interface CTASectionProps {
	coursesRef: React.RefObject<HTMLDivElement>;
}

const CTASection = ({ coursesRef }: CTASectionProps) => {
	const navigate = useNavigate();
	const { isSmallScreen, isRotatedMedium, isVerySmallScreen } = useContext(MediaQueryContext);

	const handleScrollToCourses = () => {
		if (coursesRef.current) {
			const offset = 100;
			const elementPosition = coursesRef.current.getBoundingClientRect().top + window.scrollY;
			window.scrollTo({
				top: elementPosition - offset,
				behavior: 'smooth',
			});
		}
	};

	return (
		<Box
			sx={{
				position: 'relative',
				background: 'linear-gradient(90deg, rgba(118, 75, 162, 0.5) 0%, rgba(102, 126, 234, 0.4) 50%, transparent 100%)',
				py: responsiveStyles.spacing.section,
				overflow: 'hidden',
			}}>
			<Container maxWidth='lg' sx={{ px: responsiveStyles.spacing.container, position: 'relative', zIndex: 1 }}>
				<motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
					<Box
						sx={{
							textAlign: 'center',
							maxWidth: responsiveStyles.layout.maxWidth.md,
							mx: 'auto',
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
							Öğrenme Yolculuğunuza Başlamaya Hazır mısınız?
						</Typography>
						<Typography
							variant='h5'
							sx={{
								mb: responsiveStyles.spacing.container,
								fontSize: responsiveStyles.typography.h5,
								color: '#334155',
								fontWeight: 400,
								fontFamily: 'Varela Round',
								lineHeight: 1.6,
							}}>
							Eğitim yoluyla hayatlarını değiştiren binlerce öğrenciye katılın
						</Typography>
						<Box
							sx={{
								display: 'flex',
								gap: responsiveStyles.spacing.item,
								justifyContent: 'center',
								flexWrap: 'wrap',
								mt: '2rem',
							}}>
							<Button
								variant='contained'
								size='large'
								sx={{
									...responsiveStyles.components.button,
									'background': 'linear-gradient(135deg, #FF6B3D 0%, #ff7d55 100%)',
									'color': '#FFFFFF',
									'fontFamily': 'Varela Round',
									'fontWeight': 500,
									'boxShadow': '0 4px 15px rgba(255, 107, 61, 0.35)',
									'&:hover': {
										background: 'linear-gradient(135deg, #ff7d55 0%, #FF6B3D 100%)',
										transform: 'translateY(-3px)',
										boxShadow: '0 6px 20px rgba(255, 107, 61, 0.45)',
									},
									'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
									'textTransform': 'capitalize',
									'borderRadius': { xs: '0.75rem', sm: '1rem', md: '1.25rem' },
									'padding': isSmallScreen || isRotatedMedium ? '0.4rem 1rem' : '0.5rem 1.75rem',
									'fontSize': isVerySmallScreen ? '0.7rem' : isSmallScreen || isRotatedMedium ? '0.85rem' : '1rem',
								}}
								onClick={() => {
									navigate('/auth');
									window.scrollTo({
										top: 0,
										behavior: 'smooth',
									});
								}}>
								Hemen Başla
							</Button>
							<Button
								variant='outlined'
								size='large'
								sx={{
									...responsiveStyles.components.button,
									'border': 'none',
									'color': 'white',
									'fontFamily': 'Varela Round',
									'fontWeight': 800,
									'letterSpacing': '0.03em',
									'textShadow': '0 1px 2px rgba(0, 0, 0, 0.1)',
									'textTransform': 'capitalize',
									'background': 'linear-gradient(135deg, rgba(79, 70, 229, 0.7) 0%, rgba(91, 33, 182, 0.7) 50%, rgba(124, 58, 237, 0.7) 100%)',
									'&:hover': {
										background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, rgba(124, 58, 237, 0.9) 50%, rgba(147, 51, 234, 0.9) 100%)',
										transform: 'translateY(-3px)',
										boxShadow: '0 4px 15px rgba(79, 70, 229, 0.4)',
									},
									'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
									'borderRadius': { xs: '0.75rem', sm: '1rem', md: '1.25rem' },
									'padding': isSmallScreen || isRotatedMedium ? '0.4rem 1rem' : '0.5rem 1.75rem',
									'fontSize': isVerySmallScreen ? '0.7rem' : isSmallScreen || isRotatedMedium ? '0.85rem' : '1rem',
								}}
								onClick={handleScrollToCourses}>
								Kursları Görüntüle
							</Button>
						</Box>
					</Box>
				</motion.div>
			</Container>
		</Box>
	);
};

export default CTASection;
