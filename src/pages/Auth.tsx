import { Alert, Box, Button, IconButton, InputAdornment, Snackbar, Tooltip, Typography } from '@mui/material';
import * as styles from '../styles/styleAuth';
import { FormEvent, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import theme from '../themes';
import { AuthFormErrorMessages, AuthForms, Roles, TextFieldTypes } from '../interfaces/enums';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import { UserAuthContext } from '../contexts/UserAuthContextProvider';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import { AuthError, createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { useQueryClient } from 'react-query';
import { User } from '../interfaces/user';
import { FirebaseError } from 'firebase/app';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { UserCoursesIdsWithCourseIds, UserLessonDataStorage } from '../contexts/UserCourseLessonDataContextProvider';
import { UserCoursesByUserId } from '../interfaces/userCourses';
import { UserLessonsByUserId } from '../interfaces/userLesson';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthProps {
	setUserRole: React.Dispatch<React.SetStateAction<string | null>>;
}

const Auth = ({ setUserRole }: AuthProps) => {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const vertical = 'top';
	const horizontal = 'center';

	const { setUserId, fetchUserData } = useContext(UserAuthContext);
	const { fetchOrganisationData, setOrgId } = useContext(OrganisationContext);

	const [activeForm, setActiveForm] = useState<AuthForms>(AuthForms.SIGN_UP);

	const [errorMsg, setErrorMsg] = useState<AuthFormErrorMessages>();
	const [signUpMessage, setSignUpMessage] = useState<boolean>(false);

	const [username, setUsername] = useState<string>('');
	const [email, setEmail] = useState<string>('');
	const [password, setPassword] = useState<string>('');
	const [orgCode, setOrgCode] = useState<string>('6RS1YS');

	const [showPassword, setShowPassword] = useState(false);

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
					username: username || 'Unknown',
					activeChatId: '', // Initialize activeChatId
				});
			}

			// Fetch and handle user data from your backend API
			await fetchUserData(firebaseUser.uid);
			const updatedUser = queryClient.getQueryData<User>('userData');

			if (updatedUser) {
				await fetchOrganisationData(updatedUser?.orgId);

				localStorage.setItem('role', updatedUser.role);
				localStorage.setItem('orgId', '61b23' + updatedUser.orgId + '078a9');

				setUserId(updatedUser._id);
				setOrgId(updatedUser.orgId);
				setUserRole(updatedUser.role);

				if (updatedUser.role === Roles.USER) {
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
						lessonId: userLesson.lessonId._id,
						userLessonId: userLesson._id,
						courseId: userLesson.courseId,
						isCompleted: userLesson.isCompleted,
						isInProgress: userLesson.isInProgress,
						currentQuestion: userLesson.currentQuestion,
						teacherFeedback: userLesson.teacherFeedback,
						isFeedbackGiven: userLesson.isFeedbackGiven,
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
				username: username.trim(),
				orgCode,
				firebaseUserId: user.uid,
				email,
			});

			// Handle UI updates after successful sign-up
			if (user) {
				setActiveForm(AuthForms.SIGN_IN);
				setEmail('');
				setPassword('');
				setUsername('');
				setOrgCode('');
				setErrorMsg(undefined);
				setSignUpMessage(true);
				setShowPassword(false);
			}
		} catch (error) {
			if (axios.isAxiosError(error) && error.response?.status === 400 && error.response?.data?.message === 'Username is already taken.') {
				setErrorMsg(AuthFormErrorMessages.USERNAME_EXISTS);
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
							setShowPassword(false);
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
						Register
					</Button>
				</Box>

				<Snackbar open={signUpMessage} autoHideDuration={15000} onClose={() => setSignUpMessage(false)} anchorOrigin={{ vertical, horizontal }}>
					<Alert onClose={() => setSignUpMessage(false)} severity='success' sx={{ width: '100%' }}>
						You successfully signed up! Please verify your email address.
					</Alert>
				</Snackbar>

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
																{!showPassword ? <Visibility /> : <VisibilityOff />}
															</IconButton>
														</InputAdornment>
													),
												}}
											/>
										</Box>
										<Button variant='contained' fullWidth sx={submitBtnStyles} type='submit'>
											Log In
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
												onChange={(e) => {
													setEmail(e.target.value.trim());
													setErrorMsg(undefined);
												}}
												value={email}
											/>

											<Tooltip title='Max 15 Characters' placement='top'>
												<CustomTextField
													label='Username'
													type={TextFieldTypes.TEXT}
													onChange={(e) => setUsername(e.target.value.trim())}
													value={username}
													InputProps={{ inputProps: { maxLength: 15 } }}
												/>
											</Tooltip>

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
																{!showPassword ? <Visibility /> : <VisibilityOff />}
															</IconButton>
														</InputAdornment>
													),
												}}
											/>
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
								[AuthFormErrorMessages.INVALID_CREDENTIALS]: errorMessageTypography,
								[AuthFormErrorMessages.USERNAME_EXISTS]: errorMessageTypography,
								[AuthFormErrorMessages.EMAIL_NOT_VERIFIED]: errorMessageTypography,
								[AuthFormErrorMessages.UNKNOWN_ERROR_OCCURRED]: errorMessageTypography,
								[AuthFormErrorMessages.PASSWORD_TOO_SHORT]: errorMessageTypography,
								[AuthFormErrorMessages.PASSWORD_NO_NUMBER]: errorMessageTypography,
								[AuthFormErrorMessages.PASSWORD_NO_LETTER]: errorMessageTypography,
							}[errorMsg]}
					</Box>
				</Box>
			</Box>
		</Box>
	);
};

export default Auth;
