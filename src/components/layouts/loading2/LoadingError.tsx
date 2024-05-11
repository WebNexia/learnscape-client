import { Box, Typography } from '@mui/material';
import theme from '../../../themes';
import { SentimentVeryDissatisfied } from '@mui/icons-material';

const LoadingError = () => {
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
