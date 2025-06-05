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

	useEffect(() => {
		const queryParams = new URLSearchParams(window.location.search);
		const code = queryParams.get('oobCode');
		const auth = getAuth();

		if (!code) {
			setVerificationMessage('Invalid or missing verification code.');
			return;
		}

		let didRun = false;

		const runVerification = async () => {
			if (didRun) return;
			didRun = true;
			setIsUpdating(true);
			setErrorType(null);

			try {
				await checkActionCode(auth, code);
				await applyActionCode(auth, code);
				setIsVerified(true);
				setVerificationMessage('Your email has been successfully verified.');
				verificationSuccessRef.current = true;

				// Update backend with new email if logged in as the new email
				if (auth.currentUser && user?._id) {
					await auth.currentUser.reload(); // Force refresh
					const newEmail = auth.currentUser.email;
					if (!newEmail) return;
					if (user.email !== newEmail) {
						await axios.patch(`${base_url}/users/${user._id}`, { email: newEmail });
						setUser((prev) => (prev ? { ...prev, email: newEmail } : prev));
					}
				}
				setTimeout(() => navigate('/auth'), 5000);
			} catch (error: any) {
				if (verificationSuccessRef.current) return; // Prevent error overwrite
				// If the code is expired/invalid, but Firebase user email is already updated, update backend anyway
				if (
					auth.currentUser &&
					user?._id &&
					auth.currentUser.email !== user.email // email is already updated in Firebase
				) {
					setIsVerified(true);
					setVerificationMessage('Your email was already verified. Syncing your profile...');
					try {
						await auth.currentUser.reload(); // Force refresh
						const newEmail = auth.currentUser.email;
						if (!newEmail) return;
						if (user.email !== newEmail) {
							await axios.patch(`${base_url}/users/${user._id}`, { email: newEmail });
							setUser((prev) => (prev ? { ...prev, email: newEmail } : prev));
						}
					} catch (err) {
						setVerificationMessage('Email verified, but failed to sync profile. Please try again.');
					}
					setTimeout(() => navigate('/auth'), 5000);
				} else if (auth.currentUser && user?._id && auth.currentUser.email !== user.email) {
					// User is not logged in as the new email
					setIsVerified(false);
					setVerificationMessage('Please log in with your new email to complete the update.');
				} else {
					setIsVerified(false);
					setVerificationMessage('The verification link is invalid or has expired.');
				}
			} finally {
				setIsUpdating(false);
			}
		};

		runVerification();
		// eslint-disable-next-line
	}, [navigate, user, setUser]);

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
