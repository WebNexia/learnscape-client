import { Box, Tab, Tabs } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { useState } from 'react';
import AdminPaymentsTab from '../components/layouts/payment/AdminPaymentsTab';
import AdminPromoCodesTab from '../components/layouts/promoCode/AdminPromoCodesTab';
import theme from '../themes';

const AdminPayments = () => {
	const [value, setValue] = useState<string>('Payments');
	const handleChange = (_: React.SyntheticEvent, newValue: string) => {
		setValue(newValue);
	};
	return (
		<DashboardPagesLayout pageName='Payments' customSettings={{ justifyContent: 'flex-start' }}>
			<Box>
				<Tabs
					value={value}
					onChange={handleChange}
					textColor='primary'
					indicatorColor='secondary'
					sx={{
						paddingTop: '1.5rem',
						'& .MuiTabs-indicator': {
							backgroundColor: theme.bgColor?.adminHeader, // Custom indicator color
						},
					}}>
					<Tab
						value='Payments'
						label='Payments'
						sx={{ '&.Mui-selected': { color: theme.bgColor?.adminHeader }, textTransform: 'capitalize', fontFamily: 'Poppins' }}
					/>
					<Tab
						value='PromoCodes'
						label='Promo Codes'
						sx={{ '&.Mui-selected': { color: theme.bgColor?.adminHeader, textTransform: 'capitalize', fontFamily: 'Poppins' } }}
					/>
				</Tabs>
			</Box>
			{value === 'Payments' && <AdminPaymentsTab />}
			{value === 'PromoCodes' && <AdminPromoCodesTab />}
		</DashboardPagesLayout>
	);
};

export default AdminPayments;
