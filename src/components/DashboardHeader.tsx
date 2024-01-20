import { Box, Button, Typography } from '@mui/material';
import theme from '../themes';
import { useNavigate } from 'react-router-dom';

const DashboardHeader = () => {
	const navigate = useNavigate();
	return (
		<Box
			sx={{
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				height: '3rem',
				width: '100%',
				backgroundColor: theme.textColor?.secondary.main,
				padding: '0 1rem 0 3rem',
			}}>
			<Typography variant='body1' sx={{ color: theme.textColor?.common.main }}>
				Courses
			</Typography>
			<Button
				sx={{
					textTransform: 'capitalize',
					color: theme.textColor?.common.main,
					fontFamily: theme.fontFamily?.main,
				}}
				onClick={() => {
					navigate('/');
					localStorage.removeItem('user_token');
				}}>
				Log Out
			</Button>
		</Box>
	);
};

export default DashboardHeader;
