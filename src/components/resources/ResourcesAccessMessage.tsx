import { Box, Typography } from '@mui/material';
import { useContext } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import { getResourcesAccessRequiredMessage } from '../../config/features';
import theme from '../../themes';

const ResourcesAccessMessage = () => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	return (
		<Box
			sx={{
				display: 'flex',
				flex: 1,
				alignItems: 'center',
				justifyContent: 'center',
				minHeight: '50vh',
				width: '100%',
				px: isMobileSize ? 2 : 4,
				mt: isMobileSize ? '2rem' : '4rem',
			}}>
			<Typography
				variant='body1'
				sx={{
					textAlign: 'center',
					maxWidth: '36rem',
					fontFamily: theme.fontFamily?.main || 'Varela Round, sans-serif',
					fontSize: isMobileSize ? '0.85rem' : '1rem',
					lineHeight: 1.6,
					color: theme.textColor?.error?.main ?? '#d32f2f',
				}}>
				{getResourcesAccessRequiredMessage()}
			</Typography>
		</Box>
	);
};

export default ResourcesAccessMessage;
