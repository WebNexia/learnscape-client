import { AssessmentOutlined } from '@mui/icons-material';
import { Box, Container, Paper, Typography } from '@mui/material';
import LandingPageLayout from '../components/landingPage/LandingPageLayout';
import { SEO } from '../components/seo';

const LevelTest = () => {
	const baseUrl = import.meta.env.VITE_SITE_URL || 'https://adenacademy.co.uk';

	return (
		<>
			<SEO
				title='Seviye Testi'
				description='Aden Academy İngilizce seviye testi ile dil seviyenizi keşfedin.'
				keywords='İngilizce seviye testi, online seviye testi, Aden Academy'
				url={`${baseUrl}/seviye-testi`}
			/>
			<LandingPageLayout>
				<Box
					component='main'
					sx={{
						minHeight: '72vh',
						display: 'flex',
						alignItems: 'center',
						background:
							'radial-gradient(circle at 20% 20%, rgba(0, 82, 163, 0.1), transparent 38%), linear-gradient(180deg, #ffffff 0%, #f5f9fc 100%)',
						px: 2,
						py: { xs: 10, md: 14 },
					}}>
					<Container maxWidth='md'>
						<Paper
							elevation={0}
							sx={{
								textAlign: 'center',
								borderRadius: 5,
								border: '1px solid rgba(0, 76, 153, 0.14)',
								boxShadow: '0 18px 55px rgba(0, 76, 153, 0.1)',
								px: { xs: 3, sm: 6 },
								py: { xs: 7, sm: 9 },
							}}>
							<AssessmentOutlined sx={{ color: '#FF6B3D', fontSize: { xs: 54, sm: 68 }, mb: 2 }} />
							<Typography
								component='h1'
								sx={{
									fontFamily: 'Varela Round',
									fontWeight: 700,
									fontSize: { xs: '2rem', sm: '3rem' },
									color: '#01435A',
									mb: 2,
								}}>
								Seviye Testi
							</Typography>
							<Typography
								sx={{
									fontFamily: 'Varela Round',
									fontSize: { xs: '1rem', sm: '1.15rem' },
									lineHeight: 1.7,
									color: '#526675',
								}}>
								İngilizce seviyenizi belirleyecek online testimiz çok yakında burada olacak.
							</Typography>
						</Paper>
					</Container>
				</Box>
			</LandingPageLayout>
		</>
	);
};

export default LevelTest;
