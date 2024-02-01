import { Alert, Box, Snackbar, Typography } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useQuery } from 'react-query';
import DashboardPagesLayout from '../components/layouts/DashboardLayout/DashboardPagesLayout';
import { UserCoursesIdsContext } from '../contexts/UserCoursesIdsContextProvider';

const Dashboard = () => {
	const navigate = useNavigate();
	const [signedUpMsg, setSignedUpMsg] = useState<boolean>(false);

	const { fetchCourseIds } = useContext(UserCoursesIdsContext);

	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const vertical = 'top';
	const horizontal = 'center';

	const { id } = useParams();

	useEffect(() => {
		if (localStorage.getItem('signedup')) {
			localStorage.removeItem('signedup');
			setSignedUpMsg(true);
		}

		if (id) fetchCourseIds(id);
	}, []);

	useEffect(() => {
		if (!localStorage.getItem('user_token')) {
			navigate('/auth');
		}
	}, []);

	const { data, isLoading, isError } = useQuery('userData', async () => {
		const response = await axios.get(`${base_url}/users/${id}`);

		if (!localStorage.getItem('username') && !localStorage.getItem('imageUrl')) {
			localStorage.setItem('username', response.data.data[0].username);
			localStorage.setItem('imageUrl', response.data.data[0].imageUrl);
		}

		return response.data.data[0];
	});

	if (isLoading) {
		return <Box>Loading...</Box>;
	}

	if (isError) {
		return <Box>Error fetching data</Box>;
	}

	return (
		<DashboardPagesLayout pageName='Dashboard'>
			<Snackbar
				open={signedUpMsg}
				autoHideDuration={4000}
				onClose={() => setSignedUpMsg(false)}
				anchorOrigin={{ vertical, horizontal }}>
				<Alert onClose={() => setSignedUpMsg(false)} severity='success' sx={{ width: '100%' }}>
					You successfully signed up!
				</Alert>
			</Snackbar>
			<Typography variant='h3'>Coming Soon...</Typography>
		</DashboardPagesLayout>
	);
};

export default Dashboard;
