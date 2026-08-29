import { Box, Typography, Button, Card, CardContent, Alert, Snackbar, IconButton, Table, TableBody, TableRow, TableCell, Autocomplete, TextField, Collapse, Checkbox, FormControlLabel } from '@mui/material';
import { ShoppingCart, Close, Description, Assignment, ContactPhone, ReceiptLong, Lock, ExpandMore, ExpandLess } from '@mui/icons-material';
import LandingPageLayout from '../components/landingPage/LandingPageLayout';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useConsultationCart } from '../contexts/ConsultationCartContextProvider';
import { useDocumentCart } from '../contexts/DocumentCartContextProvider';
import { feedbackFormsService } from '../services/feedbackFormsService';
import CartPaymentDialogWrapper from '../components/landingPage/CartPaymentDialogWrapper';
import type { CartPaymentItem } from '../components/landingPage/CartPaymentDialog';
import { setCurrencySymbol } from '../utils/setCurrencySymbol';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale/tr';
import axios from 'axios';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { useGeoLocation } from '../hooks/useGeoLocation';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import theme from '../themes';
import { COUNTRY_LIST } from '../data/countries';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import { UserAuthContext } from '../contexts/UserAuthContextProvider';
import { getDocumentCheckoutCopy } from '../utils/documentCheckoutCopy';

const base_url = import.meta.env.VITE_SERVER_BASE_URL;
const documentCheckoutCopy = getDocumentCheckoutCopy('tr');

function parseAmount(amount: string): number {
	if (!amount || amount.toLowerCase() === 'free') return 0;
	const n = parseFloat(amount.replace(/,/g, '.'));
	return Number.isFinite(n) ? n : 0;
}

function getCartTotals(
	documentItems: Array<{ amount: string; currency: string }>,
	consultationItems: Array<{ price: { amount: string; currency: string } }>
): Record<string, number> {
	const totals: Record<string, number> = {};
	documentItems.forEach((item) => {
		const c = (item.currency || 'usd').toLowerCase();
		totals[c] = (totals[c] ?? 0) + parseAmount(item.amount);
	});
	consultationItems.forEach((item) => {
		const c = (item.price?.currency || 'usd').toLowerCase();
		totals[c] = (totals[c] ?? 0) + parseAmount(item.price?.amount ?? '0');
	});
	return totals;
}

export default function LandingPageCart() {
	const navigate = useNavigate();
	const location = useGeoLocation();
	const { orgId: contextOrgId } = useContext(OrganisationContext);
	const { user } = useContext(UserAuthContext);
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	useEffect(() => {
		if (location?.countryCode) {
			const code = location.countryCode.toUpperCase();
			const found = COUNTRY_LIST.some((c) => c.code === code);
			setCheckoutGuestCountry(found ? code : 'TR');
		}
	}, [location?.countryCode]);

	useEffect(() => {
		if (!user) return;
		if (user.firstName) setCheckoutGuestFirstName(user.firstName);
		if (user.lastName) setCheckoutGuestLastName(user.lastName);
		if (user.email) setCheckoutGuestEmail(user.email);
	}, [user?._id, user?.firstName, user?.lastName, user?.email]);

	const { items: consultationItems, removeItem: removeConsultation, clearCart: clearConsultationCart } = useConsultationCart();
	const { items: documentItems, removeItem: removeDocument, clearCart: clearDocumentCart } = useDocumentCart();

	const [checkoutGuestFirstName, setCheckoutGuestFirstName] = useState('');
	const [checkoutGuestLastName, setCheckoutGuestLastName] = useState('');
	const [checkoutGuestEmail, setCheckoutGuestEmail] = useState('');
	const [checkoutGuestCountry, setCheckoutGuestCountry] = useState('TR');
	const [checkoutGuestPhone, setCheckoutGuestPhone] = useState('');
	const [agreeTermsAndPrivacy, setAgreeTermsAndPrivacy] = useState(false);
	const [agreeDocumentWithdrawalWaiver, setAgreeDocumentWithdrawalWaiver] = useState(false);
	const [agreeMarketing, setAgreeMarketing] = useState(false);

	const [cartPaymentOpen, setCartPaymentOpen] = useState(false);
	const [paymentQueue, setPaymentQueue] = useState<CartPaymentItem[]>([]);
	const [consultationAppointmentIds, setConsultationAppointmentIds] = useState<string[]>([]);
	const [payAllLoading, setPayAllLoading] = useState(false);

	const [error, setError] = useState<string | null>(null);
	const [successSnack, setSuccessSnack] = useState(false);
	const [successMessage, setSuccessMessage] = useState('');
	const [kaynaklarExpanded, setKaynaklarExpanded] = useState(true);
	const [danismanliklarExpanded, setDanismanliklarExpanded] = useState(true);

	useEffect(() => {
		if (error) {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}, [error]);

	const handlePayAll = async () => {
		setError(null);
		const firstName = checkoutGuestFirstName.trim();
		const lastName = checkoutGuestLastName.trim();
		const email = checkoutGuestEmail.trim();
		const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
		if (!firstName) {
			setError('Lütfen adınızı girin.');
			return;
		}
		if (!lastName) {
			setError('Lütfen soyadınızı girin.');
			return;
		}
		if (!email) {
			setError('Lütfen e-posta adresinizi girin.');
			return;
		}
		if (!emailValid) {
			setError('Geçerli bir e-posta adresi girin.');
			return;
		}
		if (!agreeTermsAndPrivacy) {
			setError('Ödemeye devam etmek için Kullanıcı Sözleşmesi ve Gizlilik Politikasını kabul etmeniz gerekmektedir.');
			return;
		}
		if (documentItems.length > 0 && documentCheckoutCopy.needsWithdrawalWaiver && !agreeDocumentWithdrawalWaiver) {
			setError(documentCheckoutCopy.waiverRequiredError);
			return;
		}
		const currencyKeys = Object.entries(getCartTotals(documentItems, consultationItems))
			.filter(([, amount]) => amount > 0)
			.map(([currency]) => currency);
		if (currencyKeys.length > 1) {
			setError(
				'Sepetinizde birden fazla para birimi var. Lütfen yalnızca aynı para birimindeki ürünlerle ödeme yapın (farklı para birimlerini ayrı ayrı satın alın).'
			);
			return;
		}
		setPayAllLoading(true);
		try {
			const guestName = `${firstName} ${lastName}`.trim();
			const items: Array<
				| { type: 'document'; documentId: string; orgId: string; amount: number; currency: string }
				| { type: 'consultation'; consultationId: string; slotId: string; consultantId: string; price: { amount: string; currency: string }; guestEmail: string; guestName: string; guestPhone?: string }
			> = [];

			for (const item of documentItems) {
				items.push({
					type: 'document',
					documentId: item.documentId,
					orgId: item.orgId,
					amount: parseAmount(item.amount),
					currency: item.currency || 'usd',
				});
			}
			for (const item of consultationItems) {
				items.push({
					type: 'consultation',
					consultationId: item.consultationId,
					slotId: item.slotId,
					consultantId: item.consultantId,
					price: item.price,
					guestName,
					guestEmail: email,
					guestPhone: checkoutGuestPhone.trim() || undefined,
				});
			}

			const res = await axios.post(`${base_url}/payments/cart/create`, {
				items,
				firstName,
				lastName,
				email,
				...(user?._id ? { userId: user._id } : {}),
			});
			const { paymentIntents, consultationAppointmentIds: appointmentIds } = res.data;

			const queue: CartPaymentItem[] = (paymentIntents || []).map(
				(pi: { clientSecret: string; paymentIntentId: string }) => ({
					type: 'document' as const,
					clientSecret: pi.clientSecret,
					paymentIntentId: pi.paymentIntentId,
					capturePayload: {
						firstName,
						lastName,
						email,
						...(user?._id ? { userId: user._id } : {}),
					},
				})
			);

			setConsultationAppointmentIds(appointmentIds || []);
			setPaymentQueue(queue);
			setCartPaymentOpen(true);
		} catch (e: unknown) {
			const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
			setError(msg || 'Ödeme hazırlanırken bir hata oluştu.');
		} finally {
			setPayAllLoading(false);
		}
	};

	const handleCartPaymentSuccess = async (result?: { documentDeliveryFailed?: boolean; documentDeliveryMessage?: string }) => {
		// Link consultation form submissions to appointments (guest name/email + appointmentId)
		const firstName = checkoutGuestFirstName.trim();
		const lastName = checkoutGuestLastName.trim();
		const email = checkoutGuestEmail.trim();
		for (let i = 0; i < consultationItems.length; i++) {
			const item = consultationItems[i];
			const appointmentId = consultationAppointmentIds[i];
			if (item.formSubmissionId && appointmentId) {
				try {
					await feedbackFormsService.linkSubmissionToAppointment(item.formSubmissionId, {
						firstName,
						lastName,
						userEmail: email,
						consultationAppointmentId: appointmentId,
					});
				} catch (_e) {
					// Non-blocking: submission stays unlinked; admin can still see form responses
				}
			}
		}
		// Record guest marketing consent if they opted in
		if (agreeMarketing && email) {
			const orgId = documentItems[0]?.orgId || contextOrgId || import.meta.env.VITE_ORG_ID;
			if (orgId) {
				try {
					await axios.post(`${base_url}/marketing-consent/guest`, {
						email,
						orgId,
						firstName: checkoutGuestFirstName.trim(),
						lastName: checkoutGuestLastName.trim(),
						source: 'cart',
					});
				} catch (_e) {
					// Non-blocking: consent not stored; user can opt in again later
				}
			}
		}
		clearDocumentCart();
		clearConsultationCart();
		setCartPaymentOpen(false);
		setPaymentQueue([]);
		setConsultationAppointmentIds([]);
		setSuccessMessage(
			result?.documentDeliveryFailed
				? result.documentDeliveryMessage ||
				'Ödemeniz alındı ancak doküman e-postası gönderilemedi. Lütfen destek ile iletişime geçin; ekibimiz size dokümanı manuel olarak iletecektir.'
				: 'Ödemeniz başarıyla tamamlandı. E-postanızı kontrol edin.'
		);
		setSuccessSnack(true);
	};

	const totalCount = consultationItems.length + documentItems.length;
	const isEmpty = totalCount === 0 && !cartPaymentOpen;
	const cartTotals = getCartTotals(documentItems, consultationItems);
	const totalCurrencies = Object.entries(cartTotals).filter(([, v]) => v > 0);
	const hasMixedCurrencies = totalCurrencies.length > 1;

	if (isEmpty) {
		return (
			<Box
				sx={{
					minHeight: '100vh',
					position: 'relative',
					background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 40%, rgba(0, 82, 163, 0.05) 100%)',
				}}>
				<Box sx={{ position: 'relative', zIndex: 1 }}>
					<LandingPageLayout>
						<Box sx={{ py: 10, px: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
							<Box
								sx={{
									width: 80,
									height: 80,
									borderRadius: '50%',
									bgcolor: 'grey.100',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									mb: 3,
									mt: isMobileSize ? '10vh' : '13vh',
								}}
							>
								<ShoppingCart sx={{ color: 'text.secondary', fontSize: 40 }} />
							</Box>
							<Typography sx={{ fontFamily: 'Varela Round', fontWeight: 600, fontSize: '1.5rem', color: '#0A1A2F', mb: 1 }}>
								Sepetiniz boş
							</Typography>
							<Typography sx={{ fontFamily: 'Varela Round', color: 'text.secondary', fontSize: '0.95rem', mb: 3 }}>
								Kitap veya danışmanlık ekleyerek devam edin.
							</Typography>
							<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
								<Button
									variant="contained"
									onClick={() => navigate('/landing-page-resources')}
									sx={{
										fontFamily: 'Varela Round',
										textTransform: 'capitalize',
										fontWeight: 600,
										px: 3,
										py: 1.25,
										borderRadius: 2,
										background: 'linear-gradient(135deg, #FF6B3D 0%, #ff7d55 100%)',
										boxShadow: '0 4px 14px rgba(255, 107, 61, 0.35)',
										'&:hover': { background: 'linear-gradient(135deg, #ff7d55 0%, #FF6B3D 100%)', boxShadow: '0 6px 20px rgba(255, 107, 61, 0.45)' },
									}}
								>
									Kitaplara Git
								</Button>
								<Button
									variant="outlined"
									onClick={() => navigate('/landing-page-consultations')}
									sx={{
										fontFamily: 'Varela Round',
										textTransform: 'capitalize',
										fontWeight: 500,
										px: 3,
										py: 1.25,
										borderRadius: 2,
										borderColor: '#0052a3',
										color: '#0052a3',
										'&:hover': { borderColor: '#004c99', bgcolor: 'rgba(0, 82, 163, 0.06)' },
									}}
								>
									Danışmanlıklara Git
								</Button>
							</Box>
						</Box>
					</LandingPageLayout>
				</Box>
				<CartPaymentDialogWrapper
					open={cartPaymentOpen}
					onClose={() => { setCartPaymentOpen(false); setPaymentQueue([]); }}
					queue={paymentQueue}
					firstName={checkoutGuestFirstName.trim()}
					lastName={checkoutGuestLastName.trim()}
					email={checkoutGuestEmail.trim()}
					onSuccess={handleCartPaymentSuccess}
				/>
				<Snackbar
					open={successSnack}
					autoHideDuration={6000}
					anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
					sx={{ mt: '4rem' }}
					onClose={() => setSuccessSnack(false)}>
					<Alert
						onClose={() => setSuccessSnack(false)}
						severity="success"
						sx={{
							width: '100%',
							fontFamily: 'Varela Round',
							backgroundColor: theme.bgColor?.greenSecondary,
							color: theme.textColor?.common.main,
							'& .MuiAlert-icon': { color: 'white' },
						}}>
						{successMessage}
					</Alert>
				</Snackbar>
			</Box>
		);
	}

	return (
		<Box
			sx={{
				minHeight: '100vh',
				position: 'relative',
				background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 40%, rgba(0, 82, 163, 0.05) 100%)',
			}}>
			<Box sx={{ position: 'relative', zIndex: 1 }}>
				<LandingPageLayout>
					<Box sx={{ maxWidth: 1100, mx: 'auto', py: { xs: 3, md: 5 }, px: { xs: 2, md: 3 } }}>
						{/* Page title */}
						<Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5, mt: isMobileSize ? '10vh' : '13vh' }}>
							<Box
								sx={{
									width: 44,
									height: 44,
									borderRadius: 2,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									background: 'linear-gradient(135deg, #FF6B3D 0%, #ff7d55 100%)',
									boxShadow: '0 4px 14px rgba(255, 107, 61, 0.35)',
								}}
							>
								<ShoppingCart sx={{ color: 'white', fontSize: 26 }} />
							</Box>
							<Box>
								<Typography sx={{ fontFamily: 'Varela Round', fontWeight: 700, fontSize: '1.5rem', color: '#0A1A2F', lineHeight: 1.2 }}>
									Sepet & Ödeme
								</Typography>
								<Typography sx={{ fontFamily: 'Varela Round', fontSize: '0.85rem', color: 'text.secondary' }}>
									{totalCount} {totalCount === 1 ? 'ürün' : 'ürün'}
								</Typography>
							</Box>
						</Box>


						{error && (
							<Alert severity="error" sx={{ mb: 3, fontFamily: 'Varela Round', borderRadius: 2 }} onClose={() => setError(null)}>
								{error}
							</Alert>
						)}


						<Box
							sx={{
								display: 'grid',
								gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
								gap: { xs: 3, md: 4 },
								alignItems: 'stretch',
								width: '100%',
							}}
						>
							{/* Left: İletişim bilgileri */}
							<Box sx={{ minWidth: 0, order: { xs: 1, md: 1 } }}>
								<Card
									sx={{
										borderRadius: 3,
										boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
										border: '1px solid rgba(0, 82, 163, 0.12)',
										overflow: 'hidden',
										height: '100%',
									}}
								>
									<Box
										sx={{
											px: 2.5,
											py: 2,
											background: 'linear-gradient(135deg, rgba(0, 82, 163, 0.12) 0%, rgba(0, 102, 204, 0.08) 100%)',
											borderBottom: '1px solid rgba(0, 82, 163, 0.1)',
										}}
									>
										<Typography sx={{ fontFamily: 'Varela Round', fontWeight: 700, fontSize: '1.1rem', color: '#0A1A2F', display: 'flex', alignItems: 'center', gap: 1 }}>
											<ContactPhone sx={{ color: '#0052a3', fontSize: 22 }} /> İletişim bilgileriniz
										</Typography>
										{/* <Typography variant="body2" sx={{ fontFamily: 'Varela Round', color: 'text.secondary', mt: 0.5, fontSize: '0.8rem' }}>
											Kaynak veya danışmanlık ödemesi için kullanılacaktır.
										</Typography> */}
									</Box>
									<CardContent sx={{ p: 2.5 }}>
										<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
											<Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
												<CustomTextField
													label="İsim"
													value={checkoutGuestFirstName}
													onChange={(e) => setCheckoutGuestFirstName(e.target.value)}
													fullWidth
													required
													placeholder="İsminiz"
													InputProps={{ inputProps: { maxLength: 50 } }}
												/>
												<CustomTextField
													label="Soy İsminiz"
													value={checkoutGuestLastName}
													onChange={(e) => setCheckoutGuestLastName(e.target.value)}
													fullWidth
													required
													placeholder="Soy isminiz"
													InputProps={{ inputProps: { maxLength: 50 } }}
												/>
											</Box>
											<CustomTextField
												label="E-posta"
												type="email"
												value={checkoutGuestEmail}
												onChange={(e) => setCheckoutGuestEmail(e.target.value)}
												fullWidth
												required
												placeholder="ornek@email.com"
												InputProps={{
													readOnly: !!user,
													inputProps: { maxLength: 254 },
													sx: user
														? {
															backgroundColor: 'action.hover',
															cursor: 'default',
														}
														: undefined,
												}}
												helperText={
													user
														? 'E-posta adresiniz hesabınıza bağlıdır. Farklı bir e-posta kullanmak için çıkış yapın.'
														: undefined
												}
											/>
											<Box sx={{ '& .react-tel-input': { fontFamily: 'Varela Round' }, '& .form-control': { width: '100% !important', fontFamily: 'Varela Round' } }}>
												<PhoneInput
													country={location?.countryCode?.toLowerCase() || 'tr'}
													enableSearch
													searchPlaceholder="Ülke arayın..."
													searchNotFound="Ülke bulunamadı"
													enableAreaCodes={false}
													countryCodeEditable={false}
													specialLabel=""
													value={checkoutGuestPhone}
													onChange={(phoneNumber) => {
														const formatted = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
														setCheckoutGuestPhone(formatted);
													}}
													inputProps={{
														placeholder: 'Telefon (isteğe bağlı)',
														style: {
															width: '100%',
															height: '2.5rem',
															fontFamily: 'Varela Round',
															fontSize: '0.9rem',
															borderRadius: '0.5rem',
															border: '1px solid rgba(0, 0, 0, 0.23)',
														},
													}}
													containerStyle={{ marginBottom: '0.5rem', color: theme.textColor?.secondary?.main, fontFamily: 'Varela Round' }}
													buttonStyle={{ borderRadius: '0.35rem 0 0 0.35rem', border: '1px solid rgba(0, 0, 0, 0.23)', backgroundColor: 'transparent' }}
													dropdownStyle={{ borderRadius: '0.35rem', border: '1px solid rgba(0, 0, 0, 0.23)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', fontFamily: 'Varela Round' }}
													searchStyle={{ width: '100%', height: '2rem', fontFamily: 'Varela Round', fontSize: '0.85rem', borderRadius: '0.5rem', border: '1px solid rgba(0, 0, 0, 0.23)', margin: '0.5rem 0' }}
												/>
											</Box>
											<Autocomplete
												options={COUNTRY_LIST}
												value={COUNTRY_LIST.find((c) => c.code === checkoutGuestCountry) ?? null}
												onChange={(_, newValue) => setCheckoutGuestCountry(newValue?.code ?? '')}
												getOptionLabel={(option) => (typeof option === 'string' ? option : option.label)}
												isOptionEqualToValue={(option, value) => option.code === value?.code}
												noOptionsText="Ülke bulunamadı"
												renderInput={(params) => (
													<TextField
														{...params}
														label="Ülke"
														required
														size="small"
														sx={{
															'& .MuiInputLabel-root': { fontFamily: 'Varela Round', },
															'& .MuiInputBase-input': { fontFamily: 'Varela Round', fontSize: '0.95rem', },
															'& .MuiOutlinedInput-root': { fontFamily: 'Varela Round', borderRadius: '0.5rem', },
														}}
													/>
												)}
												ListboxProps={{ sx: { maxHeight: 300, fontFamily: 'Varela Round', '& .MuiAutocomplete-option': { fontSize: '0.85rem' } } }}
												filterOptions={(options, { inputValue }) =>
													options.filter((opt) => opt.label.toLowerCase().includes(inputValue.toLowerCase()))
												}
											/>
											<Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
												<FormControlLabel
													control={
														<Checkbox
															checked={agreeTermsAndPrivacy}
															onChange={(e) => {
																setAgreeTermsAndPrivacy(e.target.checked);
																setError(null);
															}}
															size="small"
															sx={{
																'color': 'rgba(0, 0, 0, 0.6)',
																'&.Mui-checked': { color: theme.palette?.primary?.main ?? '#0052a3' },
															}}
														/>
													}
													label={
														<Typography component="span" sx={{ fontFamily: 'Varela Round', fontSize: isMobileSize ? '0.75rem' : '0.8rem', color: 'text.secondary' }}>
															<Link to="/terms" target="_blank" rel="noopener noreferrer" style={{ color: theme.palette?.primary?.main ?? '#0052a3', textDecoration: 'underline' }}>
																Kullanıcı Sözleşmesi
															</Link>
															{' ve '}
															<Link to="/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: theme.palette?.primary?.main ?? '#0052a3', textDecoration: 'underline' }}>
																Gizlilik Politikası
															</Link>
															{' nı okudum ve kabul ediyorum. *'}
														</Typography>
													}
													sx={{ alignItems: 'center', '& .MuiFormControlLabel-label': { mt: '2px' } }}
												/>
												{documentItems.length > 0 && documentCheckoutCopy.needsWithdrawalWaiver && (
													<FormControlLabel
														control={
															<Checkbox
																checked={agreeDocumentWithdrawalWaiver}
																onChange={(e) => {
																	setAgreeDocumentWithdrawalWaiver(e.target.checked);
																	setError(null);
																}}
																size="small"
																sx={{
																	'color': 'rgba(0, 0, 0, 0.6)',
																	'&.Mui-checked': { color: theme.palette?.primary?.main ?? '#0052a3' },
																}}
															/>
														}
														label={
															<Typography component="span" sx={{ fontFamily: 'Varela Round', fontSize: isMobileSize ? '0.75rem' : '0.8rem', color: 'text.secondary' }}>
																{documentCheckoutCopy.withdrawalWaiverLabel}
															</Typography>
														}
														sx={{ alignItems: 'flex-start', '& .MuiFormControlLabel-label': { mt: '2px' } }}
													/>
												)}
												<FormControlLabel
													control={
														<Checkbox
															checked={agreeMarketing}
															onChange={(e) => setAgreeMarketing(e.target.checked)}
															size="small"
															sx={{
																'color': 'rgba(0, 0, 0, 0.6)',
																'&.Mui-checked': { color: theme.palette?.primary?.main ?? '#0052a3' },
															}}
														/>
													}
													label={
														<Typography component="span" sx={{ fontFamily: 'Varela Round', fontSize: isMobileSize ? '0.75rem' : '0.8rem', color: 'text.secondary' }}>
															Kampanya ve duyurulardan e-posta ile haberdar olmak istiyorum.
														</Typography>
													}
													sx={{ alignItems: 'center', '& .MuiFormControlLabel-label': { mt: '2px' } }}
												/>
											</Box>
										</Box>
									</CardContent>
								</Card>
							</Box>


							<Box sx={{ minWidth: 0, order: { xs: 2, md: 2 }, display: 'flex', flexDirection: 'column', gap: 2, minHeight: { md: '100%' } }}>
								{totalCount > 0 && (
									<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
										{/* Kaynaklar (docs) – separate section, scrollable */}
										{documentItems.length > 0 && (
											<Card
												sx={{
													borderRadius: 3,
													boxShadow: '0 12px 40px rgba(10, 26, 47, 0.08), 0 2px 8px rgba(10, 26, 47, 0.04)',
													border: '1px solid rgba(0, 82, 163, 0.12)',
													overflow: 'hidden',
													flexShrink: 0,
												}}
											>
												<Box
													onClick={() => setKaynaklarExpanded((e) => !e)}
													role="button"
													aria-expanded={kaynaklarExpanded}
													aria-label={kaynaklarExpanded ? 'Kitapları daralt' : 'Kitapları genişlet'}
													sx={{
														px: 2.5,
														py: 1,
														flexShrink: 0,
														display: 'flex',
														alignItems: 'center',
														gap: 1.5,
														background: 'linear-gradient(135deg, rgba(0, 82, 163, 0.12) 0%, rgba(0, 102, 204, 0.08) 100%)',
														borderBottom: '2px solid rgba(0, 82, 163, 0.15)',
														cursor: 'pointer',
														'&:hover': { background: 'linear-gradient(135deg, rgba(0, 82, 163, 0.16) 0%, rgba(0, 102, 204, 0.1) 100%)' },
													}}
												>
													<Box sx={{ width: 34, height: 34, borderRadius: 2, background: 'linear-gradient(135deg, #004c99 0%, #0052a3 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
														<Description sx={{ color: 'white', fontSize: 20 }} />
													</Box>
													<Typography sx={{ fontFamily: 'Varela Round', fontWeight: 700, fontSize: '1rem', color: '#0A1A2F' }}>
														Kitaplar
													</Typography>
													<Typography sx={{ fontFamily: 'Varela Round', fontSize: '0.8rem', color: 'text.secondary' }}>
														{documentItems.length} {documentItems.length === 1 ? 'ürün' : 'ürün'}
													</Typography>
													<Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
														{kaynaklarExpanded ? <ExpandLess sx={{ color: 'text.secondary' }} /> : <ExpandMore sx={{ color: 'text.secondary' }} />}
													</Box>
												</Box>
												<Collapse in={kaynaklarExpanded}>
													<Table size="small">
														<TableBody>
															{documentItems.map((item) => (
																<TableRow key={item.id} sx={{ '&:last-child td': { border: 0 }, '&:hover': { bgcolor: 'rgba(0, 82, 163, 0.04)' } }}>
																	<TableCell sx={{ fontFamily: 'Varela Round', verticalAlign: 'middle', py: 1 }}>
																		<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
																			<Box sx={{ width: 30, height: 30, borderRadius: 2, background: 'linear-gradient(135deg, rgba(0, 82, 163, 0.12) 0%, rgba(0, 102, 204, 0.08) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0, 82, 163, 0.2)' }}>
																				<Description sx={{ color: '#0052a3', fontSize: isMobileSize ? 15 : 20 }} />
																			</Box>
																			<Typography sx={{ fontFamily: 'Varela Round', fontWeight: 600, fontSize: '0.9rem', color: '#0A1A2F' }}>{item.title}</Typography>
																		</Box>
																	</TableCell>
																	<TableCell sx={{ fontFamily: 'Varela Round', fontWeight: 700, color: '#0A1A2F', fontSize: isMobileSize ? '0.85rem' : '0.95rem' }} align="right">
																		{setCurrencySymbol(item.currency)}{item.amount}
																	</TableCell>
																	<TableCell padding="none" sx={{ width: 44 }}>
																		<IconButton size="small" onClick={() => removeDocument(item.id)} aria-label="Kaldır" sx={{ color: 'text.secondary', '&:hover': { color: 'error.main', bgcolor: 'rgba(239, 68, 68, 0.08)' }, borderRadius: 1.5 }}>
																			<Close fontSize="small" sx={{ fontSize: isMobileSize ? '0.9rem' : '1rem' }} />
																		</IconButton>
																	</TableCell>
																</TableRow>
															))}
														</TableBody>
													</Table>
												</Collapse>
											</Card>
										)}
										{/* Danışmanlıklar (cons) – separate section */}
										{consultationItems.length > 0 && (
											<Card
												sx={{
													borderRadius: 3,
													boxShadow: '0 12px 40px rgba(10, 26, 47, 0.08), 0 2px 8px rgba(10, 26, 47, 0.04)',
													border: '1px solid rgba(0, 82, 163, 0.12)',
													overflow: 'hidden',
													flexShrink: 0,
												}}
											>
												<Box
													onClick={() => setDanismanliklarExpanded((e) => !e)}
													role="button"
													aria-expanded={danismanliklarExpanded}
													aria-label={danismanliklarExpanded ? 'Danışmanlıkları daralt' : 'Danışmanlıkları genişlet'}
													sx={{
														px: 2.5,
														py: 1,
														flexShrink: 0,
														display: 'flex',
														alignItems: 'center',
														gap: 1.5,
														background: 'linear-gradient(135deg, rgba(0, 82, 163, 0.12) 0%, rgba(0, 102, 204, 0.08) 100%)',
														borderBottom: '2px solid rgba(0, 82, 163, 0.15)',
														cursor: 'pointer',
														'&:hover': { background: 'linear-gradient(135deg, rgba(0, 82, 163, 0.16) 0%, rgba(0, 102, 204, 0.1) 100%)' },
													}}
												>
													<Box sx={{ width: 34, height: 34, borderRadius: 2, background: 'linear-gradient(135deg, #004c99 0%, #0052a3 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
														<Assignment sx={{ color: 'white', fontSize: isMobileSize ? 15 : 20 }} />
													</Box>
													<Typography sx={{ fontFamily: 'Varela Round', fontWeight: 700, fontSize: '1rem', color: '#0A1A2F' }}>
														Danışmanlıklar
													</Typography>
													<Typography sx={{ fontFamily: 'Varela Round', fontSize: '0.8rem', color: 'text.secondary' }}>
														{consultationItems.length} {consultationItems.length === 1 ? 'ürün' : 'ürün'}
													</Typography>
													<Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
														{danismanliklarExpanded ? <ExpandLess sx={{ color: 'text.secondary' }} /> : <ExpandMore sx={{ color: 'text.secondary' }} />}
													</Box>
												</Box>
												<Collapse in={danismanliklarExpanded}>
													<Table size="small">
														<TableBody>
															{consultationItems.map((item) => (
																<TableRow key={item.id} sx={{ '&:last-child td': { border: 0 }, '&:hover': { bgcolor: 'rgba(0, 82, 163, 0.04)' } }}>
																	<TableCell sx={{ fontFamily: 'Varela Round', verticalAlign: 'middle', py: 1 }}>
																		<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
																			<Box sx={{ width: 30, height: 30, borderRadius: 2, background: 'linear-gradient(135deg, rgba(0, 82, 163, 0.12) 0%, rgba(0, 102, 204, 0.08) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(0, 82, 163, 0.2)' }}>
																				<Assignment sx={{ color: '#0052a3', fontSize: isMobileSize ? 15 : '1.25rem' }} />
																			</Box>
																			<Box>
																				<Typography sx={{ fontFamily: 'Varela Round', fontWeight: 600, color: '#0A1A2F', fontSize: '0.9rem' }}>{item.consultationTitle}</Typography>
																				<Typography variant="body2" sx={{ fontFamily: 'Varela Round', color: 'text.secondary', fontSize: '0.75rem', mt: 0.25 }}>
																					{format(new Date(item.slotStart), 'd MMM yyyy, HH:mm', { locale: tr })} · {item.consultantName}
																				</Typography>
																			</Box>
																		</Box>
																	</TableCell>
																	<TableCell sx={{ fontFamily: 'Varela Round', fontWeight: 700, color: '#0A1A2F', fontSize: isMobileSize ? '0.85rem' : '0.95rem' }} align="right">
																		{item.price.amount === '0' ? 'Ücretsiz' : `${setCurrencySymbol(item.price.currency)}${item.price.amount}`}
																	</TableCell>
																	<TableCell padding="none" sx={{ width: 44 }}>
																		<IconButton size="small" onClick={() => removeConsultation(item.id)} aria-label="Kaldır" sx={{ color: 'text.secondary', '&:hover': { color: 'error.main', bgcolor: 'rgba(239, 68, 68, 0.08)' }, borderRadius: 1.5 }}>
																			<Close fontSize="small" sx={{ fontSize: isMobileSize ? '0.9rem' : '1rem' }} />
																		</IconButton>
																	</TableCell>
																</TableRow>
															))}
														</TableBody>
													</Table>
												</Collapse>
											</Card>
										)}

										{/* Summary + Pay – fixed at bottom of column */}
										<Card
											sx={{
												flexShrink: 0,
												borderRadius: 3,
												boxShadow: '0 12px 40px rgba(10, 26, 47, 0.08), 0 2px 8px rgba(10, 26, 47, 0.04)',
												border: '1px solid rgba(255, 107, 61, 0.2)',
												background: 'linear-gradient(165deg, #ffffff 0%, rgba(255, 247, 237, 0.5) 100%)',
												overflow: 'hidden',
												transition: 'box-shadow 0.25s ease',
												'&:hover': { boxShadow: '0 16px 48px rgba(255, 107, 61, 0.12), 0 4px 12px rgba(10, 26, 47, 0.06)' },
											}}
										>
											<CardContent sx={{ py: 3, px: 2.5 }}>
												<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, py: 1.5, px: 2, borderRadius: 2, background: 'linear-gradient(135deg, rgba(255, 107, 61, 0.16) 0%, rgba(251, 146, 60, 0.12) 100%)', border: '1px solid rgba(255, 107, 61, 0.22)' }}>
													<Box sx={{ width: 40, height: 40, borderRadius: 2, background: 'linear-gradient(135deg, rgba(255, 107, 61, 0.15) 0%, rgba(251, 146, 60, 0.1) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255, 107, 61, 0.25)' }}>
														<ReceiptLong sx={{ color: '#FF6B3D', fontSize: 22 }} />
													</Box>
													<Typography sx={{ fontFamily: 'Varela Round', fontWeight: 700, fontSize: '1.1rem', color: '#0A1A2F', letterSpacing: '-0.02em' }}>
														Sepet özeti
													</Typography>
												</Box>
												<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2.5 }}>
													<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
														<Typography sx={{ fontFamily: 'Varela Round', color: 'text.secondary', fontSize: '0.9rem' }}>
															{totalCount} {totalCount === 1 ? 'ürün' : 'ürün'}
														</Typography>
													</Box>
													{totalCurrencies.length > 0 ? (
														totalCurrencies.map(([currency, amount]) => (
															<Box
																key={currency}
																sx={{
																	display: 'flex',
																	justifyContent: 'space-between',
																	alignItems: 'center',
																	py: 1.5,
																	px: 2,
																	borderRadius: 2,
																	background: 'linear-gradient(135deg, rgba(255, 107, 61, 0.06) 0%, rgba(251, 146, 60, 0.04) 100%)',
																	border: '1px solid rgba(255, 107, 61, 0.12)',
																}}
															>
																<Typography sx={{ fontFamily: 'Varela Round', fontWeight: 600, color: '#0A1A2F', fontSize: isMobileSize ? '0.9rem' : '0.95rem' }}>
																	Toplam ({currency.toUpperCase()})
																</Typography>
																<Typography sx={{ fontFamily: 'Varela Round', fontWeight: 800, fontSize: isMobileSize ? '0.95rem' : '1.05rem', color: '#0A1A2F', letterSpacing: '-0.02em' }}>
																	{amount === 0 ? 'Ücretsiz' : `${setCurrencySymbol(currency)}${amount.toFixed(2)}`}
																</Typography>
															</Box>
														))
													) : (
														<Box sx={{ py: 1.5, px: 2, borderRadius: 2, background: 'linear-gradient(135deg, rgba(255, 107, 61, 0.06) 0%, rgba(251, 146, 60, 0.04) 100%)', border: '1px solid rgba(255, 107, 61, 0.12)' }}>
															<Typography sx={{ fontFamily: 'Varela Round', fontWeight: 800, fontSize: '1.25rem', color: '#0A1A2F' }}>
																Ücretsiz
															</Typography>
														</Box>
													)}
												</Box>
												{hasMixedCurrencies && (
													<Alert severity="warning" sx={{ mb: 2, fontFamily: 'Varela Round', borderRadius: 2 }}>
														Sepetinizde birden fazla para birimi var. Ödeme yapmak için yalnızca tek para biriminde ürün bırakın.
													</Alert>
												)}
												<Button
													variant="outlined"
													fullWidth
													onClick={handlePayAll}
													disabled={payAllLoading || hasMixedCurrencies}
													// startIcon={!payAllLoading ? <Lock sx={{ fontSize: 18 }} /> : null}
													sx={{
														border: 'none',
														color: 'white',
														borderRadius: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
														py: 0.75,
														fontSize: { xs: '0.85rem', sm: '0.9rem', md: '0.9rem' },
														fontFamily: 'Varela Round',
														fontWeight: 800,
														letterSpacing: '0.03em',
														textTransform: 'capitalize',
														textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
														background: 'linear-gradient(135deg, #FF6B3D 0%, #ff7d55 100%)',
														boxShadow: '0 4px 15px rgba(255, 107, 61, 0.35)',
														'&:hover': {
															background: 'linear-gradient(135deg, #ff7d55 0%, #FF6B3D 100%) !important',
															backgroundColor: 'transparent !important',
															color: 'white !important',
															boxShadow: '0 6px 20px rgba(255, 107, 61, 0.45)',
														},
														'&.Mui-disabled': { background: 'grey.300', color: 'white', border: 'none' },
														transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
													}}
												>
													{payAllLoading ? 'Hazırlanıyor...' : 'Ödemeyi Tamamla'}
												</Button>

												<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25, mt: '2rem' }}>
													<Typography sx={{ fontFamily: 'Varela Round', fontSize: '0.75rem', color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
														<Lock sx={{ fontSize: 12, opacity: 0.8 }} /> Güvenli ödeme (Stripe)
													</Typography>
													<Typography sx={{ fontFamily: 'Varela Round', fontSize: '0.7rem', color: 'text.secondary', opacity: 0.9 }}>
														Kart bilgileriniz saklanmaz
													</Typography>
												</Box>
											</CardContent>
										</Card>
									</Box>
								)}
							</Box>
						</Box>
					</Box>
				</LandingPageLayout>
			</Box>

			<CartPaymentDialogWrapper
				open={cartPaymentOpen}
				onClose={() => { setCartPaymentOpen(false); setPaymentQueue([]); }}
				queue={paymentQueue}
				firstName={checkoutGuestFirstName.trim()}
				lastName={checkoutGuestLastName.trim()}
				email={checkoutGuestEmail.trim()}
				onSuccess={handleCartPaymentSuccess}
			/>

			<Snackbar
				open={successSnack}
				autoHideDuration={6000}
				anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
				sx={{ mt: '4rem' }}
				onClose={() => setSuccessSnack(false)}>
				<Alert
					onClose={() => setSuccessSnack(false)}
					severity="success"
					sx={{
						width: '100%',
						fontFamily: 'Varela Round',
						backgroundColor: theme.bgColor?.greenSecondary,
						color: theme.textColor?.common.main,
						'& .MuiAlert-icon': { color: 'white' },
					}}>
					{successMessage}
				</Alert>
			</Snackbar>
		</Box>
	);
}
