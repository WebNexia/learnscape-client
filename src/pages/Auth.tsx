import { Box, Button, Typography } from '@mui/material';
import * as styles from '../styles/AuthStyles';
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import theme from '../themes';
import { AuthForms, TextFieldTypes } from '../interfaces/enums';
import CustomTextField from '../components/CustomTextField';

const Auth = () => {
	const navigate = useNavigate();

	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const [activeForm, setActiveForm] = useState<AuthForms>(AuthForms.SIGN_IN);

	const [username, setUsername] = useState<string>('');
	const [email, setEmail] = useState<string>('');
	const [password, setPassword] = useState<string>('');

	const signin = async (e: FormEvent) => {
		e.preventDefault();
		try {
			const response = await axios.post(`${base_url}/users/signin`, { email, password });
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
							setActiveForm(AuthForms.SIGN_IN);
							if (activeForm !== AuthForms.SIGN_IN) {
								setEmail('');
								setUsername('');
								setPassword('');
							}
						}}
						size='large'
						sx={{
							...sharedBtnStyles,
							padding: '1rem 0',
							backgroundColor: activeForm !== AuthForms.SIGN_IN ? 'lightgray' : null,
							borderTop:
								activeForm === AuthForms.SIGN_IN ? 'solid 0.3rem #1EC28B' : 'solid 0.3rem lightgray',
						}}>
						Sign In
					</Button>
					<Button
						fullWidth
						onClick={() => {
							setActiveForm(AuthForms.SIGN_UP);
							if (!AuthForms.SIGN_UP) {
								setEmail('');
								setUsername('');
								setPassword('');
							}
						}}
						size='large'
						sx={{
							...sharedBtnStyles,
							padding: '1rem 0',
							backgroundColor: activeForm !== AuthForms.SIGN_UP ? 'lightgray' : null,
							borderTop:
								activeForm === AuthForms.SIGN_UP ? 'solid 0.3rem #1EC28B' : 'solid 0.3rem lightgray',
						}}>
						Sign Up
					</Button>
				</Box>
				<Box sx={{ display: 'flex', justifyContent: 'center' }}>
					{
						{
							[AuthForms.SIGN_IN]: (
								<Box sx={{ marginTop: '2rem', width: '80%' }}>
									<form onSubmit={signin}>
										<Box
											sx={{
												display: 'flex',
												flexDirection: 'column',
												justifyContent: 'center',
												alignItems: 'center',
											}}>
											<CustomTextField
												variant='outlined'
												label='Email Address'
												type={TextFieldTypes.EMAIL}
												onChange={(e) => setEmail(e.target.value)}
												value={email}
												size='small'
												fullWidth={true}
											/>
											<CustomTextField
												variant='outlined'
												label='Password'
												type={TextFieldTypes.PASSWORD}
												onChange={(e) => setPassword(e.target.value)}
												value={password}
												size='small'
												fullWidth={true}
											/>
										</Box>
										<Button variant='contained' fullWidth sx={submitBtnStyles} type='submit'>
											Sign In
										</Button>
									</form>
								</Box>
							),
							[AuthForms.SIGN_UP]: (
								<Box sx={{ marginTop: '2rem', width: '80%' }}>
									<form onSubmit={signup}>
										<Box
											sx={{
												display: 'flex',
												flexDirection: 'column',
												justifyContent: 'center',
												alignItems: 'center',
											}}>
											<CustomTextField
												variant='outlined'
												label='Email Address'
												type={TextFieldTypes.EMAIL}
												onChange={(e) => setEmail(e.target.value)}
												value={email}
												size='small'
												fullWidth={true}
											/>

											<CustomTextField
												variant='outlined'
												label='Username'
												type={TextFieldTypes.TEXT}
												onChange={(e) => setUsername(e.target.value)}
												value={username}
												size='small'
												fullWidth={true}
											/>
											<CustomTextField
												variant='outlined'
												label='Password'
												type={TextFieldTypes.PASSWORD}
												onChange={(e) => setPassword(e.target.value)}
												value={password}
												size='small'
												fullWidth={true}
											/>
										</Box>
										<Button variant='contained' fullWidth sx={submitBtnStyles} type='submit'>
											Sign Up
										</Button>
									</form>
								</Box>
							),
						}[activeForm]
					}
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
