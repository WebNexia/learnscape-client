import { Box, Typography } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { useContext } from 'react';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';

const AdminDashboard = () => {
	const { organisation } = useContext(OrganisationContext);

	return (
		<DashboardPagesLayout pageName='Dashboard' customSettings={{ justifyContent: 'flex-start' }}>
			<Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
				<Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', padding: '2rem' }}>
					<Typography variant='h4' sx={{ boxShadow: '0 0 0.3rem 0 rgba(0,0,0,0.2)', padding: '1rem' }}>
						Organisation Code: {organisation?.orgCode}
					</Typography>
				</Box>
				<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
					<Typography variant='h3'>Coming Soon...</Typography>
				</Box>
			</Box>
		</DashboardPagesLayout>
	);
};

export default AdminDashboard;
