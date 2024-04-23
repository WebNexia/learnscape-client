import { Box, CircularProgress, Typography } from '@mui/material';
import theme from '../../../themes';

const Loading = () => {
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
			<CircularProgress />
			<Typography
				sx={{
					margin: '2rem',
					fontSize: '2rem',
					fontFamily: 'Poppins',
					fontWeight: 500,
					color: '#01435A',
				}}>
				Loading...
			</Typography>
			<Typography
				sx={{
					fontSize: '4rem',
					fontFamily: 'Permanent Marker, cursive',
					color: '#01435A',
				}}>
				KAIZEN
			</Typography>
		</Box>
	);
};

export default Loading;
