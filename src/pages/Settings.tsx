import { Alert, Box, DialogContent, IconButton, InputAdornment, Snackbar, Tooltip, Typography } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { useContext, useState, useEffect } from 'react';
import { UserAuthContext } from '../contexts/UserAuthContextProvider';
import HandleImageUploadURL from '../components/forms/uploadImageVideoDocument/HandleImageUploadURL';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import { EmailAuthProvider, getAuth, reauthenticateWithCredential, updatePassword, onAuthStateChanged, verifyBeforeUpdateEmail } from 'firebase/auth';
import theme from '../themes';
import { Info, Visibility, VisibilityOff } from '@mui/icons-material';
import { PasswordUpdateErrorMessages, Roles, TextFieldTypes } from '../interfaces/enums';
import axios from '@utils/axiosInstance';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomCancelButton from '../components/forms/customButtons/CustomCancelButton';
import { FirebaseError } from 'firebase/app';
import CustomErrorMessage from '../components/forms/customFields/CustomErrorMessage';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import { useNavigate } from 'react-router-dom';
import CustomDialogActions from '../components/layouts/dialog/CustomDialogActions';
import { useGeoLocation } from '../hooks/useGeoLocation';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import { useAuth } from '../hooks/useAuth';

const Settings = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { user, setUser } = useContext(UserAuthContext);
	const { hasAdminAccess, canAccessPayments } = useAuth();
	const navigate = useNavigate();
	const auth = getAuth();

	const location = useGeoLocation();

	const { isSmallScreen, isRotatedMedium, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const [enterImageUrl, setEnterImageUrl] = useState<boolean>(hasAdminAccess || user?.role === Roles.INSTRUCTOR ? true : false);
	const [username, setUsername] = useState<string>(user?.username || '');
	const [imageUrl, setImageUrl] = useState<string>(user?.imageUrl || '');
	const [firstName, setFirstName] = useState<string>(user?.firstName || '');
	const [lastName, setLastName] = useState<string>(user?.lastName || '');
	const [phone, setPhone] = useState<string>(user?.phone || '');

	const [email, setEmail] = useState<string>(user?.email || '');

	const [currentPassword, setCurrentPassword] = useState<string>('');
	const [password, setPassword] = useState<string>('');
	const [confirmedPassword, setConfirmedPassword] = useState<string>('');

	const [isProfileUpdated, setIsProfileUpdated] = useState<boolean>(false);
	const [profileUpdateStatus, setProfileUpdateStatus] = useState<'updated' | 'nochange'>('updated');

	const [isPasswordUpdatedMsgDisplayed, setIsPasswordUpdatedMsgDisplayed] = useState<boolean>(false);
	const [isProfileUpdatedMsgDisplayed, setIsProfileUpdatedMsgDisplayed] = useState<boolean>(false);
	const [isEmailUpdatedMsgDisplayed, setIsEmailUpdatedMsgDisplayed] = useState<boolean>(false);

	const [isUserNameImageInfoModalOpen, setIsUserNameImageInfoModalOpen] = useState<boolean>(false);

	const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
	const [showPassword, setShowPassword] = useState<boolean>(false);
	const [showConfirmedPassword, setShowConfirmedPassword] = useState<boolean>(false);

	const [errorMsg, setErrorMsg] = useState<PasswordUpdateErrorMessages>();
	const [profileErrorMsg, setProfileErrorMsg] = useState<string | undefined>();

	const [showVerifyEmailMsg, setShowVerifyEmailMsg] = useState(false);

	const [showPasswordDialog, setShowPasswordDialog] = useState(false);
	const [emailToUpdate, setEmailToUpdate] = useState<string | null>(null);
	const [dialogPassword, setDialogPassword] = useState('');
	const [dialogError, setDialogError] = useState<string | undefined>(undefined);

	// Add auth state listener
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
			if (!firebaseUser) {
				// User is signed out, redirect to login
				navigate('/auth', { replace: true });
			} else if (!firebaseUser.emailVerified) {
				// Email not verified, show message
				setProfileErrorMsg('Please verify your email before continuing.');
			}
		});

		return () => unsubscribe();
	}, [auth, navigate]);

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

	const handleEmailUpdate = async () => {
		setProfileErrorMsg(undefined);

		if (email === user?.email) {
			setIsEmailUpdatedMsgDisplayed(true);
			return;
		}

		// Proactive check if email exists in Firebase
		try {
			const { data } = await axios.post('/users/check-email-firebase', { email });
			if (data.exists) {
				setProfileErrorMsg('This email address is already in use.');
				return;
			}
		} catch (checkError) {
			setProfileErrorMsg('Failed to check email. Please try again.');
			return;
		}

		// If email is available, open the password dialog
		setEmailToUpdate(email);
		setShowPasswordDialog(true);
	};

	const handleProfileUpdate = async () => {
		if (!isProfileUpdated) {
			setProfileUpdateStatus('nochange');
			setIsProfileUpdatedMsgDisplayed(true);
			return;
		}
		try {
			// For other profile updates (not email)
			if (isProfileUpdated) {
				try {
					await axios.patch(`${base_url}/users/${user?._id}`, {
						imageUrl,
						username,
						firstName,
						lastName,
						phone,
						...(email === user?.email ? { email } : {}), // Only include email if it hasn't changed
					});

					setUser((prevData) => {
						if (prevData) {
							return {
								...prevData,
								username,
								imageUrl,
								firstName,
								lastName,
								phone,
								...(email === user?.email ? { email } : {}), // Only update email if it hasn't changed
							};
						}
						return prevData;
					});
					setProfileUpdateStatus('updated');
					setIsProfileUpdatedMsgDisplayed(true);
					setIsProfileUpdated(false);
				} catch (error: any) {
					console.error('Profile update error:', error);
					const msg = error?.response?.data?.message;
					if (msg === 'Username already in use') {
						setProfileErrorMsg('This username is already in use.');
					} else {
						setProfileErrorMsg('An error occurred while updating your profile.');
					}
				}
			}
		} catch (error: any) {
			console.error('Profile update error:', error);

			// Firebase Auth error
			if (error.code === 'auth/email-already-in-use' || error.message === 'EMAIL_EXISTS') {
				setProfileErrorMsg('This email address is already in use.');
			} else if (error.code === 'auth/invalid-email') {
				setProfileErrorMsg('The email address is invalid.');
			} else if (error.code) {
				setProfileErrorMsg(error.message || error.code);
			}
			// Axios backend error
			else if (error?.response?.data?.message) {
				setProfileErrorMsg(error.response.data.message);
			} else {
				setProfileErrorMsg('An error occurred while updating your profile.');
			}
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

		if (currentPassword === password) {
			return PasswordUpdateErrorMessages.SAME_PASSWORD;
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

	const errorMessage = <CustomErrorMessage sx={{ fontSize: '0.75rem' }}>{errorMsg}</CustomErrorMessage>;

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
			setIsProfileUpdated(true);
		}
	};

	const handleDialogSubmit = async () => {
		setDialogError(undefined);
		const auth = getAuth();
		const firebaseUser = auth.currentUser;
		if (!firebaseUser || !emailToUpdate) return;
		if (!dialogPassword) {
			setDialogError('Please enter your current password.');
			return;
		}
		// Proactive check if email exists in Firebase
		try {
			const { data } = await axios.post('/users/check-email-firebase', { email: emailToUpdate });
			if (data.exists) {
				setDialogError('This email address is already in use.');
				return;
			}
		} catch (checkError) {
			setDialogError('Failed to check email. Please try again.');
			return;
		}
		const credential = EmailAuthProvider.credential(firebaseUser.email!, dialogPassword);
		try {
			await reauthenticateWithCredential(firebaseUser, credential);

			await verifyBeforeUpdateEmail(firebaseUser, emailToUpdate);
			setShowVerifyEmailMsg(true);
			setShowPasswordDialog(false);
			setDialogPassword('');
			setEmailToUpdate(null);
		} catch (reauthError: any) {
			console.error('verifyBeforeUpdateEmail error:', reauthError);
			if (reauthError.code === 'auth/email-already-in-use' || reauthError.message === 'EMAIL_EXISTS') {
				setDialogError('This email address is already in use.');
			} else if (reauthError.code === 'auth/wrong-password') {
				setDialogError('Incorrect password. Please try again.');
			} else {
				setDialogError('Re-authentication failed. Please try again.');
			}
		}
	};

	const handleDialogClose = () => {
		setShowPasswordDialog(false);
		setDialogPassword('');
		setDialogError(undefined);
		setEmailToUpdate(null);
	};

	return (
		<DashboardPagesLayout pageName='Settings' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
			{canAccessPayments && (
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'flex-end',
						padding: isVerySmallScreen ? '1rem 1.5rem 0' : isRotatedMedium ? '1rem 1rem 0' : '2rem 3rem 0',
						width: '100%',
					}}>
					<CustomSubmitButton onClick={() => navigate('/admin/setup')} size='small'>
						Account Setup
					</CustomSubmitButton>
				</Box>
			)}
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					padding: isVerySmallScreen ? '1rem 1.5rem' : isRotatedMedium ? '1rem' : '3rem',
					width: '100%',
				}}>
				<Box sx={{ display: 'flex', flexDirection: isVerySmallScreen ? 'column' : 'row', mb: isMobileSize ? '1rem' : '0rem' }}>
					<form
						style={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'flex-start',
							justifyContent: 'space-between',
							flex: isVerySmallScreen ? undefined : 3,
							height: isVerySmallScreen ? 'fit-content' : isRotatedMedium ? '23rem' : '29rem',
							marginBottom: isVerySmallScreen ? '3rem' : '',
						}}
						onSubmit={(e) => {
							e.preventDefault();
						}}>
						<Box sx={{ display: 'flex', justifyContent: 'center', mb: '0rem', width: '90%' }}>
							<Typography variant={isMobileSize ? 'h6' : 'h5'}>Update Profile</Typography>
						</Box>
						<Box
							sx={{
								display: 'flex',
								justifyContent: 'center',
								width: '90%',
								height: isMobileSize ? '8rem' : '10rem',
								margin: '1rem 0 0.5rem 0',
							}}>
							<img
								src={imageUrl || 'https://img.sportsbookreview.com/images/avatars/default-avatar.jpg'}
								alt='profile_img'
								style={{
									height: isMobileSize ? '7rem' : '10rem',
									width: isMobileSize ? '7rem' : '10rem',
									objectFit: 'cover',
									borderRadius: '50%',
									border: 'solid lightgray 0.01rem',
								}}
							/>
						</Box>
						<Box sx={{ width: '90%' }}>
							<HandleImageUploadURL
								label='Profile Picture'
								onImageUploadLogic={(url) => {
									setImageUrl(url);
									setIsProfileUpdated(true);
								}}
								onChangeImgUrl={(e) => {
									setImageUrl(e.target.value);
									setIsProfileUpdated(true);
								}}
								imageUrlValue={imageUrl}
								imageFolderName='ProfileImages'
								enterImageUrl={enterImageUrl}
								setEnterImageUrl={setEnterImageUrl}
							/>
						</Box>
						<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
							<Box sx={{ flex: 1 }}>
								<CustomTextField
									label='First Name'
									required={true}
									value={firstName}
									onChange={(e) => {
										setFirstName(e.target.value);
										setIsProfileUpdated(true);
									}}
									sx={{ width: '100%' }}
									InputProps={{
										inputProps: {
											maxLength: 50,
										},
									}}
								/>
							</Box>
							<Box sx={{ flex: 1, ml: '1rem' }}>
								<CustomTextField
									label='Last Name'
									required={true}
									value={lastName}
									onChange={(e) => {
										setLastName(e.target.value);
										setIsProfileUpdated(true);
									}}
									sx={{ width: '100%' }}
									InputProps={{
										inputProps: {
											maxLength: 50,
										},
									}}
								/>
							</Box>
							<Box sx={{ display: 'flex', flex: 1, ml: '1rem' }}>
								<CustomTextField
									label='Username'
									required={true}
									value={username}
									onChange={handleUsernameChange}
									sx={{ width: '100%' }}
									InputProps={{ inputProps: { maxLength: 15 } }}
								/>
							</Box>
							<Box sx={{ display: 'flex', width: '10%', justifyContent: 'flex-end', mt: '-1rem' }}>
								<Tooltip title='Username Rules' placement='top' arrow>
									<IconButton
										onClick={() => setIsUserNameImageInfoModalOpen(true)}
										sx={{
											':hover': {
												backgroundColor: 'transparent',
											},
										}}>
										<Info fontSize='small' sx={{ fontSize: isMobileSize ? '0.95rem' : undefined }} />
									</IconButton>
								</Tooltip>
							</Box>
						</Box>
						<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '90%' }}>
							<Box sx={{ flex: 1 }}>
								<CustomTextField
									label='Email Address'
									type={TextFieldTypes.EMAIL}
									required={true}
									value={email}
									onChange={(e) => {
										setEmail(e.target.value);
									}}
									sx={{ width: '100%' }}
									InputProps={{
										inputProps: {
											maxLength: 254,
										},
									}}
								/>
							</Box>

							<Box sx={{ display: 'flex', flex: 1, ml: '1rem' }}>
								<PhoneInput
									defaultCountry={location?.countryCode?.toUpperCase() || 'TR'}
									value={phone}
									onChange={(phoneNumber) => {
										setPhone(phoneNumber);
										setErrorMsg(undefined);
										setIsProfileUpdated(true);
									}}
									inputClassName='custom-phone-input'
									className='custom-phone-container'
									style={{ width: '100%', marginBottom: '0.5rem' }}
								/>
							</Box>
						</Box>

						<CustomDialog
							title='Username Rules'
							openModal={isUserNameImageInfoModalOpen}
							closeModal={() => setIsUserNameImageInfoModalOpen(false)}
							maxWidth='sm'>
							<DialogContent>
								<Box sx={{ display: 'flex', flexDirection: 'column', margin: '0.5rem 0 0.75rem 1.5rem' }}>
									<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
										- Username can include:
									</Typography>
									<Box sx={{ margin: '0.85rem 0 0 3rem' }}>
										{['min 5 characters', 'max 15 characters', 'underscore (_) and period (.)']?.map((rule, index) => (
											<ul key={index}>
												<li style={{ color: theme.textColor?.secondary.main }}>
													<Typography sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.35rem' }}>{rule}</Typography>
												</li>
											</ul>
										))}
									</Box>
									<Typography variant='body2' sx={{ mt: '0.5rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
										- Username cannot start/end with underscore and period
									</Typography>
									<Typography variant='body2' sx={{ mt: '0.5rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
										- Username cannot include space
									</Typography>
								</Box>
								<Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', mb: '0.5rem' }}>
									<CustomCancelButton onClick={() => setIsUserNameImageInfoModalOpen(false)} sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
										Close
									</CustomCancelButton>
								</Box>
							</DialogContent>
						</CustomDialog>

						{profileErrorMsg && <CustomErrorMessage sx={{ width: '100%', fontSize: '0.75rem', mb: 1 }}>{profileErrorMsg}</CustomErrorMessage>}
						<Box sx={{ display: 'flex', width: '90%', justifyContent: 'space-between' }}>
							<CustomSubmitButton size='small' type='submit' sx={{ fontSize: isMobileSize ? '0.7rem' : undefined }} onClick={handleEmailUpdate}>
								Update Email
							</CustomSubmitButton>
							<CustomSubmitButton size='small' type='submit' sx={{ fontSize: isMobileSize ? '0.7rem' : undefined }} onClick={handleProfileUpdate}>
								Update Profile
							</CustomSubmitButton>
						</Box>
						<Snackbar
							open={isProfileUpdatedMsgDisplayed}
							autoHideDuration={3000}
							anchorOrigin={{ vertical, horizontal }}
							sx={{ mt: '1rem' }}
							onClose={() => setIsProfileUpdatedMsgDisplayed(false)}>
							<Alert
								severity={profileUpdateStatus === 'updated' ? 'success' : 'info'}
								variant='filled'
								sx={{ width: '100%', color: '#fff', fontSize: isMobileSize ? '0.7rem' : undefined }}>
								{profileUpdateStatus === 'updated' ? 'You have successfully updated your profile!' : 'No changes were made to your profile.'}
							</Alert>
						</Snackbar>
						<Snackbar
							open={isEmailUpdatedMsgDisplayed}
							autoHideDuration={3000}
							anchorOrigin={{ vertical, horizontal }}
							sx={{ mt: '1rem' }}
							onClose={() => setIsEmailUpdatedMsgDisplayed(false)}>
							<Alert severity='info' variant='filled' sx={{ width: '100%', color: '#fff', fontSize: isMobileSize ? '0.7rem' : undefined }}>
								Your email address is already up to date!
							</Alert>
						</Snackbar>
					</form>
					{!isVerySmallScreen && (
						<Box
							sx={{
								height: isRotatedMedium ? '23rem' : '29.25rem',
								width: '1px',
								margin: '0 0 0 2rem',
								borderRight: '0.1rem solid lightgray',
							}}></Box>
					)}
					<form
						style={{
							display: 'flex',
							flexDirection: 'column',
							justifyContent: 'space-between',
							alignItems: 'center',
							flex: isVerySmallScreen ? undefined : 3,
							height: isVerySmallScreen ? 'fit-content' : isRotatedMedium ? '23rem' : '29rem',
						}}
						onSubmit={(e) => {
							e.preventDefault();
							handlePasswordUpdate();
						}}>
						<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
							<Box sx={{ mb: isMobileSize ? '0.5rem' : '1.5rem' }}>
								<Typography variant={isMobileSize ? 'h6' : 'h5'}>Update Password</Typography>
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
								sx={{ width: isVerySmallScreen ? '90%' : isMobileSize ? '80%' : '75%', margin: isMobileSize ? '0.35rem' : '0.75rem' }}
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
												{!showCurrentPassword ? (
													<Visibility fontSize='small' sx={{ fontSize: isMobileSize ? '0.9rem' : undefined }} />
												) : (
													<VisibilityOff fontSize='small' sx={{ fontSize: isMobileSize ? '0.9rem' : undefined }} />
												)}
											</IconButton>
										</InputAdornment>
									),
									inputProps: {
										maxLength: 50,
									},
								}}
							/>
							<CustomTextField
								label='New Password'
								required={true}
								type={showPassword ? TextFieldTypes.TEXT : TextFieldTypes.PASSWORD}
								value={password}
								onChange={(e) => {
									setPassword(e.target.value.trim());
									setErrorMsg(undefined);
								}}
								sx={{ width: isVerySmallScreen ? '90%' : isMobileSize ? '80%' : '75%', margin: isMobileSize ? '0.35rem' : '0.75rem' }}
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
												{!showPassword ? (
													<Visibility fontSize='small' sx={{ fontSize: isMobileSize ? '0.9rem' : undefined }} />
												) : (
													<VisibilityOff fontSize='small' sx={{ fontSize: isMobileSize ? '0.9rem' : undefined }} />
												)}
											</IconButton>
										</InputAdornment>
									),
									inputProps: {
										maxLength: 50,
									},
								}}
							/>
							<CustomTextField
								label='Confirm New Password'
								required={true}
								type={showConfirmedPassword ? TextFieldTypes.TEXT : TextFieldTypes.PASSWORD}
								value={confirmedPassword}
								onChange={(e) => {
									setConfirmedPassword(e.target.value.trim());
									setErrorMsg(undefined);
								}}
								sx={{ width: isVerySmallScreen ? '90%' : isMobileSize ? '80%' : '75%', margin: isMobileSize ? '0.35rem' : '0.75rem' }}
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
												{!showConfirmedPassword ? (
													<Visibility fontSize='small' sx={{ fontSize: isMobileSize ? '0.9rem' : undefined }} />
												) : (
													<VisibilityOff fontSize='small' sx={{ fontSize: isMobileSize ? '0.9rem' : undefined }} />
												)}
											</IconButton>
										</InputAdornment>
									),
									inputProps: {
										maxLength: 50,
									},
								}}
							/>

							<Box>
								{errorMsg &&
									{
										[PasswordUpdateErrorMessages.INVALID_CURRENT_PASSWORD]: errorMessage,
										[PasswordUpdateErrorMessages.PASSWORDS_DO_NOT_MATCH]: errorMessage,
										[PasswordUpdateErrorMessages.PASSWORD_NO_LETTER]: errorMessage,
										[PasswordUpdateErrorMessages.PASSWORD_NO_NUMBER]: errorMessage,
										[PasswordUpdateErrorMessages.PASSWORD_TOO_SHORT]: errorMessage,
										[PasswordUpdateErrorMessages.SAME_PASSWORD]: errorMessage,
									}[errorMsg]}
							</Box>
							<Box sx={{ width: isVerySmallScreen ? '90%' : isMobileSize ? '80%' : '75%', mt: '1rem' }}>
								<Typography sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.5rem' }}>- Password cannot include space</Typography>
								<Typography sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>- Password must include at least:</Typography>
								<Box sx={{ margin: '0.75rem 0 0 3rem' }}>
									{['6 characters', '1 letter', '1 number']?.map((rule, index) => (
										<ul key={index}>
											<li style={{ color: theme.textColor?.secondary.main }}>
												<Typography sx={{ fontSize: isMobileSize ? '0.65rem' : '0.75rem', mb: '0.35rem' }}>{rule}</Typography>
											</li>
										</ul>
									))}
								</Box>
							</Box>
						</Box>
						<Box sx={{ display: 'flex', width: isVerySmallScreen ? '90%' : isMobileSize ? '80%' : '75%', justifyContent: 'flex-end', mt: '0.5rem' }}>
							<CustomSubmitButton size='small' sx={{ alignSelf: 'flex-end', fontSize: isMobileSize ? '0.7rem' : undefined }} type='submit'>
								Update Password
							</CustomSubmitButton>
						</Box>

						<Snackbar
							open={isPasswordUpdatedMsgDisplayed}
							autoHideDuration={3000}
							anchorOrigin={{ vertical, horizontal }}
							sx={{ mt: '1rem' }}
							onClose={() => setIsPasswordUpdatedMsgDisplayed(false)}>
							<Alert severity='success' variant='filled' sx={{ width: '100%', color: '#fff', fontSize: isMobileSize ? '0.7rem' : undefined }}>
								You have successfully updated your password!
							</Alert>
						</Snackbar>
					</form>
				</Box>
			</Box>
			<Snackbar
				open={showVerifyEmailMsg}
				autoHideDuration={6000}
				anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
				onClose={() => setShowVerifyEmailMsg(false)}
				sx={{ mt: '2.5rem' }}>
				<Alert
					severity='info'
					variant='filled'
					sx={{
						'width': '100%',
						'fontSize': '0.85rem',
						'letterSpacing': 0,
						'color': '#fff',
						'backgroundColor': '#1976d2',
						'& .MuiAlert-message': {
							lineHeight: 1.5,
						},
					}}>
					A verification email has been sent to your new address. Please check your inbox and verify your email.
				</Alert>
			</Snackbar>

			<CustomDialog openModal={showPasswordDialog} closeModal={handleDialogClose} title='Enter Current Password' maxWidth='sm'>
				<DialogContent>
					<CustomTextField
						type='password'
						label='Current Password'
						value={dialogPassword}
						onChange={(e) => setDialogPassword(e.target.value)}
						sx={{ mt: '0.75rem' }}
					/>
					{dialogError && <CustomErrorMessage sx={{ mt: 1 }}>{dialogError}</CustomErrorMessage>}
				</DialogContent>
				<CustomDialogActions onCancel={handleDialogClose} onSubmit={handleDialogSubmit} submitBtnText='Submit' />
			</CustomDialog>
		</DashboardPagesLayout>
	);
};

export default Settings;
