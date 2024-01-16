import { Box, Button, Typography } from '@mui/material';
import * as styles from '../styles/AuthStyles';
import { FormEvent, useState } from 'react';
import { AuthUtils } from '../utils/AuthUtils';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import theme from '../themes';

const Auth = () => {
	const navigate = useNavigate();

	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const [isSignInActive, setSignInIsActive] = useState<boolean>(true);
	const [isSignUpActive, setSignUpIsActive] = useState<boolean>(false);

	const [username, setUsername] = useState<string>('');
	const [email, setEmail] = useState<string>('');
	const [password, setPassword] = useState<string>('');

	const signin = async (e: FormEvent) => {
		e.preventDefault();
		try {
			const response = await axios.post(`${base_url}/users/signin`, { email, password });
			console.log(response.data);
			setEmail('');
			setUsername('');
			navigate(`/user/${response.data._id}`);
			localStorage.setItem('user_token', response.data.token);
		} catch (error) {
			console.log(error);
		}
	};

	const signup = async (e: FormEvent) => {
		e.preventDefault();
		try {
			const response = await axios.post(`${base_url}/users/signup`, { username, email, password });
			console.log(response.data.data[0]._id);
			setEmail('');
			setPassword('');
			setUsername('');
			navigate(`/user/${response.data.data[0]._id}`);
			localStorage.setItem('signedup', 'yes');
		} catch (error) {
			console.log(error);
		}
	};

	const sharedBtnStyles = theme.tabBtnAuth || {};
	const submitBtnStyles = theme.submitBtn || {};

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
							if (!isSignInActive) {
								setEmail('');
								setUsername('');
								setPassword('');
							}
						}}
						size='large'
						sx={{
							...sharedBtnStyles,
							padding: '1rem 0',
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
							if (!isSignUpActive) {
								setEmail('');
								setUsername('');
								setPassword('');
							}
						}}
						size='large'
						sx={{
							...sharedBtnStyles,
							padding: '1rem 0',
							backgroundColor: !isSignUpActive ? 'lightgray' : null,
							borderTop: isSignUpActive ? 'solid 0.3rem #1EC28B' : 'solid 0.3rem lightgray',
						}}>
						Sign Up
					</Button>
				</Box>

				<Box sx={{ display: 'flex', justifyContent: 'center' }}>
					{isSignInActive ? (
						<Box sx={{ marginTop: '2rem', width: '80%' }}>
							<form onSubmit={signin}>
								<Box
									sx={{
										display: 'flex',
										flexDirection: 'column',
										justifyContent: 'center',
										alignItems: 'center',
									}}>
									{AuthUtils.textFieldGenerator('Email Address', 'email', email, (e) =>
										setEmail(e.target.value)
									)}
									{AuthUtils.textFieldGenerator('Password', 'password', password, (e) =>
										setPassword(e.target.value)
									)}
								</Box>
								<Button variant='contained' fullWidth sx={submitBtnStyles} type='submit'>
									Sign In
								</Button>
							</form>
						</Box>
					) : null}
					{isSignUpActive ? (
						<Box sx={{ marginTop: '2rem', width: '80%' }}>
							<form onSubmit={signup}>
								<Box
									sx={{
										display: 'flex',
										flexDirection: 'column',
										justifyContent: 'center',
										alignItems: 'center',
									}}>
									{AuthUtils.textFieldGenerator('Email Address', 'email', email, (e) =>
										setEmail(e.target.value)
									)}
									{AuthUtils.textFieldGenerator('Username', 'text', username, (e) =>
										setUsername(e.target.value)
									)}
									{AuthUtils.textFieldGenerator('Password', 'password', password, (e) =>
										setPassword(e.target.value)
									)}
								</Box>
								<Button variant='contained' fullWidth sx={submitBtnStyles} type='submit'>
									Sign Up
								</Button>
							</form>
						</Box>
					) : null}
				</Box>
				<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
					<Typography
						variant='body1'
						sx={{
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
		</Box>
	);
};

export default Auth;
