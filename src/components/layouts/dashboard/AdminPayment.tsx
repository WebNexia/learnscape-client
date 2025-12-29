import { Box, Typography } from '@mui/material';
import { useContext } from 'react';

import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

interface AdminPaymentProps {
	// Owner-specific props
	ownerIncome?: number;
	ownerIncomeFromPayments?: number;
	ownerIncomeFromSubscriptions?: number;
	// Super-admin-specific props
	superAdminIncome?: number;
	superAdminIncomeFromPayments?: number;
	superAdminIncomeFromSubscriptions?: number;
	// Common props
	totalPayments?: number;
}

const AdminPayment = ({
	ownerIncome,
	ownerIncomeFromPayments,
	ownerIncomeFromSubscriptions,
	superAdminIncome,
	superAdminIncomeFromPayments,
	superAdminIncomeFromSubscriptions,
	totalPayments,
}: AdminPaymentProps) => {
	const { isRotatedMedium, isSmallScreen } = useContext(MediaQueryContext);

	const isMobileSize: boolean = isSmallScreen || isRotatedMedium;

	// Determine which income to show based on what's provided
	const yourIncome = ownerIncome !== undefined ? ownerIncome : superAdminIncome !== undefined ? superAdminIncome : 0;
	const incomeFromPayments =
		ownerIncomeFromPayments !== undefined ? ownerIncomeFromPayments : superAdminIncomeFromPayments !== undefined ? superAdminIncomeFromPayments : 0;
	const incomeFromSubscriptions =
		ownerIncomeFromSubscriptions !== undefined
			? ownerIncomeFromSubscriptions
			: superAdminIncomeFromSubscriptions !== undefined
				? superAdminIncomeFromSubscriptions
				: 0;

	return (
		<Box
			sx={{
				'display': 'flex',
				'flexDirection': 'column',
				'alignItems': 'center',
				'boxShadow': '0.1rem 0.3rem 0.3rem 0.3rem rgba(0,0,0,0.2)',
				'height': '26rem',
				'padding': '1rem',
				'borderRadius': '0.35rem',
				'transition': '0.3s',
				':hover': {
					boxShadow: '0rem 0.1rem 0.2rem 0.1rem rgba(0,0,0,0.3)',
				},
			}}>
			<Box sx={{ flex: 1 }}>
				<Typography variant={isMobileSize ? 'h6' : 'h5'}>Your Income</Typography>
			</Box>
			<Box sx={{ display: 'flex', alignItems: 'center', flex: 6 }}>
				<Typography variant='h2' sx={{ fontSize: isMobileSize ? '2.5rem' : '3.5rem' }}>
					{yourIncome ? `£${yourIncome.toFixed(2)}` : '£0.00'}
				</Typography>
			</Box>

			<Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', width: '100%', flex: 3, gap: '0.25rem' }}>
				<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.8rem', margin: '0.25rem 0 0 1rem' }}>
					From Payments: £{incomeFromPayments.toFixed(2)}
				</Typography>
				<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.8rem', margin: '0.25rem 0 0 1rem' }}>
					From Subscriptions: £{incomeFromSubscriptions.toFixed(2)}
				</Typography>
				<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.8rem', margin: '0.5rem 0 0 1rem' }}>
					Total Payments: {totalPayments || 0}
				</Typography>
			</Box>
		</Box>
	);
};

export default AdminPayment;
