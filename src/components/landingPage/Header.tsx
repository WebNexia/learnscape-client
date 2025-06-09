import { AppBar, Box, Button, IconButton, Toolbar, Typography } from '@mui/material';
import theme from '../../themes';
import { useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import logo from '../../assets/logo.png';
import { Menu } from '@mui/icons-material';
import LandingPageDrawer from '../landingPage/LandingPageDrawer';

const Header = () => {
	const { isVerySmallScreen, isSmallScreen, isRotated, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;
	const navigate = useNavigate();
	const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

	const navItems = [
		{
			label: 'Ana Sayfa',
			action: () => {
				navigate('/');
				window.scrollTo({ top: 0, behavior: 'smooth' });
			},
		},
		{
			label: 'Kurslar',
			action: () => {
				navigate('/landing-page-courses');
				window.scrollTo({ top: 0, behavior: 'smooth' });
			},
		},
		{
			label: 'Kaynaklar',
			action: () => {
				navigate('/resources');
				window.scrollTo({ top: 0, behavior: 'smooth' });
			},
		},
		{
			label: 'İletişim',
			action: () => {
				navigate('/contact');
				window.scrollTo({ top: 0, behavior: 'smooth' });
			},
		},
		{
			label: 'Hakkımızda',
			action: () => {
				navigate('/about');
				window.scrollTo({ top: 0, behavior: 'smooth' });
			},
		},
	];

	return (
		<AppBar position='sticky' sx={{ background: 'none', boxShadow: 'none' }}>
			<Box sx={{ position: 'relative' }}>
				<Toolbar
					sx={{
						display: 'flex',
						justifyContent: 'space-between',
						width: '100%',
						height: isMobileSize ? '10vh' : '13vh',
						background: '#FDF7F0',
						backgroundImage: `
							linear-gradient(135deg, rgba(44, 62, 80, 0.05), rgba(52, 152, 219, 0.05)),
							radial-gradient(circle, rgba(44,62,80,0.08) 1px, transparent 1px)
						`,
						backgroundSize: 'auto, 30px 30px',
						backgroundRepeat: 'repeat, repeat',
						position: 'fixed',
						top: 0,
						px: isMobileSizeSmall ? '0.35rem' : '0.75rem',
						transition: 'all 0.3s ease',
						zIndex: 1201,
					}}>
					<Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
						{(isVerySmallScreen || isRotatedMedium) && (
							<IconButton onClick={() => setIsDrawerOpen(true)}>
								<Menu sx={{ color: theme.textColor?.primary.main, padding: 0 }} fontSize='small' />
							</IconButton>
						)}
						<Box
							sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
							onClick={() => {
								navigate('/');
								window.scrollTo({ top: 0, behavior: 'smooth' });
							}}>
							<Box
								component='img'
								src={logo}
								alt='logo'
								sx={{
									height: { xs: '6vh', sm: '6vh', md: '10vh' },
									minHeight: '2rem',
									maxHeight: '4.5rem',
									width: 'auto',
								}}
							/>
						</Box>
					</Box>
					<LandingPageDrawer isDrawerOpen={isDrawerOpen} setIsDrawerOpen={setIsDrawerOpen} navItems={navItems} />

					{!(isVerySmallScreen || isRotatedMedium) && (
						<Box sx={{ display: 'flex', justifyContent: 'center', flex: 1 }}>
							{navItems
								.filter((item) => item.label !== 'Ana Sayfa')
								.map((item, index) => (
									<Box key={index} onClick={item.action} sx={{ ml: index === 0 ? 0 : isSmallScreen ? '0.5rem' : '1rem' }}>
										<Typography
											sx={{
												'fontFamily': 'Varela Round',
												'color': theme.textColor?.primary.main,
												'&:hover': {
													color: '#3498DB',
													textDecoration: 'underline',
												},
												'cursor': 'pointer',
												'fontSize': isMobileSizeSmall ? '0.65rem' : isMobileSize ? '0.85rem' : '1.25rem',
												'transition': 'all 0.3s ease',
											}}>
											{item.label}
										</Typography>
									</Box>
								))}
						</Box>
					)}
					<Box sx={{ display: 'flex', justifyContent: 'flex-end', flex: 1, alignItems: 'center', gap: 1 }}>
						<Button
							sx={{
								'fontFamily': 'Varela Round',
								'textTransform': 'capitalize',
								'fontSize': isMobileSizeSmall ? '0.7rem' : isMobileSize ? '0.85rem' : '1rem',
								'color': '#2C3E50',
								'border': '1px solid #2C3E50',
								'padding': isMobileSize ? '0.3rem 0.75rem' : '0.35rem 1.5rem',
								'borderRadius': { xs: '0.5rem', sm: '0.9rem', md: '1.1rem' },
								'&:hover': {
									backgroundColor: theme.bgColor?.greenPrimary,
									color: '#fff',
									transform: 'translateY(-2px)',
									boxShadow: '0 4px 12px rgba(44, 62, 80, 0.1)',
								},
								'transition': 'all 0.3s ease',
							}}
							onClick={() => navigate('/auth')}>
							Giriş Yap
						</Button>
					</Box>
				</Toolbar>
			</Box>
		</AppBar>
	);
};

export default Header;
