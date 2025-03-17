import { Box, Typography } from '@mui/material';
import { useContext } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import theme from '../../themes';
import { Instagram, WhatsApp } from '@mui/icons-material';

const Footer = () => {
	const { isVerySmallScreen, isSmallScreen, isRotated, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				height: '27.5vh',
				backgroundColor: theme.bgColor?.primary,
				position: 'relative',
				bottom: 0,
				width: '100%',
			}}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', padding: '2rem 8rem' }}>
				<Box>
					<Typography variant='h4' sx={{ color: theme.textColor?.common.main, mb: '1rem' }}>
						Kaizenglish
					</Typography>
					<Typography sx={{ color: theme.textColor?.common.main }}>275 New North Road,</Typography>
					<Typography sx={{ color: theme.textColor?.common.main }}> London, England, N1 7AA</Typography>

					<Box component='a' href='https://www.instagram.com/learnwithlondoner/' target='_blank' rel='noopener noreferrer'>
						<Instagram sx={{ color: theme.textColor?.common.main, mt: '1rem' }} />
					</Box>
				</Box>
				<Box>
					<Typography variant='h4' sx={{ color: theme.textColor?.common.main, mb: '1rem' }}>
						Contact Us
					</Typography>
					<Typography sx={{ color: theme.textColor?.common.main }}>info@kaizenglish.com</Typography>
					<Box
						component='a'
						href={`https://wa.me/447498163458?text=${encodeURIComponent('Feel free to ask us anything about our courses!')}`}
						target='_blank'
						rel='noopener noreferrer'
						sx={{ display: 'flex', alignItems: 'center', mt: '0.5rem', cursor: 'pointer' }}>
						<Typography sx={{ color: theme.textColor?.common.main }}>WhatsApp</Typography>
						<WhatsApp sx={{ ml: '0.75rem', color: theme.textColor?.greenSecondary.main }} fontSize='small' />
					</Box>
				</Box>
				<Box>
					<Typography variant='h4' sx={{ color: theme.textColor?.common.main, mb: '1rem' }}>
						Kurumsal
					</Typography>
					<Typography sx={{ color: theme.textColor?.common.main }}>Kullanıcı Sözleşmesi</Typography>
					<Typography sx={{ color: theme.textColor?.common.main }}> Gizlilik</Typography>
				</Box>
			</Box>
			<Box sx={{ display: 'flex', justifyContent: 'center', position: 'absolute', bottom: 1, width: '100%' }}>
				<Typography sx={{ fontSize: isSmallScreen ? '0.55rem' : '0.75rem', color: theme.textColor?.common.main }}>
					&copy; 2025 Webnexia Software Solutions Ltd. All rights reserved.
				</Typography>
			</Box>
		</Box>
	);
};

export default Footer;
