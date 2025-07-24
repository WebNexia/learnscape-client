import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, applyActionCode, checkActionCode, signOut } from 'firebase/auth';
import { Alert, Box, Typography, Button } from '@mui/material';
import theme from '../themes';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import { UserAuthContext } from '../contexts/UserAuthContextProvider';
import axios from '@utils/axiosInstance';

import logo from '../assets/logo.png';

const VerifyEmailPage = () => {
	const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
	const [isVerified, setIsVerified] = useState<boolean | null>(null);
	const [isUpdating, setIsUpdating] = useState(false);
	const [errorType, setErrorType] = useState<'firebase' | 'backend' | null>(null);
	const navigate = useNavigate();
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { organisation } = useContext(OrganisationContext);
	const { user, setUser } = useContext(UserAuthContext);
	const verificationSuccessRef = useRef(false);
	const hasRunRef = useRef(false);

	// Retry function for verification status check
	const checkVerificationWithRetry = async (auth: any, maxRetries = 3): Promise<boolean> => {
		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			try {
				await auth.currentUser?.reload();
				if (auth.currentUser?.emailVerified) {
					return true;
				}

				// Wait before next attempt (exponential backoff)
				if (attempt < maxRetries) {
					await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
				}
			} catch (error) {
				console.warn(`Verification check attempt ${attempt} failed:`, error);
				if (attempt === maxRetries) {
					throw error;
				}
			}
		}
		return false;
	};

	useEffect(() => {
		const queryParams = new URLSearchParams(window.location.search);
		const code = queryParams.get('oobCode');
		const auth = getAuth();

		if (!code) {
			setVerificationMessage('Invalid or missing verification code.');
			return;
		}

		// Prevent multiple executions
		if (hasRunRef.current) return;
		hasRunRef.current = true;

		const runVerification = async () => {
			setIsUpdating(true);
			setErrorType(null);

			try {
				// Step 1: Verify the action code
				await checkActionCode(auth, code);

				// Step 2: Apply the action code
				await applyActionCode(auth, code);

				// Step 3: Set success state immediately
				setIsVerified(true);
				setVerificationMessage('Your email has been successfully verified.');
				verificationSuccessRef.current = true;

				// Step 4: Wait and retry verification status check
				try {
					const isVerified = await checkVerificationWithRetry(auth, 3);

					if (isVerified && auth.currentUser && user?._id) {
						// Update backend with new email if needed
						const newEmail = auth.currentUser.email;
						if (newEmail && user.email !== newEmail) {
							try {
								await axios.patch(`${base_url}/users/${user._id}`, { email: newEmail });
								setUser((prev) => (prev ? { ...prev, email: newEmail } : prev));
							} catch (backendError) {
								console.warn('Failed to sync email with backend:', backendError);
								// Don't overwrite success message for backend sync failure
							}
						}
					}
				} catch (retryError) {
					console.warn('Verification status check failed after retries:', retryError);
					// Keep success message even if status check fails
				}

				// Step 5: Redirect after successful verification
				setTimeout(() => navigate('/auth'), 11000);
			} catch (error: any) {
				// Only handle errors if we haven't already succeeded
				if (verificationSuccessRef.current) {
					return;
				}

				console.error('Verification error:', error);

				// Check if user is already verified despite the error
				try {
					await auth.currentUser?.reload();
					if (auth.currentUser?.emailVerified) {
						setIsVerified(true);
						setVerificationMessage('Your email was already verified. Syncing your profile...');
						verificationSuccessRef.current = true;

						// Update backend if needed
						if (auth.currentUser && user?._id) {
							const newEmail = auth.currentUser.email;
							if (newEmail && user.email !== newEmail) {
								try {
									await axios.patch(`${base_url}/users/${user._id}`, { email: newEmail });
									setUser((prev) => (prev ? { ...prev, email: newEmail } : prev));
								} catch (backendError) {
									console.warn('Failed to sync email with backend:', backendError);
								}
							}
						}

						setTimeout(() => navigate('/auth'), 11000);
						return;
					}
				} catch (reloadError) {
					console.warn('Failed to reload user:', reloadError);
				}

				// Handle different error scenarios
				if (error.code === 'auth/invalid-action-code') {
					setIsVerified(false);
					setVerificationMessage('The verification link is invalid or has expired.');
				} else if (error.code === 'auth/expired-action-code') {
					setIsVerified(false);
					setVerificationMessage('The verification link has expired. Please request a new one.');
				} else {
					setIsVerified(false);
					setVerificationMessage('An error occurred during verification. Please try again.');
				}
			} finally {
				setIsUpdating(false);
			}
		};

		runVerification();
	}, [navigate, user, setUser, base_url]);

	return (
		<Box
			sx={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'flex-start',
				backgroundColor: theme.bgColor?.commonTwo,
				height: '100vh',
				padding: '3rem',
			}}>
			<Box sx={{ textAlign: 'center', maxWidth: '600px', width: '100%' }}>
				<img src={logo} alt='logo' style={{ height: '6rem', marginBottom: '2rem' }} />
				<Typography variant='h4' sx={{ mb: '2rem' }}>
					Verify Your Email
				</Typography>

				{verificationMessage && (
					<Alert
						severity={isVerified && !errorType ? 'success' : 'error'}
						sx={{
							'width': '70%',
							'margin': '3rem auto',
							'textAlign': 'center',
							'& .MuiAlert-message': {
								fontSize: '1rem',
								lineHeight: 1.5,
							},
						}}>
						{verificationMessage}
					</Alert>
				)}

				{isVerified && !isUpdating && !errorType && (
					<Typography
						variant='body2'
						sx={{
							mt: '1rem',
							color: 'text.secondary',
							fontSize: '0.9rem',
						}}>
						You will be redirected to the login page in a few seconds...
					</Typography>
				)}

				<Button
					variant='contained'
					sx={{
						mt: '2rem',
						textTransform: 'capitalize',
						minWidth: '200px',
					}}
					onClick={() => navigate('/auth', { replace: true })}
					disabled={isUpdating}>
					{isUpdating ? 'Updating...' : 'Go to Login Page'}
				</Button>
			</Box>
		</Box>
	);
};

export default VerifyEmailPage;
