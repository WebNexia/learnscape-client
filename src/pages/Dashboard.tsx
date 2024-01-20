import { Alert, Box, Snackbar } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import theme from '../themes';
import axios from 'axios';
import { useQuery } from 'react-query';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/DashboardHeader';

const Dashboard = () => {
	const navigate = useNavigate();
	const [signedUpMsg, setSignedUpMsg] = useState<boolean>(false);

	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const vertical = 'top';
	const horizontal = 'center';

	const { id } = useParams();

	useEffect(() => {
		if (localStorage.getItem('signedup')) {
			localStorage.removeItem('signedup');
			setSignedUpMsg(true);
		}
	}, []);

	useEffect(() => {
		if (!localStorage.getItem('user_token')) {
			navigate('/auth');
		}
	}, []);

	const { data, isLoading, isError } = useQuery('userData', async () => {
		const response = await axios.get(`${base_url}/users/${id}`);
		return response.data.data[0];
	});

	if (isLoading) {
		return <Box>Loading...</Box>;
	}

	if (isError) {
		return <Box>Error fetching data</Box>;
	}

	return (
		<Box
			sx={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				backgroundColor: theme.palette.secondary.main,
				minHeight: '100vh',
				position: 'relative',
			}}>
			<Snackbar
				open={signedUpMsg}
				autoHideDuration={4000}
				onClose={() => setSignedUpMsg(false)}
				anchorOrigin={{ vertical, horizontal }}>
				<Alert onClose={() => setSignedUpMsg(false)} severity='success' sx={{ width: '100%' }}>
					You successfully signed up!
				</Alert>
			</Snackbar>
			<Sidebar data={data} />
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					minHeight: '100vh',
					width: 'calc(100vw - 10rem)',
					position: 'absolute',
					right: 0,
				}}>
				<DashboardHeader />
				<Box></Box>
			</Box>
		</Box>
	);
};

export default Dashboard;
