import {
	Alert,
	Box,
	Card,
	Checkbox,
	FormControlLabel,
	Grid,
	IconButton,
	Typography,
} from '@mui/material';
import { Add, Groups, Lock, MarkEmailReadOutlined, Person, ReceiptLong, Remove } from '@mui/icons-material';
import { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Club, ClubPurchaseSession } from '../../interfaces/club';
import { clubsService } from '../../services/clubsService';
import { setCurrencySymbol } from '../../utils/setCurrencySymbol';
import { useGeoLocation } from '../../hooks/useGeoLocation';
import { useIsLpQaPreview } from '../../hooks/useIsLpQaPreview';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import { OrganisationContext } from '../../contexts/OrganisationContextProvider';
import CustomTextField from '../forms/customFields/CustomTextField';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import { saveCheckoutReturnContext, type ClubCheckoutReturnContext } from '../../utils/hostedCheckout';
import { clubDetailPath, resolveSeatPurchasePrice } from '../../utils/clubPurchasePricing';
import theme from '../../themes';

const FONT = 'Varela Round';
const INPUT_RADIUS = '8px';
const linkColor = theme.palette?.primary?.main ?? '#0052a3';

type Props = {
	club: Club;
	onCancel: () => void;
};

const ClubPaymentForm = ({ club, onCancel }: Props) => {
	const { orgId } = useContext(OrganisationContext);
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const geoLocation = useGeoLocation();
	const isQaPreview = useIsLpQaPreview();

	const [personCount, setPersonCount] = useState(1);
	const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [agreeTermsAndPrivacy, setAgreeTermsAndPrivacy] = useState(false);
	const [agreeMarketing, setAgreeMarketing] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const purchaseSessions = club.purchaseSessions || [];
	const selectedSessions = purchaseSessions.filter((s) => selectedSessionIds.includes(s._id));
	const seatCeiling = selectedSessions.length
		? Math.min(...selectedSessions.map((s) => s.seatsLeft), Math.floor((club.seatPool || 0) / selectedSessions.length) || 0)
		: Math.max(0, ...purchaseSessions.map((s) => s.seatsLeft), 0);

	useEffect(() => {
		setPersonCount((n) => Math.min(Math.max(1, n), Math.max(1, seatCeiling || 1)));
		setSelectedSessionIds((ids) =>
			ids.filter((id) => {
				const session = purchaseSessions.find((s) => s._id === id);
				return Boolean(session && session.seatsLeft >= 1 && !session.isFull);
			}),
		);
	}, [club._id, club.seatPool, purchaseSessions.length]);

	const quote = useMemo(
		() => resolveSeatPurchasePrice(club?.packs, selectedSessions.length, personCount, geoLocation?.countryCode),
		[club, selectedSessions.length, personCount, geoLocation?.countryCode],
	);

	const sessionsByMonth = useMemo(() => {
		const groups: { monthKey: string; monthLabel: string; sessions: ClubPurchaseSession[] }[] = [];
		purchaseSessions.forEach((session) => {
			const existing = groups.find((g) => g.monthKey === session.monthKey);
			if (existing) existing.sessions.push(session);
			else groups.push({ monthKey: session.monthKey, monthLabel: session.monthLabel, sessions: [session] });
		});
		return groups;
	}, [purchaseSessions]);

	const clearError = () => setErrorMessage(null);

	const handlePayment = async () => {
		if (!orgId || !quote.ok) return;
		clearError();
		if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
			setErrorMessage('İsim, soyisim, e-posta ve telefon zorunludur.');
			return;
		}
		if (!agreeTermsAndPrivacy) {
			setErrorMessage("Lütfen Kullanıcı Sözleşmesi ve Gizlilik Politikası'nı kabul edin.");
			return;
		}
		if (!selectedSessions.length) {
			setErrorMessage('Katılacağınız oturumları seçin.');
			return;
		}
		if (personCount > seatCeiling) {
			setErrorMessage(`Bu oturumlar için en fazla ${seatCeiling} kişi seçebilirsiniz.`);
			return;
		}

		setIsProcessing(true);
		try {
			const clubReturnContext: ClubCheckoutReturnContext = {
				kind: 'club',
				firstName: firstName.trim(),
				lastName: lastName.trim(),
				email: email.trim(),
				agreeMarketing,
				orgId: orgId.toString(),
			};
			saveCheckoutReturnContext(clubReturnContext);

			const cancelPath = clubDetailPath(club, isQaPreview);
			const result = await clubsService.checkout(orgId, club._id, {
				sessionCount: selectedSessions.length,
				personCount,
				sessionIds: selectedSessions.map((s) => s._id),
				currency: quote.currency,
				amount: quote.amount,
				firstName: firstName.trim(),
				lastName: lastName.trim(),
				email: email.trim(),
				guestPhone: phone.trim(),
				cancelUrl: `${window.location.origin}${cancelPath}`,
				...(isQaPreview ? { qaPreview: true } : {}),
			});

			if (result.checkoutUrl) {
				window.location.href = result.checkoutUrl;
				return;
			}
			setErrorMessage('Ödeme başlatılamadı.');
		} catch (err: any) {
			setErrorMessage(err?.response?.data?.error || 'Ödeme başlatılamadı.');
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<form
			onSubmit={async (e) => {
				e.preventDefault();
				await handlePayment();
			}}>
			<Grid container spacing={3} sx={{ alignItems: 'stretch' }}>
				<Grid item xs={12} md={6} sx={{ display: 'flex' }}>
					<Card
						sx={{
							p: 0,
							borderRadius: 2,
							boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
							border: '1px solid',
							borderColor: 'divider',
							overflow: 'hidden',
							display: 'flex',
							flexDirection: 'column',
							minHeight: { xs: 'auto', md: 480 },
							width: '100%',
						}}>
						<Box
							sx={{
								px: 2.5,
								py: 2,
								background: 'linear-gradient(135deg, rgba(0, 82, 163, 0.12) 0%, rgba(0, 102, 204, 0.08) 100%)',
								borderBottom: '1px solid rgba(0, 82, 163, 0.1)',
							}}>
							<Typography
								sx={{
									fontFamily: FONT,
									fontWeight: 700,
									fontSize: '1.1rem',
									color: '#0A1A2F',
									display: 'flex',
									alignItems: 'center',
									gap: 1,
								}}>
								<Person sx={{ color: '#0052a3', fontSize: 22 }} /> Kayıt ve Katılım Bilgileri
							</Typography>
						</Box>
						<Box sx={{ p: 2.5, flex: 1 }}>
							<Box sx={{ mb: 2 }}>
								<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, mb: 0.75 }}>
									<Typography sx={{ fontFamily: FONT, fontSize: isMobileSize ? '0.95rem' : '1.05rem', fontWeight: 700, color: '#0A1A2F' }}>
										Kişi sayısı
									</Typography>
									<Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, px: 0.5, py: 0.25, bgcolor: '#fff' }}>
										<IconButton size='small' aria-label='Kişi azalt' disabled={isProcessing || personCount <= 1} onClick={() => { setPersonCount((n) => Math.max(1, n - 1)); clearError(); }} sx={{ color: '#0052a3' }}>
											<Remove fontSize='small' />
										</IconButton>
										<Typography sx={{ fontFamily: FONT, fontWeight: 700, minWidth: 28, textAlign: 'center' }}>{personCount}</Typography>
										<IconButton
											size='small'
											aria-label='Kişi artır'
											disabled={isProcessing || personCount >= Math.max(1, seatCeiling)}
											onClick={() => {
												setPersonCount((n) => Math.min(Math.max(1, seatCeiling), n + 1));
												clearError();
											}}
											sx={{ color: '#0052a3' }}>
											<Add fontSize='small' />
										</IconButton>
									</Box>
								</Box>
								<Typography sx={{ fontFamily: FONT, fontSize: '0.75rem', color: purchaseSessions.length ? 'text.secondary' : '#E11D48' }}>
									{purchaseSessions.length
										? 'Seçtiğiniz her oturumda bu kadar koltuk ayrılır. Ödeme sonrası Zoom linkleri e-postanıza gelir.'
										: 'Bu ay ve sonraki ay için açık oturum yok.'}
								</Typography>
							</Box>

							<Box sx={{ mb: 2 }}>
								<Typography sx={{ fontFamily: FONT, fontSize: isMobileSize ? '0.95rem' : '1.05rem', fontWeight: 700, color: '#0A1A2F', mb: 1 }}>
									Oturumlar
								</Typography>
								{sessionsByMonth.map((group) => (
									<Box key={group.monthKey} sx={{ mb: 1.25 }}>
										<Typography sx={{ fontFamily: FONT, fontSize: '0.8rem', fontWeight: 700, color: '#0052a3', textTransform: 'capitalize', mb: 0.5 }}>
											{group.monthLabel}
										</Typography>
										{group.sessions.map((session) => {
											const blocked = session.isFull || session.seatsLeft < personCount;
											const checked = selectedSessionIds.includes(session._id);
											const when = new Date(session.startsAt).toLocaleString('tr-TR', {
												weekday: 'short',
												day: 'numeric',
												month: 'short',
												hour: '2-digit',
												minute: '2-digit',
											});
											return (
												<FormControlLabel
													key={session._id}
													sx={{ display: 'flex', alignItems: 'flex-start', ml: 0, mr: 0, mb: 0.25 }}
													control={
														<Checkbox
															size='small'
															checked={checked}
															disabled={isProcessing || (blocked && !checked)}
															onChange={() => {
																setSelectedSessionIds((ids) => (ids.includes(session._id) ? ids.filter((id) => id !== session._id) : [...ids, session._id]));
																clearError();
															}}
															sx={{ py: 0.4, color: '#0052a3' }}
														/>
													}
													label={
														<Typography sx={{ fontFamily: FONT, fontSize: '0.82rem', color: blocked && !checked ? '#94a3b8' : '#0A1A2F', textTransform: 'capitalize' }}>
															{when} · {session.seatsLeft} boş
															{blocked && !checked ? ' · bu kişi sayısı için yer yok' : ''}
														</Typography>
													}
												/>
											);
										})}
									</Box>
								))}
							</Box>

							<CustomTextField
								label='İsim'
								size='small'
								value={firstName}
								onChange={(e) => {
									setFirstName(e.target.value);
									clearError();
								}}
								fullWidth
								sx={{
									mb: 2,
									'& .MuiOutlinedInput-root': { fontFamily: FONT, borderRadius: INPUT_RADIUS },
									'& .MuiInputBase-input': { fontFamily: FONT, fontSize: '0.85rem' },
									'& .MuiInputLabel-root': { fontFamily: FONT, fontSize: '0.85rem' },
								}}
								disabled={isProcessing}
							/>
							<CustomTextField
								label='Soyisim'
								size='small'
								value={lastName}
								onChange={(e) => {
									setLastName(e.target.value);
									clearError();
								}}
								fullWidth
								sx={{
									mb: 2,
									'& .MuiOutlinedInput-root': { fontFamily: FONT, borderRadius: INPUT_RADIUS },
									'& .MuiInputBase-input': { fontFamily: FONT, fontSize: '0.85rem' },
									'& .MuiInputLabel-root': { fontFamily: FONT, fontSize: '0.85rem' },
								}}
								disabled={isProcessing}
							/>
							<CustomTextField
								label='E-posta'
								type='email'
								size='small'
								value={email}
								onChange={(e) => {
									setEmail(e.target.value);
									clearError();
								}}
								fullWidth
								sx={{
									mb: 2,
									'& .MuiOutlinedInput-root': { fontFamily: FONT, borderRadius: INPUT_RADIUS },
									'& .MuiInputBase-input': { fontFamily: FONT, fontSize: '0.85rem' },
									'& .MuiInputLabel-root': { fontFamily: FONT, fontSize: '0.85rem' },
								}}
								disabled={isProcessing}
								InputProps={{ inputProps: { maxLength: 254 } }}
							/>
							<CustomTextField
								label='Telefon'
								size='small'
								value={phone}
								onChange={(e) => {
									setPhone(e.target.value);
									clearError();
								}}
								fullWidth
								required
								sx={{
									mb: 2,
									'& .MuiOutlinedInput-root': { fontFamily: FONT, borderRadius: INPUT_RADIUS },
									'& .MuiInputBase-input': { fontFamily: FONT, fontSize: '0.85rem' },
									'& .MuiInputLabel-root': { fontFamily: FONT, fontSize: '0.85rem' },
								}}
								disabled={isProcessing}
								InputProps={{ inputProps: { maxLength: 40 } }}
							/>

							<Box
								sx={{
									display: 'flex',
									alignItems: 'flex-start',
									gap: 1.25,
									mb: 2,
									px: 1.5,
									py: 1.25,
									borderRadius: 1.5,
									backgroundColor: 'rgba(0, 82, 163, 0.08)',
									border: '1px solid rgba(0, 82, 163, 0.22)',
								}}>
								<MarkEmailReadOutlined sx={{ color: linkColor, fontSize: '1.35rem', mt: '1px', flexShrink: 0 }} />
								<Typography
									sx={{
										fontFamily: FONT,
										fontSize: isMobileSize ? '0.82rem' : '0.9rem',
										fontWeight: 700,
										color: '#0A1A2F',
										lineHeight: 1.45,
									}}>
									Ödeme sonrası bilet kodunuz e-postanıza gelir.
								</Typography>
							</Box>

							<FormControlLabel
								required
								control={
									<Checkbox
										checked={agreeTermsAndPrivacy}
										onChange={(e) => {
											setAgreeTermsAndPrivacy(e.target.checked);
											clearError();
										}}
										size='small'
										disabled={isProcessing}
										sx={{ color: 'rgba(0,0,0,0.6)', '&.Mui-checked': { color: linkColor } }}
									/>
								}
								label={
									<Typography component='span' sx={{ fontFamily: FONT, fontSize: isMobileSize ? '0.7rem' : '0.75rem', color: 'text.secondary' }}>
										<Link to='/terms' target='_blank' rel='noopener noreferrer' style={{ color: linkColor, textDecoration: 'underline' }}>
											Kullanıcı Sözleşmesi
										</Link>
										{' ve '}
										<Link to='/privacy-policy' target='_blank' rel='noopener noreferrer' style={{ color: linkColor, textDecoration: 'underline' }}>
											Gizlilik Politikası
										</Link>
										{' nı okudum ve kabul ediyorum.'}
									</Typography>
								}
								sx={{ alignItems: 'center', '& .MuiFormControlLabel-label': { mt: '2px' }, mb: 1 }}
							/>
							<FormControlLabel
								control={
									<Checkbox
										checked={agreeMarketing}
										onChange={(e) => setAgreeMarketing(e.target.checked)}
										size='small'
										disabled={isProcessing}
										sx={{ color: 'rgba(0,0,0,0.6)', '&.Mui-checked': { color: linkColor } }}
									/>
								}
								label={
									<Typography component='span' sx={{ fontFamily: FONT, fontSize: isMobileSize ? '0.7rem' : '0.75rem', color: 'text.secondary' }}>
										Kampanya ve duyurulardan e-posta ile haberdar olmak istiyorum.
									</Typography>
								}
								sx={{ alignItems: 'center', '& .MuiFormControlLabel-label': { mt: '2px' } }}
							/>
						</Box>
					</Card>
				</Grid>

				<Grid item xs={12} md={6} sx={{ display: 'flex' }}>
					<Card
						sx={{
							p: 0,
							borderRadius: 2,
							boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
							border: '1px solid',
							borderColor: 'divider',
							overflow: 'hidden',
							display: 'flex',
							flexDirection: 'column',
							minHeight: { xs: 'auto', md: 480 },
							width: '100%',
							position: { md: 'sticky' },
							top: { md: 24 },
						}}>
						<Box
							sx={{
								px: 2.5,
								py: 2,
								background: 'linear-gradient(135deg, rgba(255, 107, 61, 0.16) 0%, rgba(251, 146, 60, 0.12) 100%)',
								borderBottom: '1px solid rgba(255, 107, 61, 0.22)',
							}}>
							<Typography
								sx={{
									fontFamily: FONT,
									fontWeight: 700,
									fontSize: '1.1rem',
									color: '#0A1A2F',
									display: 'flex',
									alignItems: 'center',
									gap: 1,
								}}>
								<ReceiptLong sx={{ color: '#FF6B3D', fontSize: 22 }} /> Sipariş Özeti
							</Typography>
						</Box>
						<Box sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
							<Box
								sx={{
									mb: 2,
									borderRadius: 2,
									background: 'linear-gradient(135deg, rgba(0, 82, 163, 0.06) 0%, rgba(0, 102, 204, 0.04) 100%)',
									border: '1px solid rgba(0, 82, 163, 0.12)',
									overflow: 'hidden',
								}}>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 2, pt: 1.5, pb: 1 }}>
									<Box
										sx={{
											width: 36,
											height: 36,
											borderRadius: 1.5,
											background: 'linear-gradient(135deg, rgba(0, 82, 163, 0.14) 0%, rgba(0, 102, 204, 0.08) 100%)',
											border: '1px solid rgba(0, 82, 163, 0.2)',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											flexShrink: 0,
										}}>
										<Groups sx={{ color: '#0052a3', fontSize: 18 }} />
									</Box>
									<Typography
										sx={{
											fontFamily: FONT,
											fontSize: isMobileSize ? '0.9rem' : '1rem',
											color: '#0A1A2F',
											fontWeight: 600,
											lineHeight: 1.25,
											flex: 1,
											minWidth: 0,
										}}>
										{club.title}
									</Typography>
								</Box>
								<Box
									sx={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between',
										px: 2,
										py: 1,
										borderTop: '1px solid rgba(0, 82, 163, 0.08)',
										background: 'linear-gradient(135deg, rgba(255, 107, 61, 0.08) 0%, rgba(251, 146, 60, 0.05) 100%)',
										gap: 1,
										flexWrap: 'wrap',
									}}>
									<Typography sx={{ fontFamily: FONT, fontSize: '0.9rem', color: 'text.secondary' }}>Toplam</Typography>
									{quote.ok ? (
										<Typography
											sx={{
												fontFamily: FONT,
												fontWeight: 800,
												fontSize: isMobileSize ? '1.05rem' : '1.25rem',
												color: '#0A1A2F',
												letterSpacing: '-0.03em',
												lineHeight: 1.2,
											}}>
											{setCurrencySymbol(quote.currency)}
											{quote.amount}
										</Typography>
									) : (
										<Typography sx={{ fontFamily: FONT, fontSize: '0.85rem', color: '#b45309' }}>{quote.message}</Typography>
									)}
								</Box>
								{quote.ok && (
									<Box sx={{ px: 2, py: 1, borderTop: '1px solid rgba(0, 82, 163, 0.06)' }}>
										<Typography sx={{ fontFamily: FONT, fontSize: '0.8rem', color: 'text.secondary' }}>
											{personCount} kişi, {selectedSessions.length} oturum — {quote.label}
										</Typography>
									</Box>
								)}
							</Box>

							<Typography
								sx={{
									fontFamily: FONT,
									fontSize: isMobileSize ? '0.8rem' : '0.88rem',
									fontWeight: 700,
									color: '#0A1A2F',
									lineHeight: 1.85,
									mt: 1.5,
									mb: 1,
									px: 1.25,
									py: 1,
									borderRadius: 1.5,
									backgroundColor: 'rgba(255, 107, 61, 0.1)',
									border: '1px solid rgba(255, 107, 61, 0.28)',
								}}>
								Ödeme, seçtiğiniz kişi ve oturumlar içindir.
								<br />
								Koltuklar ödeme başlarken ayrılır. Zoom linkleri e-postanıza gelir.
								<br />
								Oturum iptali veya değişikliği için bizimle{' '}
								<Link to='/contact-us' target='_blank' rel='noopener noreferrer' style={{ color: linkColor, textDecoration: 'underline' }}>
									iletişime geçin
								</Link>
								.
							</Typography>



							<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: 1, mt: 'auto' }}>
								<CustomDialogActions
									onCancel={onCancel}
									showCancelBtn={false}
									submitBtnText={isProcessing ? 'İşleniyor' : 'Ödemeye Git'}
									submitBtnSx={{
										background: 'linear-gradient(135deg, #FF6B3D 0%, #ff7d55 100%) !important',
										backgroundColor: 'transparent !important',
										fontFamily: FONT,
										color: 'white !important',
										width: '100%',
										py: '1.15rem',
										margin: 0,
										'&:hover': {
											background: 'white !important',
											color: '#FF6B3D !important',
											border: '1px solid #FF6B3D !important',
										},
										'&.Mui-disabled': {
											background: 'rgba(0,0,0,0.12) !important',
											color: 'rgba(0,0,0,0.26) !important',
										},
									}}
									disableBtn={isProcessing || !quote.ok || !agreeTermsAndPrivacy || !selectedSessions.length || purchaseSessions.length < 1}
									submitBtnType='submit'
									actionSx={{ flexDirection: 'column', gap: 0, px: 0, width: '100%', mb: 0, marginBottom: 0, pb: 0 }}
								/>
								{errorMessage && (
									<Alert
										severity='error'
										onClose={clearError}
										sx={{
											width: '100%',
											mt: 0.75,
											fontFamily: FONT,
											fontSize: isMobileSize ? '0.75rem' : '0.85rem',
											whiteSpace: 'pre-line',
											backgroundColor: '#FFF1F2',
											color: '#9F1239',
											border: '1px solid #FDA4AF',
											borderRadius: 2,
											'& .MuiAlert-icon': { color: '#E11D48' },
											'& .MuiAlert-action .MuiIconButton-root': { color: '#9F1239' },
										}}>
										{errorMessage}
									</Alert>
								)}
								<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25, mt: 1 }}>
									<Typography
										sx={{
											fontFamily: FONT,
											fontSize: '0.75rem',
											color: 'text.secondary',
											display: 'flex',
											alignItems: 'center',
											gap: 0.5,
										}}>
										<Lock sx={{ fontSize: 12, opacity: 0.8 }} /> Güvenli ödeme (Stripe)
									</Typography>
									<Typography sx={{ fontFamily: FONT, fontSize: '0.7rem', color: 'text.secondary', opacity: 0.9 }}>
										Kart bilgileriniz Stripe sayfasında girilir ve saklanmaz
									</Typography>
								</Box>
							</Box>
						</Box>
					</Card>
				</Grid>
			</Grid>
		</form>
	);
};

export default ClubPaymentForm;
