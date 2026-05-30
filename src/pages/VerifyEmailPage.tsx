import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, applyActionCode, checkActionCode } from 'firebase/auth';
import { Alert, Box, Typography, Button, CircularProgress } from '@mui/material';
import theme from '../themes';
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

	const { user, setUser } = useContext(UserAuthContext);
	const verificationSuccessRef = useRef(false);
	const hasRunRef = useRef(false);

	const checkVerificationWithRetry = async (auth: ReturnType<typeof getAuth>, maxRetries = 3): Promise<boolean> => {
		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			try {
				await auth.currentUser?.reload();
				if (auth.currentUser?.emailVerified) {
					return true;
				}

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
			setVerificationMessage('Geçersiz veya eksik doğrulama kodu.');
			setIsVerified(false);
			return;
		}

		if (hasRunRef.current) return;
		hasRunRef.current = true;

		const runVerification = async () => {
			setIsUpdating(true);
			setErrorType(null);

			try {
				await checkActionCode(auth, code);
				await applyActionCode(auth, code);

				setIsVerified(true);
				setVerificationMessage('E-postanız başarıyla doğrulandı.');
				verificationSuccessRef.current = true;

				try {
					const emailVerified = await checkVerificationWithRetry(auth, 3);

					if (emailVerified && auth.currentUser && user?._id) {
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
				} catch (retryError) {
					console.warn('Verification status check failed after retries:', retryError);
				}

				setTimeout(() => navigate('/auth'), 8000);
			} catch (error: unknown) {
				if (verificationSuccessRef.current) {
					return;
				}

				console.error('Verification error:', error);

				const firebaseError = error as { code?: string };

				try {
					await auth.currentUser?.reload();
					if (auth.currentUser?.emailVerified) {
						setIsVerified(true);
						setVerificationMessage('E-postanız zaten doğrulanmış. Profiliniz senkronize ediliyor...');
						verificationSuccessRef.current = true;

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

						setTimeout(() => navigate('/auth'), 8000);
						return;
					}
				} catch (reloadError) {
					console.warn('Failed to reload user:', reloadError);
				}

				if (firebaseError.code === 'auth/invalid-action-code') {
					setIsVerified(false);
					setVerificationMessage('Doğrulama bağlantısı geçersiz veya süresi dolmuş.');
				} else if (firebaseError.code === 'auth/expired-action-code') {
					setIsVerified(false);
					setVerificationMessage('Doğrulama bağlantısının süresi dolmuş. Lütfen yeni bir bağlantı isteyin.');
				} else {
					setIsVerified(false);
					setVerificationMessage('Doğrulama sırasında bir hata oluştu. Lütfen tekrar deneyin.');
				}
			} finally {
				setIsUpdating(false);
			}
		};

		void runVerification();
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
					E-postanızı Doğrulayın
				</Typography>

				{verificationMessage && (
					<Alert
						severity={isVerified && !errorType ? 'success' : 'error'}
						sx={{
							width: '85%',
							margin: '2rem auto',
							textAlign: 'center',
							'& .MuiAlert-message': {
								fontSize: '1rem',
								lineHeight: 1.5,
							},
						}}>
						{verificationMessage}
					</Alert>
				)}

				{isVerified && !isUpdating && !errorType && (
					<Typography variant='body2' sx={{ mt: '1rem', color: 'text.secondary', fontSize: '0.9rem' }}>
						Birkaç saniye içinde giriş sayfasına yönlendirileceksiniz...
					</Typography>
				)}

				<Box
					sx={{
						mt: '2rem',
						display: 'flex',
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'center',
						gap: 2,
					}}>
					{isUpdating && <CircularProgress size={28} />}
					<Button
						variant='contained'
						sx={{ textTransform: 'capitalize', minWidth: '200px' }}
						onClick={() => navigate('/auth', { replace: true })}
						disabled={isUpdating}>
						Giriş Sayfasına Git
					</Button>
				</Box>
			</Box>
		</Box>
	);
};

export default VerifyEmailPage;
