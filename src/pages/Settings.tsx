import { Alert, Box, DialogContent, IconButton, InputAdornment, Snackbar, Tooltip, Typography } from '@mui/material';

import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { useContext, useState } from 'react';
import { UserAuthContext } from '../contexts/UserAuthContextProvider';
import HandleImageUploadURL from '../components/forms/uploadImageVideoDocument/HandleImageUploadURL';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import { EmailAuthProvider, getAuth, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import theme from '../themes';
import { Info, Visibility, VisibilityOff } from '@mui/icons-material';
import { PasswordUpdateErrorMessages, TextFieldTypes } from '../interfaces/enums';
import axios from 'axios';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomCancelButton from '../components/forms/customButtons/CustomCancelButton';
import { FirebaseError } from 'firebase/app';
import CustomErrorMessage from '../components/forms/customFields/CustomErrorMessage';

const Settings = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { user, setUser } = useContext(UserAuthContext);
	const [enterImageUrl, setEnterImageUrl] = useState<boolean>(true);
	const [username, setUsername] = useState<string>(user?.username || '');
	const [imageUrl, setImageUrl] = useState<string>(user?.imageUrl || '');

	const [currentPassword, setCurrentPassword] = useState<string>('');
	const [password, setPassword] = useState<string>('');
	const [confirmedPassword, setConfirmedPassword] = useState<string>('');

	const [isPasswordUpdated, setIsPasswordUpdated] = useState<boolean>(false);
	const [isImgUsernameUpdated, setIsImgUsernameUpdated] = useState<boolean>(false);

	const [isPasswordUpdatedMsgDisplayed, setIsPasswordUpdatedMsgDisplayed] = useState<boolean>(false);
	const [isImgUsernameUpdatedMsgDisplayed, setIsImgUsernameUpdatedMsgDisplayed] = useState<boolean>(false);

	const [isUserNameImageInfoModalOpen, setIsUserNameImageInfoModalOpen] = useState<boolean>(false);

	const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
	const [showPassword, setShowPassword] = useState<boolean>(false);
	const [showConfirmedPassword, setShowConfirmedPassword] = useState<boolean>(false);

	const [errorMsg, setErrorMsg] = useState<PasswordUpdateErrorMessages>();

	const toggleCurrentPasswordVisibility = () => {
		setShowCurrentPassword((prevShowPassword) => !prevShowPassword);
	};

	const togglePasswordVisibility = () => {
		setShowPassword((prevShowPassword) => !prevShowPassword);
	};

	const toggleConfirmedPasswordVisibility = () => {
		setShowConfirmedPassword((prevShowPassword) => !prevShowPassword);
	};

	const vertical = 'top';
	const horizontal = 'center';

	const handleUsernameProfilePictureUpdate = async () => {
		try {
			if (isImgUsernameUpdated) {
				await axios.patch(`${base_url}/users/${user?._id}`, { imageUrl, username });
			}
			setUser((prevData) => {
				if (prevData) {
					return { ...prevData, username, imageUrl };
				}
				return prevData;
			});
			setIsImgUsernameUpdatedMsgDisplayed(true);
			setIsImgUsernameUpdated(false);
		} catch (error) {
			console.log(error);
		}
	};

	const validatePassword = (password: string): PasswordUpdateErrorMessages | null => {
		const minLength = 6;
		// const hasUppercase = /[A-Z]/.test(password);
		// const hasLowercase = /[a-z]/.test(password);
		const hasNumber = /\d/.test(password);
		// const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
		const hasLetter = /[a-zA-Z]/.test(password);

		if (password.length < minLength) {
			return PasswordUpdateErrorMessages.PASSWORD_TOO_SHORT;
		}
		if (!hasLetter) {
			return PasswordUpdateErrorMessages.PASSWORD_NO_LETTER;
		}
		// if (!hasUppercase) {
		// 	return PasswordUpdateErrorMessages.PASSWORD_NO_UPPERCASE;
		// }
		// if (!hasLowercase) {
		// 	return PasswordUpdateErrorMessages.PASSWORD_NO_LOWERCASE;
		// }
		if (!hasNumber) {
			return PasswordUpdateErrorMessages.PASSWORD_NO_NUMBER;
		}
		// if (!hasSpecialChar) {
		// 	return PasswordUpdateErrorMessages.PASSWORD_NO_SPECIAL_CHAR;
		// }
		return null;
	};

	const handlePasswordUpdate = async () => {
		const passwordValidationError = validatePassword(password);
		if (passwordValidationError) {
			setErrorMsg(passwordValidationError);
			return;
		}

		const auth = getAuth();
		const user = auth.currentUser;

		if (password !== confirmedPassword) {
			setErrorMsg(PasswordUpdateErrorMessages.PASSWORDS_DO_NOT_MATCH);
			return;
		}

		if (user) {
			try {
				if (isPasswordUpdated) {
					// Re-authenticate user
					const credential = EmailAuthProvider.credential(user?.email!, currentPassword);
					await reauthenticateWithCredential(user, credential);
					// Update password
					await updatePassword(user, password);

					setIsPasswordUpdatedMsgDisplayed(true);
					setErrorMsg(undefined);

					setCurrentPassword('');
					setPassword('');
					setConfirmedPassword('');
					setIsPasswordUpdated(false);
				}
			} catch (error) {
				console.error('Error updating password:', error);
				if (error instanceof FirebaseError) {
					if (error.code === 'auth/invalid-credential') {
						setErrorMsg(PasswordUpdateErrorMessages.INVALID_CURRENT_PASSWORD);
					}
				}
			}
		}
	};

	const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		const regex = /^(?![._])(?!.*[._]$)[a-zA-Z0-9._]*$/; // No start/end with _ or .

		if (regex.test(value)) {
			setUsername(value.trim()); // Only set the username if it matches the pattern
			setIsImgUsernameUpdated(true);
		}
	};

	return (
		<DashboardPagesLayout pageName='Settings' customSettings={{ justifyContent: 'flex-start' }}>
			<Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '3rem', width: '100%' }}>
				<Box sx={{ display: 'flex' }}>
					<form
						style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-between', flex: 3, height: '29rem' }}
						onSubmit={(e) => {
							e.preventDefault();
							handleUsernameProfilePictureUpdate();
						}}>
						<Box sx={{ display: 'flex', justifyContent: 'center', mb: '0rem', width: '90%' }}>
							<Typography variant='h5'>Update Profile Picture & Username</Typography>
						</Box>
						<Box sx={{ display: 'flex', justifyContent: 'center', width: '90%' }}>
							<img
								src={imageUrl || 'https://img.sportsbookreview.com/images/avatars/default-avatar.jpg'}
								alt='profile_img'
								style={{ height: '10rem', width: '10rem', objectFit: 'cover', borderRadius: '50%', marginBottom: '1rem' }}
							/>
						</Box>
						<Box sx={{ width: '90%' }}>
							<HandleImageUploadURL
								label='Profile Picture'
								onImageUploadLogic={(url) => setImageUrl(url)}
								onChangeImgUrl={(e) => {
									setImageUrl(e.target.value);
									setIsImgUsernameUpdated(true);
								}}
								imageUrlValue={imageUrl}
								imageFolderName='ProfileImages'
								enterImageUrl={enterImageUrl}
								setEnterImageUrl={setEnterImageUrl}
							/>
						</Box>
						<Box sx={{ display: 'flex', width: '100%' }}>
							<CustomTextField
								label='Username'
								required={true}
								value={username}
								onChange={handleUsernameChange}
								sx={{ width: '100%' }}
								InputProps={{ inputProps: { maxLength: 15 } }}
							/>
							<Box sx={{ display: 'flex', width: '11%', justifyContent: 'flex-end', mt: '-1rem' }}>
								<Tooltip title='Username Rules' placement='top'>
									<IconButton
										onClick={() => setIsUserNameImageInfoModalOpen(true)}
										sx={{
											':hover': {
												backgroundColor: 'transparent',
											},
										}}>
										<Info fontSize='small' />
									</IconButton>
								</Tooltip>
							</Box>
						</Box>

						<CustomDialog
							title='Username Rules'
							openModal={isUserNameImageInfoModalOpen}
							closeModal={() => setIsUserNameImageInfoModalOpen(false)}
							maxWidth='sm'>
							<DialogContent>
								<Box sx={{ display: 'flex', flexDirection: 'column', margin: '0.5rem 0 0.5rem 1.5rem' }}>
									<Typography variant='body2'>- Username can include:</Typography>
									<Box sx={{ margin: '0.85rem 0 0 3rem' }}>
										{['max 15 characters', 'underscore (_) and period (.)'].map((rule, index) => (
											<ul key={index}>
												<li style={{ color: theme.textColor?.secondary.main }}>
													<Typography sx={{ fontSize: '0.85rem', mb: '0.35rem' }}>{rule}</Typography>
												</li>
											</ul>
										))}
									</Box>
									<Typography variant='body2' sx={{ mt: '0.5rem' }}>
										- Username cannot start/end with underscore and period
									</Typography>
									<Typography variant='body2' sx={{ mt: '0.5rem' }}>
										- Username cannot include space
									</Typography>
								</Box>
								<Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', mb: '0.5rem' }}>
									<CustomCancelButton onClick={() => setIsUserNameImageInfoModalOpen(false)}>Close</CustomCancelButton>
								</Box>
							</DialogContent>
						</CustomDialog>

						<Box sx={{ display: 'flex', width: '90%', justifyContent: 'flex-end' }}>
							<CustomSubmitButton size='small' type='submit'>
								Update
							</CustomSubmitButton>
						</Box>
						<Snackbar
							open={isImgUsernameUpdatedMsgDisplayed}
							autoHideDuration={3000}
							anchorOrigin={{ vertical, horizontal }}
							sx={{ mt: '1rem' }}
							onClose={() => setIsImgUsernameUpdatedMsgDisplayed(false)}>
							<Alert severity='success' variant='filled' sx={{ width: '100%', color: '#fff' }}>
								You have successfully updated your profile picture and/or username!
							</Alert>
						</Snackbar>
					</form>
					<Box sx={{ height: 'calc(100vh - 4rem)', width: '1px', margin: '0 0 0 2rem', borderRight: '0.1rem solid lightgray' }}></Box>
					<form
						style={{
							display: 'flex',
							flexDirection: 'column',
							justifyContent: 'space-between',
							alignItems: 'center',
							flex: 3,
							height: '29rem',
						}}
						onSubmit={(e) => {
							e.preventDefault();
							handlePasswordUpdate();
						}}>
						<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
							<Box sx={{ mb: '1.5rem' }}>
								<Typography variant='h5'>Update Password</Typography>
							</Box>

							<CustomTextField
								label='Current Password'
								required={true}
								type={showCurrentPassword ? TextFieldTypes.TEXT : TextFieldTypes.PASSWORD}
								value={currentPassword}
								onChange={(e) => {
									setCurrentPassword(e.target.value.trim());
									setErrorMsg(undefined);
								}}
								sx={{ width: '75%', margin: '0.75rem' }}
								InputProps={{
									endAdornment: (
										<InputAdornment position='end'>
											<IconButton
												onClick={toggleCurrentPasswordVisibility}
												edge='end'
												sx={{
													':hover': {
														backgroundColor: 'transparent',
													},
												}}>
												{!showCurrentPassword ? <Visibility fontSize='small' /> : <VisibilityOff fontSize='small' />}
											</IconButton>
										</InputAdornment>
									),
								}}
							/>
							<CustomTextField
								label='New Password'
								required={true}
								type={showPassword ? TextFieldTypes.TEXT : TextFieldTypes.PASSWORD}
								value={password}
								onChange={(e) => {
									setPassword(e.target.value.trim());
									setIsPasswordUpdated(true);
									setErrorMsg(undefined);
								}}
								sx={{ width: '75%', margin: '0.75rem' }}
								InputProps={{
									endAdornment: (
										<InputAdornment position='end'>
											<IconButton
												onClick={togglePasswordVisibility}
												edge='end'
												sx={{
													':hover': {
														backgroundColor: 'transparent',
													},
												}}>
												{!showPassword ? <Visibility fontSize='small' /> : <VisibilityOff fontSize='small' />}
											</IconButton>
										</InputAdornment>
									),
								}}
							/>
							<CustomTextField
								label='Confirm New Password'
								required={true}
								type={showConfirmedPassword ? TextFieldTypes.TEXT : TextFieldTypes.PASSWORD}
								value={confirmedPassword}
								onChange={(e) => {
									setConfirmedPassword(e.target.value.trim());
									setIsPasswordUpdated(true);
									setErrorMsg(undefined);
								}}
								sx={{ width: '75%', margin: '0.75rem' }}
								InputProps={{
									endAdornment: (
										<InputAdornment position='end'>
											<IconButton
												onClick={toggleConfirmedPasswordVisibility}
												edge='end'
												sx={{
													':hover': {
														backgroundColor: 'transparent',
													},
												}}>
												{!showConfirmedPassword ? <Visibility fontSize='small' /> : <VisibilityOff fontSize='small' />}
											</IconButton>
										</InputAdornment>
									),
								}}
							/>

							<Box>
								{errorMsg &&
									{
										[PasswordUpdateErrorMessages.INVALID_CURRENT_PASSWORD]: (
											<CustomErrorMessage sx={{ fontSize: '0.75rem' }}>{errorMsg}</CustomErrorMessage>
										),
										[PasswordUpdateErrorMessages.PASSWORDS_DO_NOT_MATCH]: (
											<CustomErrorMessage sx={{ fontSize: '0.75rem' }}>{errorMsg}</CustomErrorMessage>
										),
										[PasswordUpdateErrorMessages.PASSWORD_NO_LETTER]: (
											<CustomErrorMessage sx={{ fontSize: '0.75rem' }}>{errorMsg}</CustomErrorMessage>
										),
										[PasswordUpdateErrorMessages.PASSWORD_NO_NUMBER]: (
											<CustomErrorMessage sx={{ fontSize: '0.75rem' }}>{errorMsg}</CustomErrorMessage>
										),
										[PasswordUpdateErrorMessages.PASSWORD_TOO_SHORT]: (
											<CustomErrorMessage sx={{ fontSize: '0.75rem' }}>{errorMsg}</CustomErrorMessage>
										),
									}[errorMsg]}
							</Box>
							<Box sx={{ width: '75%', mt: '1rem' }}>
								<Typography sx={{ fontSize: '0.85rem', mb: '0.5rem' }}>- Password cannot include space</Typography>
								<Typography sx={{ fontSize: '0.85rem' }}>- Password must include at least:</Typography>
								<Box sx={{ margin: '0.75rem 0 0 3rem' }}>
									{['6 characters', '1 letter', '1 number'].map((rule, index) => (
										<ul key={index}>
											<li style={{ color: theme.textColor?.secondary.main }}>
												<Typography sx={{ fontSize: '0.75rem', mb: '0.35rem' }}>{rule}</Typography>
											</li>
										</ul>
									))}
								</Box>
							</Box>
						</Box>
						<Box sx={{ display: 'flex', width: '75%', justifyContent: 'flex-end', mt: '0.5rem' }}>
							<CustomSubmitButton size='small' sx={{ alignSelf: 'flex-end' }} type='submit'>
								Update
							</CustomSubmitButton>
						</Box>

						<Snackbar
							open={isPasswordUpdatedMsgDisplayed}
							autoHideDuration={3000}
							anchorOrigin={{ vertical, horizontal }}
							sx={{ mt: '1rem' }}
							onClose={() => setIsPasswordUpdatedMsgDisplayed(false)}>
							<Alert severity='success' variant='filled' sx={{ width: '100%', color: '#fff' }}>
								You have successfully updated your password!
							</Alert>
						</Snackbar>
					</form>
				</Box>
			</Box>
		</DashboardPagesLayout>
	);
};

export default Settings;
