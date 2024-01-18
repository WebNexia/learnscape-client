import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
	const navigate = useNavigate();
	return (
		<Box
			sx={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				backgroundColor: '#FDF7F0',
				height: '100vh',
			}}>
			<Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
				<Typography variant='h2' sx={{ fontWeight: 500, color: '#01435A', marginBottom: '1rem' }}>
					LearnScape
				</Typography>
				<Button
					sx={{
						textTransform: 'capitalize',
						fontSize: '1.25rem',
						color: '#4D7B8B',
						':hover': { backgroundColor: 'transparent', textDecoration: 'underline' },
					}}
					onClick={() => navigate('/auth')}>
					Register
				</Button>
			</Box>
		</Box>
	);
};

export default HomePage;
