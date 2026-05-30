import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material';
import axios from '@utils/axiosInstance';
import theme from '../themes';
import logo from '../assets/logo.png';

const ConfirmEmailChangePage = () => {
	const navigate = useNavigate();
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const hasRunRef = useRef(false);

	const [message, setMessage] = useState<string | null>(null);
	const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const token = new URLSearchParams(window.location.search).get('token');
		if (!token) {
			setMessage('Geçersiz veya eksik doğrulama bağlantısı.');
			setIsSuccess(false);
			setIsLoading(false);
			return;
		}

		if (hasRunRef.current) return;
		hasRunRef.current = true;

		const confirmChange = async () => {
			try {
				const response = await axios.post(`${base_url}/users/confirm-email-change`, { token });
				setIsSuccess(true);
				setMessage(response.data?.message || 'E-posta adresiniz başarıyla güncellendi.');
				setTimeout(() => navigate('/auth', { replace: true }), 8000);
			} catch (error: unknown) {
				setIsSuccess(false);
				const axiosError = error as { response?: { data?: { message?: string } } };
				setMessage(axiosError.response?.data?.message || 'E-posta değişikliği tamamlanamadı. Lütfen tekrar deneyin.');
			} finally {
				setIsLoading(false);
			}
		};

		void confirmChange();
	}, [base_url, navigate]);

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
					E-posta Değişikliğini Onayla
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

				{isSuccess && !isLoading && (
					<Typography variant='body2' sx={{ mt: '1rem', color: 'text.secondary' }}>
						Birkaç saniye içinde giriş sayfasına yönlendirileceksiniz.
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

export default ConfirmEmailChangePage;
