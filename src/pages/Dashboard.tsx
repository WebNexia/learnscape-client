import { Alert, Box, Button, Snackbar, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
	const navigate = useNavigate();
	const [signedUpMsg, setSignedUpMsg] = useState<boolean>(false);

	const vertical = 'top';
	const horizontal = 'center';

	useEffect(() => {
		if (localStorage.getItem('signedup')) {
			localStorage.removeItem('signedup');
			setSignedUpMsg(true);
		}
	}, []);

	return (
		<Box
			sx={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				backgroundColor: '#FDF7F0',
				minHeight: '100vh',
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
			<Box>
				<Typography variant='h3'>Dashboard</Typography>
				<Button
					onClick={() => {
						navigate('/');
						localStorage.removeItem('user_token');
					}}>
					Logout
				</Button>
			</Box>
		</Box>
	);
};

export default Dashboard;
