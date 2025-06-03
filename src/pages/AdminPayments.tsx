import { Box, Tab, Tabs } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { useContext, useState } from 'react';
import AdminPaymentsTab from '../components/layouts/payment/AdminPaymentsTab';
import AdminPromoCodesTab from '../components/layouts/promoCode/AdminPromoCodesTab';
import theme from '../themes';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';

const AdminPayments = () => {
	const [value, setValue] = useState<string>('Payments');
	const handleChange = (_: React.SyntheticEvent, newValue: string) => {
		setValue(newValue);
	};

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	return (
		<DashboardPagesLayout pageName='Payments' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
			<Box>
				<Tabs
					value={value}
					onChange={handleChange}
					textColor='primary'
					indicatorColor='secondary'
					sx={{
						'paddingTop': isMobileSize ? '0.75rem' : '1.5rem',
						'& .MuiTabs-indicator': {
							backgroundColor: theme.bgColor?.adminHeader, // Custom indicator color
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
							'&.MuiTab-root': { textTransform: 'capitalize' }, // Ensure capitalization
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
							'&.MuiTab-root': { textTransform: 'capitalize' }, // Ensure capitalization
						}}
					/>
				</Tabs>
			</Box>
			{value === 'Payments' && <AdminPaymentsTab />}
			{value === 'PromoCodes' && <AdminPromoCodesTab />}
		</DashboardPagesLayout>
	);
};

export default AdminPayments;
