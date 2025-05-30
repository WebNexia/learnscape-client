import { Box, Typography } from '@mui/material';
import LandingPageLayout from '../components/landingPage/LandingPageLayout';
import theme from '../themes';

const LandingPageResources = () => {
	return (
		<LandingPageLayout>
			<Box sx={{ paddingTop: '13vh', width: '100%' }}>
				<Box sx={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
					<Typography variant='h3' sx={{ textTransform: 'uppercase', color: theme.textColor?.secondary.main, fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important" }}>
						{/* Free Resources */}
						Ücretsiz Kaynaklar
					</Typography>
				</Box>
			</Box>
		</LandingPageLayout>
	);
};

export default LandingPageResources;
