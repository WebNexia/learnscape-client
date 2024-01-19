import { Alert, Box, Button, Snackbar, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';

const Dashboard = () => {
	const navigate = useNavigate();
	const [signedUpMsg, setSignedUpMsg] = useState<boolean>(false);

	const vertical = 'top';
	const horizontal = 'center';

	const theme = useTheme();

	useEffect(() => {
		if (localStorage.getItem('signedup')) {
			localStorage.removeItem('signedup');
			setSignedUpMsg(true);
		}
	}, []);

	useEffect(() => {
		if (!localStorage.getItem('user_token')) {
			navigate('/auth');
			console.log('not logged in');
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
			<Box
				sx={{
					width: '10rem',
					minHeight: '100vh',
					backgroundColor: theme.palette.primary.main,
					position: 'absolute',
					left: 0,
				}}>
				<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '5rem' }}>
					<Typography variant='h1' sx={{ color: 'white', fontSize: '2.25rem' }}>
						KAIZEN
					</Typography>
				</Box>

				{/* <Typography variant='h3'>Dashboard</Typography>
				<Button
					onClick={() => {
						navigate('/');
						localStorage.removeItem('user_token');
					}}>
					Logout
				</Button> */}
			</Box>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					minHeight: '100vh',
					width: 'calc(100vw - 10rem)',
					position: 'absolute',
					right: 0,
				}}>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'flex-start',
						alignItems: 'center',
						height: '3rem',
						width: '100%',
						backgroundColor: theme.typography.body1.color,
					}}>
					<Typography variant='h3' sx={{ color: 'white' }}>
						Courses
					</Typography>
				</Box>
				<Box></Box>
			</Box>
		</Box>
	);
};

export default Dashboard;
