import { Alert, Box, Button, DialogContent, IconButton, InputAdornment, Snackbar, Tooltip, Typography } from '@mui/material';
import * as styles from '../styles/styleAuth';
import { FormEvent, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import theme from '../themes';
import { AuthFormErrorMessages, AuthForms, Roles, TextFieldTypes } from '../interfaces/enums';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import { UserAuthContext } from '../contexts/UserAuthContextProvider';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import { AuthError, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { useQueryClient } from 'react-query';
import { User } from '../interfaces/user';
import { FirebaseError } from 'firebase/app';
import { Info, Visibility, VisibilityOff } from '@mui/icons-material';
import { UserCoursesIdsWithCourseIds, UserLessonDataStorage } from '../contexts/UserCourseLessonDataContextProvider';
import { UserCoursesByUserId } from '../interfaces/userCourses';
import { UserLessonsByUserId } from '../interfaces/userLesson';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomCancelButton from '../components/forms/customButtons/CustomCancelButton';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import PhoneInput from 'react-phone-input-2';
import { useGeoLocation } from '../hooks/useGeoLocation';

interface AuthProps {
	setUserRole: React.Dispatch<React.SetStateAction<string | null>>;
}

const Auth = ({ setUserRole }: AuthProps) => {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const organisationCode = import.meta.env.VITE_ORG_CODE;
	const orgId = import.meta.env.VITE_ORG_ID;

	const vertical = 'top';
	const horizontal = 'center';

	const location = useGeoLocation();

	const { setUserId, fetchUserData } = useContext(UserAuthContext);
	const { fetchOrganisationData, setOrgId } = useContext(OrganisationContext);
	const { isVerySmallScreen, isSmallScreen, isRotated, isRotatedMedium } = useContext(MediaQueryContext);

	const isMobileSize = isSmallScreen || isRotatedMedium;

	const [activeForm, setActiveForm] = useState<AuthForms>(AuthForms.SIGN_UP);

	const [errorMsg, setErrorMsg] = useState<AuthFormErrorMessages>();
	const [signUpMessage, setSignUpMessage] = useState<boolean>(false);
	const [resetPasswordMsg, setResetPasswordMsg] = useState<boolean>(false);

	const [firstName, setFirstName] = useState<string>('');
	const [lastName, setLastName] = useState<string>('');
	const [username, setUsername] = useState<string>('');
	const [email, setEmail] = useState<string>('');
	const [phone, setPhone] = useState<string>('');
	const [password, setPassword] = useState<string>('');
	const [orgCode, setOrgCode] = useState<string>(organisationCode);

	const [showPassword, setShowPassword] = useState<boolean>(false);
	const [isUserNameImageInfoModalOpen, setIsUserNameImageInfoModalOpen] = useState<boolean>(false);
	const [isPasswordInfoModalOpen, setIsPasswordInfoModalOpen] = useState<boolean>(false);

	const [isResetPassword, setIsResetPassword] = useState<boolean>(false);

	const togglePasswordVisibility = () => {
		setShowPassword((prevShowPassword) => !prevShowPassword);
	};

	const errorMessageTypography = (
		<Typography variant='body2' sx={{ textAlign: 'center', color: 'red', marginTop: '1rem' }}>
			{errorMsg}
		</Typography>
	);

	const signIn = async (e: FormEvent) => {
		e.preventDefault();
		try {
			const userCredential = await signInWithEmailAndPassword(auth, email, password);
			const firebaseUser = userCredential.user;

			if (!firebaseUser.emailVerified) {
				setErrorMsg(AuthFormErrorMessages.EMAIL_NOT_VERIFIED);
				return;
			}

			// Ensure user document exists in Firestore
			const userRef = doc(db, 'users', firebaseUser.uid);
			const userDoc = await getDoc(userRef);
			if (!userDoc.exists()) {
				// Create the document if it doesn't exist
				await setDoc(userRef, {
					firebaseUserId: firebaseUser.uid,
					email: firebaseUser.email,
					activeChatId: '', // Initialize activeChatId
				});
			}

			// Fetch and handle user data from your backend API
			await fetchUserData(firebaseUser.uid);
			const updatedUser = queryClient.getQueryData<User>('userData');

			if (updatedUser) {
				await fetchOrganisationData(orgId);

				localStorage.setItem('role', updatedUser.role);
				localStorage.setItem('orgId', '61b23' + orgId + '078a9');

				setUserId(updatedUser._id);
				setOrgId(orgId);
				setUserRole(updatedUser.role);

				if (!updatedUser.isActive) {
					navigate(`/`);
				} else if (updatedUser.role === Roles.USER) {
					navigate(`/dashboard/user/${updatedUser._id}`);
				} else if (updatedUser.role === Roles.ADMIN) {
					navigate(`/admin/dashboard/user/${updatedUser._id}`);
				}

				// Clear inputs and handle success state
				setEmail('');
				setUsername('');
				setPassword('');
				setErrorMsg(undefined);

				// Load user-specific course and lesson data if the user is not an admin
				if (updatedUser.role !== Roles.ADMIN) {
					const userCourseResponse = await axios.get(`${base_url}/usercourses/user/${updatedUser._id}`);
					const userCourseData: UserCoursesIdsWithCourseIds[] = userCourseResponse.data.response.reduce(
						(acc: UserCoursesIdsWithCourseIds[], value: UserCoursesByUserId) => {
							if (value.courseId && value.courseId._id) {
								acc.push({
									courseId: value.courseId._id,
									userCourseId: value._id,
									isCourseCompleted: value.isCompleted,
									isCourseInProgress: value.isInProgress,
									courseTitle: value.courseId.title,
									createdAt: value.createdAt,
									isActive: value.isActive,
									validUntil: value.validUntil,
								});
							}
							return acc;
						},
						[]
					);
					localStorage.setItem('userCourseData', JSON.stringify(userCourseData));

					// Load user lesson data and store in local storage
					const userLessonResponse = await axios.get(`${base_url}/userlessons/user/${updatedUser._id}`);
					const userLessonData: UserLessonDataStorage[] = userLessonResponse?.data.response?.map((userLesson: UserLessonsByUserId) => ({
						lessonId: userLesson?.lessonId?._id,
						userLessonId: userLesson?._id,
						courseId: userLesson?.courseId,
						isCompleted: userLesson?.isCompleted,
						isInProgress: userLesson?.isInProgress,
						currentQuestion: userLesson?.currentQuestion,
						teacherFeedback: userLesson?.teacherFeedback,
						isFeedbackGiven: userLesson?.isFeedbackGiven,
						updatedAt: userLesson?.updatedAt,
					}));
					localStorage.setItem('userLessonData', JSON.stringify(userLessonData));
				}
			}
		} catch (error) {
			const firebaseError = error as AuthError;
			if (firebaseError.code === 'auth/invalid-credential') {
				setErrorMsg(AuthFormErrorMessages.INVALID_CREDENTIALS);
			}
			console.log(firebaseError, 'Failed to sign in');
		}
	};

	const handlePasswordReset = async () => {
		try {
			await sendPasswordResetEmail(auth, email);
			setResetPasswordMsg(true);
			setEmail('');
			setActiveForm(AuthForms.SIGN_IN);
			setIsResetPassword(false);
		} catch (error) {
			if (error instanceof FirebaseError) {
				switch (error.code) {
					case 'auth/network-request-failed':
						setErrorMsg(AuthFormErrorMessages.NETWORK_ERROR);
				}
			}
			console.log(error);
			setErrorMsg(AuthFormErrorMessages.UNKNOWN_ERROR_OCCURRED);
		}
	};

	const validatePassword = (password: string): AuthFormErrorMessages | null => {
		const minLength = 6;
		// const hasUppercase = /[A-Z]/.test(password);
		// const hasLowercase = /[a-z]/.test(password);
		const hasNumber = /\d/.test(password);
		// const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
		const hasLetter = /[a-zA-Z]/.test(password);

		if (password.length < minLength) {
			return AuthFormErrorMessages.PASSWORD_TOO_SHORT;
		}
		if (!hasLetter) {
			return AuthFormErrorMessages.PASSWORD_NO_LETTER;
		}
		// if (!hasUppercase) {
		// 	return AuthFormErrorMessages.PASSWORD_NO_UPPERCASE;
		// }
		// if (!hasLowercase) {
		// 	return AuthFormErrorMessages.PASSWORD_NO_LOWERCASE;
		// }
		if (!hasNumber) {
			return AuthFormErrorMessages.PASSWORD_NO_NUMBER;
		}
		// if (!hasSpecialChar) {
		// 	return AuthFormErrorMessages.PASSWORD_NO_SPECIAL_CHAR;
		// }
		return null;
	};

	const signUp = async (e: FormEvent) => {
		e.preventDefault();

		const passwordValidationError = validatePassword(password);
		if (passwordValidationError) {
			setErrorMsg(passwordValidationError);
			return;
		}

		try {
			// Step 1: Create user with Firebase Authentication
			const userCredential = await createUserWithEmailAndPassword(auth, email, password);
			const user = userCredential.user;

			// Step 2: Send email verification
			await sendEmailVerification(user);

			// Step 3: Create a Firestore document for the user
			const userRef = doc(db, 'users', user.uid); // Create a Firestore document reference
			await setDoc(userRef, {
				firebaseUserId: user.uid, // Store the Firebase user ID
				email: user.email,
				username: username, // Store the username entered during sign-up
				activeChatId: '', // Initialize `activeChatId` to an empty string
				createdAt: new Date(), // Optionally store when the user was created
			});

			// Step 4: Send user data to your backend server (optional, if needed)
			await axios.post(`${base_url}/users/signup`, {
				firstName: firstName.trim(),
				lastName: lastName.trim(),
				username: username.trim(),
				orgCode: organisationCode,
				firebaseUserId: user.uid,
				email: email.trim(),
				phone,
				countryCode: location?.countryCode,
			});

			// Handle UI updates after successful sign-up
			if (user) {
				setActiveForm(AuthForms.SIGN_IN);
				setFirstName('');
				setLastName('');
				setEmail('');
				setPassword('');
				setUsername('');
				setPhone('');
				setOrgCode('');
				setErrorMsg(undefined);
				setSignUpMessage(true);
				setShowPassword(false);
			}
		} catch (error) {
			if (axios.isAxiosError(error) && error.response?.status === 400 && error.response?.data?.message === 'username') {
				setErrorMsg(AuthFormErrorMessages.USERNAME_EXISTS);
			} else if (axios.isAxiosError(error) && error.response?.status === 400 && error.response?.data?.message === 'phone') {
				setErrorMsg(AuthFormErrorMessages.PHONE_NUMBER_EXISTS);
			} else if (error instanceof FirebaseError) {
				handleFirebaseError(error);
			}
		}
	};

	const handleFirebaseError = (error: FirebaseError) => {
		switch (error.code) {
			case 'auth/email-already-in-use':
				setErrorMsg(AuthFormErrorMessages.EMAIL_EXISTS);
				break;
			default:
				setErrorMsg(AuthFormErrorMessages.UNKNOWN_ERROR_OCCURRED);
		}
	};

	const sharedBtnStyles = theme.tabBtnAuth || {};
	const submitBtnStyles = theme.submitBtn || {};

	const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		const regex = /^(?![._])(?!.*[._]$)[a-zA-Z0-9._]*$/; // No start/end with _ or .

		if (regex.test(value)) {
			setUsername(value.trim()); // Only set the username if it matches the pattern
		}
	};

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'center',
				alignItems: 'center',
				backgroundColor: '#FDF7F0',
				height: '100vh',
				padding: isRotated ? '5rem 0' : '',
			}}>
			<Box>
				<Typography variant='h1' sx={{ fontSize: '2.5rem', mb: '1.5rem' }}>
					KAIZENGLISH
				</Typography>
			</Box>
			<Box sx={styles.formContainerStyles(isVerySmallScreen, isSmallScreen, isRotated, isRotatedMedium)}>
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
					{!isResetPassword && (
						<>
							<Button
								fullWidth
								onClick={() => {
									setActiveForm(AuthForms.SIGN_IN);
									setShowPassword(false);
									if (activeForm !== AuthForms.SIGN_IN) {
										setErrorMsg(undefined);
										setFirstName('');
										setLastName('');
										setEmail('');
										setUsername('');
										setPassword('');
										setPhone('');
									}
								}}
								size='large'
								sx={{
									...sharedBtnStyles,
									padding: isRotated ? '0.5rem' : '1rem 0',
									backgroundColor: activeForm !== AuthForms.SIGN_IN ? 'lightgray' : null,
									borderTop: activeForm === AuthForms.SIGN_IN ? `solid 0.3rem ${theme.bgColor?.greenPrimary}` : 'solid 0.3rem lightgray',
									fontSize: isMobileSize ? '0.9rem' : '1.15rem',
								}}>
								Log In
							</Button>
							<Button
								fullWidth
								onClick={() => {
									setActiveForm(AuthForms.SIGN_UP);
									setShowPassword(false);
									if (activeForm !== AuthForms.SIGN_UP) {
										setEmail('');
										setUsername('');
										setPassword('');
										setOrgCode('');
										setPhone('');
										setErrorMsg(undefined);
									}
								}}
								size='large'
								sx={{
									...sharedBtnStyles,
									padding: isRotated ? '0.5rem' : '1rem 0',
									backgroundColor: activeForm !== AuthForms.SIGN_UP ? 'lightgray' : null,
									borderTop: activeForm === AuthForms.SIGN_UP ? `solid 0.3rem ${theme.bgColor?.greenPrimary}` : 'solid 0.3rem lightgray',
									fontSize: isMobileSize ? '0.9rem' : '1.15rem',
								}}>
								Register
							</Button>
						</>
					)}
				</Box>

				<Snackbar open={signUpMessage} autoHideDuration={15000} onClose={() => setSignUpMessage(false)} anchorOrigin={{ vertical, horizontal }}>
					<Alert onClose={() => setSignUpMessage(false)} severity='success' sx={{ width: '100%', fontSize: isMobileSize ? '0.7rem' : undefined }}>
						You successfully signed up! Please verify your email address.
					</Alert>
				</Snackbar>

				<Box sx={{ display: 'flex', justifyContent: 'center' }}>
					{
						{
							[AuthForms.SIGN_IN]: (
								<Box sx={{ marginTop: '1.5rem', width: isVerySmallScreen ? '85%' : '80%' }}>
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
												onChange={(e) => {
													setEmail(e.target.value.trim());
													setErrorMsg(undefined);
												}}
												value={email}
											/>
											<CustomTextField
												label='Password'
												type={showPassword ? TextFieldTypes.TEXT : TextFieldTypes.PASSWORD}
												onChange={(e) => {
													setPassword(e.target.value.trim());
													setErrorMsg(undefined);
												}}
												value={password}
												InputProps={{
													endAdornment: (
														<InputAdornment position='end'>
															<IconButton onClick={togglePasswordVisibility} edge='end'>
																{!showPassword ? (
																	<Visibility sx={{ fontSize: isMobileSize ? '1rem' : '1.25rem' }} />
																) : (
																	<VisibilityOff sx={{ fontSize: isMobileSize ? '1rem' : '1.25rem' }} />
																)}
															</IconButton>
														</InputAdornment>
													),
												}}
											/>

											<Box sx={{ width: '100%' }}>
												<Typography
													onClick={() => {
														setActiveForm(AuthForms.RESET);
														setIsResetPassword(true);
														setEmail('');
													}}
													sx={{
														cursor: 'pointer',
														':hover': {
															textDecoration: 'underline',
														},
														fontSize: isMobileSize ? '0.7rem' : '0.8rem',
													}}>
													Forgot Your Password?
												</Typography>
											</Box>
										</Box>
										<Button variant='contained' fullWidth sx={submitBtnStyles} type='submit'>
											Log In
										</Button>
									</form>
								</Box>
							),
							[AuthForms.SIGN_UP]: (
								<Box sx={{ marginTop: '1.5rem', width: isVerySmallScreen ? '85%' : '80%' }}>
									<form onSubmit={signUp}>
										<Box
											sx={{
												display: 'flex',
												flexDirection: 'column',
												justifyContent: 'center',
												alignItems: 'flex-start',
											}}>
											<Box sx={{ display: 'flex', width: '100%' }}>
												<CustomTextField
													label='First Name'
													type={TextFieldTypes.TEXT}
													onChange={(e) => {
														setFirstName(e.target.value.trim());
														setErrorMsg(undefined);
													}}
													value={firstName}
												/>
												<CustomTextField
													label='Last Name'
													type={TextFieldTypes.TEXT}
													onChange={(e) => {
														setLastName(e.target.value.trim());
														setErrorMsg(undefined);
													}}
													value={lastName}
													sx={{ ml: '0.5rem' }}
												/>
											</Box>
											<CustomTextField
												label='Email Address'
												type={TextFieldTypes.EMAIL}
												onChange={(e) => {
													setEmail(e.target.value.trim());
													setErrorMsg(undefined);
												}}
												value={email}
											/>

											<Box sx={{ width: '100%', mb: '1.5rem' }}>
												<PhoneInput
													country={'tr'}
													enableSearch={true}
													inputStyle={{ width: '100%', height: '2rem', fontFamily: 'Poppins' }}
													containerStyle={{ marginBottom: '0.85rem', color: theme.textColor?.secondary.main, fontFamily: 'Poppins' }}
													value={phone}
													onChange={(phoneNumber, country) => {
														const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
														setPhone(formattedNumber);
														setErrorMsg(undefined);
													}}
												/>
											</Box>

											<Box sx={{ display: 'flex', width: '110%' }}>
												<CustomTextField
													label='Username'
													type={TextFieldTypes.TEXT}
													onChange={handleUsernameChange}
													value={username}
													InputProps={{ inputProps: { maxLength: 15 } }}
												/>
												<Box sx={{ display: 'flex', width: '10%', justifyContent: 'flex-end', mb: '0.85rem' }}>
													<Tooltip title='Username Rules' placement='right'>
														<IconButton
															onClick={() => setIsUserNameImageInfoModalOpen(true)}
															sx={{
																':hover': {
																	backgroundColor: 'transparent',
																},
															}}>
															<Info sx={{ fontSize: isMobileSize ? '1rem' : '1.25rem' }} />
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

											<Box sx={{ display: 'flex', width: '110%' }}>
												<CustomTextField
													label='Password'
													type={showPassword ? TextFieldTypes.TEXT : TextFieldTypes.PASSWORD}
													onChange={(e) => {
														setPassword(e.target.value.trim());
														setErrorMsg(undefined);
													}}
													value={password}
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
																		<Visibility sx={{ fontSize: isMobileSize ? '1rem' : '1.25rem' }} />
																	) : (
																		<VisibilityOff sx={{ fontSize: isMobileSize ? '1rem' : '1.25rem' }} />
																	)}
																</IconButton>
															</InputAdornment>
														),
													}}
												/>
												<Box sx={{ display: 'flex', width: '10%', justifyContent: 'flex-end', mt: '-1rem' }}>
													<Tooltip title='Password Rules' placement='right'>
														<IconButton
															onClick={() => setIsPasswordInfoModalOpen(true)}
															sx={{
																':hover': {
																	backgroundColor: 'transparent',
																},
															}}>
															<Info sx={{ fontSize: isMobileSize ? '1rem' : '1.25rem' }} />
														</IconButton>
													</Tooltip>
												</Box>

												<CustomDialog
													title='Password Rules'
													openModal={isPasswordInfoModalOpen}
													closeModal={() => setIsPasswordInfoModalOpen(false)}
													maxWidth='sm'>
													<DialogContent>
														<Box sx={{ width: '75%', margin: '0.5rem 0 0.5rem 2rem' }}>
															<Typography variant='body2' sx={{ mb: '0.5rem' }}>
																- Password cannot include space
															</Typography>
															<Typography variant='body2'>- Password must include at least:</Typography>
															<Box sx={{ margin: '0.75rem 0 0 3rem' }}>
																{['6 characters', '1 letter', '1 number'].map((rule, index) => (
																	<ul key={index}>
																		<li style={{ color: theme.textColor?.secondary.main }}>
																			<Typography sx={{ fontSize: '0.85rem', mb: '0.35rem' }}>{rule}</Typography>
																		</li>
																	</ul>
																))}
															</Box>
														</Box>
														<Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', mb: '0.5rem' }}>
															<CustomCancelButton onClick={() => setIsPasswordInfoModalOpen(false)}>Close</CustomCancelButton>
														</Box>
													</DialogContent>
												</CustomDialog>
											</Box>
											{/* <CustomTextField
												label='Organization Code'
												type={TextFieldTypes.TEXT}
												onChange={(e) => {
													setOrgCode(e.target.value.trim());
													setErrorMsg(undefined);
												}}
												value={orgCode}
											/> */}
										</Box>
										<Button variant='contained' fullWidth sx={submitBtnStyles} type='submit'>
											Register
										</Button>
									</form>
								</Box>
							),
							[AuthForms.RESET]: (
								<form
									style={{ marginTop: '-2rem', width: '80%' }}
									onSubmit={(e) => {
										e.preventDefault();
										handlePasswordReset();
									}}>
									<Typography variant='body1' sx={{ marginBottom: '1rem' }}>
										Reset Password
									</Typography>
									<CustomTextField
										label='Email Address'
										type='email'
										value={email}
										onChange={(e) => {
											setEmail(e.target.value.trim());
											setErrorMsg(undefined);
										}}
									/>
									<Button variant='contained' fullWidth sx={submitBtnStyles} type='submit'>
										Send Password Reset Email
									</Button>
									<Typography
										sx={{
											cursor: 'pointer',
											marginTop: '1rem',
											textAlign: 'center',
											':hover': { textDecoration: 'underline' },
											fontSize: '0.8rem',
										}}
										onClick={() => {
											setActiveForm(AuthForms.SIGN_IN);
											setIsResetPassword(false);
											setEmail('');
										}}>
										Back to Log In
									</Typography>
								</form>
							),
						}[activeForm]
					}
				</Box>

				<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
					<Typography
						variant={isMobileSize ? 'body2' : 'body1'}
						sx={{
							marginTop: '1.25rem',
							color: theme.textColor?.primary.main,
							cursor: 'pointer',
							':hover': { textDecoration: 'underline' },
						}}
						onClick={() => {
							navigate('/');
							setIsResetPassword(false);
						}}>
						Home Page
					</Typography>
				</Box>

				<Snackbar open={resetPasswordMsg} autoHideDuration={15000} onClose={() => setResetPasswordMsg(false)} anchorOrigin={{ vertical, horizontal }}>
					<Alert onClose={() => setResetPasswordMsg(false)} severity='success' sx={{ width: '100%', fontSize: isMobileSize ? '0.7rem' : undefined }}>
						Password reset email sent! Check your inbox.
					</Alert>
				</Snackbar>

				<Box>
					{errorMsg &&
						{
							[AuthFormErrorMessages.EMAIL_EXISTS]: errorMessageTypography,
							[AuthFormErrorMessages.INVALID_CREDENTIALS]: errorMessageTypography,
							[AuthFormErrorMessages.USERNAME_EXISTS]: errorMessageTypography,
							[AuthFormErrorMessages.PHONE_NUMBER_EXISTS]: errorMessageTypography,
							[AuthFormErrorMessages.EMAIL_NOT_VERIFIED]: errorMessageTypography,
							[AuthFormErrorMessages.UNKNOWN_ERROR_OCCURRED]: errorMessageTypography,
							[AuthFormErrorMessages.PASSWORD_TOO_SHORT]: errorMessageTypography,
							[AuthFormErrorMessages.PASSWORD_NO_NUMBER]: errorMessageTypography,
							[AuthFormErrorMessages.PASSWORD_NO_LETTER]: errorMessageTypography,
							[AuthFormErrorMessages.NETWORK_ERROR]: errorMessageTypography,
						}[errorMsg]}
				</Box>
			</Box>
			<Box sx={{ display: 'flex', justifyContent: 'center', mt: isRotated ? '0.75rem' : '2rem', width: '100%', padding: '0 1rem' }}>
				<Typography sx={{ fontSize: isSmallScreen ? '0.55rem' : '0.65rem', position: 'absolute', bottom: 3 }}>
					&copy; 2025 Webnexia Software Solutions Ltd. All rights reserved.
				</Typography>
			</Box>
		</Box>
	);
};

export default Auth;
