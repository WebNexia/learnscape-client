import { AppBar, Box, Button, IconButton, Toolbar, Typography, Badge } from '@mui/material';
import theme from '../../themes';
import { useLocation, useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import { useDocumentCart } from '../../contexts/DocumentCartContextProvider';
import { useConsultationCart } from '../../contexts/ConsultationCartContextProvider';
import logo from '../../assets/logo.png';
import { Menu, ShoppingCart } from '@mui/icons-material';
import LandingPageDrawer from '../landingPage/LandingPageDrawer';

const Header = () => {
	const { isVerySmallScreen, isSmallScreen, isRotated, isRotatedMedium, isMobileLandscape, isMobilePortrait, isTabletPortrait } =
		useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;
	const navigate = useNavigate();
	const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
	const location = useLocation();
	const { count: documentCartCount } = useDocumentCart();
	const { count: consultationCartCount } = useConsultationCart();
	const cartCount = documentCartCount + consultationCartCount;

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
			isActive: location.pathname === '/landing-page-courses',
		},
		{
			label: 'Kaynaklar',
			action: () => {
				navigate('/landing-page-resources');
				window.scrollTo({ top: 0, behavior: 'smooth' });
			},
			isActive: location.pathname === '/landing-page-resources',
		},
		{
			label: 'Danışmanlık',
			action: () => {
				navigate('/landing-page-consultations');
				window.scrollTo({ top: 0, behavior: 'smooth' });
			},
			isActive: location.pathname === '/landing-page-consultations',
		},
		{
			label: 'İletişim',
			action: () => {
				navigate('/contact-us');
				window.scrollTo({ top: 0, behavior: 'smooth' });
			},
			isActive: location.pathname === '/contact-us',
		},
		{
			label: 'Hakkımızda',
			action: () => {
				navigate('/about-us');
				window.scrollTo({ top: 0, behavior: 'smooth' });
			},
			isActive: location.pathname === '/about-us',
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
						height: isMobileLandscape
							? '10vh'
							: isMobilePortrait
								? '10vh'
								: isTabletPortrait
									? '10vh'
									: isSmallScreen
										? '10vh'
										: { md: '13vh', lg: '13vh' },
						background: 'linear-gradient(270deg, rgba(102, 126, 234, 0.5) 0%, rgba(118, 75, 162, 0.4) 50%, transparent 100%)',
						backdropFilter: 'blur(20px)',
						borderBottom: '1px solid rgba(91, 141, 239, 0.15)',
						boxShadow: '0 2px 20px rgba(91, 141, 239, 0.12)',
						position: 'fixed',
						top: 0,
						px: isMobileSizeSmall ? '0.35rem' : '0.75rem',
						transition: 'all 0.3s ease',
						zIndex: 1201,
					}}>
					<Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
						{(isSmallScreen || isRotatedMedium) && (
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

					{!(isSmallScreen || isRotatedMedium) && (
						<Box sx={{ display: 'flex', justifyContent: 'center', flex: 1 }}>
							{navItems
								?.filter((item) => item.label !== 'Ana Sayfa')
								?.map((item, index) => (
									<Box
										key={index}
										onClick={item.action}
										sx={{
											ml: index === 0 ? 0 : isSmallScreen ? '0.5rem' : '1rem',
											position: 'relative',
											cursor: 'pointer',
											'&::after': {
												content: '""',
												position: 'absolute',
												left: '50%',
												bottom: -4,
												height: 2,
												width: item.isActive ? '100%' : 0,
												background: item.isActive
													? 'linear-gradient(90deg, transparent, #ff7d55, #FF6B3D, #ff7d55, transparent)'
													: 'linear-gradient(90deg, transparent, #ff7d55 20%, #FF6B3D 50%, #ff7d55 80%, transparent)',
												borderRadius: 1,
												transform: 'translateX(-50%)',
												transition: 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
											},
											'&:hover::after': {
												width: '100%',
											},
										}}
									>
										<Typography
											sx={{
												fontFamily: 'Varela Round',
												color: item.isActive ? '#ff7d55' : '#0A1A2F',
												textDecoration: 'none',
												fontWeight: item.isActive ? 600 : 400,
												cursor: 'pointer',
												fontSize: isMobileSizeSmall ? '0.65rem' : isMobileSize ? '0.85rem' : '1.25rem',
												transition: 'color 0.25s ease',
											}}
										>
											{item.label}
										</Typography>
									</Box>
								))}
						</Box>
					)}
					<Box sx={{ display: 'flex', justifyContent: 'flex-end', flex: 1, alignItems: 'center', gap: 2.5 }}>
						<Badge
							badgeContent={cartCount}
							color="primary"
							invisible={cartCount === 0}
							anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
							sx={{
								'& .MuiBadge-badge': {
									fontSize: isMobileSizeSmall ? '0.6rem' : '0.7rem',
									width: isMobileSizeSmall ? 2 : 10,
									height: isMobileSizeSmall ? 16 : 18,
									padding: 0,
									borderRadius: '50%',
									top: isMobileSizeSmall ? 4 : 6,
									right: 6,
									transition: 'background-color 0.3s',
								},
								'&:hover .MuiBadge-badge': {
									backgroundColor: '#ff7d55',
								},
							}}
						>
							<IconButton
								onClick={() => navigate('/landing-page-cart')}
								sx={{
									color: theme.textColor?.primary?.main ?? '#0A1A2F',
									'&:hover': { backgroundColor: 'transparent' },
								}}
								aria-label="Sepet"
							>
								<ShoppingCart fontSize={isMobileSizeSmall ? 'small' : 'large'} sx={{ fontSize: isMobileSizeSmall ? '1.6rem' : '1.75rem' }} />
							</IconButton>
						</Badge>
						<Button
							sx={{
								'fontFamily': 'Varela Round',
								'textTransform': 'capitalize',
								'fontSize': isMobileSizeSmall ? '0.7rem' : isMobileSize ? '0.85rem' : '1rem',
								'color': '#FFFFFF',
								'background': 'linear-gradient(135deg, #FF6B3D 0%, #ff7d55 100%)',
								'padding': isMobileSize ? '0.4rem 1rem' : '0.5rem 1.75rem',
								'borderRadius': { xs: '0.75rem', sm: '1rem', md: '1.25rem' },
								'fontWeight': 500,
								'boxShadow': '0 4px 15px rgba(255, 107, 61, 0.35)',
								'&:hover': {
									background: 'linear-gradient(135deg, #ff7d55 0%, #FF6B3D 100%)',
									transform: 'translateY(-2px)',
									boxShadow: '0 6px 20px rgba(255, 107, 61, 0.45)',
								},
								'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
