import { Box, Tab, Tabs } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import AdminPageErrorBoundary from '../components/error/AdminPageErrorBoundary';
import { useContext, useState, useEffect } from 'react';
import AdminPaymentsTab from '../components/layouts/payment/AdminPaymentsTab';
import AdminPromoCodesTab from '../components/layouts/promoCode/AdminPromoCodesTab';
import AdminSubscriptionsTab from '../components/layouts/subscription/AdminSubscriptionsTab';
import theme from '../themes';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import { PaymentsContext } from '../contexts/PaymentsContextProvider';
import { PromoCodesContext } from '../contexts/PromoCodesContextProvider';
import { SubscriptionsContext } from '../contexts/SubscriptionsContextProvider';

const AdminPayments = () => {
	const [value, setValue] = useState<string>('Payments');
	const handleChange = (_: React.SyntheticEvent, newValue: string) => {
		setValue(newValue);
	};

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	// Get context functions to enable fetching
	const { enablePaymentsFetch } = useContext(PaymentsContext);
	const { enablePromoCodesFetch } = useContext(PromoCodesContext);
	const { enableSubscriptionsFetch } = useContext(SubscriptionsContext);

	// Enable data fetching when component mounts
	useEffect(() => {
		enablePaymentsFetch(); // 👈 Enable payments fetching when component mounts
		enablePromoCodesFetch(); // 👈 Enable promo codes fetching when component mounts
		enableSubscriptionsFetch(); // 👈 Enable subscriptions fetching when component mounts
	}, []);

	return (
		<AdminPageErrorBoundary pageName='Payments'>
			<DashboardPagesLayout pageName='Payments' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
				{/* Sticky Tabs */}
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'row',
						justifyContent: 'center',
						position: 'fixed',
						top: isMobileSize ? '3.5rem' : '4rem', // Account for DashboardHeader height
						left: isMobileSize ? 0 : '10rem', // Account for sidebar width on desktop
						right: 0,
						zIndex: 100, // Higher z-index to ensure it's above all content
						backgroundColor: theme.bgColor?.secondary,
						backdropFilter: 'blur(10px)',
						width: isMobileSize ? '100%' : 'calc(100% - 10rem)',
					}}>
					<Tabs
						value={value}
						onChange={handleChange}
						textColor='primary'
						indicatorColor='secondary'
						sx={{
							'paddingTop': isMobileSize ? '0.5rem' : '0.25rem',
							'paddingLeft': isMobileSize ? '1rem' : '2rem',
							'paddingRight': isMobileSize ? '1rem' : '2rem',
							'& .MuiTabs-indicator': {
								backgroundColor: theme.bgColor?.adminHeader,
							},
						}}>
						<Tab
							value='Payments'
							label='Payments'
							sx={{
								'&.Mui-selected': { color: theme.bgColor?.adminHeader },
								'textTransform': 'capitalize',
								'fontFamily': 'Poppins',
								'fontSize': isMobileSize ? '0.75rem' : undefined,
								'&.MuiTab-root': { textTransform: 'capitalize' },
							}}
						/>
						<Tab
							value='Subscriptions'
							label='Subscriptions'
							sx={{
								'&.Mui-selected': { color: theme.bgColor?.adminHeader },
								'textTransform': 'capitalize',
								'fontFamily': 'Poppins',
								'fontSize': isMobileSize ? '0.75rem' : undefined,
								'&.MuiTab-root': { textTransform: 'capitalize' },
							}}
						/>
						<Tab
							value='PromoCodes'
							label='Promo Codes'
							sx={{
								'&.Mui-selected': { color: theme.bgColor?.adminHeader },
								'textTransform': 'capitalize',
								'fontFamily': 'Poppins',
								'fontSize': isMobileSize ? '0.75rem' : undefined,
								'&.MuiTab-root': { textTransform: 'capitalize' },
							}}
						/>
					</Tabs>
				</Box>

				{/* Spacer to push content down when sticky */}
				<Box
					sx={{
						height: '5rem', // Account for tabs height
						width: '100%',
					}}
				/>

				{/* Content */}
				<Box sx={{ padding: '0rem', width: '100%' }}>
					{value === 'Payments' && <AdminPaymentsTab />}
					{value === 'Subscriptions' && <AdminSubscriptionsTab />}
					{value === 'PromoCodes' && <AdminPromoCodesTab />}
				</Box>
			</DashboardPagesLayout>
		</AdminPageErrorBoundary>
	);
};

export default AdminPayments;
