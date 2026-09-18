import {
	Alert,
	Box,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	InputAdornment,
	Link,
	Snackbar,
	Typography,
	Chip,
} from '@mui/material';
import {
	ArrowBack,
	ConfirmationNumberOutlined,
	ContentCopyOutlined,
	InfoOutlined,
	VideocamOutlined,
} from '@mui/icons-material';
import LandingPageLayout from '../components/landingPage/LandingPageLayout';
import { useContext, useEffect, useRef, useState } from 'react';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import { clubsService } from '../services/clubsService';
import { ClubTicketLookupResult } from '../interfaces/club';
import { SEO } from '../components/seo';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import { useIsLpQaPreview } from '../hooks/useIsLpQaPreview';
import { LP_QA_PREVIEW_SEGMENT } from '../utils/lpQaPreview';

const FONT = "'Varela Round', sans-serif";
const BLUE = '#0052a3';

type PendingRedeem = {
	sessionId: string;
	label: string;
};

function buildTicketShareText(result: ClubTicketLookupResult) {
	const lines = ['Aden Academy kulüp bileti', `Kod: ${result.ticket.code}`];
	if (result.ticket.guestName) lines.push(`Ad: ${result.ticket.guestName}`);
	if (result.club?.title) lines.push(`Kulüp: ${result.club.title}`);
	lines.push('');
	result.sessions.forEach((session) => {
		const when = new Date(session.startsAt).toLocaleString('tr-TR', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			hour: '2-digit',
			minute: '2-digit',
		});
		lines.push(when);
		if (session.zoomJoinUrl) lines.push(session.zoomJoinUrl);
		lines.push('');
	});
	lines.push(`Oturum iptali veya değişikliği için iletişime geçin: ${window.location.origin}/contact-us`);
	return lines.join('\n').trim();
}

const LandingPageClubTicket = () => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const isQaPreview = useIsLpQaPreview();
	const clubsListPath = isQaPreview ? `/landing-page-clubs/${LP_QA_PREVIEW_SEGMENT}` : '/landing-page-clubs';
	const copyHandledRef = useRef(false);
	const shareHandledRef = useRef(false);

	const [code, setCode] = useState(() => (searchParams.get('code') || '').trim().toUpperCase());
	const [loading, setLoading] = useState(false);
	const [redeemingId, setRedeemingId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [result, setResult] = useState<ClubTicketLookupResult | null>(null);
	const [joinUrl, setJoinUrl] = useState<string | null>(null);
	const [copyToast, setCopyToast] = useState(false);
	const [copyToastMessage, setCopyToastMessage] = useState('Bilet kodu kopyalandı');
	const [pendingRedeem, setPendingRedeem] = useState<PendingRedeem | null>(null);

	useEffect(() => {
		const qCode = (searchParams.get('code') || '').trim().toUpperCase();
		const shouldCopy = searchParams.get('copy') === '1';
		if (!qCode) return;
		setCode(qCode);
		if (!shouldCopy || copyHandledRef.current) return;
		copyHandledRef.current = true;
		(async () => {
			try {
				await navigator.clipboard.writeText(qCode);
				setCopyToastMessage('Bilet kodu kopyalandı');
				setCopyToast(true);
			} catch {
				/* ignore clipboard failures; code is still prefilled */
			}
			const next = new URLSearchParams(searchParams);
			next.delete('copy');
			setSearchParams(next, { replace: true });
		})();
	}, [searchParams, setSearchParams]);

	useEffect(() => {
		const qCode = (searchParams.get('code') || '').trim().toUpperCase();
		if (searchParams.get('share') !== '1' || !qCode || shareHandledRef.current) return;
		shareHandledRef.current = true;
		setCode(qCode);
		(async () => {
			try {
				const data = await clubsService.lookupTicket(qCode, { qaPreview: isQaPreview });
				setResult(data);
				try {
					await navigator.clipboard.writeText(buildTicketShareText(data));
					setCopyToastMessage('Bilet bilgileri kopyalandı. Başkasına gönderebilirsiniz.');
					setCopyToast(true);
				} catch {
					setError('Otomatik kopyalanamadı. Aşağıdaki butonu kullanın.');
				}
			} catch {
				setError('Bilet bulunamadı.');
			} finally {
				const next = new URLSearchParams(searchParams);
				next.delete('share');
				setSearchParams(next, { replace: true });
			}
		})();
	}, [isQaPreview, searchParams, setSearchParams]);

	const handleLookup = async () => {
		setError(null);
		setSuccess(null);
		setJoinUrl(null);
		if (!code.trim()) {
			setError('Bilet kodu gerekli.');
			return;
		}
		setLoading(true);
		try {
			const data = await clubsService.lookupTicket(code.trim(), {
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
		setPendingRedeem(null);
		setError(null);
		setSuccess(null);
		setRedeemingId(sessionId);
		try {
			const data = await clubsService.redeemTicket(code.trim(), sessionId, {
				qaPreview: isQaPreview,
			});
			setJoinUrl(data.zoomJoinUrl || null);
				setSuccess(data.alreadyRegistered ? 'Bu oturum için zaten kayıtlısınız.' : 'Kayıt tamam.');
			const refreshed = await clubsService.lookupTicket(code.trim(), {
				qaPreview: isQaPreview,
			});
			setResult(refreshed);
		} catch (err: any) {
			setError(err?.response?.data?.error || 'Kayıt başarısız.');
		} finally {
			setRedeemingId(null);
		}
	};

	const fieldSx = {
		'& .MuiOutlinedInput-root': {
			borderRadius: '0.75rem',
			backgroundColor: 'rgba(255,255,255,0.92)',
			fontFamily: FONT,
			'& fieldset': { borderColor: 'rgba(0, 82, 163, 0.16)' },
			'&:hover fieldset': { borderColor: 'rgba(0, 82, 163, 0.35)' },
			'&.Mui-focused fieldset': { borderColor: BLUE, borderWidth: 1.5 },
		},
		'& .MuiInputLabel-root': { fontFamily: FONT },
		'& .MuiInputBase-input': { fontFamily: FONT, py: 1.35 },
	};

	return (
		<>
			<SEO
				title='Oturum Sorgula - Aden Academy'
				description='Bilet kodunuzla kayıtlı oturumlarınızı ve Zoom linklerinizi görün.'
				noIndex={isQaPreview}
			/>
			<Box
				sx={{
					minHeight: '100vh',
					position: 'relative',
					overflow: 'hidden',
					background: `
						radial-gradient(ellipse 80% 50% at 10% 0%, rgba(0, 82, 163, 0.12) 0%, transparent 55%),
						radial-gradient(ellipse 70% 45% at 95% 15%, rgba(255, 107, 61, 0.1) 0%, transparent 50%),
						linear-gradient(180deg, #f4f7fb 0%, #ffffff 45%, #eef3f8 100%)
					`,
				}}>
				<LandingPageLayout>
					<Box
						sx={{
							width: '100%',
							maxWidth: result ? 520 : 420,
							mx: 'auto',
							px: { xs: 2, sm: 2.5 },
							pt: isMobileSize ? '11vh' : '13vh',
							pb: 8,
							transition: 'max-width 0.35s ease',
						}}>
						<Box sx={{ textAlign: 'center', mb: 3.5 }}>
							<Box
								sx={{
									width: isMobileSize ? 44 : 56,
									height: isMobileSize ? 44 : 56,
									mx: 'auto',
									mb: 2,
									borderRadius: isMobileSize ? '0.85rem' : '1rem',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									background: `linear-gradient(145deg, ${BLUE} 0%, #0070d6 100%)`,
									boxShadow: '0 10px 28px rgba(0, 82, 163, 0.28)',
								}}>
								<ConfirmationNumberOutlined sx={{ color: '#fff', fontSize: isMobileSize ? 22 : 28 }} />
							</Box>
							<Typography
								component='h1'
								sx={{
									fontFamily: FONT,
									fontWeight: 700,
									fontSize: isMobileSize ? '1.4rem' : '1.85rem',
									letterSpacing: '-0.02em',
									color: '#0A1A2F',
									mb: 1,
								}}>
								Oturum Sorgula
							</Typography>
							<Typography
								sx={{
									fontFamily: FONT,
									fontSize: isMobileSize ? '0.85rem' : '0.92rem',
									color: '#64748b',
									lineHeight: 1.55,
									maxWidth: 360,
									mx: 'auto',
								}}>
								Bilet kodunuzla kayıtlı olduğunuz oturumları ve Zoom linklerini görün.
							</Typography>
						</Box>

						<Box
							component='form'
							onSubmit={(e) => {
								e.preventDefault();
								void handleLookup();
							}}
							sx={{
								display: 'flex',
								flexDirection: 'column',
								gap: 1.75,
								mb: 2.5,
							}}>
							<CustomTextField
								label='Bilet Kodu'
								value={code}
								onChange={(e) => setCode(e.target.value.toUpperCase())}
								placeholder='CLB-XXXXXX'
								fullWidth
								InputProps={{
									startAdornment: (
										<InputAdornment position='start'>
											<ConfirmationNumberOutlined sx={{ color: BLUE, fontSize: 20 }} />
										</InputAdornment>
									),
								}}
								sx={fieldSx}
							/>

							<Button
								type='submit'
								variant='contained'
								disabled={loading}
								fullWidth
								startIcon={loading ? <CircularProgress size={18} color='inherit' /> : undefined}
								sx={{
									mt: 0.5,
									fontFamily: FONT,
									textTransform: 'none',
									fontWeight: 700,
									fontSize: isMobileSize ? '0.85rem' : '0.95rem',
									height: isMobileSize ? 40 : 46,
									borderRadius: '0.75rem',
									boxShadow: '0 8px 20px rgba(0, 82, 163, 0.25)',
									background: `linear-gradient(135deg, ${BLUE} 0%, #0066cc 100%)`,
									'&:hover': {
										background: 'linear-gradient(135deg, #004080 0%, #0052a3 100%)',
										boxShadow: '0 10px 24px rgba(0, 82, 163, 0.32)',
									},
								}}>
								Bilet Sorgula
							</Button>

							<Button
								type='button'
								variant='text'
								onClick={() => navigate(clubsListPath)}
								startIcon={<ArrowBack sx={{ fontSize: 18 }} />}
								sx={{
									alignSelf: 'center',
									fontFamily: FONT,
									textTransform: 'none',
									color: '#64748b',
									fontSize: '0.85rem',
									px: 1.5,
									'&:hover': { backgroundColor: 'rgba(0, 82, 163, 0.06)', color: BLUE },
								}}>
								Kulüp listesine dön
							</Button>
						</Box>


						{error && (
							<Alert severity='error' sx={{ mb: 2, borderRadius: '0.75rem', fontFamily: FONT }}>
								{error}
							</Alert>
						)}
						{success && (
							<Alert severity='success' sx={{ mb: 2, borderRadius: '0.75rem', fontFamily: FONT }}>
								{success}
							</Alert>
						)}
						{joinUrl && (
							<Button
								href={joinUrl}
								target='_blank'
								rel='noopener noreferrer'
								variant='contained'
								fullWidth
								startIcon={<VideocamOutlined />}
								sx={{
									mb: 2.5,
									textTransform: 'none',
									fontFamily: FONT,
									fontWeight: 700,
									height: 44,
									borderRadius: '0.75rem',
									bgcolor: '#2D8CFF',
									'&:hover': { bgcolor: '#1a7aef' },
								}}>
								Zoom’a Katıl
							</Button>
						)}

						{result && (
							<Box
								sx={{
									animation: 'ticketFadeIn 0.35s ease-out',
									'@keyframes ticketFadeIn': {
										from: { opacity: 0, transform: 'translateY(10px)' },
										to: { opacity: 1, transform: 'translateY(0)' },
									},
								}}>
								<Box
									sx={{
										mb: 2,
										pb: 2,
										borderBottom: '1px solid rgba(0, 82, 163, 0.1)',
										textAlign: 'center',
									}}>
									<Typography
										sx={{
											fontFamily: FONT,
											fontWeight: 700,
											fontSize: '1.05rem',
											color: '#0A1A2F',
											mb: 0.5,
										}}>
										{result.club.title}
									</Typography>
									<Typography sx={{ fontFamily: FONT, color: '#475569', fontSize: '0.88rem' }}>
										{result.ticket.guestName}
									</Typography>
									<Button
										type='button'
										variant='outlined'
										size='small'
										startIcon={<ContentCopyOutlined />}
										onClick={async () => {
											try {
												await navigator.clipboard.writeText(buildTicketShareText(result));
												setCopyToastMessage('Bilet bilgileri kopyalandı. Başkasına gönderebilirsiniz.');
												setCopyToast(true);
											} catch {
												setError('Kopyalama başarısız. Metni seçip kopyalayın.');
											}
										}}
										sx={{
											mt: 1.25,
											textTransform: 'none',
											fontFamily: FONT,
											fontWeight: 700,
											borderColor: BLUE,
											color: BLUE,
											borderRadius: '999px',
										}}>
										Bilet bilgilerini kopyala
									</Button>
									{result.ticket.expiresAt && (
										<Typography
											sx={{
												mt: 1,
												fontFamily: FONT,
												fontSize: '0.78rem',
												color: '#64748b',
												lineHeight: 1.45,
											}}>
											Son geçerlilik:{' '}
											{new Date(result.ticket.expiresAt).toLocaleString('tr-TR', {
												weekday: 'short',
												day: 'numeric',
												month: 'long',
												hour: '2-digit',
												minute: '2-digit',
											})}
										</Typography>
									)}
								</Box>

								{result.sessions.length === 0 ? (
									<Typography sx={{ fontFamily: FONT, color: '#94a3b8', textAlign: 'center' }}>
										Bu bilete kayıtlı oturum yok.
									</Typography>
								) : (
									<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
										{result.sessions.map((s) => {
											const starts = new Date(s.startsAt);
											const label = starts.toLocaleString('tr-TR', {
												weekday: 'long',
												day: 'numeric',
												month: 'long',
												hour: '2-digit',
												minute: '2-digit',
											});
											const disabled = s.isFull || s.alreadyRegistered || !!redeemingId;
											return (
												<Box
													key={s._id}
													sx={{
														display: 'flex',
														flexDirection: { xs: 'column', sm: 'row' },
														alignItems: { xs: 'stretch', sm: 'center' },
														justifyContent: 'space-between',
														gap: 1.25,
														p: 1.5,
														borderRadius: '0.85rem',
														backgroundColor: 'rgba(255,255,255,0.9)',
														border: '1px solid rgba(0, 82, 163, 0.1)',
														boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
													}}>
													<Box sx={{ minWidth: 0, flex: 1 }}>
														<Typography
															sx={{
																fontFamily: FONT,
																fontWeight: 600,
																fontSize: '0.9rem',
																color: '#0A1A2F',
																textTransform: 'capitalize',
															}}>
															{label}
														</Typography>
														<Typography sx={{ fontFamily: FONT, fontSize: '0.78rem', color: '#64748b', mt: 0.25 }}>
															{s.isFull && !s.alreadyRegistered
																? `Dolu · ${s.durationMinutes} dk`
																: `${s.durationMinutes} dk`}
														</Typography>
													</Box>
													<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
														{s.alreadyRegistered ? (
															s.zoomJoinUrl ? (
																<Button
																	href={s.zoomJoinUrl}
																	target='_blank'
																	size='small'
																	startIcon={<VideocamOutlined />}
																	sx={{
																		textTransform: 'none',
																		fontFamily: FONT,
																		fontWeight: 600,
																		borderRadius: '0.6rem',
																		color: '#2D8CFF',
																	}}>
																	Zoom
																</Button>
															) : (
																<Chip label='Kayıtlı' color='success' size='small' sx={{ fontFamily: FONT }} />
															)
														) : (
															<Button
																variant='contained'
																size='small'
																disabled={disabled}
																onClick={() =>
																	setPendingRedeem({
																		sessionId: s._id,
																		label,
																	})
																}
																sx={{
																	textTransform: 'none',
																	fontFamily: FONT,
																	fontWeight: 700,
																	minWidth: 88,
																	borderRadius: '0.6rem',
																	bgcolor: s.isFull ? undefined : BLUE,
																	boxShadow: 'none',
																}}>
																{redeemingId === s._id ? (
																	<CircularProgress size={18} color='inherit' />
																) : s.isFull ? (
																	'Dolu'
																) : (
																	'Katıl'
																)}
															</Button>
														)}
													</Box>
												</Box>
											);
										})}
									</Box>
								)}
							</Box>
						)}
					</Box>
					<Box
						sx={{
							display: 'flex',
							gap: 1,
							justifyContent: 'center',
							alignItems: 'center',
							px: 0.5,
							mb: 3,
						}}>
						<InfoOutlined sx={{ color: BLUE, fontSize: 18, mt: '0.5px', flexShrink: 0 }} />
						<Typography sx={{ fontFamily: FONT, fontSize: '0.75rem', color: '#64748b', lineHeight: 1.5 }}>
							Oturum iptali veya değişikliği için{' '}
							<a href='/contact-us' style={{ color: BLUE, fontWeight: 600, textDecoration: 'none' }}>
								bizimle iletişime geçin
							</a>
							.
						</Typography>
					</Box>
				</LandingPageLayout>
			</Box>
			<Snackbar
				open={copyToast}
				autoHideDuration={2500}
				onClose={() => setCopyToast(false)}
				anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
				<Alert onClose={() => setCopyToast(false)} severity='success' variant='filled' sx={{ fontFamily: FONT }}>
					{copyToastMessage}
				</Alert>
			</Snackbar>

			<Dialog
				open={Boolean(pendingRedeem)}
				onClose={() => {
					if (!redeemingId) setPendingRedeem(null);
				}}
				fullWidth
				maxWidth='xs'
				PaperProps={{
					sx: {
						borderRadius: '1rem',
						fontFamily: FONT,
					},
				}}>
				<DialogTitle sx={{ fontFamily: FONT, fontWeight: 700, fontSize: '1.1rem', color: '#0A1A2F', pb: 1 }}>
					Oturuma katılmayı onayla
				</DialogTitle>
				<DialogContent>
					{pendingRedeem && (
						<Typography sx={{ fontFamily: FONT, fontSize: '0.9rem', color: '#334155', mb: 1.5, textTransform: 'capitalize' }}>
							{pendingRedeem.label}
						</Typography>
					)}
					<Typography sx={{ fontFamily: FONT, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.55 }}>
						Bu işlem 1 oturum hakkınızı kullanır.
					</Typography>
					<Typography sx={{ fontFamily: FONT, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.85, mt: '0.5rem' }}>
						Oturum iptali veya değişikliği için{' '}
						<Link href='/contact-us' target='_blank' rel='noopener noreferrer' sx={{ color: BLUE, fontWeight: 700 }}>
							bizimle iletişime geçin
						</Link>
						.
					</Typography>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
					<Button
						onClick={() => setPendingRedeem(null)}
						disabled={Boolean(redeemingId)}
						sx={{ textTransform: 'none', fontFamily: FONT, color: '#64748b' }}>
						Vazgeç
					</Button>
					<Button
						variant='contained'
						disabled={!pendingRedeem || Boolean(redeemingId)}
						onClick={() => pendingRedeem && handleRedeem(pendingRedeem.sessionId)}
						sx={{
							textTransform: 'none',
							fontFamily: FONT,
							fontWeight: 700,
							bgcolor: BLUE,
							borderRadius: '0.6rem',
							boxShadow: 'none',
							minWidth: 100,
						}}>
						{redeemingId ? <CircularProgress size={18} color='inherit' /> : 'Onayla'}
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
};

export default LandingPageClubTicket;
