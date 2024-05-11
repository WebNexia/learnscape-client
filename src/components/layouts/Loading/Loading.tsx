import { Box, CircularProgress, Typography } from '@mui/material';
import theme from '../../../themes';
import { useContext } from 'react';
import { OrganisationContext } from '../../../contexts/OrganisationContextProvider';

const Loading = () => {
	const { organisation } = useContext(OrganisationContext);
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
				{organisation?.orgName}
			</Typography>
		</Box>
	);
};

export default Loading;
