import { Typography } from '@mui/material';
import { useContext, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { UserCourseLessonDataContext } from '../contexts/UserCourseLessonDataContextProvider';

const Dashboard = () => {
	const { fetchUserCourseData, fetchUserLessonData } = useContext(UserCourseLessonDataContext);

	const { id } = useParams();

	useEffect(() => {
		if (id) {
			fetchUserCourseData(id);
			fetchUserLessonData(id);
		}
	}, []);

	return (
		<DashboardPagesLayout pageName='Dashboard'>
			<Typography variant='h3'>Coming Soon...</Typography>
		</DashboardPagesLayout>
	);
};

export default Dashboard;
