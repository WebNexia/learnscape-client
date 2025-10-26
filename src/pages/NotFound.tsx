import { Box, Button, Container, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowBack } from '@mui/icons-material';
import LandingPageLayout from '../components/landingPage/LandingPageLayout';

const NotFound = () => {
	const navigate = useNavigate();

	return (
		<LandingPageLayout>
			<Container maxWidth='md'>
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						minHeight: { xs: '60vh', md: '70vh' },
						textAlign: 'center',
						paddingTop: { xs: '10vh', md: '13vh' },
						px: { xs: 2, md: 0 },
					}}>
					{/* 404 Number */}
					<Typography
						variant='h1'
						sx={{
							fontSize: { xs: '4rem', sm: '5rem', md: '6rem', lg: '8rem' },
							fontWeight: 700,
							color: 'primary.main',
							fontFamily: 'Varela Round',
							lineHeight: 1,
							mb: { xs: 1, md: 2 },
						}}>
						404
					</Typography>

					{/* Error Message */}
					<Typography
						variant='h4'
						sx={{
							fontWeight: 600,
							color: 'text.primary',
							fontFamily: 'Varela Round',
							mb: { xs: 1, md: 2 },
							fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem', lg: '2rem' },
						}}>
						Sayfa Bulunamadı
					</Typography>

					<Typography
						variant='body1'
						sx={{
							color: 'text.secondary',
							fontFamily: 'Varela Round',
							mb: { xs: 3, md: 4 },
							fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
							maxWidth: '500px',
							px: { xs: 1, md: 0 },
						}}>
						Aradığınız sayfa mevcut değil veya taşınmış olabilir. Ana sayfaya dönmek için aşağıdaki butonları kullanabilirsiniz.
					</Typography>

					{/* Action Buttons */}
					<Box
						sx={{
							display: 'flex',
							gap: { xs: 1.5, sm: 2 },
							flexDirection: { xs: 'column', sm: 'row' },
							alignItems: 'center',
							width: { xs: '100%', sm: 'auto' },
						}}>
						<Button
							variant='contained'
							size='large'
							startIcon={<Home />}
							onClick={() => navigate('/')}
							sx={{
								fontFamily: 'Varela Round',
								fontWeight: 600,
								borderRadius: 2,
								px: { xs: 2, md: 3 },
								py: { xs: 0.75, md: 1.5 },
								fontSize: { xs: '0.8rem', md: '0.9rem' },
								width: { xs: '100%', sm: 'auto' },
								maxWidth: { xs: '200px', sm: 'none' },
							}}>
							Ana Sayfa
						</Button>

						<Button
							variant='outlined'
							size='large'
							startIcon={<ArrowBack />}
							onClick={() => navigate(-1)}
							sx={{
								fontFamily: 'Varela Round',
								fontWeight: 600,
								borderRadius: 2,
								px: { xs: 1.5, md: 3 },
								py: { xs: 0.75, md: 1.5 },
								fontSize: { xs: '0.8rem', md: '0.9rem' },
								width: { xs: '100%', sm: 'auto' },
								maxWidth: { xs: '200px', sm: 'none' },
							}}>
							Geri Dön
						</Button>
					</Box>
				</Box>
			</Container>
		</LandingPageLayout>
	);
};

export default NotFound;
