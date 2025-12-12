import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Alert, CircularProgress, Divider } from '@mui/material';
import { CheckCircle, Cancel, CalendarToday, School, Person, Verified } from '@mui/icons-material';
import axiosInstance from '../utils/axiosInstance';
import theme from '../themes';
import logo from '../assets/logo.png';
import LondonBg from '../assets/london-bg.jpg';

interface VerificationData {
	valid: boolean;
	certificateId: string;
	course: {
		id: string;
		title: string;
	};
	user: {
		id: string;
		name: string;
	};
	completionDate: string;
}

const CertificateVerificationPage = () => {
	const { certificateId } = useParams<{ certificateId: string }>();
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [verificationData, setVerificationData] = useState<VerificationData | null>(null);

	useEffect(() => {
		const verifyCertificate = async () => {
			if (!certificateId) {
				setError('Geçersiz doğrulama bağlantısı. Sertifika numarası eksik.');
				setLoading(false);
				return;
			}

			try {
				const response = await axiosInstance.get(`/courses/certificates/verify/${encodeURIComponent(certificateId)}`);

				if (response.data?.status === 200 && response.data?.data) {
					setVerificationData(response.data.data);
				} else {
					setError('Sertifika doğrulanamadı.');
				}
			} catch (err: any) {
				console.error('Certificate verification error:', err);
				if (err.response?.data?.message) {
					setError(err.response.data.message);
				} else {
					setError('Sertifika doğrulanırken bir hata oluştu. Lütfen tekrar deneyin.');
				}
			} finally {
				setLoading(false);
			}
		};

		verifyCertificate();
	}, [certificateId]);

	const formatDate = (dateString: string) => {
		try {
			const date = new Date(dateString);
			return date.toLocaleDateString('tr-TR', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			});
		} catch {
			return dateString;
		}
	};

	return (
		<Box
			sx={{
				'position': 'relative',
				'overflow': 'hidden',
				'minHeight': '100vh',
				'display': 'flex',
				'flexDirection': 'column',
				'alignItems': 'center',
				'justifyContent': 'center',
				'padding': { xs: 1, sm: 2 },
				// Fixed background image - London cityscape (same as Landing Page)
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
			}}>
			{/* Logo */}
			<Box sx={{ textAlign: 'center', mb: { xs: 1, sm: 1.5 }, cursor: 'pointer', zIndex: 1, position: 'relative' }} onClick={() => navigate('/')}>
				<Box
					component='img'
					src={logo}
					alt='Logo'
					sx={{
						'height': { xs: '4rem', sm: '5rem', md: '5.5rem' },
						'filter': 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
						'transition': 'opacity 0.3s ease',
						'&:hover': {
							opacity: 0.8,
						},
					}}
				/>
			</Box>

			<Paper
				elevation={8}
				sx={{
					width: '100%',
					maxWidth: { xs: '85%', sm: '70%', md: '40%' },
					padding: { xs: 1.5, sm: 2, md: 2.5 },
					borderRadius: 3,
					backgroundColor: '#ffffff',
					boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
					zIndex: 1,
					position: 'relative',
					mx: { xs: 1, sm: 2 },
					mb: { xs: 1, sm: 1.5 },
				}}>
				{loading && (
					<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: { xs: 2, sm: 2.5 } }}>
						<CircularProgress sx={{ mb: 1.5, color: theme.palette.primary.main, width: { xs: 40, sm: 50 }, height: { xs: 40, sm: 50 } }} />
						<Typography variant='h6' sx={{ color: theme.textColor?.primary.main, fontSize: { xs: '0.9rem', sm: '1.1rem' } }}>
							Sertifika doğrulanıyor...
						</Typography>
					</Box>
				)}

				{error && (
					<Box>
						<Alert severity='error' sx={{ mb: 3 }}>
							<Typography variant='h6' sx={{ mb: 1, fontWeight: 600 }}>
								Doğrulama Başarısız
							</Typography>
							<Typography variant='body2'>{error}</Typography>
						</Alert>
						<Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
							<Cancel sx={{ fontSize: 60, color: '#d32f2f' }} />
						</Box>
					</Box>
				)}

				{verificationData && verificationData.valid && (
					<Box sx={{ fontFamily: 'Varela Round' }}>
						{/* Success Header */}
						<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: { xs: 1.5, sm: 2 } }}>
							<Box
								sx={{
									width: { xs: 50, sm: 60, md: 70 },
									height: { xs: 50, sm: 60, md: 70 },
									borderRadius: '50%',
									backgroundColor: '#e8f5e9',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									mb: { xs: 1, sm: 1.5 },
								}}>
								<Verified sx={{ fontSize: { xs: 30, sm: 40, md: 45 }, color: '#2e7d32' }} />
							</Box>
							<Typography
								variant='h4'
								sx={{ fontWeight: 700, color: theme.textColor?.primary.main, mb: 0.5, fontSize: { xs: '1.15rem', sm: '1.35rem', md: '1.5rem' } }}>
								Sertifika Geçerli
							</Typography>
							<Typography variant='body2' sx={{ color: theme.textColor?.secondary.main, fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
								Bu sertifika başarıyla doğrulandı.
							</Typography>
						</Box>

						<Divider sx={{ my: { xs: 1.5, sm: 2 } }} />

						{/* Certificate Details */}
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1, sm: 3 } }}>
							{/* Course Name */}
							<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 1, sm: 1.5 } }}>
								<School sx={{ color: theme.palette.primary.main, fontSize: { xs: 20, sm: 22, md: 24 }, mt: 0.3, flexShrink: 0 }} />
								<Box sx={{ flex: 1, minWidth: 0 }}>
									<Typography
										variant='caption'
										sx={{
											color: theme.textColor?.secondary.main,
											fontWeight: 600,
											fontSize: { xs: '0.6rem', sm: '0.7rem' },
											fontFamily: 'Varela Round',
										}}>
										KURS ADI
									</Typography>
									<Typography
										variant='h6'
										sx={{
											color: theme.textColor?.primary.main,
											mt: 0.3,
											fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
											wordBreak: 'break-word',
											fontFamily: 'Varela Round',
										}}>
										{verificationData.course.title}
									</Typography>
								</Box>
							</Box>

							{/* Learner Name */}
							<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 1, sm: 1.5 } }}>
								<Person sx={{ color: theme.palette.primary.main, fontSize: { xs: 20, sm: 22, md: 24 }, mt: 0.3, flexShrink: 0 }} />
								<Box sx={{ flex: 1, minWidth: 0 }}>
									<Typography
										variant='caption'
										sx={{
											color: theme.textColor?.secondary.main,
											fontWeight: 600,
											fontSize: { xs: '0.6rem', sm: '0.7rem' },
											fontFamily: 'Varela Round',
										}}>
										ÖĞRENCİ ADI
									</Typography>
									<Typography
										variant='h6'
										sx={{
											color: theme.textColor?.primary.main,
											mt: 0.3,
											fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
											wordBreak: 'break-word',
											fontFamily: 'Varela Round',
										}}>
										{verificationData.user.name}
									</Typography>
								</Box>
							</Box>

							{/* Completion Date */}
							<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 1, sm: 1.5 } }}>
								<CalendarToday sx={{ color: theme.palette.primary.main, fontSize: { xs: 20, sm: 22, md: 24 }, mt: 0.3, flexShrink: 0 }} />
								<Box sx={{ flex: 1, minWidth: 0 }}>
									<Typography
										variant='caption'
										sx={{
											color: theme.textColor?.secondary.main,
											fontWeight: 600,
											fontSize: { xs: '0.6rem', sm: '0.7rem' },
											fontFamily: 'Varela Round',
										}}>
										TAMAMLAMA TARİHİ
									</Typography>
									<Typography
										variant='h6'
										sx={{
											color: theme.textColor?.primary.main,
											mt: 0.3,
											fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
											wordBreak: 'break-word',
											fontFamily: 'Varela Round',
										}}>
										{formatDate(verificationData.completionDate)}
									</Typography>
								</Box>
							</Box>

							{/* Certificate ID */}
							<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 1, sm: 1.5 } }}>
								<CheckCircle sx={{ color: theme.palette.primary.main, fontSize: { xs: 20, sm: 22, md: 24 }, mt: 0.3, flexShrink: 0 }} />
								<Box sx={{ flex: 1, minWidth: 0 }}>
									<Typography
										variant='caption'
										sx={{
											color: theme.textColor?.secondary.main,
											fontWeight: 600,
											fontSize: { xs: '0.6rem', sm: '0.7rem' },
											fontFamily: 'Varela Round',
										}}>
										SERTİFİKA NUMARASI
									</Typography>
									<Typography
										variant='body1'
										sx={{
											color: theme.textColor?.primary.main,
											mt: 0.3,
											fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
											wordBreak: 'break-all',
											fontFamily: 'Varela Round',
										}}>
										{verificationData.certificateId}
									</Typography>
								</Box>
							</Box>
						</Box>

						<Divider sx={{ my: { xs: 1.5, sm: 2 } }} />

						{/* Footer Note */}
						<Box sx={{ textAlign: 'center', mt: { xs: 1, sm: 1.5 } }}>
							<Typography
								variant='caption'
								sx={{
									color: theme.textColor?.secondary.main,
									fontStyle: 'italic',
									fontSize: { xs: '0.65rem', sm: '0.7rem' },
									fontFamily: 'Varela Round',
								}}>
								Bu sertifika, kurs tamamlama başarısını doğrulamak için verilmiştir.
							</Typography>
						</Box>
					</Box>
				)}
			</Paper>
		</Box>
	);
};

export default CertificateVerificationPage;
