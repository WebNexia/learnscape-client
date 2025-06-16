import { Alert, Box, Button, DialogContent, IconButton, InputAdornment, Snackbar, Tooltip, Typography } from '@mui/material';
import * as styles from '../styles/styleAuth';
import { FormEvent, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '@utils/axiosInstance';
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
import 'react-phone-input-2/lib/style.css';
import logo from '../assets/logo.png';

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

	const { setUserId, fetchUserData, setUser } = useContext(UserAuthContext);
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
	const [isResendingVerification, setIsResendingVerification] = useState<boolean>(false);

	const togglePasswordVisibility = () => {
		setShowPassword((prevShowPassword) => !prevShowPassword);
	};

	const errorMessageTypography = (
		<Typography
			variant='body2'
			sx={{
				textAlign: 'center',
				color: '#ff4d4f',
				padding: '0.5rem 1rem',
				borderRadius: '0.5rem',
				marginTop: '0.75rem',
				fontSize: isMobileSize ? '0.75rem' : '0.85rem',
				fontFamily: 'Varela Round',
			}}>
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

			// Update email verification status in MongoDB if needed
			if (updatedUser && !updatedUser.isEmailVerified) {
				await axiosInstance.patch(`${base_url}/users/${updatedUser._id}`, {
					isEmailVerified: true,
					email: firebaseUser.email,
					activeChatId: userDoc.data()?.activeChatId || null,
				});
				setUser((prev) =>
					prev
						? {
								...prev,
								isEmailVerified: true,
								email: firebaseUser.email!,
								activeChatId: userDoc.data()?.activeChatId || null,
							}
						: prev
				);
			} else if (firebaseUser.email && updatedUser?.email !== firebaseUser.email) {
				// Sync email and activeChatId to MongoDB if different
				await axiosInstance.patch(`${base_url}/users/${updatedUser?._id}`, {
					email: firebaseUser.email,
					activeChatId: userDoc.data()?.activeChatId || null,
				});
				setUser((prev) =>
					prev
						? {
								...prev,
								email: firebaseUser.email!,
								activeChatId: userDoc.data()?.activeChatId || null,
							}
						: prev
				);
			}

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
					const userCourseResponse = await axiosInstance.get(`${base_url}/usercourses/user/${updatedUser._id}`);
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
					const userLessonResponse = await axiosInstance.get(`${base_url}/userlessons/user/${updatedUser._id}`);
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
			} else if (firebaseError.code === 'auth/visibility-check-was-unavailable') {
				setErrorMsg(AuthFormErrorMessages.VISIBILITY_CHECK_ERROR);
			} else {
				console.log(firebaseError, 'Failed to sign in');
				setErrorMsg(AuthFormErrorMessages.UNKNOWN_ERROR_OCCURRED);
			}
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

		// Phone number validation
		if (!phone || phone.length <= 3 || !/^\+\d{10,15}$/.test(phone)) {
			setErrorMsg(AuthFormErrorMessages.INVALID_PHONE_NUMBER);
			return;
		}

		// Username validation
		if (username.length < 5) {
			setErrorMsg(AuthFormErrorMessages.USERNAME_TOO_SHORT);
			return;
		}

		if (username.length > 15) {
			setErrorMsg(AuthFormErrorMessages.USERNAME_TOO_LONG);
			return;
		}

		// Password validation
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
			const userRef = doc(db, 'users', user.uid);
			await setDoc(userRef, {
				firebaseUserId: user.uid,
				email: user.email,
				username: username,
				activeChatId: null,
				createdAt: new Date(),
			});

			// Step 4: Create MongoDB user record immediately
			const signupData = {
				firstName: firstName.trim(),
				lastName: lastName.trim(),
				username: username.trim(),
				orgCode: organisationCode,
				email: email.trim().toLowerCase(),
				phone,
				countryCode: location?.countryCode,
				firebaseUserId: user.uid,
				isEmailVerified: false,
			};

			await axiosInstance.post(`${base_url}/users/signup`, signupData);

			// Handle UI updates after successful sign-up
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

	const handleResendVerification = async () => {
		if (!email) return;
		setIsResendingVerification(true);
		try {
			const userCredential = await signInWithEmailAndPassword(auth, email, password);
			await sendEmailVerification(userCredential.user);
			setErrorMsg(AuthFormErrorMessages.VERIFICATION_EMAIL_SENT);
		} catch (error) {
			console.error('Error resending verification email:', error);
			setErrorMsg(AuthFormErrorMessages.VERIFICATION_EMAIL_ERROR);
		} finally {
			setIsResendingVerification(false);
		}
	};

	return (
		<Box
			sx={{
				height: '100vh',
				display: 'flex',
				flexDirection: 'column',
				backgroundColor: '#FDF7F0',
			}}>
			{/* Main content */}
			<Box
				sx={{
					flex: 1,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'flex-start',
					position: 'relative',
					overflow: 'hidden',
					paddingTop: '10vh',
				}}>
				{/* Background Pattern */}
				<Box
					sx={{
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background: `
							radial-gradient(circle at 20% 20%, rgba(77, 123, 139, 0.08) 0%, transparent 50%),
							radial-gradient(circle at 80% 80%, rgba(1, 67, 90, 0.08) 0%, transparent 50%)
						`,
						zIndex: 0,
					}}
				/>
				{/* Logo and Title */}
				<Box sx={{ position: 'relative', zIndex: 1, mb: '1.5rem', mt: '-2rem' }}>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/')}>
						<img src={logo} alt='logo' style={{ height: isRotated ? '15vh' : isSmallScreen ? '8vh' : '11vh' }} />
					</Box>
				</Box>

				{/* Auth Form Container */}
				<Box
					sx={{
						...styles.formContainerStyles(isVerySmallScreen, isSmallScreen, isRotated, isRotatedMedium),
						'position': 'relative',
						'zIndex': 1,
						'backdropFilter': 'blur(10px)',
						'backgroundColor': 'rgba(255, 255, 255, 0.95)',
						'borderRadius': '1rem',
						'boxShadow': '0 8px 32px rgba(0, 0, 0, 0.08)',
						'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
						'border': '1px solid rgba(255, 255, 255, 0.2)',
						'&:hover': {
							boxShadow: '0 12px 48px rgba(0, 0, 0, 0.12)',
							transform: 'translateY(-2px)',
						},
						'animation': 'fadeIn 0.5s ease-out',
						'@keyframes fadeIn': {
							'0%': {
								opacity: 0,
								transform: 'translateY(10px)',
							},
							'100%': {
								opacity: 1,
								transform: 'translateY(0)',
							},
						},
					}}>
					{/* Auth Tabs */}
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							width: '100%',
							position: 'absolute',
							top: 0,
							left: 0,
							borderRadius: '1rem 1rem 0 0',
							overflow: 'hidden',
						}}>
						{!isResetPassword && (
							<>
								<Button
									fullWidth
									onClick={(e) => {
										e.preventDefault();
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
										'padding': '0.75rem',
										'backgroundColor': activeForm !== AuthForms.SIGN_IN ? 'rgba(0, 0, 0, 0.07)' : 'transparent',
										'borderTop': 'none',
										'fontSize': isMobileSize ? '0.85rem' : '1rem',
										'fontWeight': 500,
										'letterSpacing': '1px',
										'transition': 'all 0.2s ease',
										'position': 'relative',
										'&:after': {
											content: '""',
											position: 'absolute',
											bottom: 0,
											left: '50%',
											transform: 'translateX(-50%)',
											width: activeForm === AuthForms.SIGN_IN ? '30%' : '0%',
											height: '2px',
											backgroundColor: theme.bgColor?.greenPrimary,
											transition: 'width 0.3s ease',
										},
										'&:hover': {
											'backgroundColor': 'rgba(0, 0, 0, 0.04)',
											'&:after': {
												width: '30%',
											},
										},
									}}>
									GİRİŞ YAP
								</Button>
								<Button
									fullWidth
									onClick={(e) => {
										e.preventDefault();
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
										'fontFamily': 'Varela Round',
										'padding': '0.75rem',
										'backgroundColor': activeForm !== AuthForms.SIGN_UP ? 'rgba(0, 0, 0, 0.07)' : 'transparent',
										'borderTop': 'none',
										'fontSize': isMobileSize ? '0.85rem' : '1rem',
										'fontWeight': 500,
										'letterSpacing': '1px',
										'transition': 'all 0.2s ease',
										'position': 'relative',
										'&:after': {
											content: '""',
											position: 'absolute',
											bottom: 0,
											left: '50%',
											transform: 'translateX(-50%)',
											width: activeForm === AuthForms.SIGN_UP ? '30%' : '0%',
											height: '2px',
											backgroundColor: theme.bgColor?.greenPrimary,
											transition: 'width 0.3s ease',
										},
										'&:hover': {
											'backgroundColor': 'rgba(0, 0, 0, 0.04)',
											'&:after': {
												width: '30%',
											},
										},
									}}>
									Kayıt Ol
								</Button>
							</>
						)}
					</Box>

					{/* Form Content */}
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'center',
						}}>
						{
							{
								[AuthForms.SIGN_IN]: (
									<Box sx={{ marginTop: '0.25rem', width: isVerySmallScreen ? '85%' : '80%' }}>
										<form onSubmit={signIn}>
											<Box
												sx={{
													display: 'flex',
													flexDirection: 'column',
													justifyContent: 'center',
													alignItems: 'center',
												}}>
												<CustomTextField
													label='E-posta Adresi'
													type={TextFieldTypes.EMAIL}
													onChange={(e) => {
														setEmail(e.target.value.trim());
														setErrorMsg(undefined);
													}}
													value={email}
													sx={{
														'& .MuiOutlinedInput-root': {
															'fontFamily': 'Varela Round',
															'borderRadius': '0.35rem',
															'transition': 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
															'&:hover': {
																backgroundColor: 'rgba(0, 0, 0, 0.02)',
															},
															'&.Mui-focused': {
																boxShadow: '0 0 0 2px rgba(30, 194, 139, 0.2)',
															},
														},
														'& .MuiInputBase-input': { fontFamily: 'Varela Round' },
														'& .MuiInputBase-input::placeholder': { fontFamily: 'Varela Round', opacity: 1 },
														'& .MuiInputLabel-root': { fontFamily: 'Varela Round' },
													}}
												/>
												<CustomTextField
													label='Şifre'
													type={showPassword ? TextFieldTypes.TEXT : TextFieldTypes.PASSWORD}
													onChange={(e) => {
														setPassword(e.target.value.trim());
														setErrorMsg(undefined);
													}}
													value={password}
													sx={{
														'& .MuiOutlinedInput-root': {
															'fontFamily': 'Varela Round',
															'borderRadius': '0.35rem',
															'transition': 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
															'&:hover': {
																backgroundColor: 'rgba(0, 0, 0, 0.02)',
															},
															'&.Mui-focused': {
																boxShadow: '0 0 0 2px rgba(30, 194, 139, 0.2)',
															},
														},
														'& .MuiInputBase-input': { fontFamily: 'Varela Round' },
														'& .MuiInputBase-input::placeholder': { fontFamily: 'Varela Round', opacity: 1 },
														'& .MuiInputLabel-root': { fontFamily: 'Varela Round' },
													}}
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
															'cursor': 'pointer',
															':hover': {
																textDecoration: 'underline',
															},
															'fontSize': isMobileSize ? '0.7rem' : '0.8rem',
															'fontFamily': 'Varela Round',
															'color': 'gray',
														}}>
														Şifrenizi mi unuttunuz?
													</Typography>
												</Box>
											</Box>
											<Button
												variant='contained'
												fullWidth
												sx={{
													...submitBtnStyles,
													'fontFamily': 'Varela Round',
													'borderRadius': '0.35rem',
													'padding': '0.45rem',
													'fontSize': '0.9rem',
													'fontWeight': 400,
													'letterSpacing': '0.3px',
													'textTransform': 'none',
													'boxShadow': '0 4px 12px rgba(30, 194, 139, 0.15)',
													'transition': 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
													'&:hover': {
														transform: 'translateY(-1px)',
														boxShadow: '0 6px 16px rgba(30, 194, 139, 0.2)',
													},
													'&:active': {
														transform: 'translateY(0)',
														boxShadow: '0 4px 12px rgba(30, 194, 139, 0.15)',
													},
												}}
												type='submit'>
												Giriş Yap
											</Button>
										</form>
									</Box>
								),
								[AuthForms.SIGN_UP]: (
									<Box sx={{ marginTop: '0.5rem', width: isVerySmallScreen ? '85%' : '80%' }}>
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
														label='İsim'
														type={TextFieldTypes.TEXT}
														onChange={(e) => {
															setFirstName(e.target.value.trim());
															setErrorMsg(undefined);
														}}
														value={firstName}
														sx={{
															'& .MuiOutlinedInput-root': {
																'fontFamily': 'Varela Round',
																'borderRadius': '0.35rem',
																'transition': 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
																'&:hover': {
																	backgroundColor: 'rgba(0, 0, 0, 0.02)',
																},
																'&.Mui-focused': {
																	boxShadow: '0 0 0 2px rgba(30, 194, 139, 0.2)',
																},
															},
															'& .MuiInputBase-input': { fontFamily: 'Varela Round' },
															'& .MuiInputBase-input::placeholder': { fontFamily: 'Varela Round', opacity: 1 },
															'& .MuiInputLabel-root': { fontFamily: 'Varela Round' },
														}}
													/>
													<CustomTextField
														label='Soyisim'
														type={TextFieldTypes.TEXT}
														onChange={(e) => {
															setLastName(e.target.value.trim());
															setErrorMsg(undefined);
														}}
														value={lastName}
														sx={{
															'& .MuiOutlinedInput-root': {
																'fontFamily': 'Varela Round',
																'borderRadius': '0.35rem',
																'transition': 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
																'&:hover': {
																	backgroundColor: 'rgba(0, 0, 0, 0.02)',
																},
																'&.Mui-focused': {
																	boxShadow: '0 0 0 2px rgba(30, 194, 139, 0.2)',
																},
															},
															'& .MuiInputBase-input': { fontFamily: 'Varela Round' },
															'& .MuiInputBase-input::placeholder': { fontFamily: 'Varela Round', opacity: 1 },
															'& .MuiInputLabel-root': { fontFamily: 'Varela Round' },
															'ml': '0.5rem',
														}}
													/>
												</Box>

												<Box sx={{ display: 'flex', width: '110%', alignItems: 'flex-start' }}>
													<CustomTextField
														label='Kullanıcı Adı'
														type={TextFieldTypes.TEXT}
														onChange={handleUsernameChange}
														value={username}
														InputProps={{ inputProps: { maxLength: 15 } }}
														sx={{
															'& .MuiOutlinedInput-root': {
																'fontFamily': 'Varela Round',
																'borderRadius': '0.35rem',
																'transition': 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
																'&:hover': {
																	backgroundColor: 'rgba(0, 0, 0, 0.02)',
																},
																'&.Mui-focused': {
																	boxShadow: '0 0 0 2px rgba(30, 194, 139, 0.2)',
																},
															},
															'& .MuiInputBase-input': { fontFamily: 'Varela Round' },
															'& .MuiInputBase-input::placeholder': { fontFamily: 'Varela Round', opacity: 1 },
															'& .MuiInputLabel-root': { fontFamily: 'Varela Round' },
														}}
													/>
													<Box sx={{ display: 'flex', width: '10%', justifyContent: 'flex-end', mt: '-0.5rem' }}>
														<Tooltip title='Kullanıcı Adı Kuralları' placement='right'>
															<IconButton
																onClick={() => setIsUserNameImageInfoModalOpen(true)}
																sx={{
																	'ml': '0.5rem',
																	'mt': '0.5rem',
																	':hover': {
																		backgroundColor: 'transparent',
																	},
																}}>
																<Info sx={{ fontSize: isMobileSize ? '1rem' : '1.25rem' }} />
															</IconButton>
														</Tooltip>
													</Box>
												</Box>

												<Box sx={{ width: '100%', mb: '1.75rem' }}>
													<PhoneInput
														country={location?.countryCode?.toLowerCase() || 'tr'}
														enableSearch={true}
														searchPlaceholder='Ülke arayın...'
														searchNotFound='Ülke bulunamadı'
														enableAreaCodes={false}
														countryCodeEditable={false}
														inputProps={{ required: true }}
														inputStyle={{
															width: '100%',
															height: '2.25rem',
															fontFamily: 'Varela Round',
															fontSize: isMobileSize ? '0.85rem' : '0.9rem',
															borderRadius: '0.35rem',
															border: '1px solid rgba(0, 0, 0, 0.23)',
															transition: 'all 0.2s ease',
														}}
														containerStyle={{
															marginBottom: '0.5rem',
															color: theme.textColor?.secondary.main,
															fontFamily: 'Varela Round',
															transition: 'all 0.2s ease',
														}}
														buttonStyle={{
															borderRadius: '0.35rem 0 0 0.35rem',
															border: '1px solid rgba(0, 0, 0, 0.23)',
															backgroundColor: 'transparent',
														}}
														dropdownStyle={{
															borderRadius: '0.35rem',
															border: '1px solid rgba(0, 0, 0, 0.23)',
															boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
															fontFamily: 'Varela Round',
														}}
														searchStyle={{
															width: '100%',
															height: '2rem',
															fontFamily: 'Varela Round',
															fontSize: '0.85rem',
															borderRadius: '0.35rem',
															border: '1px solid rgba(0, 0, 0, 0.23)',
															margin: '0.5rem 0',
														}}
														value={phone}
														onChange={(phoneNumber, country) => {
															const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
															setPhone(formattedNumber);
															setErrorMsg(undefined);
														}}
													/>
												</Box>

												<Box sx={{ display: 'flex', width: '100%' }}>
													<CustomTextField
														label='E-posta Adresi'
														type={TextFieldTypes.EMAIL}
														onChange={(e) => {
															setEmail(e.target.value.trim());
															setErrorMsg(undefined);
														}}
														value={email}
														sx={{
															'& .MuiOutlinedInput-root': { fontFamily: 'Varela Round' },
															'& .MuiInputBase-input': { fontFamily: 'Varela Round' },
															'& .MuiInputBase-input::placeholder': { fontFamily: 'Varela Round', opacity: 1 },
															'& .MuiInputLabel-root': { fontFamily: 'Varela Round' },
														}}
													/>
												</Box>

												<Box sx={{ display: 'flex', width: '110%' }}>
													<CustomTextField
														label='Şifre'
														type={showPassword ? TextFieldTypes.TEXT : TextFieldTypes.PASSWORD}
														onChange={(e) => {
															setPassword(e.target.value.trim());
															setErrorMsg(undefined);
														}}
														value={password}
														sx={{
															'& .MuiOutlinedInput-root': {
																'fontFamily': 'Varela Round',
																'borderRadius': '0.35rem',
																'transition': 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
																'&:hover': {
																	backgroundColor: 'rgba(0, 0, 0, 0.02)',
																},
																'&.Mui-focused': {
																	boxShadow: '0 0 0 2px rgba(30, 194, 139, 0.2)',
																},
															},
															'& .MuiInputBase-input': { fontFamily: 'Varela Round' },
															'& .MuiInputBase-input::placeholder': { fontFamily: 'Varela Round', opacity: 1 },
															'& .MuiInputLabel-root': { fontFamily: 'Varela Round' },
														}}
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
														<Tooltip title='Şifre Kuralları' placement='right'>
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
												</Box>
											</Box>
											<Button
												variant='contained'
												fullWidth
												sx={{
													...submitBtnStyles,
													'borderRadius': '0.35rem',
													'padding': '0.45rem',
													'fontSize': '0.9rem',
													'fontWeight': 400,
													'letterSpacing': '0.3px',
													'textTransform': 'none',
													'boxShadow': '0 4px 12px rgba(30, 194, 139, 0.15)',
													'transition': 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
													'&:hover': {
														transform: 'translateY(-1px)',
														boxShadow: '0 6px 16px rgba(30, 194, 139, 0.2)',
													},
													'&:active': {
														transform: 'translateY(0)',
														boxShadow: '0 4px 12px rgba(30, 194, 139, 0.15)',
													},
												}}
												type='submit'>
												Kayıt Ol
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
										<Typography variant='body1' sx={{ marginBottom: '1rem', fontFamily: 'Varela Round' }}>
											Şifre Sıfırlama
										</Typography>
										<CustomTextField
											label='E-posta Adresi'
											type='email'
											value={email}
											onChange={(e) => {
												setEmail(e.target.value.trim());
												setErrorMsg(undefined);
											}}
											sx={{
												'& .MuiOutlinedInput-root': { fontFamily: 'Varela Round' },
												'& .MuiInputBase-input': { fontFamily: 'Varela Round' },
												'& .MuiInputBase-input::placeholder': { fontFamily: 'Varela Round', opacity: 1 },
												'& .MuiInputLabel-root': { fontFamily: 'Varela Round' },
											}}
										/>
										<Button variant='contained' fullWidth sx={submitBtnStyles} type='submit'>
											Şifre Sıfırlama E-postası Gönder
										</Button>
										<Typography
											sx={{
												'cursor': 'pointer',
												'marginTop': '1rem',
												'textAlign': 'center',
												':hover': { textDecoration: 'underline' },
												'fontSize': '0.8rem',
												'fontFamily': 'Varela Round',
											}}
											onClick={() => {
												setActiveForm(AuthForms.SIGN_IN);
												setIsResetPassword(false);
												setEmail('');
											}}>
											Giriş Yap'a Dön
										</Typography>
									</form>
								),
							}[activeForm]
						}
					</Box>

					{/* Home Page Link */}
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							mt: '1.5rem',
						}}>
						<Typography
							variant='body2'
							sx={{
								'fontFamily': 'Varela Round',
								'color': theme.textColor?.primary.main,
								'cursor': 'pointer',
								'transition': 'all 0.3s ease',
								'&:hover': {
									color: theme.bgColor?.greenPrimary,
									textDecoration: 'underline',
								},
							}}
							onClick={() => {
								navigate('/');
								setIsResetPassword(false);
							}}>
							Ana Sayfa
						</Typography>
					</Box>

					{/* Error Messages */}
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'center',
							mb: '0.5rem',
						}}>
						{errorMsg &&
							{
								[AuthFormErrorMessages.EMAIL_EXISTS]: errorMessageTypography,
								[AuthFormErrorMessages.INVALID_CREDENTIALS]: errorMessageTypography,
								[AuthFormErrorMessages.USERNAME_EXISTS]: errorMessageTypography,
								[AuthFormErrorMessages.PHONE_NUMBER_EXISTS]: errorMessageTypography,
								[AuthFormErrorMessages.EMAIL_NOT_VERIFIED]: (
									<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
										{errorMessageTypography}
										<Button
											variant='contained'
											color='primary'
											onClick={handleResendVerification}
											disabled={isResendingVerification}
											sx={{
												'mt': 1,
												'fontFamily': 'Varela Round',
												'fontSize': isMobileSize ? '0.75rem' : '0.85rem',
												'textTransform': 'none',
												'backgroundColor': theme.bgColor?.greenPrimary,
												'&:hover': {
													backgroundColor: theme.bgColor?.greenSecondary,
												},
											}}>
											{isResendingVerification ? 'Gönderiliyor...' : 'Doğrulama E-postasını Tekrar Gönder'}
										</Button>
									</Box>
								),
								[AuthFormErrorMessages.UNKNOWN_ERROR_OCCURRED]: errorMessageTypography,
								[AuthFormErrorMessages.PASSWORD_TOO_SHORT]: errorMessageTypography,
								[AuthFormErrorMessages.PASSWORD_NO_NUMBER]: errorMessageTypography,
								[AuthFormErrorMessages.PASSWORD_NO_LETTER]: errorMessageTypography,
								[AuthFormErrorMessages.NETWORK_ERROR]: errorMessageTypography,
								[AuthFormErrorMessages.INVALID_PHONE_NUMBER]: errorMessageTypography,
								[AuthFormErrorMessages.USERNAME_TOO_SHORT]: errorMessageTypography,
								[AuthFormErrorMessages.USERNAME_TOO_LONG]: errorMessageTypography,
								[AuthFormErrorMessages.VISIBILITY_CHECK_ERROR]: errorMessageTypography,
								[AuthFormErrorMessages.VERIFICATION_EMAIL_SENT]: errorMessageTypography,
								[AuthFormErrorMessages.VERIFICATION_EMAIL_ERROR]: errorMessageTypography,
							}[errorMsg]}
					</Box>
				</Box>

				{/* Success Messages */}
				<Snackbar open={signUpMessage} autoHideDuration={15000} onClose={() => setSignUpMessage(false)} anchorOrigin={{ vertical, horizontal }}>
					<Alert
						onClose={() => setSignUpMessage(false)}
						severity='success'
						sx={{
							'fontFamily': 'Varela Round',
							'width': '100%',
							'fontSize': isMobileSize ? '0.7rem' : undefined,
							'boxShadow': '0 4px 12px rgba(0, 0, 0, 0.1)',
							'borderRadius': '0.5rem',
							'& .MuiAlert-icon': {
								color: '#1EC28B',
							},
						}}>
						Kayıt işlemi başarılı! Lütfen e-posta adresinizi doğrulayın.
					</Alert>
				</Snackbar>

				<Snackbar open={resetPasswordMsg} autoHideDuration={15000} onClose={() => setResetPasswordMsg(false)} anchorOrigin={{ vertical, horizontal }}>
					<Alert
						onClose={() => setResetPasswordMsg(false)}
						severity='success'
						sx={{
							'fontFamily': 'Varela Round',
							'width': '100%',
							'fontSize': isMobileSize ? '0.7rem' : undefined,
							'boxShadow': '0 4px 12px rgba(0, 0, 0, 0.1)',
							'borderRadius': '0.5rem',
							'& .MuiAlert-icon': {
								color: '#1EC28B',
							},
						}}>
						Şifre sıfırlama e-postası gönderildi! Gelen kutunuzu kontrol edin.
					</Alert>
				</Snackbar>

				{/* Username Rules Modal */}
				<CustomDialog
					title='Kullanıcı Adı Kuralları'
					openModal={isUserNameImageInfoModalOpen}
					closeModal={() => setIsUserNameImageInfoModalOpen(false)}
					maxWidth='sm'
					titleSx={{ fontFamily: 'Varela Round' }}>
					<DialogContent>
						<Box sx={{ display: 'flex', flexDirection: 'column', margin: '0.5rem 0 0.75rem 1.5rem' }}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', fontFamily: 'Varela Round' }}>
								Kullanıcı adı şunları içerebilir:
							</Typography>
							<Box sx={{ margin: '0.85rem 0 0 3rem' }}>
								{['en fazla 15 karakter', 'en az 5 karakter', 'alt çizgi (_) ve nokta (.)'].map((rule, index) => (
									<ul key={index}>
										<li style={{ color: theme.textColor?.secondary.main }}>
											<Typography sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.35rem', fontFamily: 'Varela Round' }}>
												{rule}
											</Typography>
										</li>
									</ul>
								))}
							</Box>
							<Typography variant='body2' sx={{ mt: '0.5rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem', fontFamily: 'Varela Round' }}>
								Kullanıcı adı alt çizgi veya nokta ile başlayamaz/bitemez
							</Typography>
							<Typography variant='body2' sx={{ mt: '0.5rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem', fontFamily: 'Varela Round' }}>
								Kullanıcı adı boşluk içeremez
							</Typography>
						</Box>
						<Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', mb: '0.5rem' }}>
							<CustomCancelButton
								onClick={() => setIsUserNameImageInfoModalOpen(false)}
								sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', fontFamily: 'Varela Round' }}>
								Kapat
							</CustomCancelButton>
						</Box>
					</DialogContent>
				</CustomDialog>

				{/* Password Rules Modal */}
				<CustomDialog
					title='Şifre Kuralları'
					openModal={isPasswordInfoModalOpen}
					closeModal={() => setIsPasswordInfoModalOpen(false)}
					maxWidth='sm'
					titleSx={{ fontFamily: 'Varela Round' }}>
					<DialogContent>
						<Box sx={{ display: 'flex', flexDirection: 'column', margin: '0.5rem 0 0.75rem 1.5rem' }}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', fontFamily: 'Varela Round' }}>
								Şifreniz şunları içermelidir:
							</Typography>
							<Box sx={{ margin: '0.85rem 0 0 3rem' }}>
								{['en az 6 karakter uzunluğunda olmalı', 'en az bir harf içermeli', 'en az bir rakam içermeli'].map((rule, index) => (
									<ul key={index}>
										<li style={{ color: theme.textColor?.secondary.main }}>
											<Typography sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.35rem', fontFamily: 'Varela Round' }}>
												{rule}
											</Typography>
										</li>
									</ul>
								))}
							</Box>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mt: '1rem', fontFamily: 'Varela Round' }}>
								Şifreniz şunları içeremez:
							</Typography>
							<Box sx={{ margin: '0.5rem 0 0 3rem' }}>
								<ul>
									<li style={{ color: theme.textColor?.secondary.main }}>
										<Typography sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.35rem', fontFamily: 'Varela Round' }}>
											boşluk içeremez
										</Typography>
									</li>
								</ul>
							</Box>
						</Box>
						<Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', mb: '0.5rem' }}>
							<CustomCancelButton
								onClick={() => setIsPasswordInfoModalOpen(false)}
								sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', fontFamily: 'Varela Round' }}>
								Kapat
							</CustomCancelButton>
						</Box>
					</DialogContent>
				</CustomDialog>
				<Typography sx={{ fontSize: isSmallScreen ? '0.55rem' : '0.65rem', position: 'absolute', bottom: 3, fontFamily: 'Varela Round' }}>
					&copy; 2025 Webnexia Software Solutions Ltd. Tüm hakları saklıdır.
				</Typography>
			</Box>
		</Box>
	);
};

export default Auth;
