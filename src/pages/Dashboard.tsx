import { Alert, Snackbar, Typography } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardPagesLayout from '../components/layouts/Dashboard Layout/DashboardPagesLayout';
import { UserCourseLessonDataContext } from '../contexts/UserCourseLessonDataContextProvider';

const Dashboard = () => {
	const navigate = useNavigate();
	const [signedUpMsg, setSignedUpMsg] = useState<boolean>(false);

	const { fetchUserCourseData, fetchUserLessonData } = useContext(UserCourseLessonDataContext);

	const vertical = 'top';
	const horizontal = 'center';

	const { id } = useParams();

	useEffect(() => {
		if (localStorage.getItem('signedup')) {
			localStorage.removeItem('signedup');
			setSignedUpMsg(true);
		}

		if (id) {
			fetchUserCourseData(id);
			fetchUserLessonData(id);
		}
	}, []);

	useEffect(() => {
		if (!localStorage.getItem('user_token')) {
			navigate('/auth');
		}
	}, []);

	return (
		<DashboardPagesLayout pageName='Dashboard'>
			<Snackbar open={signedUpMsg} autoHideDuration={4000} onClose={() => setSignedUpMsg(false)} anchorOrigin={{ vertical, horizontal }}>
				<Alert onClose={() => setSignedUpMsg(false)} severity='success' sx={{ width: '100%' }}>
					You successfully signed up!
				</Alert>
			</Snackbar>
			<Typography variant='h3'>Coming Soon...</Typography>
		</DashboardPagesLayout>
	);
};

export default Dashboard;
