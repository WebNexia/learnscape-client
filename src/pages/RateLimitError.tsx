import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import theme from '../themes';
import logo from '../assets/logo.png';

interface RateLimitInfo {
	type: 'api' | 'signup' | 'email' | 'ip_blocked';
	retryAfter: number;
	timestamp: number;
}

const RateLimitError = () => {
	const navigate = useNavigate();
	const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);
	const [remainingTime, setRemainingTime] = useState<number>(0);

	useEffect(() => {
		const storedInfo = localStorage.getItem('rateLimitInfo');
		if (storedInfo) {
			try {
				const info = JSON.parse(storedInfo);

				// Basic validation
				if (!info.retryAfter || !info.type) {
					localStorage.removeItem('rateLimitInfo');
					return;
				}

				// Add timestamp if it doesn't exist (for backward compatibility)
				if (!info.timestamp) {
					info.timestamp = Date.now();
					localStorage.setItem('rateLimitInfo', JSON.stringify(info));
				}

				setRateLimitInfo(info);
			} catch (e) {
				// In case JSON.parse fails
				localStorage.removeItem('rateLimitInfo');
			}
		}
	}, []);

	// Update remaining time every second
	useEffect(() => {
		if (!rateLimitInfo) return;

		const updateRemainingTime = () => {
			const now = Date.now();
			const timeElapsed = (now - rateLimitInfo.timestamp) / 1000; // in seconds
			const remaining = Math.max(0, rateLimitInfo.retryAfter - timeElapsed);

			setRemainingTime(remaining);

			if (remaining <= 0) {
				// Rate limit has expired
				localStorage.removeItem('rateLimitInfo');
				navigate(-1);
			}
		};

		// Update immediately
		updateRemainingTime();

		// Then update every second
		const interval = setInterval(updateRemainingTime, 1000);

		return () => clearInterval(interval);
	}, [rateLimitInfo, navigate]);

	if (!rateLimitInfo) {
		return (
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					minHeight: '100vh',
					backgroundColor: theme.bgColor?.secondary,
					padding: '2rem',
				}}>
				<img src={logo} alt='LearnScape Logo' style={{ width: '200px', marginBottom: '2rem' }} />
				<Typography variant='h4' sx={{ color: theme.textColor?.primary, marginBottom: '1rem', textAlign: 'center', fontFamily: 'Poppins' }}>
					Rate limit bilgisi bulunamadı.
				</Typography>
				<Typography variant='h5' sx={{ color: theme.textColor?.secondary, marginBottom: '2rem', textAlign: 'center', fontFamily: 'Poppins' }}>
					Lütfen daha sonra tekrar deneyin.
				</Typography>
				<Button
					variant='contained'
					onClick={() => {
						localStorage.removeItem('rateLimitInfo');
						navigate(-1);
					}}
					sx={{
						'backgroundColor': '#01435A',
						'&:hover': { backgroundColor: '#012B3A' },
					}}>
					Geri Dön
				</Button>
			</Box>
		);
	}

	const getTimeDisplay = () => {
		if (rateLimitInfo.type === 'ip_blocked') {
			// For IP blocking, show hours and minutes
			const hours = Math.floor(remainingTime / 3600);
			const minutes = Math.ceil((remainingTime % 3600) / 60);

			if (hours > 0) {
				return `${hours} saat ${minutes} dakika`;
			} else {
				return `${minutes} dakika`;
			}
		} else {
			// For other types, show minutes
			const minutes = Math.ceil(remainingTime / 60);
			return `${minutes} dakika`;
		}
	};

	const getMessage = () => {
		switch (rateLimitInfo.type) {
			case 'signup':
				return 'Çok fazla kayıt denemesi yaptınız. Lütfen';
			case 'email':
				return 'Çok fazla e-posta kontrolü yaptınız. Lütfen';
			case 'ip_blocked':
				return 'IP adresiniz geçici olarak engellenmiştir. Lütfen';
			case 'api':
			default:
				return 'Çok fazla istek gönderdiniz. Lütfen';
		}
	};

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				minHeight: '100vh',
				backgroundColor: theme.bgColor?.secondary,
				padding: '2rem',
			}}>
			<img src={logo} alt='LearnScape Logo' style={{ width: '200px', marginBottom: '2rem' }} />

			<Typography
				variant='h4'
				sx={{
					color: theme.textColor?.primary,
					marginBottom: '1rem',
					textAlign: 'center',
					fontFamily: 'Poppins',
				}}>
				{getMessage()}
			</Typography>

			<Typography
				variant='h5'
				sx={{
					color: theme.textColor?.secondary,
					marginBottom: '2rem',
					textAlign: 'center',
					fontFamily: 'Poppins',
				}}>
				{getTimeDisplay()} sonra tekrar deneyin
			</Typography>

			<Typography
				variant='body1'
				sx={{
					color: theme.textColor?.secondary,
					marginBottom: '2rem',
					textAlign: 'center',
					fontFamily: 'Poppins',
					fontSize: '1rem',
					maxWidth: '500px',
					marginX: 'auto',
				}}>
				{rateLimitInfo.type === 'ip_blocked'
					? 'IP adresiniz 24 saat boyunca engellenmiştir. Bu süre boyunca farklı bir ağ kullanabilir veya VPN kullanabilirsiniz.'
					: 'Sayfayı yenilerseniz veya pencereyi kapatıp tekrar açarsanız, bekleme süresi sunucu tarafından tekrar başlatılabilir. Lütfen sayaç bitene kadar bekleyin ve ardından tekrar deneyin.'}
			</Typography>

			<Button
				variant='contained'
				onClick={() => {
					localStorage.removeItem('rateLimitInfo');
					navigate(-1);
				}}
				sx={{
					'backgroundColor': '#01435A',
					'&:hover': {
						backgroundColor: '#012B3A',
					},
				}}>
				Geri Dön
			</Button>
		</Box>
	);
};

export default RateLimitError;
