import { Box, Typography } from '@mui/material';
import { useContext } from 'react';
import { PaymentsContext } from '../../../contexts/PaymentsContextProvider';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

const AdminPayment = () => {
	const { totalPaymentAmountGBP, totalNumberOfPayments } = useContext(PaymentsContext);
	const { isRotatedMedium, isSmallScreen } = useContext(MediaQueryContext);

	const isMobileSize: boolean = isSmallScreen || isRotatedMedium;
	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				boxShadow: '0.1rem 0.3rem 0.3rem 0.3rem rgba(0,0,0,0.2)',
				height: '26rem',
				padding: '1rem',
				borderRadius: '0.35rem',
				transition: '0.3s',
				':hover': {
					boxShadow: '0rem 0.1rem 0.2rem 0.1rem rgba(0,0,0,0.3)',
				},
			}}>
			<Box sx={{ flex: 1 }}>
				<Typography variant={isMobileSize ? 'h6' : 'h5'}>Payment Summary</Typography>
			</Box>
			<Box sx={{ display: 'flex', alignItems: 'center', flex: 8 }}>
				<Typography variant='h2' sx={{ fontSize: isMobileSize ? '3rem' : '4rem' }}>
					£{totalPaymentAmountGBP}
				</Typography>
			</Box>
			<Box sx={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
				<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.8rem' : '0.9rem', margin: '1rem 0 0 1rem' }}>
					Total Number of Payments: {totalNumberOfPayments}
				</Typography>
			</Box>
		</Box>
	);
};

export default AdminPayment;
