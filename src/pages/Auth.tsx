import { Alert, Box, Button, DialogContent, IconButton, InputAdornment, Snackbar, Tooltip, Typography } from '@mui/material';
import * as styles from '../styles/styleAuth';
import { FormEvent, useContext, useState, useRef } from 'react';
import axiosInstance from '@utils/axiosInstance';
import axios from 'axios';
import theme from '../themes';
import { AuthFormErrorMessages, AuthForms, TextFieldTypes } from '../interfaces/enums';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import { UserAuthContext } from '../contexts/UserAuthContextProvider';
import { AuthError, createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { FirebaseError } from 'firebase/app';
import { Info, Visibility, VisibilityOff } from '@mui/icons-material';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomCancelButton from '../components/forms/customButtons/CustomCancelButton';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import PhoneInput from 'react-phone-input-2';
import { useGeoLocation } from '../hooks/useGeoLocation';
import 'react-phone-input-2/lib/style.css';
import logo from '../assets/logo.png';
import ReCAPTCHA from 'react-google-recaptcha';
import { useNavigate } from 'react-router-dom';
import LondonBg from '../assets/london-bg.jpg';

const Auth = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const organisationCode = import.meta.env.VITE_ORG_CODE;

	const vertical = 'top';
	const horizontal = 'center';

	const location = useGeoLocation();

	const navigate = useNavigate();

	const { setSkipFetchDuringSignup } = useContext(UserAuthContext);
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

	const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
	const [resetRecaptchaToken, setResetRecaptchaToken] = useState<string | null>(null);
	const recaptchaRef = useRef<any>(null);
	const resetRecaptchaRef = useRef<any>(null);
	const signupFinallyExecutedRef = useRef(false);

	const [signingUp, setSigningUp] = useState<boolean>(false);
	// Removed isSignupInProgress - no longer needed

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

			// Set session timestamp explicitly after successful signIn
			const currentTime = Date.now();
			localStorage.setItem('sessionTimestamp', currentTime.toString());

			// Clear inputs and handle success state
			setEmail('');
			setUsername('');
			setPassword('');
			setErrorMsg(undefined);
		} catch (error) {
			const firebaseError = error as AuthError;
			if (firebaseError.code === 'auth/invalid-credential') {
				setErrorMsg(AuthFormErrorMessages.INVALID_CREDENTIALS);
			} else if (firebaseError.code === 'auth/visibility-check-was-unavailable') {
				setErrorMsg(AuthFormErrorMessages.VISIBILITY_CHECK_ERROR);
			} else {
				setErrorMsg(AuthFormErrorMessages.UNKNOWN_ERROR_OCCURRED);
			}
		}
	};

	const handlePasswordReset = async () => {
		if (!resetRecaptchaToken) {
			setErrorMsg(AuthFormErrorMessages.RECAPTCHA_ERROR);
			return;
		}
		try {
			await axiosInstance.post(`${base_url}/users/forgot-password`, {
				email,
				recaptchaToken: resetRecaptchaToken,
			});
			setResetPasswordMsg(true);
			setEmail('');
			setPassword('');
			setActiveForm(AuthForms.SIGN_IN);
			setIsResetPassword(false);
			resetResetRecaptcha();
			setErrorMsg(undefined);
		} catch (error) {
			if (error instanceof FirebaseError) {
				switch (error.code) {
					case 'auth/network-request-failed':
						setErrorMsg(AuthFormErrorMessages.NETWORK_ERROR);
				}
			}
			console.log(error);
			setErrorMsg(AuthFormErrorMessages.UNKNOWN_ERROR_OCCURRED);
			resetResetRecaptcha();
			setErrorMsg(undefined);
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

		// Prevent multiple signup attempts
		if (signingUp) {
			return;
		}

		// Reset the finally executed flag
		signupFinallyExecutedRef.current = false;

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

		// reCAPTCHA validation (move this BEFORE Firebase call)
		if (!recaptchaToken) {
			setErrorMsg(AuthFormErrorMessages.RECAPTCHA_ERROR);
			return;
		}

		// Prevent fetchUserData from running during signup - MUST be before Firebase user creation

		setSkipFetchDuringSignup(true);
		setSigningUp(true);
		let userCreated = false;
		try {
			// Step 1: Create user with Firebase Authentication
			const userCredential = await createUserWithEmailAndPassword(auth, email, password);
			const user = userCredential.user;
			userCreated = true;

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
				recaptchaToken,
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
			setRecaptchaToken(null);
		} catch (error) {
			// Clean up Firebase user if backend registration fails
			if (userCreated && auth.currentUser) {
				try {
					await auth.currentUser.delete();
				} catch (cleanupError) {
					console.error('Failed to delete Firebase user after backend failure:', cleanupError);
				}
			}
			if (axios.isAxiosError(error) && error.response) {
				const msg = error.response.data?.message;

				if (error.response.status === 400 && error.response.data?.message === 'username') {
					setErrorMsg(AuthFormErrorMessages.USERNAME_EXISTS);
				} else if (error.response.status === 400 && error.response.data?.message === 'phone') {
					setErrorMsg(AuthFormErrorMessages.PHONE_NUMBER_EXISTS);
				} else if (error.response.status === 400 && error.response.data?.message === 'Invalid phone number') {
					setErrorMsg(AuthFormErrorMessages.INVALID_PHONE_NUMBER);
				} else if (
					msg === 'reCAPTCHA doğrulama tokeni eksik.' ||
					msg === 'reCAPTCHA doğrulaması başarısız.' ||
					msg === 'reCAPTCHA doğrulaması sırasında hata oluştu.'
				) {
					setErrorMsg(AuthFormErrorMessages.RECAPTCHA_ERROR_OCCURRED);
				} else {
					setErrorMsg(error.response.data?.message || 'Bilinmeyen bir hata oluştu.');
				}
			} else if (error instanceof FirebaseError) {
				handleFirebaseError(error);
			} else {
				setErrorMsg(AuthFormErrorMessages.UNKNOWN_ERROR_OCCURRED);
			}
			if (recaptchaRef.current) {
				recaptchaRef.current.reset();
			}
			setRecaptchaToken(null);
		} finally {
			// Prevent multiple executions of the finally block
			if (signupFinallyExecutedRef.current) {
				return;
			}
			signupFinallyExecutedRef.current = true;

			setSigningUp(false);
			setSkipFetchDuringSignup(false);
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

	const handleResetRecaptchaChange = (token: string | null) => {
		setResetRecaptchaToken(token);
		setErrorMsg(undefined);
	};
	const resetResetRecaptcha = () => {
		setResetRecaptchaToken(null);
		if (resetRecaptchaRef.current) {
			resetRecaptchaRef.current.reset();
		}
	};

	return (
		<Box
			sx={{
				'position': 'relative',
				'overflow': 'hidden',
				'minHeight': '100vh',
				'height': '100vh',
				'display': 'flex',
				'flexDirection': 'column',
				// Fixed background image - London cityscape
				'backgroundImage': `url(${LondonBg})`,
				'backgroundSize': 'cover',
				'backgroundPosition': 'center',
				'backgroundRepeat': 'no-repeat',
				'backgroundAttachment': 'fixed',
				// Overlay for better content readability
				'&::before': {
					content: '""',
					position: 'fixed',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.75) 100%)',
					zIndex: 0,
					pointerEvents: 'none',
				},
				// Subtle gradient accent overlay
				'&::after': {
					content: '""',
					position: 'fixed',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					background:
						'radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.08) 0%, transparent 50%)',
					zIndex: 0,
					pointerEvents: 'none',
				},
				'& h1, h2, h3, h4, h5, h6': {
					fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
					fontWeight: 500,
				},
				'& button': {
					fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
					fontWeight: 400,
				},
				'& .gradient-text': {
					'background': 'linear-gradient(135deg, #4f46e5 0%, #5b21b6 50%, #7c3aed 100%)',
					'WebkitBackgroundClip': 'text',
					'WebkitTextFillColor': 'transparent',
					'backgroundClip': 'text',
					'backgroundSize': '200% 200%',
					'animation': 'gradientShift 6s ease infinite',
					'@keyframes gradientShift': {
						'0%': { backgroundPosition: '0% 50%' },
						'50%': { backgroundPosition: '100% 50%' },
						'100%': { backgroundPosition: '0% 50%' },
					},
				},
				'& .accent-color': {
					color: '#1e293b',
				},
				'& .secondary-color': {
					color: '#6366f1',
				},
				'& .tertiary-color': {
					color: '#64748b',
				},
				'& .kaizen-title': {
					fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
					fontWeight: 600,
				},
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
					zIndex: 2,
				}}>
				{/* Logo and Title */}
				<Box sx={{ position: 'relative', zIndex: 1, mb: '1rem', mt: '-3rem' }}>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/')}>
						<img src={logo} alt='logo' style={{ height: isRotated ? '15vh' : isSmallScreen ? '8vh' : '10vh' }} />
					</Box>
				</Box>

				{/* Auth Form Container */}
				<Box
					sx={{
						...styles.formContainerStyles(isVerySmallScreen, isSmallScreen, isRotated, isRotatedMedium, activeForm === AuthForms.SIGN_IN),
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
											backgroundColor: 'rgba(91, 33, 182, 0.7)',
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
											backgroundColor: 'rgba(91, 33, 182, 0.7)',
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
													InputProps={{
														inputProps: {
															maxLength: 254,
														},
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
														inputProps: {
															maxLength: 50,
														},
													}}
												/>

												<Box sx={{ width: '100%', mb: '0.75rem' }}>
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
											<Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
												<Button
													variant='contained'
													fullWidth
													sx={{
														'height': '2.25rem',
														'fontFamily': 'Varela Round',
														'textTransform': 'capitalize',
														'fontSize': isMobileSize ? '0.85rem' : '0.9rem',
														'color': '#FFFFFF',
														'background': 'linear-gradient(135deg, #FF6B3D 0%, #ff7d55 100%)',
														'padding': isMobileSize ? '0.4rem 1rem' : '0.5rem 1.75rem',
														'borderRadius': { xs: '0.75rem', sm: '1rem', md: '1.25rem' },
														'fontWeight': 500,
														'boxShadow': '0 4px 15px rgba(255, 107, 61, 0.35)',
														'&:hover': {
															background: 'linear-gradient(135deg, #ff7d55 0%, #FF6B3D 100%)',
															transform: 'translateY(-2px)',
															boxShadow: '0 6px 20px rgba(255, 107, 61, 0.45)',
														},
														'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
														'&:disabled': {
															backgroundColor: '#ccc',
															color: '#666',
															background: '#ccc',
														},
													}}
													type='submit'>
													Giriş Yap
												</Button>
											</Box>
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
															setFirstName(e.target.value);
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
														InputProps={{
															inputProps: {
																maxLength: 50,
															},
														}}
													/>
													<CustomTextField
														label='Soyisim'
														type={TextFieldTypes.TEXT}
														onChange={(e) => {
															setLastName(e.target.value);
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
														InputProps={{
															inputProps: {
																maxLength: 50,
															},
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
														<Tooltip title='Kullanıcı Adı Kuralları' placement='right' arrow>
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
													<Typography
														variant='body2'
														sx={{ marginBottom: '0.25rem', fontFamily: 'Varela Round', color: theme.textColor?.secondary.main }}>
														Telefon Numarası *
													</Typography>
													<Box
														component='div'
														sx={{
															'& > label': {
																display: 'none !important',
																visibility: 'hidden !important',
																height: '0 !important',
																width: '0 !important',
																overflow: 'hidden !important',
															},
															'& label': {
																display: 'none !important',
																visibility: 'hidden !important',
																height: '0 !important',
																width: '0 !important',
																overflow: 'hidden !important',
															},
															'& .react-tel-input label': {
																display: 'none !important',
																visibility: 'hidden !important',
																height: '0 !important',
																width: '0 !important',
																overflow: 'hidden !important',
															},
															'& .flag-dropdown + label': {
																display: 'none !important',
																visibility: 'hidden !important',
																height: '0 !important',
																width: '0 !important',
																overflow: 'hidden !important',
															},
															'& .react-tel-input > label': {
																display: 'none !important',
																visibility: 'hidden !important',
																height: '0 !important',
																width: '0 !important',
																overflow: 'hidden !important',
															},
															'& [for*="phone"]': {
																display: 'none !important',
																visibility: 'hidden !important',
																height: '0 !important',
																width: '0 !important',
																overflow: 'hidden !important',
															},
															'& [aria-label*="Phone"]': {
																display: 'none !important',
																visibility: 'hidden !important',
																height: '0 !important',
																width: '0 !important',
																overflow: 'hidden !important',
															},
															'& .react-tel-input::before': {
																display: 'none !important',
																content: '""',
															},
															'& .react-tel-input > *:first-of-type:not(.flag-dropdown):not(input)': {
																display: 'none !important',
																visibility: 'hidden !important',
																height: '0 !important',
																width: '0 !important',
																overflow: 'hidden !important',
															},
														}}>
														<PhoneInput
															country={location?.countryCode?.toLowerCase() || 'tr'}
															enableSearch={true}
															searchPlaceholder='Ülke arayın...'
															searchNotFound='Ülke bulunamadı'
															enableAreaCodes={false}
															countryCodeEditable={false}
															specialLabel=''
															inputProps={{ required: true, maxLength: 20 }}
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
															onChange={(phoneNumber, _) => {
																const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
																setPhone(formattedNumber);
																setErrorMsg(undefined);
															}}
														/>
													</Box>
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
														InputProps={{
															inputProps: {
																maxLength: 254,
															},
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
															inputProps: {
																maxLength: 50,
															},
														}}
													/>
													<Box sx={{ display: 'flex', width: '10%', justifyContent: 'flex-end', mt: '-1rem' }}>
														<Tooltip title='Şifre Kuralları' placement='right' arrow>
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
											<Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', mb: '1.5rem' }}>
												<ReCAPTCHA
													ref={recaptchaRef}
													sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
													onChange={(token) => {
														setRecaptchaToken(token);
														setErrorMsg(undefined);
													}}
													key={activeForm === AuthForms.SIGN_UP ? 'signup' : 'other'}
												/>
											</Box>
											<Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
												<Button
													variant='contained'
													fullWidth
													sx={{
														'height': '2.25rem',
														'fontFamily': 'Varela Round',
														'textTransform': 'capitalize',
														'fontSize': isMobileSize ? '0.85rem' : '0.9rem',
														'color': '#FFFFFF',
														'background': 'linear-gradient(135deg, #FF6B3D 0%, #ff7d55 100%)',
														'padding': isMobileSize ? '0.4rem 1rem' : '0.5rem 1.25rem',
														'borderRadius': { xs: '0.75rem', sm: '1rem', md: '1.25rem' },
														'fontWeight': 500,
														'boxShadow': '0 4px 15px rgba(255, 107, 61, 0.35)',
														'&:hover': {
															background: 'linear-gradient(135deg, #ff7d55 0%, #FF6B3D 100%)',
															transform: 'translateY(-2px)',
															boxShadow: '0 6px 20px rgba(255, 107, 61, 0.45)',
														},
														'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
														'&:disabled': {
															backgroundColor: '#ccc',
															color: '#666',
															background: '#ccc',
														},
													}}
													type='submit'
													disabled={signingUp}>
													{signingUp ? 'İşleniyor...' : 'Kayıt Ol'}
												</Button>
											</Box>
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
											InputProps={{
												inputProps: {
													maxLength: 254,
												},
											}}
										/>
										<Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', mb: '1.5rem' }}>
											<ReCAPTCHA
												ref={resetRecaptchaRef}
												sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
												onChange={handleResetRecaptchaChange}
												onExpired={resetResetRecaptcha}
												key={activeForm === AuthForms.RESET ? 'reset' : 'other'}
											/>
										</Box>
										<Button
											variant='contained'
											fullWidth
											sx={{
												'height': '2.25rem',
												'fontFamily': 'Varela Round',
												'textTransform': 'capitalize',
												'fontSize': isMobileSize ? '0.85rem' : '0.9rem',
												'color': '#FFFFFF',
												'background': 'linear-gradient(135deg, #FF6B3D 0%, #ff7d55 100%)',
												'padding': isMobileSize ? '0.4rem 1rem' : '0.5rem 1.75rem',
												'borderRadius': { xs: '0.75rem', sm: '1rem', md: '1.25rem' },
												'fontWeight': 500,
												'boxShadow': '0 4px 15px rgba(255, 107, 61, 0.35)',
												'&:hover': {
													background: 'linear-gradient(135deg, #ff7d55 0%, #FF6B3D 100%)',
													transform: 'translateY(-2px)',
													boxShadow: '0 6px 20px rgba(255, 107, 61, 0.45)',
												},
												'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
												'&:disabled': {
													backgroundColor: '#ccc',
													color: '#666',
													background: '#ccc',
												},
											}}
											type='submit'>
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
												setPassword('');
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
							mt: '1.25rem',
						}}>
						<Typography
							variant='body2'
							sx={{
								'fontFamily': 'Varela Round',
								'color': theme.textColor?.primary.main,
								'cursor': 'pointer',
								'transition': 'all 0.3s ease',
								'&:hover': {
									color: 'rgba(91, 33, 182, 0.7)',
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
								[AuthFormErrorMessages.RECAPTCHA_ERROR]: errorMessageTypography,
								[AuthFormErrorMessages.RECAPTCHA_ERROR_OCCURRED]: errorMessageTypography,
								[AuthFormErrorMessages.USER_INACTIVE]: errorMessageTypography,
							}[errorMsg]}
					</Box>
				</Box>

				{/* Success Messages */}
				<Snackbar open={signUpMessage} autoHideDuration={8500} onClose={() => setSignUpMessage(false)} anchorOrigin={{ vertical, horizontal }}>
					<Alert
						onClose={() => setSignUpMessage(false)}
						severity='success'
						sx={{
							'fontFamily': 'Varela Round',
							'width': '100%',
							'fontSize': isMobileSize ? '0.7rem' : undefined,
							'boxShadow': '0 4px 12px rgba(0, 0, 0, 0.1)',
							'borderRadius': '0.5rem',
							'backgroundColor': 'rgba(147, 51, 234, 1)',
							'color': theme.textColor?.common.main,
							'& .MuiAlert-icon': {
								color: theme.textColor?.common.main,
							},
						}}>
						Kayıt işlemi başarılı! Lütfen e-posta adresinizi doğrulayın. Spam klasörünü kontrol edin.
					</Alert>
				</Snackbar>

				<Snackbar open={resetPasswordMsg} autoHideDuration={8500} onClose={() => setResetPasswordMsg(false)} anchorOrigin={{ vertical, horizontal }}>
					<Alert
						onClose={() => setResetPasswordMsg(false)}
						severity='success'
						sx={{
							'fontFamily': 'Varela Round',
							'width': '100%',
							'fontSize': isMobileSize ? '0.7rem' : undefined,
							'boxShadow': '0 4px 12px rgba(0, 0, 0, 0.1)',
							'borderRadius': '0.5rem',
							'backgroundColor': 'rgba(147, 51, 234, 1)',
							'color': theme.textColor?.common.main,
							'& .MuiAlert-icon': {
								color: theme.textColor?.common.main,
							},
						}}>
						Şifre sıfırlama e-postası gönderildi! Gelen kutunuzu ve spam klasörünü kontrol edin.
					</Alert>
				</Snackbar>

				{/* Username Rules Modal */}
				<CustomDialog
					title='Kullanıcı Adı Kuralları'
					openModal={isUserNameImageInfoModalOpen}
					closeModal={() => setIsUserNameImageInfoModalOpen(false)}
					maxWidth='sm'
					titleSx={{ fontFamily: 'Varela Round' }}
					PaperProps={{
						style: {
							backgroundColor: '#fff',
						},
					}}>
					<DialogContent>
						<Box sx={{ display: 'flex', flexDirection: 'column', margin: '0.5rem 0 0.75rem 1.5rem' }}>
							<Typography
								variant='body2'
								sx={{
									fontSize: isMobileSize ? '0.75rem' : '0.9rem',
									fontFamily: 'Varela Round',
									mb: '0.75rem',
									lineHeight: '1.75',
									textDecoration: 'underline',
								}}>
								Kullanıcı adı platforma giriş yaptığınızda diğer kullanıcılar tarafından topluluk sayfalarında ve mesajlaşmalarda görülecektir. Bu
								nedenle kullanıcı adınızın anlamlı olması önemlidir.
							</Typography>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.9rem', fontFamily: 'Varela Round' }}>
								Kullanıcı adı şunları içerebilir:
							</Typography>
							<Box sx={{ margin: '0.85rem 0 0 3rem' }}>
								{['en fazla 15 karakter', 'en az 5 karakter', 'alt çizgi (_) ve nokta (.)']?.map((rule, index) => (
									<ul key={index}>
										<li style={{ color: theme.textColor?.secondary.main }}>
											<Typography sx={{ fontSize: isMobileSize ? '0.75rem' : '0.9rem', mb: '0.35rem', fontFamily: 'Varela Round' }}>
												{rule}
											</Typography>
										</li>
									</ul>
								))}
							</Box>
							<Typography variant='body2' sx={{ mt: '0.5rem', fontSize: isMobileSize ? '0.75rem' : '0.9rem', fontFamily: 'Varela Round' }}>
								Kullanıcı adı alt çizgi veya nokta ile başlayamaz/bitemez
							</Typography>
							<Typography variant='body2' sx={{ mt: '0.5rem', fontSize: isMobileSize ? '0.75rem' : '0.9rem', fontFamily: 'Varela Round' }}>
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
					titleSx={{ fontFamily: 'Varela Round' }}
					PaperProps={{
						style: {
							backgroundColor: '#fff',
						},
					}}>
					<DialogContent>
						<Box sx={{ display: 'flex', flexDirection: 'column', margin: '0.5rem 0 0.75rem 1.5rem' }}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.9rem', fontFamily: 'Varela Round' }}>
								Şifreniz şunları içermelidir:
							</Typography>
							<Box sx={{ margin: '0.85rem 0 0 3rem' }}>
								{['en az 6, en fazla 50 karakter uzunluğunda olmalı', 'en az bir harf içermeli', 'en az bir rakam içermeli']?.map((rule, index) => (
									<ul key={index}>
										<li style={{ color: theme.textColor?.secondary.main }}>
											<Typography sx={{ fontSize: isMobileSize ? '0.75rem' : '0.9rem', mb: '0.35rem', fontFamily: 'Varela Round' }}>
												{rule}
											</Typography>
										</li>
									</ul>
								))}
							</Box>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.9rem', mt: '1rem', fontFamily: 'Varela Round' }}>
								Şifreniz şunları içeremez:
							</Typography>
							<Box sx={{ margin: '0.5rem 0 0 3rem' }}>
								<ul>
									<li style={{ color: theme.textColor?.secondary.main }}>
										<Typography sx={{ fontSize: isMobileSize ? '0.75rem' : '0.9rem', mb: '0.35rem', fontFamily: 'Varela Round' }}>
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
					&copy; {new Date().getFullYear()} Webnexia Software Solutions Ltd. Tüm hakları saklıdır.
				</Typography>
			</Box>
		</Box>
	);
};

export default Auth;
