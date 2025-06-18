import { Box, Typography } from '@mui/material';
import theme from '../../../themes';
import { SentimentVeryDissatisfied } from '@mui/icons-material';
import { useEffect } from 'react';

const LoadingError = () => {
	useEffect(() => {
		// Check if we have rate limit info
		const rateLimitInfo = localStorage.getItem('rateLimitInfo');
		if (rateLimitInfo) {
			// If we have rate limit info, redirect to rate limit error page
			// Only redirect if we're not already on the rate limit error page
			if (window.location.pathname !== '/rate-limit-error') {
				window.location.href = '/rate-limit-error';
			}
		}
	}, []);

	// Eğer rate limit sayfasındaysan, hiçbir şey gösterme
	if (window.location.pathname === '/rate-limit-error') {
		return null;
	}

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'center',
				alignItems: 'center',
				backgroundColor: theme.bgColor?.secondary,
				height: '100vh',
			}}>
			<Typography
				sx={{
					margin: '2rem',
					fontSize: '2rem',
					fontFamily: 'Poppins',
					fontWeight: 500,
					color: '#01435A',
				}}>
				Ooops, something went wrong!
			</Typography>
			<SentimentVeryDissatisfied fontSize='large' color='error' />
		</Box>
	);
};

export default LoadingError;
