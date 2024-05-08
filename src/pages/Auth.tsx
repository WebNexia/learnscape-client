import { Box, Button, Typography } from '@mui/material';
import * as styles from '../styles/AuthStyles';
import { FormEvent, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import theme from '../themes';
import { AuthFormErrorMessages, AuthForms, Roles, TextFieldTypes } from '../interfaces/enums';
import CustomTextField from '../components/forms/Custom Fields/CustomTextField';
import { UserAuthContext } from '../contexts/UserAuthContextProvider';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';

interface AuthProps {
	setUserRole: React.Dispatch<React.SetStateAction<string | null>>;
}

const Auth = ({ setUserRole }: AuthProps) => {
	const navigate = useNavigate();

	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { setUserId, fetchUserData } = useContext(UserAuthContext);
	const { fetchOrganisationData, setOrgId } = useContext(OrganisationContext);

	const [activeForm, setActiveForm] = useState<AuthForms>(AuthForms.SIGN_UP);

	const [errorMsg, setErrorMsg] = useState<AuthFormErrorMessages>();

	const [username, setUsername] = useState<string>('');
	const [email, setEmail] = useState<string>('');
	const [password, setPassword] = useState<string>('');
	const [orgCode, setOrgCode] = useState<string>('');

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
				localStorage.setItem('user_token', response.data.token);
				localStorage.setItem('role', response.data.role);

				setUserId(response.data._id);
				setOrgId(response.data.orgId);

				await Promise.all([fetchUserData(response.data._id), fetchOrganisationData(response.data.orgId)]);

				if (response.data.role) {
					setUserRole(response.data.role);
				}

				if (response.data.role === Roles.USER) {
					navigate(`/dashboard/user/${response.data._id}`);
				} else if (response.data.role === Roles.ADMIN) {
					navigate(`/admin/dashboard/user/${response.data._id}`);
				}

				setEmail('');
				setUsername('');
				setPassword('');
				setErrorMsg(undefined);
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
				orgCode,
			});

			if (response.data.status === 201) {
				await signIn(e);
				setEmail('');
				setPassword('');
				setUsername('');
				setOrgCode('');
				setErrorMsg(undefined);
			}

			localStorage.setItem('signedup', 'yes');
		} catch (error: any) {
			if (error.response.status === 409) {
				setErrorMsg(AuthFormErrorMessages.EMAIL_EXISTS);
			} else if (error.response.status === 404) {
				setErrorMsg(AuthFormErrorMessages.ORG_CODE_NOT_EXIST);
			}
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
							borderTop: activeForm === AuthForms.SIGN_IN ? `solid 0.3rem ${theme.bgColor?.greenPrimary}` : 'solid 0.3rem lightgray',
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
							borderTop: activeForm === AuthForms.SIGN_UP ? `solid 0.3rem ${theme.bgColor?.greenPrimary}` : 'solid 0.3rem lightgray',
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
											<CustomTextField label='Email Address' type={TextFieldTypes.EMAIL} onChange={(e) => setEmail(e.target.value)} value={email} />
											<CustomTextField
												label='Password'
												type={TextFieldTypes.PASSWORD}
												onChange={(e) => setPassword(e.target.value)}
												value={password}
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
									<form onSubmit={signUp}>
										<Box
											sx={{
												display: 'flex',
												flexDirection: 'column',
												justifyContent: 'center',
												alignItems: 'center',
											}}>
											<CustomTextField label='Email Address' type={TextFieldTypes.EMAIL} onChange={(e) => setEmail(e.target.value)} value={email} />

											<CustomTextField label='Username' type={TextFieldTypes.TEXT} onChange={(e) => setUsername(e.target.value)} value={username} />
											<CustomTextField
												label='Password'
												type={TextFieldTypes.PASSWORD}
												onChange={(e) => setPassword(e.target.value)}
												value={password}
											/>
											<CustomTextField
												label='Organization Code'
												type={TextFieldTypes.TEXT}
												onChange={(e) => setOrgCode(e.target.value)}
												value={orgCode}
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
								[AuthFormErrorMessages.WRONG_PASSWORD]: errorMessageTypography,
								[AuthFormErrorMessages.ORG_CODE_NOT_EXIST]: errorMessageTypography,
							}[errorMsg]}
					</Box>
				</Box>
			</Box>
		</Box>
	);
};

export default Auth;
