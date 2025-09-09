import { Box, Typography } from '@mui/material';

import { useContext } from 'react';

import { InquiriesContext } from '../../../contexts/InquiriesContextProvider';

interface AdminInquiriesProps {
	inquiriesCount?: number;
}

const AdminInquiries = ({ inquiriesCount }: AdminInquiriesProps) => {
	const { totalItems } = useContext(InquiriesContext);

	// Use new dashboard data if available, otherwise fall back to context
	const displayCount = inquiriesCount !== undefined ? inquiriesCount : totalItems;

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
			<Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
				<Typography variant='h6'>Inquiries ({displayCount})</Typography>
				<Typography>&</Typography>
				<Typography variant='h6'>Bulk Email</Typography>
			</Box>
		</Box>
	);
};

export default AdminInquiries;
