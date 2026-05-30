import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { applyActionCode, checkActionCode, getAuth } from 'firebase/auth';
import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material';
import theme from '../themes';
import logo from '../assets/logo.png';

/** Legacy Firebase recoverEmail links (revert unauthorized email change). */
const RecoverEmailPage = () => {
	const navigate = useNavigate();
	const hasRunRef = useRef(false);

	const [message, setMessage] = useState<string | null>(null);
	const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const oobCode = new URLSearchParams(window.location.search).get('oobCode');
		if (!oobCode) {
			setMessage('Geçersiz veya eksik bağlantı.');
			setIsSuccess(false);
			setIsLoading(false);
			return;
		}

		if (hasRunRef.current) return;
		hasRunRef.current = true;

		const runRecover = async () => {
			const auth = getAuth();
			try {
				const info = await checkActionCode(auth, oobCode);
				const restoredEmail = info.data.email;
				await applyActionCode(auth, oobCode);
				setIsSuccess(true);
				setMessage(
					restoredEmail
						? `E-posta adresiniz ${restoredEmail} olarak geri alındı. Yeni şifrenizle giriş yapabilirsiniz.`
						: 'E-posta değişikliği geri alındı. Giriş sayfasına yönlendirileceksiniz.'
				);
				setTimeout(() => navigate('/auth', { replace: true }), 8000);
			} catch {
				setIsSuccess(false);
				setMessage('Bağlantı geçersiz veya süresi dolmuş.');
			} finally {
				setIsLoading(false);
			}
		};

		void runRecover();
	}, [navigate]);

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
					E-posta Değişikliğini Geri Al
				</Typography>

				{!isLoading && message && (
					<Alert
						severity={isSuccess ? 'success' : 'error'}
						sx={{
							width: '85%',
							margin: '2rem auto',
							textAlign: 'center',
							'& .MuiAlert-message': { fontSize: '1rem', lineHeight: 1.5 },
						}}>
						{message}
					</Alert>
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
					{isLoading && <CircularProgress size={28} />}
					<Button
						variant='contained'
						sx={{ textTransform: 'capitalize', minWidth: '200px' }}
						onClick={() => navigate('/auth', { replace: true })}
						disabled={isLoading}>
						Giriş Sayfasına Git
					</Button>
				</Box>
			</Box>
		</Box>
	);
};

export default RecoverEmailPage;
