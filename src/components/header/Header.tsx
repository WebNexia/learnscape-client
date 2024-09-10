import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material';
import theme from '../../themes';
import { useNavigate } from 'react-router-dom';

const Header = () => {
	const navigate = useNavigate();
	return (
		<AppBar position='sticky'>
			<Toolbar
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					width: '100%',
					height: '13vh',
					background: 'linear-gradient(270deg, #4D7B8B, #01435A)',
					position: 'fixed',
					top: 0,
				}}>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>
					<Box>
						<Typography
							variant='h1'
							sx={{ color: theme.textColor?.common.main, fontSize: '3.5rem', cursor: 'pointer' }}
							style={{ textShadow: '0.2rem 0.2rem rgba(0, 0, 0, 0.15)' }}
							onClick={() => navigate('/')}>
							KAIZEN
						</Typography>
					</Box>
					<Box>
						<Typography
							variant='h5'
							sx={{
								fontFamily: 'Poppins',
								color: theme.textColor?.common.main,
								':hover': { textDecoration: 'underline' },
								cursor: 'pointer',
								textShadow: '0.2rem 0.2rem rgba(0, 0, 0, 0.15)',
							}}>
							Courses
						</Typography>
					</Box>
					<Box>
						<Typography
							variant='h5'
							sx={{
								fontFamily: 'Poppins',
								color: theme.textColor?.common.main,
								':hover': { textDecoration: 'underline' },
								cursor: 'pointer',
								textShadow: '0.2rem 0.2rem rgba(0, 0, 0, 0.15)',
							}}>
							News
						</Typography>
					</Box>
					<Box>
						<Typography
							variant='h5'
							sx={{
								fontFamily: 'Poppins',
								color: theme.textColor?.common.main,
								':hover': { textDecoration: 'underline' },
								cursor: 'pointer',
								textShadow: '0.2rem 0.2rem rgba(0, 0, 0, 0.15)',
							}}>
							Blog
						</Typography>
					</Box>
					<Box>
						<Typography
							variant='h5'
							sx={{
								fontFamily: 'Poppins',
								color: theme.textColor?.common.main,
								':hover': { textDecoration: 'underline' },
								cursor: 'pointer',
								textShadow: '0.2rem 0.2rem rgba(0, 0, 0, 0.15)',
							}}>
							About
						</Typography>
					</Box>
				</Box>
				<Box sx={{ display: 'flex', justifyContent: 'flex-end', flex: 1 }}>
					<Button
						sx={{
							textTransform: 'capitalize',
							fontSize: '1rem',
							color: theme.textColor?.common.main,
							border: '#fff 0.01rem solid',
							padding: '0.5rem',
							boxShadow: '0.1rem 0.3rem 0.2rem 0.2rem rgba(0, 0, 0, 0.3)',
							transition: '0.3s',
							':hover': { backgroundColor: '#fff', color: theme.textColor?.primary.main },
						}}
						onClick={() => navigate('/auth')}>
						Login / Register
					</Button>
				</Box>
			</Toolbar>
		</AppBar>
	);
};

export default Header;
