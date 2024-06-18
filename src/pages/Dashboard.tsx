import { Typography } from '@mui/material';
import { useContext, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { UserCourseLessonDataContext } from '../contexts/UserCourseLessonDataContextProvider';

const Dashboard = () => {
	return (
		<DashboardPagesLayout pageName='Dashboard'>
			<Typography variant='h3'>Coming Soon...</Typography>
		</DashboardPagesLayout>
	);
};

export default Dashboard;
