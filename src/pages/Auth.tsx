import { Box, Button, Typography } from '@mui/material';
import * as styles from '../styles/AuthStyles';
import { useState } from 'react';
import { AuthUtils } from '../utils/AuthUtils';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
	const navigate = useNavigate();

	const [isSignInActive, setSignInIsActive] = useState<boolean>(true);
	const [isSignUpActive, setSignUpIsActive] = useState<boolean>(false);

	return (
		<Box
			sx={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				backgroundColor: '#FDF7F0',
				height: '100vh',
			}}>
			<Box sx={styles.formContainerStyles()}>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						width: '100%',
						position: 'absolute',
						top: 0,
						left: 0,
					}}>
					<Button
						fullWidth
						onClick={() => {
							setSignInIsActive(true);
							setSignUpIsActive(false);
						}}
						size='large'
						sx={{
							padding: '1rem 0',
							color: '#4D7B8B',
							backgroundColor: !isSignInActive ? 'lightgray' : null,
							borderTop: isSignInActive ? 'solid 0.3rem #1EC28B' : 'solid 0.3rem lightgray',
						}}>
						Sign In
					</Button>
					<Button
						fullWidth
						onClick={() => {
							setSignInIsActive(false);
							setSignUpIsActive(true);
						}}
						size='large'
						sx={{
							padding: '1rem 0',
							color: '#4D7B8B',
							backgroundColor: !isSignUpActive ? 'lightgray' : null,
							borderTop: isSignUpActive ? 'solid 0.3rem #1EC28B' : 'solid 0.3rem lightgray',
						}}>
						Sign Up
					</Button>
				</Box>

				<Box sx={{ display: 'flex', justifyContent: 'center' }}>
					{isSignInActive ? (
						<Box sx={{ marginTop: '2rem', width: '80%' }}>
							<form>
								<Box
									sx={{
										display: 'flex',
										flexDirection: 'column',
										justifyContent: 'center',
										alignItems: 'center',
									}}>
									{AuthUtils.textFieldGenerator('Email Address', 'email')}
									{AuthUtils.textFieldGenerator('Password', 'password')}
								</Box>
								<Button variant='contained' fullWidth sx={styles.submitBtnStyles()}>
									Sign In
								</Button>
							</form>
						</Box>
					) : null}
					{isSignUpActive ? (
						<Box sx={{ marginTop: '2rem', width: '80%' }}>
							<form>
								<Box
									sx={{
										display: 'flex',
										flexDirection: 'column',
										justifyContent: 'center',
										alignItems: 'center',
									}}>
									{AuthUtils.textFieldGenerator('Email Address', 'email')}
									{AuthUtils.textFieldGenerator('Username', 'text')}
									{AuthUtils.textFieldGenerator('Password', 'password')}
								</Box>
								<Button variant='contained' fullWidth sx={styles.submitBtnStyles()}>
									Sign Up
								</Button>
							</form>
						</Box>
					) : null}
				</Box>
				<Typography
					variant='body1'
					sx={{
						textAlign: 'center',
						marginTop: '1.25rem',
						color: '#01435A',
						cursor: 'pointer',
						':hover': { textDecoration: 'underline' },
					}}
					onClick={() => navigate('/')}>
					Home Page
				</Typography>
			</Box>
		</Box>
	);
};

export default Auth;
