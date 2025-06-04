import { Box, Container, Typography } from '@mui/material';
import { useContext } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import theme from '../../themes';
import { Instagram, WhatsApp } from '@mui/icons-material';

const Footer = () => {
	const { isVerySmallScreen, isSmallScreen, isRotated, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

	const fontFamilyLandingPage = "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important";

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'center',
				alignItems: 'center',
				height: '22vh',
				backgroundColor: theme.bgColor?.primary,
				position: 'relative',
				bottom: 0,
				width: '100%',
				backgroundImage: `radial-gradient(circle, rgba(52,73,94,0.3) 1px, transparent 1px)`,
				backgroundSize: '28px 28px',
			}}>
			<Container>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', padding: '0rem 5rem', maxWidth: '120rem', width: '100%' }}>
					<Box>
						<Typography variant='h4' sx={{ color: theme.textColor?.common.main, mb: '1rem', fontFamily: fontFamilyLandingPage }}>
							Kaizenglish
						</Typography>
						<Typography variant='body2' sx={{ color: theme.textColor?.common.main, fontFamily: fontFamilyLandingPage }}>
							275 New North Road,
						</Typography>
						<Typography variant='body2' sx={{ color: theme.textColor?.common.main, fontFamily: fontFamilyLandingPage }}>
							{' '}
							London, England, N1 7AA
						</Typography>

						<Box component='a' href='https://www.instagram.com/learnwithlondoner/' target='_blank' rel='noopener noreferrer'>
							<Instagram sx={{ color: theme.textColor?.common.main, mt: '0.75rem' }} />
						</Box>
					</Box>
					<Box>
						<Typography variant='h4' sx={{ color: theme.textColor?.common.main, mb: '1rem', fontFamily: fontFamilyLandingPage }}>
							{/* Contact Us */}
							İletişim
						</Typography>
						<Typography variant='body2' sx={{ color: theme.textColor?.common.main, fontFamily: fontFamilyLandingPage }}>
							info@kaizenglish.com
						</Typography>
						<Box
							component='a'
							href={`https://wa.me/447498163458?text=${encodeURIComponent('Feel free to ask us anything about our courses!')}`}
							target='_blank'
							rel='noopener noreferrer'
							sx={{ display: 'flex', alignItems: 'center', mt: '0.5rem', cursor: 'pointer' }}>
							<Typography variant='body2' sx={{ color: theme.textColor?.common.main, fontFamily: fontFamilyLandingPage }}>
								WhatsApp
							</Typography>
							<WhatsApp sx={{ ml: '0.25rem', color: theme.textColor?.greenSecondary.main }} fontSize='small' />
						</Box>
					</Box>
					<Box>
						<Typography variant='h4' sx={{ color: theme.textColor?.common.main, mb: '1rem', fontFamily: fontFamilyLandingPage }}>
							{/* Corporate */}
							Kurumsal
						</Typography>
						<Typography variant='body2' sx={{ color: theme.textColor?.common.main, fontFamily: fontFamilyLandingPage }}>
							{/* Terms of Service */}Kullanıcı Sözleşmesi
						</Typography>
						<Typography variant='body2' sx={{ color: theme.textColor?.common.main, fontFamily: fontFamilyLandingPage }}>
							{/* Privacy */}Gizlilik
						</Typography>
					</Box>
				</Box>
			</Container>
			<Box sx={{ display: 'flex', justifyContent: 'center', position: 'absolute', bottom: 1, width: '100%' }}>
				<Typography
					sx={{
						fontSize: isSmallScreen ? '0.55rem' : '0.75rem',
						color: theme.textColor?.common.main,
						fontFamily: fontFamilyLandingPage,
					}}>
					{/* &copy; 2025 Webnexia Software Solutions Ltd. All rights reserved. */}
					&copy; 2025 Webnexia Software Solutions Ltd. Tüm hakları saklıdır.
				</Typography>
			</Box>
		</Box>
	);
};

export default Footer;
