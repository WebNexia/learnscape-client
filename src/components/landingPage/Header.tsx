import { AppBar, Box, Button, IconButton, Toolbar, Typography, Badge } from '@mui/material';
import theme from '../../themes';
import { useLocation, useNavigate } from 'react-router-dom';
import { useContext, useState, useEffect, Fragment } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import { useDocumentCart } from '../../contexts/DocumentCartContextProvider';
import { useConsultationCart } from '../../contexts/ConsultationCartContextProvider';
import logo from '../../assets/logo.png';
import {
	Menu,
	ShoppingCart,
	SchoolOutlined,
	MenuBookOutlined,
	GroupsOutlined,
	MailOutline,
	InfoOutlined,
} from '@mui/icons-material';
import LandingPageDrawer from '../landingPage/LandingPageDrawer';

const Header = () => {
	const { isVerySmallScreen, isSmallScreen, isRotated, isRotatedMedium, isMobileLandscape, isMobilePortrait, isTabletPortrait } =
		useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;
	const navigate = useNavigate();
	const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
	const [isScrolled, setIsScrolled] = useState<boolean>(false);
	const location = useLocation();

	useEffect(() => {
		const handleScroll = () => setIsScrolled(window.scrollY > 10);
		handleScroll();
		window.addEventListener('scroll', handleScroll, { passive: true });
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);
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
			NavIcon: SchoolOutlined,
			action: () => {
				navigate('/landing-page-courses');
				window.scrollTo({ top: 0, behavior: 'smooth' });
			},
			isActive: location.pathname === '/landing-page-courses',
		},
		{
			label: 'Kaynaklar',
			NavIcon: MenuBookOutlined,
			action: () => {
				navigate('/landing-page-resources');
				window.scrollTo({ top: 0, behavior: 'smooth' });
			},
			isActive: location.pathname === '/landing-page-resources',
		},
		{
			label: 'Danışmanlık',
			NavIcon: GroupsOutlined,
			action: () => {
				navigate('/landing-page-consultations');
				window.scrollTo({ top: 0, behavior: 'smooth' });
			},
			isActive: location.pathname === '/landing-page-consultations',
		},
		{
			label: 'İletişim',
			NavIcon: MailOutline,
			action: () => {
				navigate('/contact-us');
				window.scrollTo({ top: 0, behavior: 'smooth' });
			},
			isActive: location.pathname === '/contact-us',
		},
		{
			label: 'Hakkımızda',
			NavIcon: InfoOutlined,
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
						backgroundColor: isScrolled ? '#FFFFFF' : 'transparent',
						boxShadow: isScrolled ? '0 1px 8px rgba(0, 0, 0, 0.04)' : 'none',
						borderBottom: isScrolled ? '1px solid rgba(0, 0, 0, 0.04)' : '1px solid transparent',
						position: 'fixed',
						top: 0,
						px: isMobileSizeSmall ? '0.35rem' : '0.75rem',
						transition: 'background-color 250ms ease, box-shadow 250ms ease, border-color 250ms ease',
						zIndex: 1201,
					}}>
					<Box sx={{ display: 'flex', alignItems: 'center', flex: '0 0 auto' }}>
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
						<Box
							sx={{
								'@keyframes navSpectrum': {
									'0%': { backgroundPosition: '0% 50%' },
									'100%': { backgroundPosition: '200% 50%' },
								},
								'@keyframes navDiamondPulse': {
									'0%, 100%': { opacity: 0.55, transform: 'rotate(45deg) scale(1)' },
									'50%': { opacity: 1, transform: 'rotate(45deg) scale(1.08)' },
								},
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'center',
								flex: '1 1 auto',
								minWidth: 0,
								flexWrap: 'nowrap',
								gap: { md: 1, lg: 1.75 },
								px: { md: 0.5, lg: 1 },
							}}>
							{navItems
								?.filter((item) => item.label !== 'Ana Sayfa')
								?.map((item, index) => {
									const NavIcon = 'NavIcon' in item && item.NavIcon ? item.NavIcon : null;
									const staggerY = index % 2 === 0 ? 0 : 2;
									return (
										<Fragment key={item.label}>
											{index > 0 && (
												<Box
													aria-hidden
													sx={{
														width: 5,
														height: 5,
														alignSelf: 'center',
														flexShrink: 0,
														transform: 'rotate(45deg)',
														borderRadius: '1px',
														background: 'linear-gradient(135deg, rgba(255,107,61,0.85) 0%, rgba(1,67,90,0.75) 100%)',
														boxShadow: '0 0 14px rgba(255,107,61,0.35)',
														animation: 'navDiamondPulse 3.2s ease-in-out infinite',
														animationDelay: `${index * 0.35}s`,
													}}
												/>
											)}
											<Box
												onClick={item.action}
												role='button'
												tabIndex={0}
												onKeyDown={(e) => {
													if (e.key === 'Enter' || e.key === ' ') {
														e.preventDefault();
														item.action();
													}
												}}
												sx={{
													display: 'inline-flex',
													alignItems: 'center',
													gap: { md: 0.35, lg: 0.45 },
													flexShrink: 0,
													cursor: 'pointer',
													position: 'relative',
													zIndex: 0,
													py: 0.5,
													px: { md: 0.25, lg: 0.4 },
													transform: `translateY(${staggerY}px)`,
													transition: 'transform 0.28s cubic-bezier(0.34, 1.2, 0.64, 1)',
													'&::before': {
														content: '""',
														position: 'absolute',
														left: '50%',
														bottom: -2,
														width: '140%',
														height: '160%',
														transform: 'translateX(-50%)',
														background:
															'radial-gradient(ellipse 80% 70% at 50% 85%, rgba(255,107,61,0.2) 0%, rgba(30,194,139,0.06) 45%, transparent 72%)',
														opacity: 0,
														transition: 'opacity 0.4s ease',
														pointerEvents: 'none',
														zIndex: -1,
													},
													'&::after': {
														content: '""',
														position: 'absolute',
														left: '50%',
														bottom: 0,
														height: 3,
														width: item.isActive ? '100%' : 0,
														maxWidth: '100%',
														background:
															'linear-gradient(90deg, #01435A, #1EC28B, #FF6B3D, #ff9a6b, #FF6B3D, #01435A)',
														backgroundSize: '220% 100%',
														borderRadius: 2,
														transform: 'translateX(-50%)',
														opacity: item.isActive ? 1 : 0,
														transition: 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
														animation: item.isActive ? 'navSpectrum 4s ease infinite' : 'none',
													},
													'&:hover': {
														transform: `translateY(${staggerY - 3}px)`,
													},
													'&:hover::before': {
														opacity: 1,
													},
													'&:hover::after': {
														width: '100%',
														opacity: 1,
														animation: 'navSpectrum 2.4s ease infinite',
													},
													'&:hover .nav-link-icon': {
														color: '#FF6B3D',
														transform: 'rotate(-6deg) scale(1.07)',
														filter: 'drop-shadow(0 0 10px rgba(255,107,61,0.45))',
													},
													'&:hover .nav-link-label': {
														backgroundImage:
															'linear-gradient(95deg, #01435A 0%, #0d7a6a 28%, #1EC28B 42%, #FF6B3D 72%, #ff9a6b 100%)',
														backgroundClip: 'text',
														WebkitBackgroundClip: 'text',
														WebkitTextFillColor: 'transparent',
														color: 'transparent',
														letterSpacing: '0.045em',
													},
													'&:focus-visible': {
														outline: '2px solid #FF6B3D',
														outlineOffset: 4,
														borderRadius: 0.5,
													},
													'&:active': {
														transform: `translateY(${staggerY}px)`,
													},
												}}
											>
												{NavIcon && (
													<NavIcon
														className='nav-link-icon'
														sx={{
															fontSize: { md: '1.02rem', lg: '1.12rem' },
															color: item.isActive ? '#FF6B3D' : '#01435A',
															opacity: item.isActive ? 1 : 0.9,
															transition:
																'color 0.28s ease, transform 0.35s cubic-bezier(0.34, 1.2, 0.64, 1), filter 0.35s ease, opacity 0.25s ease',
															...(item.isActive && {
																filter: 'drop-shadow(0 0 8px rgba(255,107,61,0.35))',
															}),
														}}
													/>
												)}
												<Typography
													className='nav-link-label'
													sx={{
														fontFamily: 'Varela Round',
														fontWeight: item.isActive ? 700 : 600,
														fontSize: { md: '0.84rem', lg: '0.94rem' },
														lineHeight: 1.2,
														whiteSpace: 'nowrap',
														display: 'inline-block',
														transition: 'letter-spacing 0.3s ease, color 0.25s ease',
														...(item.isActive
															? {
																	backgroundImage:
																		'linear-gradient(95deg, #a32a0c 0%, #FF6B3D 38%, #ff9a6b 100%)',
																	backgroundClip: 'text',
																	WebkitBackgroundClip: 'text',
																	WebkitTextFillColor: 'transparent',
																	color: 'transparent',
																	letterSpacing: '0.035em',
																}
															: {
																	color: '#0A1A2F',
																}),
													}}
												>
													{item.label}
												</Typography>
											</Box>
										</Fragment>
									);
								})}
						</Box>
					)}
					<Box sx={{ display: 'flex', justifyContent: 'flex-end', flex: '0 0 auto', alignItems: 'center', gap: 2.5 }}>
						<Badge
							badgeContent={cartCount}
							color="primary"
							invisible={cartCount === 0}
							anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
							sx={{
								'& .MuiBadge-badge': {
									fontSize: isMobileSizeSmall ? '0.5rem' : '0.55rem',
									minWidth: isMobileSizeSmall ? 12 : 14,
									height: isMobileSizeSmall ? 12 : 14,
									padding: 0,
									borderRadius: '50%',
									top: isMobileSizeSmall ? 8 : 8,
									right: isMobileSizeSmall ? 8 : 8,
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
								'background': '#FF6B3D',
								'padding': isMobileSize ? '0.4rem 1rem' : '0.5rem 1.75rem',
								'borderRadius': { xs: '0.75rem', sm: '1rem', md: '1.25rem' },
								'fontWeight': 500,
								'boxShadow': '0 4px 15px rgba(255, 107, 61, 0.35)',
								'&:hover': {
									background: '#ff7d55',
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
