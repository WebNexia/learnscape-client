import { Box, Button, Typography } from '@mui/material';
import * as styles from '../styles/AuthStyles';
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import theme from '../themes';
import { AuthFormErrorMessages, AuthForms, TextFieldTypes } from '../interfaces/enums';
import CustomTextField from '../components/forms/CustomFields/CustomTextField';

const Auth = () => {
	const navigate = useNavigate();

	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const [activeForm, setActiveForm] = useState<AuthForms>(AuthForms.SIGN_IN);

	const [errorMsg, setErrorMsg] = useState<AuthFormErrorMessages>();

	const [username, setUsername] = useState<string>('');
	const [email, setEmail] = useState<string>('');
	const [password, setPassword] = useState<string>('');

	const errorMessageTypography = (
		<Typography variant='body2' sx={{ textAlign: 'center', color: 'red', marginTop: '1rem' }}>
			{errorMsg}
		</Typography>
	);

	const signIn = async (e: FormEvent) => {
		e.preventDefault();
		try {
			const response = await axios.post(`${base_url}/users/signin`, { email, password });

			if (response.data.status) {
				navigate(`/dashboard/user/${response.data._id}`);
				localStorage.setItem('user_token', response.data.token);
				setEmail('');
				setUsername('');
				setPassword('');
			} else if (response.data.message === 'Email does not exist') {
				setErrorMsg(AuthFormErrorMessages.EMAIL_NOT_EXIST);
			} else {
				setErrorMsg(AuthFormErrorMessages.WRONG_PASSWORD);
			}
		} catch (error) {
			console.log(error);
		}
	};

	const signUp = async (e: FormEvent) => {
		e.preventDefault();
		try {
			const response = await axios.post(`${base_url}/users/signup`, {
				username,
				email,
				password,
			});

			if (response.data.status !== 409) {
				signIn(e);
				setEmail('');
				setPassword('');
				setUsername('');
			} else if (response.data.status === 409) {
				setErrorMsg(AuthFormErrorMessages.EMAIL_EXISTS);
			}

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
								setErrorMsg(undefined);
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
								activeForm === AuthForms.SIGN_IN
									? `solid 0.3rem ${theme.bgColor?.greenPrimary}`
									: 'solid 0.3rem lightgray',
						}}>
						Sign In
					</Button>
					<Button
						fullWidth
						onClick={() => {
							setActiveForm(AuthForms.SIGN_UP);
							if (activeForm !== AuthForms.SIGN_UP) {
								setEmail('');
								setUsername('');
								setPassword('');
								setErrorMsg(undefined);
							}
						}}
						size='large'
						sx={{
							...sharedBtnStyles,
							padding: '1rem 0',
							backgroundColor: activeForm !== AuthForms.SIGN_UP ? 'lightgray' : null,
							borderTop:
								activeForm === AuthForms.SIGN_UP
									? `solid 0.3rem ${theme.bgColor?.greenPrimary}`
									: 'solid 0.3rem lightgray',
						}}>
						Sign Up
					</Button>
				</Box>
				<Box sx={{ display: 'flex', justifyContent: 'center' }}>
					{
						{
							[AuthForms.SIGN_IN]: (
								<Box sx={{ marginTop: '2rem', width: '80%' }}>
									<form onSubmit={signIn}>
										<Box
											sx={{
												display: 'flex',
												flexDirection: 'column',
												justifyContent: 'center',
												alignItems: 'center',
											}}>
											<CustomTextField
												label='Email Address'
												type={TextFieldTypes.EMAIL}
												onChange={(e) => setEmail(e.target.value)}
												value={email}
											/>
											<CustomTextField
												label='Password'
												type={TextFieldTypes.PASSWORD}
												onChange={(e) => setPassword(e.target.value)}
												value={password}
											/>
										</Box>
										<Button fullWidth sx={submitBtnStyles} type='submit'>
											Sign In
										</Button>
									</form>
								</Box>
							),
							[AuthForms.SIGN_UP]: (
								<Box sx={{ marginTop: '2rem', width: '80%' }}>
									<form onSubmit={signUp}>
										<Box
											sx={{
												display: 'flex',
												flexDirection: 'column',
												justifyContent: 'center',
												alignItems: 'center',
											}}>
											<CustomTextField
												label='Email Address'
												type={TextFieldTypes.EMAIL}
												onChange={(e) => setEmail(e.target.value)}
												value={email}
											/>

											<CustomTextField
												label='Username'
												type={TextFieldTypes.TEXT}
												onChange={(e) => setUsername(e.target.value)}
												value={username}
											/>
											<CustomTextField
												label='Password'
												type={TextFieldTypes.PASSWORD}
												onChange={(e) => setPassword(e.target.value)}
												value={password}
											/>
										</Box>
										<Button
											variant='contained'
											fullWidth
											sx={submitBtnStyles}
											type='submit'>
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
							color: theme.textColor?.primary.main,
							cursor: 'pointer',
							':hover': { textDecoration: 'underline' },
						}}
						onClick={() => navigate('/')}>
						Home Page
					</Typography>
				</Box>
				<Box>
					<Box>
						{errorMsg &&
							{
								[AuthFormErrorMessages.EMAIL_EXISTS]: errorMessageTypography,
								[AuthFormErrorMessages.EMAIL_NOT_EXIST]: errorMessageTypography,
								[AuthFormErrorMessages.USERNAME_EXISTS]: errorMessageTypography,
								[AuthFormErrorMessages.WRONG_PASSWORD]: errorMessageTypography,
							}[errorMsg]}
					</Box>
				</Box>
			</Box>
		</Box>
	);
};

export default Auth;
