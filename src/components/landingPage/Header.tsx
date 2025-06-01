import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material';
import theme from '../../themes';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import logo from '../../assets/logo.png';

const Header = ({ coursesRef }: { coursesRef: React.RefObject<HTMLDivElement> }) => {
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

	const { isVerySmallScreen, isSmallScreen, isRotated, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;
	const navigate = useNavigate();

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
					<Box
						sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '33%', cursor: 'pointer', }}
						onClick={() => navigate('/')}>
					
						<img src={logo} alt='logo' style={{height: '11vh' }} />
					</Box>
					<Box sx={{ display: 'flex', justifyContent: 'center', width: '33%' }}>
						<Box>
							<Typography
								variant='h4'
								onClick={handleScrollToCourses}
								sx={{
									'fontFamily': 'tahoma',
									'color': theme.textColor?.primary.main,
									':hover': {
										color: '#3498DB',
										textDecoration: 'underline',
									},
									'cursor': 'pointer',
									'fontSize': isMobileSizeSmall ? '0.65rem' : isMobileSize ? '0.85rem' : undefined,
									'transition': 'all 0.3s ease',
								}}>
								{/* Courses */}
								Kurslar
							</Typography>
						</Box>
						<Box>
							<Typography
								variant='h4'
								sx={{
									'fontFamily': 'Varela Round',
									'color': theme.textColor?.primary.main,
									':hover': {
										color: '#3498DB',
										textDecoration: 'underline',
									},
									'cursor': 'pointer',
									'fontSize': isMobileSizeSmall ? '0.65rem' : isMobileSize ? '0.85rem' : undefined,
									'paddingLeft': isVerySmallScreen ? '0.5rem' : '1.25rem',
									'transition': 'all 0.3s ease',
								}}>
								{/* News */}
								Blog
							</Typography>
						</Box>
						<Box onClick={() => navigate('/resources')}>
							<Typography
								variant='h4'
								sx={{
									'fontFamily': 'Varela Round',
									'color': theme.textColor?.primary.main,
									':hover': {
										color: '#3498DB',
										textDecoration: 'underline',
									},
									'cursor': 'pointer',
									'fontSize': isMobileSizeSmall ? '0.65rem' : isMobileSize ? '0.85rem' : undefined,
									'paddingLeft': isVerySmallScreen ? '0.5rem' : '1.25rem',
									'transition': 'all 0.3s ease',
								}}>
								{/* Resources */}
								Kaynaklar
							</Typography>
						</Box>
					</Box>
					<Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '33%' }}>
						<Button
							sx={{
								'fontFamily': 'Varela Round',
								'textTransform': 'capitalize',
								'fontSize': isMobileSizeSmall ? '0.7rem' : isMobileSize ? '0.85rem' : '1rem',
								'color': '#2C3E50',
								'border': '1px solid #2C3E50',
								'padding': isMobileSizeSmall ? '0.1rem 0.2rem' : '0.5rem 1.75rem',
								'borderRadius': '1rem',
								':hover': {
									backgroundColor: theme.bgColor?.greenPrimary,
									color: '#fff',
									transform: 'translateY(-2px)',
									boxShadow: '0 4px 12px rgba(44, 62, 80, 0.1)',
								},
								'transition': 'all 0.3s ease',
							}}
							onClick={() => navigate('/auth')}>
							{/* Login */}
							Giriş Yap
						</Button>
					</Box>
				</Toolbar>
			</Box>
		</AppBar>
	);
};

export default Header;
