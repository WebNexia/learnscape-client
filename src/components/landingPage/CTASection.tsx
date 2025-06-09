import { Box, Button, Container, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { responsiveStyles } from '../../styles/responsiveStyles';

const colorScheme = {
	primary: '#2C3E50',
	secondary: '#3498DB',
	accent: '#FDF7F0',
	text: '#34495E',
};

interface CTASectionProps {
	coursesRef: React.RefObject<HTMLDivElement>;
}

const CTASection = ({ coursesRef }: CTASectionProps) => {
	const navigate = useNavigate();

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
				backgroundColor: 'rgba(44, 62, 80, 0.02)',
				py: responsiveStyles.spacing.section,
			}}>
			<Container maxWidth='lg' sx={{ px: responsiveStyles.spacing.container }}>
				<motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
					<Box
						sx={{
							textAlign: 'center',
							maxWidth: responsiveStyles.layout.maxWidth.md,
							mx: 'auto',
						}}>
						<Typography
							variant='h2'
							sx={{
								mb: responsiveStyles.spacing.item,
								fontSize: responsiveStyles.typography.h2,
								color: colorScheme.text,
								fontWeight: 600,
								fontFamily: 'Varela Round',
							}}>
							Öğrenme Yolculuğunuza Başlamaya Hazır mısınız?
						</Typography>
						<Typography
							variant='h5'
							sx={{
								mb: responsiveStyles.spacing.container,
								fontSize: responsiveStyles.typography.h5,
								color: colorScheme.text,
								opacity: 0.8,
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
									'backgroundColor': colorScheme.primary,
									'color': '#fff',
									'fontFamily': 'Varela Round',
									'fontWeight': 400,
									'&:hover': {
										backgroundColor: colorScheme.secondary,
										transform: 'translateY(-2px)',
										boxShadow: '0 4px 12px rgba(44, 62, 80, 0.1)',
									},
									'transition': 'all 0.3s ease',
									'borderRadius': { xs: '0.5rem', sm: '0.9rem', md: '1.1rem' },
									'padding': { xs: '0.5rem 0.75rem', sm: '0.5rem 1rem', md: '0.5rem 1rem' },
									'fontSize': { xs: '0.6rem', sm: '0.8rem', md: '0.9rem' },
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
									'borderColor': colorScheme.primary,
									'color': colorScheme.primary,
									'fontFamily': "'Plus Jakarta Sans', sans-serif",
									'fontWeight': 400,
									'&:hover': {
										borderColor: colorScheme.secondary,
										color: colorScheme.secondary,
										backgroundColor: 'rgba(44, 62, 80, 0.05)',
										transform: 'translateY(-2px)',
										boxShadow: '0 4px 12px rgba(44, 62, 80, 0.1)',
									},
									'transition': 'all 0.3s ease',
									'borderRadius': { xs: '0.5rem', sm: '0.9rem', md: '1.1rem' },
									'padding': { xs: '0.5rem 1rem', sm: '0.5rem 1rem', md: '0.5rem 1rem' },
									'fontSize': { xs: '0.6rem', sm: '0.8rem', md: '0.9rem' },
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
