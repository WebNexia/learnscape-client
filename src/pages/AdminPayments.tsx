import { Box, Tab, Tabs } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { useState } from 'react';
import AdminPaymentsTab from '../components/layouts/payment/AdminPaymentsTab';
import AdminPromoCodesTab from '../components/layouts/promoCode/AdminPromoCodesTab';

const AdminPayments = () => {
	const [value, setValue] = useState<string>('Payments');
	const handleChange = (_: React.SyntheticEvent, newValue: string) => {
		setValue(newValue);
	};
	return (
		<DashboardPagesLayout pageName='Payments' customSettings={{ justifyContent: 'flex-start' }}>
			<Box>
				<Tabs value={value} onChange={handleChange} textColor='primary' indicatorColor='primary' sx={{ textTransform: 'capitalize' }}>
					<Tab value='Payments' label='Payments' />
					<Tab value='PromoCodes' label='Promo Codes' />
				</Tabs>
			</Box>
			{value === 'Payments' && <AdminPaymentsTab />}
			{value === 'PromoCodes' && <AdminPromoCodesTab />}
		</DashboardPagesLayout>
	);
};

export default AdminPayments;
