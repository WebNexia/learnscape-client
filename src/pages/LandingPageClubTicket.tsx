import {
	Alert,
	Box,
	Button,
	CircularProgress,
	Typography,
	List,
	ListItem,
	ListItemText,
	Chip,
} from '@mui/material';
import LandingPageLayout from '../components/landingPage/LandingPageLayout';
import { useContext, useState } from 'react';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import { clubsService } from '../services/clubsService';
import { ClubTicketLookupResult } from '../interfaces/club';
import { SEO } from '../components/seo';
import { useNavigate } from 'react-router-dom';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import CustomCancelButton from '../components/forms/customButtons/CustomCancelButton';
import { useIsLpQaPreview } from '../hooks/useIsLpQaPreview';
import { LP_QA_PREVIEW_SEGMENT } from '../utils/lpQaPreview';

const LandingPageClubTicket = () => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const navigate = useNavigate();
	const isQaPreview = useIsLpQaPreview();
	const clubsListPath = isQaPreview ? `/landing-page-clubs/${LP_QA_PREVIEW_SEGMENT}` : '/landing-page-clubs';

	const [code, setCode] = useState('');
	const [email, setEmail] = useState('');
	const [loading, setLoading] = useState(false);
	const [redeemingId, setRedeemingId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [result, setResult] = useState<ClubTicketLookupResult | null>(null);
	const [joinUrl, setJoinUrl] = useState<string | null>(null);

	const handleLookup = async () => {
		setError(null);
		setSuccess(null);
		setJoinUrl(null);
		if (!code.trim() || !email.trim()) {
			setError('Bilet kodu ve e-posta gerekli.');
			return;
		}
		setLoading(true);
		try {
			const data = await clubsService.lookupTicket(code.trim(), email.trim(), {
				qaPreview: isQaPreview,
			});
			setResult(data);
		} catch (err: any) {
			setResult(null);
			setError(err?.response?.data?.error || 'Bilet bulunamadı.');
		} finally {
			setLoading(false);
		}
	};

	const handleRedeem = async (sessionId: string) => {
		setError(null);
		setSuccess(null);
		setRedeemingId(sessionId);
		try {
			const data = await clubsService.redeemTicket(code.trim(), email.trim(), sessionId, {
				qaPreview: isQaPreview,
			});
			setJoinUrl(data.zoomJoinUrl || null);
			setSuccess(
				data.alreadyRegistered
					? 'Bu oturum için zaten kayıtlısınız.'
					: `Kayıt tamam! Kalan hak: ${data.sessionsRemaining}`,
			);
			const refreshed = await clubsService.lookupTicket(code.trim(), email.trim(), {
				qaPreview: isQaPreview,
			});
			setResult(refreshed);
		} catch (err: any) {
			setError(err?.response?.data?.error || 'Kayıt başarısız.');
		} finally {
			setRedeemingId(null);
		}
	};

	return (
		<>
			<SEO
				title='Kulüp Bileti - Aden Academy'
				description='Bilet kodunuz ile Zoom kulüp oturumu seçin.'
				noIndex={isQaPreview}
			/>
			<Box
				sx={{
					minHeight: '100vh',
					background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 40%, rgba(0, 82, 163, 0.05) 100%)',
				}}>
				<LandingPageLayout>
					<Box sx={{ width: '90%', maxWidth: 640, mx: 'auto', pt: isMobileSize ? '12vh' : '14vh', pb: 6 }}>
						<Typography
							variant='h4'
							sx={{
								fontFamily: 'Varela Round',
								mb: 1,
								background: 'linear-gradient(135deg, #004c99 0%, #0066CC 100%)',
								WebkitBackgroundClip: 'text',
								WebkitTextFillColor: 'transparent',
							}}>
							Bilet ile Katıl
						</Typography>
						<Typography sx={{ fontFamily: 'Varela Round', color: '#64748b', mb: 2 }}>
							E-postanıza gelen bilet kodu ve e-posta adresinizle yaklaşan oturumları görün. Kayıt sonrası size özel
							Zoom linki e-postanıza gelir.
						</Typography>
						<Alert severity='info' sx={{ mb: 3, fontFamily: 'Varela Round' }}>
							Bir oturum kaydınızı iptal etmek isterseniz lütfen{' '}
							<a href='/contact-us' style={{ color: '#0052a3', fontWeight: 600 }}>
								bizimle iletişime geçin
							</a>
							. İptali ekibimiz yapar ve oturum hakkınız iade edilir.
						</Alert>

						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
							<CustomTextField
								label='Bilet Kodu'
								value={code}
								onChange={(e) => setCode(e.target.value.toUpperCase())}
								placeholder='CLB-XXXXXX'
								fullWidth
								sx={{ '& .MuiInputBase-input': { fontFamily: "'Varela Round', sans-serif" } }}
							/>
							<CustomTextField
								label='E-posta'
								type='email'
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								fullWidth
								sx={{ '& .MuiInputBase-input': { fontFamily: "'Varela Round', sans-serif" } }}
							/>
							<CustomSubmitButton
								type='button'
								variant='contained'
								onClick={handleLookup}
								disabled={loading}
								sx={{
									fontFamily: "'Varela Round', sans-serif",
									textTransform: 'none',
									background: 'linear-gradient(135deg, #0052a3 0%, #0066cc 100%)',
								}}
								startIcon={loading ? <CircularProgress size={18} color='inherit' /> : undefined}>
								Bilet Sorgula
							</CustomSubmitButton>
							<CustomCancelButton
								onClick={() => navigate(clubsListPath)}
								sx={{ fontFamily: "'Varela Round', sans-serif", textTransform: 'none' }}>
								Kulüp listesine dön
							</CustomCancelButton>
						</Box>

						{error && (
							<Alert severity='error' sx={{ mb: 2 }}>
								{error}
							</Alert>
						)}
						{success && (
							<Alert severity='success' sx={{ mb: 2 }}>
								{success}
							</Alert>
						)}
						{joinUrl && (
							<Button
								href={joinUrl}
								target='_blank'
								rel='noopener noreferrer'
								variant='contained'
								sx={{ mb: 2, textTransform: 'none', bgcolor: '#2D8CFF' }}>
								Zoom’a Katıl
							</Button>
						)}

						{result && (
							<Box>
								<Typography sx={{ fontFamily: 'Varela Round', fontWeight: 600, mb: 0.5 }}>
									{result.club.title}
								</Typography>
								<Typography sx={{ fontFamily: 'Varela Round', color: '#475569', mb: 2 }}>
									{result.ticket.guestName} — Kalan hak:{' '}
									<strong>
										{result.ticket.sessionsRemaining} / {result.ticket.sessionsTotal}
									</strong>
								</Typography>

								{result.sessions.length === 0 ? (
									<Typography sx={{ fontFamily: 'Varela Round', color: '#94a3b8' }}>
										Yaklaşan oturum yok.
									</Typography>
								) : (
									<>
									<List>
										{result.sessions.map((s) => {
											const starts = new Date(s.startsAt);
											const label = starts.toLocaleString('tr-TR', {
												weekday: 'long',
												day: 'numeric',
												month: 'long',
												hour: '2-digit',
												minute: '2-digit',
											});
											const disabled =
												s.isFull ||
												s.alreadyRegistered ||
												result.ticket.sessionsRemaining < 1 ||
												!!redeemingId;
											return (
												<ListItem
													key={s._id}
													sx={{
														border: '1px solid rgba(0,82,163,0.12)',
														borderRadius: 1,
														mb: 1,
														flexDirection: { xs: 'column', sm: 'row' },
														alignItems: { xs: 'stretch', sm: 'center' },
														gap: 1,
													}}
													secondaryAction={
														s.alreadyRegistered ? (
															s.zoomJoinUrl ? (
																<Button
																	href={s.zoomJoinUrl}
																	target='_blank'
																	size='small'
																	sx={{ textTransform: 'none' }}>
																	Zoom
																</Button>
															) : (
																<Chip label='Kayıtlı' color='success' size='small' />
															)
														) : (
															<Button
																variant='contained'
																size='small'
																disabled={disabled && !s.alreadyRegistered}
																onClick={() => handleRedeem(s._id)}
																sx={{
																	textTransform: 'none',
																	bgcolor: s.isFull ? undefined : '#0052a3',
																}}>
																{redeemingId === s._id ? (
																	<CircularProgress size={18} color='inherit' />
																) : s.isFull ? (
																	'Dolu'
																) : (
																	'Katıl'
																)}
															</Button>
														)
													}>
													<ListItemText
														primary={label}
														secondary={`${s.seatsLeft ?? 0} / ${s.capacity} yer · ${s.durationMinutes} dk`}
														primaryTypographyProps={{ fontFamily: 'Varela Round' }}
														secondaryTypographyProps={{ fontFamily: 'Varela Round' }}
														sx={{ pr: { sm: 12 } }}
													/>
													{s.isFull && !s.alreadyRegistered && (
														<Chip label='Dolu' size='small' color='warning' sx={{ mr: { sm: 14 } }} />
													)}
												</ListItem>
											);
										})}
									</List>
									</>
								)}
							</Box>
						)}
					</Box>
				</LandingPageLayout>
			</Box>
		</>
	);
};

export default LandingPageClubTicket;
