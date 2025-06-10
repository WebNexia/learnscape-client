import { Box, Typography } from '@mui/material';

import { useContext } from 'react';

import { ContactRequestsContext } from '../../../contexts/ContactRequestsContextProvider';
import { InfoOutlined } from '@mui/icons-material';
import theme from '../../../themes';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

const AdminContactRequests = () => {
	const { isRotated, isSmallScreen } = useContext(MediaQueryContext);

	const isMobileSize: boolean = isSmallScreen || isRotated;
	const { contactRequests } = useContext(ContactRequestsContext);

	return (
		<Box
			sx={{
				'display': 'flex',
				'flexDirection': 'column',
				'alignItems': 'center',
				'boxShadow': '0.1rem 0.3rem 0.3rem 0.3rem rgba(0,0,0,0.2)',
				'padding': '1rem',
				'borderRadius': '0.35rem',
				'height': '12rem',
				'cursor': 'pointer',
				'transition': '0.3s',
				':hover': {
					boxShadow: '0rem 0.1rem 0.2rem 0.1rem rgba(0,0,0,0.3)',
				},
			}}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
				<Typography variant='h6'>Contact Requests</Typography>
				<InfoOutlined sx={{ ml: '0.5rem', color: theme.textColor?.greenPrimary.main }} fontSize={isMobileSize ? 'small' : 'medium'} />
			</Box>
			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '7rem' }}>
				<Typography variant='h6' sx={{ fontSize: '1.75rem', textAlign: 'center' }}>
					{contactRequests.length}
				</Typography>
			</Box>
		</Box>
	);
};

export default AdminContactRequests;
