import {
	Box,
	Checkbox,
	FormControlLabel,
	Typography,
	Button,
	Card,
	CardActionArea,
	CardContent,
	Collapse,
	IconButton,
	Grid,
} from '@mui/material';
import { ExpandMore, Person, ReceiptLong, MenuBook, Lock } from '@mui/icons-material';
import CustomTextField from '../../forms/customFields/CustomTextField';
import CustomDialogActions from '../dialog/CustomDialogActions';
import CustomSubmitButton from '../../forms/customButtons/CustomSubmitButton';
import CustomErrorMessage from '../../forms/customFields/CustomErrorMessage';
import { useContext, useEffect, useState, useRef } from 'react';
import { useQueryClient } from 'react-query';
import {
	CardCvcElement,
	CardExpiryElement,
	CardNumberElement,
	useElements,
	useStripe,
} from '@stripe/react-stripe-js';
import axiosInstance from '@utils/axiosInstance';
import axios from 'axios';
import visaIcon from '../../../assets/visa.png';
import masterCardIcon from '../../../assets/mastercard.png';
import defaultCardIcon from '../../../assets/credit-card.png';
import { CourseEnrollmentProof, SingleCourse } from '../../../interfaces/course';
import { Link } from 'react-router-dom';
import { OrganisationContext } from '../../../contexts/OrganisationContextProvider';
import theme from '../../../themes';
import { setCurrencySymbol } from '../../../utils/setCurrencySymbol';
import { UserAuthContext } from '../../../contexts/UserAuthContextProvider';
import { getPriceForCountry } from '../../../utils/getPriceForCountry';
import { resolvePricingCountryCode } from '../../../utils/resolvePricingCountryCode';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import { useGeoLocation } from '../../../hooks/useGeoLocation';
import ReCAPTCHA from 'react-google-recaptcha';
import { getPostEnrollmentUserPatch } from '../../../utils/learnerPlatformAccess';
import { getCourseAccessCheckoutCopy } from '../../../utils/courseAccessCheckoutCopy';

const FONT = 'Varela Round';
const INPUT_RADIUS = '0.5rem';
const GROUP_DESCRIPTION_BREAK =
	/\s+(?=(?:Türkiye Saati|Berlin Saati|Londra Saati|London Time|Berlin Time|UK Time))/g;

const formatGroupDescription = (description?: string): string => {
	if (!description) return '';
	const normalized = description.replace(/\r\n/g, '\n');
	if (normalized.includes('\n')) return normalized;
	return normalized.replace(GROUP_DESCRIPTION_BREAK, '\n').replace(/^(Ders Günleri:[^\n]*)\n/, '$1\n\n');
};

interface CoursePaymentFormProps {
	course: SingleCourse;
	courseRegistration: (
		userId: string,
		orgId: string,
		groupName?: string,
		proof?: CourseEnrollmentProof
	) => Promise<string>;
	onSuccess: () => void;
	onCancel: () => void;
}

export default function CoursePaymentForm({
	course,
	courseRegistration,
	onSuccess,
	onCancel,
}: CoursePaymentFormProps) {
	const { orgId } = useContext(OrganisationContext);
	const { user, setUser } = useContext(UserAuthContext);
	const queryClient = useQueryClient();
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { isRotatedMedium, isSmallScreen } = useContext(MediaQueryContext);
	const location = useGeoLocation();
	const recaptchaRef = useRef<any>(null);

	const resolvedCountryCode = resolvePricingCountryCode(user?.countryCode, location?.countryCode);
	const isCourseFree =
		getPriceForCountry(course, resolvedCountryCode)?.amount === 'Free' ||
		getPriceForCountry(course, resolvedCountryCode)?.amount === '' ||
		getPriceForCountry(course, resolvedCountryCode)?.amount === '0';
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const checkoutCopy = getCourseAccessCheckoutCopy(course, 'tr');

	let resolvedUserId = user?._id || '';
	let resolvedOrgId = orgId;
	let resolvedFirstName = user?.firstName || '';
	let resolvedLastName = user?.lastName || '';

	const [isProcessing, setIsProcessing] = useState(false);
	const [agreed, setAgreed] = useState(false);
	const [agreedWithdrawalWaiver, setAgreedWithdrawalWaiver] = useState(false);
	const [cardBrand, setCardBrand] = useState('unknown');
	const [errorMessage, setErrorMessage] = useState('');
	const [email, setEmail] = useState('');
	const [isUserAccountExist, setIsUserAccountExist] = useState(true);
	const [isAlreadyEnrolled, setIsAlreadyEnrolled] = useState(false);
	const [isEmailVerified, setIsEmailVerified] = useState(true);
	const [promoCode, setPromoCode] = useState('');
	const [discountedAmount, setDiscountedAmount] = useState(() => {
		const amount = +getPriceForCountry(course, resolvedCountryCode).amount;
		return isNaN(amount) ? 0 : amount;
	});
	const [isPromoCodeApplied, setIsPromoCodeApplied] = useState(false);
	const [usersUsedPromoCode, setUsersUsedPromoCode] = useState<string[]>([]);
	const [promoCodeId, setPromoCodeId] = useState('');
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [cardNumberComplete, setCardNumberComplete] = useState(false);
	const [cardExpiryComplete, setCardExpiryComplete] = useState(false);
	const [cardCvcComplete, setCardCvcComplete] = useState(false);
	const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
	const [selectedGroupName, setSelectedGroupName] = useState('');
	const [isGroupSelectionExpanded, setIsGroupSelectionExpanded] = useState(true);
	const [isResendingVerification, setIsResendingVerification] = useState(false);
	const [verificationSent, setVerificationSent] = useState(false);

	const stripe = useStripe();
	const elements = useElements();

	useEffect(() => {
		if (!course) return;
		const amount = +getPriceForCountry(course, resolvedCountryCode).amount;
		if (!isPromoCodeApplied) setDiscountedAmount(isNaN(amount) ? 0 : amount);
	}, [user, location, course, isPromoCodeApplied]);

	useEffect(() => {
		if (email || promoCode || cardNumberComplete || cardExpiryComplete || cardCvcComplete) {
			setIsGroupSelectionExpanded(false);
		}
	}, [email, promoCode, cardNumberComplete, cardExpiryComplete, cardCvcComplete]);

	const handleRecaptchaChange = (token: string | null) => {
		setRecaptchaToken(token);
		setErrorMessage('');
	};
	const resetRecaptcha = () => {
		setRecaptchaToken(null);
		if (recaptchaRef.current) recaptchaRef.current.reset();
	};
	const validateRecaptcha = () => {
		if (!recaptchaToken) {
			setErrorMessage('Lütfen reCAPTCHA doğrulamasını tamamlayın.');
			return false;
		}
		return true;
	};
	const getCardIcon = (brand: string) => {
		switch (brand) {
			case 'visa':
				return visaIcon;
			case 'mastercard':
				return masterCardIcon;
			default:
				return defaultCardIcon;
		}
	};

	const resetForm = (preserveError = false) => {
		setEmail('');
		setPromoCode('');
		setSelectedGroupName('');
		const amount = +getPriceForCountry(course, resolvedCountryCode).amount;
		setDiscountedAmount(isNaN(amount) ? 0 : amount);
		setIsPromoCodeApplied(false);
		setAgreed(false);
		if (!preserveError) {
			setErrorMessage('');
			resetRecaptcha();
		}
		setIsSubmitted(false);
		setIsProcessing(false);
		setIsAlreadyEnrolled(false);
		setIsEmailVerified(true);
		resetRecaptcha();
	};

	const handlePayment = async () => {
		if (!course) return;
		setIsProcessing(true);
		setIsSubmitted(true);
		const lockedAmount = discountedAmount;

		if (!email?.trim()) {
			setErrorMessage('Lütfen e-posta adresinizi giriniz.');
			setIsProcessing(false);
			setIsSubmitted(false);
			return;
		}
		if (!agreed) {
			setErrorMessage('Lütfen Kullanıcı Sözleşmesi ve Gizlilik Politikası\'nı kabul edin.');
			setIsProcessing(false);
			setIsSubmitted(false);
			return;
		}
		if (checkoutCopy.needsWithdrawalWaiver && !agreedWithdrawalWaiver) {
			setErrorMessage(checkoutCopy.waiverRequiredError);
			setIsProcessing(false);
			setIsSubmitted(false);
			return;
		}
		if (!isCourseFree && !validateRecaptcha()) {
			setIsProcessing(false);
			setIsSubmitted(false);
			return;
		}
		if (course?.groups?.length && !selectedGroupName.trim()) {
			setErrorMessage('Lütfen bir grup seçin.');
			setIsProcessing(false);
			setIsSubmitted(false);
			return;
		}
		const selectedGroup = selectedGroupName.trim()
			? course?.groups?.find((g) => g.name === selectedGroupName)
			: null;
		if (selectedGroup?.isFull) {
			setErrorMessage('Seçilen grup dolu. Lütfen başka bir grup seçin.');
			setSelectedGroupName('');
			setIsProcessing(false);
			setIsSubmitted(false);
			return;
		}

		try {
			const axiosWithTimeout = axios.create({ ...axiosInstance.defaults, timeout: 10000 });
			const userExistsResponse = await axiosWithTimeout.post(`${base_url}/users/check-user-exists`, {
				email,
				courseId: course._id,
			});
			setIsUserAccountExist(userExistsResponse.data.exists);
			if (!userExistsResponse.data.exists) {
				setErrorMessage('Bu e-posta adresi herhangi bir hesaba bağlı değil.\nKursa katılmak için ücretsiz hesap oluşturun! - ');
				setIsUserAccountExist(false);
				setIsProcessing(false);
				resetRecaptcha();
				return;
			}
			if (!userExistsResponse.data.isEmailVerified) {
				setErrorMessage('Lütfen önce e-posta adresinizi doğrulayın. E-posta adresinize gönderilen doğrulama bağlantısını kontrol edin.');
				setIsEmailVerified(false);
				setIsProcessing(false);
				resetRecaptcha();
				return;
			}
			if (userExistsResponse.data.isEnrolledInCourse) {
				setErrorMessage('Bu kursa zaten kayıtlısınız!');
				setIsAlreadyEnrolled(true);
				setIsProcessing(false);
				resetRecaptcha();
				return;
			}
			resolvedUserId = userExistsResponse.data.userId;
			resolvedOrgId = userExistsResponse.data.orgId;
			if (!resolvedFirstName) {
				resolvedFirstName = (email || '').split('@')[0] || 'Guest';
			}
			if (!resolvedLastName) {
				resolvedLastName = '-';
			}

			if (isCourseFree) {
				await courseRegistration(resolvedUserId, resolvedOrgId, selectedGroupName || undefined, { email });
				resetForm();
				setIsProcessing(false);
				onSuccess();
				return;
			}
		} catch (err: any) {
			if (axios.isAxiosError(err)) {
				if (err.code === 'ECONNABORTED') setErrorMessage('Bağlantı zaman aşımına uğradı. Lütfen tekrar deneyin.');
				else if (!err.response) setErrorMessage('İnternet bağlantınızı kontrol edin ve tekrar deneyin.');
				else if (err.response?.data?.message) {
					const msg = err.response.data.message;
					if (msg?.toLowerCase?.()?.includes('recaptcha')) {
						setErrorMessage("reCAPTCHA doğrulaması başarısız. Lütfen reCAPTCHA'yı tekrar tamamlayın.");
						setIsProcessing(false);
						return;
					}
					setErrorMessage(msg);
				} else setErrorMessage('Bir hata oluştu. Lütfen tekrar deneyin.');
			} else setErrorMessage('Beklenmeyen bir hata oluştu.');
			resetRecaptcha();
			setIsProcessing(false);
			return;
		}

		if (!stripe || !elements) {
			setErrorMessage('Ödeme sistemi yüklenemedi.');
			resetRecaptcha();
			setIsProcessing(false);
			return;
		}
		const cardNumberElement = elements.getElement(CardNumberElement);
		if (!cardNumberComplete || !cardExpiryComplete || !cardCvcComplete) {
			setErrorMessage('Lütfen tüm kart bilgilerini doldurun.');
			setIsProcessing(false);
			resetRecaptcha();
			return;
		}
		if (!cardNumberElement) {
			setErrorMessage('Kart bilgileri eksik.');
			setIsProcessing(false);
			resetRecaptcha();
			return;
		}

		try {
			const response = await axiosInstance.post(`${base_url}/payments`, {
				amount: lockedAmount,
				currency: getPriceForCountry(course, resolvedCountryCode).currency,
				orgId: resolvedOrgId,
				userId: resolvedUserId,
				courseId: course._id,
				email,
				firstName: resolvedFirstName,
				lastName: resolvedLastName,
				paymentType: 'course',
				...(isPromoCodeApplied && promoCodeId ? { promoCodeId } : {}),
				recaptchaToken,
			});
			const { clientSecret, paymentIntentId } = response.data;

			const { error: methodError, paymentMethod } = await stripe.createPaymentMethod({
				type: 'card',
				card: cardNumberElement,
				billing_details: { name: `${resolvedFirstName} ${resolvedLastName}` },
			});
			if (methodError) {
				resetForm(true);
				setErrorMessage(methodError.message || 'Ödeme yöntemi oluşturulamadı.');
				resetRecaptcha();
				setIsProcessing(false);
				return;
			}

			const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
				payment_method: paymentMethod!.id,
			});
			if (error || paymentIntent?.status !== 'requires_capture') {
				resetForm(true);
				setErrorMessage(error?.message ? `Ödeme onayı başarısız: ${error.message}` : 'Ödeme onayı başarısız.');
				resetRecaptcha();
				setIsProcessing(false);
				return;
			}

			try {
				await courseRegistration(resolvedUserId, resolvedOrgId, selectedGroupName || undefined, { email, paymentIntentId });
			} catch (regErr) {
				resetForm(true);
				setErrorMessage('Kurs kaydı başarısız oldu. Ücretlendirilmediniz.');
				resetRecaptcha();
				setIsProcessing(false);
				return;
			}

			try {
				await axiosInstance.patch(`${base_url}/payments/capture/${paymentIntentId}`, {
					userId: resolvedUserId,
					orgId: resolvedOrgId,
					courseId: course._id,
					firstName: resolvedFirstName,
					lastName: resolvedLastName,
					email,
					paymentType: 'course',
					...(isPromoCodeApplied && promoCodeId ? { promoCodeId } : {}),
				});

				if (!user?.hasRegisteredCourse && !course?.courseManagement?.isExternal) {
					await axiosInstance.post(`${base_url}/users/public-update-registration-status`, {
						userId: resolvedUserId,
						email,
						courseId: course._id,
						paymentIntentId,
					});
					setUser((prev) => (prev ? { ...prev, hasRegisteredCourse: true } : prev));
				} else {
					const patch = getPostEnrollmentUserPatch(user, course);
					if (patch) {
						setUser((prev) => (prev ? { ...prev, ...patch } : prev));
					}
				}

				if (isPromoCodeApplied && promoCodeId) {
					setUsersUsedPromoCode([...usersUsedPromoCode, resolvedUserId]);
				}

				resetForm();
				setIsProcessing(false);
				onSuccess();
			} catch (captureError) {
				resetForm(true);
				console.error(`❌ Payment capture failed for paymentIntentId: ${paymentIntentId}, userId: ${resolvedUserId}`, captureError);

				try {
					await axiosInstance.post(`${base_url}/userCourses/public-rollback`, {
						userId: resolvedUserId,
						courseId: course._id,
						email,
						paymentIntentId,
					});

					await queryClient.invalidateQueries(['userCourseData']);
					await queryClient.invalidateQueries(['userLessonsForCourse', course._id, resolvedUserId]);
				} catch (cleanupErr) {
					resetForm(true);
					console.error(`❌ Rollback failed for userId: ${resolvedUserId}, courseId: ${course._id}`, cleanupErr);
				}

				setErrorMessage('Ödeme işlemi tamamlanamadı. Lütfen tekrar deneyin veya destek ile iletişime geçin.');
				resetRecaptcha();
			}
		} catch (err) {
			console.error(err);
			resetForm(true);
			setErrorMessage('Ödeme işlenirken bir hata oluştu.');
			resetRecaptcha();
		} finally {
			setIsProcessing(false);
		}
	};

	const handleApplyPromoCode = async () => {
		if (!course) return;
		if (!email) {
			setErrorMessage('Lütfen e-posta adresinizi giriniz.');
			resetRecaptcha();
			return;
		}
		if (!promoCode) {
			setErrorMessage('Promosyon kodu girin');
			resetRecaptcha();
			return;
		}
		try {
			const userExistsResponse = await axiosInstance.post(`${base_url}/users/check-user-exists`, { email });
			setIsUserAccountExist(userExistsResponse.data.exists);
			resolvedUserId = userExistsResponse?.data?.userId;
			if (!userExistsResponse.data.exists) {
				setErrorMessage('Bu e-posta adresi herhangi bir hesaba bağlı değil.\nKursa katılmak için ücretsiz hesap oluşturun! - ');
				setIsUserAccountExist(false);
				return;
			}
			const res = await axiosInstance.post(`${base_url}/promocodes/apply`, {
				code: promoCode.trim(),
				courseId: course._id,
				userId: resolvedUserId,
				orgId,
				email,
			});
			const { discountAmount, usersUsed, _id } = res.data;
			setPromoCodeId(_id);
			let newTotal = +getPriceForCountry(course, resolvedCountryCode).amount;
			if (isNaN(newTotal)) newTotal = 0;
			newTotal -= (newTotal * discountAmount) / 100;
			setDiscountedAmount(Math.max(newTotal, 0));
			setErrorMessage('');
			setIsPromoCodeApplied(true);
			setUsersUsedPromoCode(usersUsed);
		} catch (err) {
			setErrorMessage(axios.isAxiosError(err) && err.response?.data?.message ? 'Geçersiz promosyon kodu' : 'Geçersiz promosyon kodu');
			const amount = +getPriceForCountry(course, resolvedCountryCode).amount;
			setDiscountedAmount(isNaN(amount) ? 0 : amount);
			resetRecaptcha();
		}
	};

	const handleResendVerification = async () => {
		if (!email) return;
		setIsResendingVerification(true);
		try {
			await axiosInstance.post(`${base_url}/users/resend-verification`, { email });
			setVerificationSent(true);
			setErrorMessage('Doğrulama e-postası gönderildi. Lütfen gelen kutunuzu kontrol edin.');
		} catch (e) {
			setErrorMessage(axios.isAxiosError(e) && e.response?.data?.isEmailVerified ? 'E-posta zaten doğrulanmış.' : 'Doğrulama e-postası gönderilemedi.');
		}
		resetRecaptcha();
		setIsResendingVerification(false);
	};

	const handleClose = () => {
		if (!isProcessing) {
			resetForm();
			onCancel();
		}
	};

	const cardBorder = (invalid: boolean) =>
		invalid ? '1px solid red' : '1px solid #ccc';
	const cardBoxSx = (invalid: boolean) => ({
		border: cardBorder(invalid),
		padding: '0.6rem',
		borderRadius: '8px',
		backgroundColor: '#fff',
		fontFamily: FONT,
	});
	const showCardError = (cvc = false) =>
		isSubmitted &&
		!isCourseFree &&
		isUserAccountExist &&
		!isAlreadyEnrolled &&
		isEmailVerified &&
		recaptchaToken &&
		(cvc ? !cardCvcComplete : !cardNumberComplete && !cardExpiryComplete);

	return (
		<form
			onSubmit={async (e) => {
				e.preventDefault();
				await handlePayment();
			}}>
			<Grid container spacing={3} sx={{ alignItems: 'stretch' }}>
				{/* Left: Kayıt ve Katılım Bilgileri */}
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
							<Typography sx={{ fontFamily: FONT, fontWeight: 700, fontSize: '1.1rem', color: '#0A1A2F', display: 'flex', alignItems: 'center', gap: 1 }}>
								<Person sx={{ color: '#0052a3', fontSize: 22 }} /> Kayıt ve Katılım Bilgileri
							</Typography>
							{/* <Typography variant="body2" sx={{ fontFamily: FONT, color: 'text.secondary', mt: 0.5, fontSize: '0.8rem' }}>
								Grup, e-posta ve sözleşme onayı.
							</Typography> */}
						</Box>
						<Box sx={{ p: 2.5, flex: 1 }}>
							{course?.groups && course.groups.length > 0 && (
								<Box sx={{ mb: '2rem' }}>
									<Box
										sx={{
											backgroundColor: theme.bgColor?.primary,
											padding: isMobileSize ? '0.5rem 0.75rem' : '0.6rem 1rem',
											cursor: 'pointer',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'space-between',
											borderRadius: '0.35rem',
											mb: 1.5,
											gap: 1,
										}}
										onClick={() => setIsGroupSelectionExpanded(!isGroupSelectionExpanded)}>
										<Typography
											sx={{
												fontFamily: FONT,
												fontWeight: 500,
												fontSize: isMobileSize ? '0.85rem' : '0.95rem',
												color: 'white',
												ml: '0.25rem',
												flex: 1,
												minWidth: 0,
												whiteSpace: 'nowrap',
												overflow: 'hidden',
												textOverflow: 'ellipsis',
											}}>
											{selectedGroupName
												? (() => {
													const sel = course.groups?.find((g) => g.name === selectedGroupName);
													return sel ? `Seçilen: ${sel.name}` : `Seçili: ${selectedGroupName}`;
												})()
												: `Grup Seçimi (${course.groups?.length ?? 0} seçenek)`}
										</Typography>
										<Box
											sx={{
												display: 'flex',
												alignItems: 'center',
												gap: 0.5,
												flexShrink: 0,
											}}
											onClick={(e) => {
												e.stopPropagation();
												setIsGroupSelectionExpanded(!isGroupSelectionExpanded);
											}}>
											<Typography
												component="span"
												sx={{
													fontFamily: FONT,
													fontSize: '0.7rem',
													color: 'rgba(255,255,255,0.9)',
													textDecoration: 'underline',
													'&:hover': { color: 'white' },
												}}>
												Değiştir
											</Typography>
											<IconButton
												size="small"
												aria-label={isGroupSelectionExpanded ? 'Kapat' : 'Aç'}
												sx={{
													color: 'white',
													p: 0.25,
													transform: isGroupSelectionExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
													transition: 'transform 0.3s ease',
													'&:hover': { backgroundColor: 'rgba(255,255,255,0.15)' },
												}}>
												<ExpandMore fontSize="medium" />
											</IconButton>
										</Box>
									</Box>
									<Collapse in={isGroupSelectionExpanded}>
										<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
											{course.groups.map((group) => (
												<Card
													key={group.name}
													sx={{
														border: selectedGroupName === group.name ? '2px solid' : '1px solid',
														borderColor: selectedGroupName === group.name ? theme.palette.primary.main : group.isFull ? '#ef4444' : theme.palette.divider,
														borderRadius: '0.75rem',
														backgroundColor: selectedGroupName === group.name ? 'rgba(25, 118, 210, 0.04)' : group.isFull ? 'rgba(239, 68, 68, 0.04)' : 'transparent',
														opacity: group.isFull ? 0.7 : 1,
													}}>
													<CardActionArea
														onClick={() => { if (!group.isFull) { setSelectedGroupName(group.name); setErrorMessage(''); setIsGroupSelectionExpanded(false); } }}
														disabled={group.isFull}>
														<CardContent sx={{ p: '1rem !important', '&:last-child': { pb: '1rem' } }}>
															<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75 }}>
																{selectedGroupName === group.name && (
																	<Typography sx={{ fontWeight: 600, fontSize: isMobileSize ? '0.85rem' : '0.95rem', color: theme.palette.primary.main, fontFamily: FONT, lineHeight: 1.4 }}>✓</Typography>
																)}
																<Box sx={{ minWidth: 0, flex: 1 }}>
																	<Typography sx={{ fontWeight: 600, fontSize: isMobileSize ? '0.85rem' : '0.95rem', color: group.isFull ? '#ef4444' : '#2C3E50', fontFamily: FONT }}>
																		{group.name} {group.isFull && '(Kontenjan Doldu)'}
																	</Typography>
																	<Typography
																		variant="body2"
																		sx={{
																			fontSize: isMobileSize ? '0.75rem' : '0.85rem',
																			color: '#475569',
																			fontFamily: FONT,
																			whiteSpace: 'pre-line',
																			mt: 0.5,
																		}}>
																		{formatGroupDescription(group.description)}
																	</Typography>
																</Box>
															</Box>
														</CardContent>
													</CardActionArea>
												</Card>
											))}
										</Box>
									</Collapse>
								</Box>
							)}

							<Box sx={{ mb: 2 }}>
								<CustomTextField
									label="E-posta Adresi"
									size="small"
									value={email}
									type="email"
									onChange={(e) => {
										setEmail(e.target.value);
										setIsPromoCodeApplied(false);
										setIsGroupSelectionExpanded(false);
										const amount = +getPriceForCountry(course, resolvedCountryCode).amount;
										setDiscountedAmount(isNaN(amount) ? 0 : amount);
										setUsersUsedPromoCode((prev) => prev?.filter((id) => id !== resolvedUserId) || []);
										setErrorMessage('');
										setIsUserAccountExist(true);
									}}
									sx={{
										mb: 0.5,
										'& .MuiOutlinedInput-root': { fontFamily: FONT, borderRadius: INPUT_RADIUS },
										'& .MuiInputBase-input': { fontFamily: FONT, fontSize: '0.85rem' },
										'& .MuiInputLabel-root': { fontFamily: FONT, fontSize: '0.85rem' },
									}}
									InputProps={{ inputProps: { maxLength: 254 } }}
								/>
								<Typography variant="body2" sx={{ fontFamily: FONT, fontSize: '0.75rem', color: 'text.secondary', mt: 0.5 }}>
									Platformumuzda kayıtlı e-posta adresinizle kursu satın alabilirsiniz. Hesabınız yoksa{' '}
									<Box
										component="span"
										onClick={() => window.open('/auth', '_blank')}
										sx={{
											color: theme.palette?.primary?.main ?? '#0052a3',
											textDecoration: 'underline',
											cursor: 'pointer',
											fontWeight: 500,
											'&:hover': { color: theme.palette?.primary?.dark ?? '#003a75' },
										}}>
										buraya tıklayın
									</Box>
									.
								</Typography>
							</Box>

							{!isCourseFree && (
								<Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', mt: '2.5rem' }}>
									<CustomTextField
										label="Promosyon Kodu"
										size="small"
										required={false}
										value={promoCode}
										onChange={(e) => {
											setPromoCode(e.target.value);
											setErrorMessage('');
											setIsGroupSelectionExpanded(false);
											setIsPromoCodeApplied(false);
											const amount = +getPriceForCountry(course, resolvedCountryCode).amount;
											setDiscountedAmount(isNaN(amount) ? 0 : amount);
											setUsersUsedPromoCode((prev) => prev?.filter((id) => id !== resolvedUserId) || []);
										}}
										sx={{
											flex: 1,
											minWidth: 120,
											'& .MuiOutlinedInput-root': { fontFamily: FONT, borderRadius: '8px' },
											'& .MuiInputBase-input': { fontFamily: FONT, fontSize: '0.85rem' },
											'& .MuiInputLabel-root': { fontFamily: FONT, fontSize: '0.85rem' },
										}}
										InputProps={{ inputProps: { maxLength: 25 } }}
									/>
									<CustomSubmitButton
										size="small"
										type="button"
										onClick={handleApplyPromoCode}
										sx={{
											background: 'linear-gradient(135deg, #FF6B3D 0%, #ff7d55 100%) !important',
											backgroundColor: 'transparent !important',
											fontFamily: FONT,
											color: 'white !important',
											'&:hover': { background: 'white !important', color: '#FF6B3D !important', border: '1px solid #FF6B3D !important' },
										}}>
										Uygula
									</CustomSubmitButton>
								</Box>
							)}





							{/* Sol: Kullanıcı Sözleşmesi ve Gizlilik */}
							<FormControlLabel
								required
								control={
									<Checkbox
										checked={agreed}
										onChange={(e) => { setAgreed(e.target.checked); setErrorMessage(''); resetRecaptcha(); }}
										size="small"
										sx={{ color: 'rgba(0,0,0,0.6)', '&.Mui-checked': { color: theme.palette?.primary?.main ?? '#0052a3' } }}
									/>
								}
								label={
									<Typography component="span" sx={{ fontFamily: FONT, fontSize: isMobileSize ? '0.7rem' : '0.75rem', color: 'text.secondary' }}>
										<Link to="/terms" target="_blank" rel="noopener noreferrer" style={{ color: theme.palette?.primary?.main ?? '#0052a3', textDecoration: 'underline' }}>Kullanıcı Sözleşmesi</Link>
										{' ve '}
										<Link to="/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: theme.palette?.primary?.main ?? '#0052a3', textDecoration: 'underline' }}>Gizlilik Politikası</Link>
										{' nı okudum ve kabul ediyorum.'}
									</Typography>
								}
								sx={{ alignItems: 'center', '& .MuiFormControlLabel-label': { mt: '2px' }, mb: checkoutCopy.needsWithdrawalWaiver || checkoutCopy.showCohortNotice ? 1 : 2 }}
							/>
							{checkoutCopy.showCohortNotice && (
								<Typography
									component="p"
									sx={{ fontFamily: FONT, fontSize: isMobileSize ? '0.68rem' : '0.72rem', color: 'text.secondary', mb: 1, lineHeight: 1.6 }}>
									{checkoutCopy.cohortNotice}
								</Typography>
							)}
							{checkoutCopy.needsWithdrawalWaiver && (
								<FormControlLabel
									required
									control={
										<Checkbox
											checked={agreedWithdrawalWaiver}
											onChange={(e) => { setAgreedWithdrawalWaiver(e.target.checked); setErrorMessage(''); resetRecaptcha(); }}
											size="small"
											sx={{ color: 'rgba(0,0,0,0.6)', '&.Mui-checked': { color: theme.palette?.primary?.main ?? '#0052a3' } }}
										/>
									}
									label={
										<Typography component="span" sx={{ fontFamily: FONT, fontSize: isMobileSize ? '0.68rem' : '0.72rem', color: 'text.secondary', lineHeight: 1.6 }}>
											{checkoutCopy.withdrawalWaiverLabel}
										</Typography>
									}
									sx={{ alignItems: 'flex-start', '& .MuiFormControlLabel-label': { mt: '2px' }, mb: 2 }}
								/>
							)}
						</Box>
					</Card>
				</Grid>

				{/* Right: Sipariş Özeti + Kart Bilgileri */}
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
							<Typography sx={{ fontFamily: FONT, fontWeight: 700, fontSize: '1.1rem', color: '#0A1A2F', display: 'flex', alignItems: 'center', gap: 1 }}>
								<ReceiptLong sx={{ color: '#FF6B3D', fontSize: 22 }} /> Sipariş Özeti
							</Typography>
							{/* <Typography variant="body2" sx={{ fontFamily: FONT, color: 'text.secondary', mt: 0.5, fontSize: '0.8rem' }}>
								Kurs ve ödeme bilgileri.
							</Typography> */}
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
								{/* Logo + title row */}
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
										<MenuBook sx={{ color: '#0052a3', fontSize: 18 }} />
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
										{course.title}
									</Typography>
								</Box>
								{/* Price row – sits directly under title, same card */}
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
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
										<Typography sx={{ fontFamily: FONT, fontWeight: 800, fontSize: isMobileSize ? '1.05rem' : '1.25rem', color: '#0A1A2F', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
											{setCurrencySymbol(getPriceForCountry(course, resolvedCountryCode).currency)}
											{discountedAmount}
										</Typography>
										{isPromoCodeApplied && (
											<Typography
												variant="body2"
												sx={{
													fontFamily: FONT,
													fontSize: '0.65rem',
													fontWeight: 600,
													color: theme.textColor?.greenPrimary?.main ?? 'success.main',
													px: 0.75,
													py: 0.2,
													borderRadius: 1,
													bgcolor: 'rgba(46, 125, 50, 0.12)',
												}}>
												Promosyon uygulandı
											</Typography>
										)}
									</Box>
								</Box>
							</Box>

							{/* Sağ: Kart bilgileri */}
							{!isCourseFree && (
								<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2, mt: 2 }}>
									<Box>
										<Typography variant="subtitle2" sx={{ fontFamily: FONT, fontWeight: 500, mb: 0.5, color: '#2C3E50', fontSize: isMobileSize ? '0.75rem' : '0.9rem' }}>
											Kart Numarası*
										</Typography>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
											<Box sx={{ ...cardBoxSx(!!showCardError()), width: '100%' }}>
												<CardNumberElement
													options={{
														style: {
															base: { fontSize: isMobileSize ? '11px' : '14px', color: '#223354', fontFamily: 'Arial, sans-serif', '::placeholder': { color: '#aab7c4' } },
															invalid: { color: '#9e2146' },
														},
													}}
													onChange={(e) => { setCardNumberComplete(e.complete); setCardBrand(e.brand || 'unknown'); setErrorMessage(''); setIsGroupSelectionExpanded(false); }}
												/>
											</Box>
											<img src={getCardIcon(cardBrand)} alt="" style={{ width: 40, height: 'auto' }} />
										</Box>
									</Box>
									<Box sx={{ display: 'flex', gap: 2 }}>
										<Box sx={{ flex: 1 }}>
											<Typography variant="subtitle2" sx={{ fontFamily: FONT, fontWeight: 500, mb: 0.5, color: '#2C3E50', fontSize: isMobileSize ? '0.75rem' : '0.9rem' }}>Son Kullanma Tarihi*</Typography>
											<Box sx={cardBoxSx(!!(isSubmitted && !cardExpiryComplete && !isCourseFree && isUserAccountExist && !isAlreadyEnrolled && isEmailVerified && recaptchaToken))}>
												<CardExpiryElement
													options={{
														style: {
															base: { fontSize: isMobileSize ? '11px' : '14px', color: '#223354', fontFamily: 'Arial, sans-serif', '::placeholder': { color: '#aab7c4' } },
															invalid: { color: '#9e2146' },
														},
													}}
													onChange={(e) => { setCardExpiryComplete(e.complete); setErrorMessage(''); setIsGroupSelectionExpanded(false); }}
												/>
											</Box>
										</Box>
										<Box sx={{ flex: 1 }}>
											<Typography variant="subtitle2" sx={{ fontFamily: FONT, fontWeight: 500, mb: 0.5, color: '#2C3E50', fontSize: isMobileSize ? '0.75rem' : '0.9rem' }}>CVC*</Typography>
											<Box sx={cardBoxSx(!!(isSubmitted && !cardCvcComplete && !isCourseFree && isUserAccountExist && !isAlreadyEnrolled && isEmailVerified && recaptchaToken))}>
												<CardCvcElement
													options={{
														style: {
															base: { fontSize: isMobileSize ? '11px' : '14px', color: '#223354', fontFamily: 'Arial, sans-serif', '::placeholder': { color: '#aab7c4' } },
															invalid: { color: '#9e2146' },
														},
													}}
													onChange={(e) => { setCardCvcComplete(e.complete); setErrorMessage(''); setIsGroupSelectionExpanded(false); }}
												/>
											</Box>
										</Box>
									</Box>
								</Box>
							)}

							<Box sx={{ my: '1rem', mx: 'auto', width: 'fit-content' }}>
								<ReCAPTCHA
									ref={recaptchaRef}
									sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
									onChange={handleRecaptchaChange}
									onExpired={() => setRecaptchaToken(null)}
									key="course-payment"
								/>
							</Box>

							{errorMessage && (
								<CustomErrorMessage sx={{ width: '100%', fontSize: isMobileSize ? '0.65rem' : '0.75rem', fontFamily: FONT, mb: 1.5 }}>
									<span style={{ whiteSpace: 'pre-line' }}>
										{errorMessage}
										{!isUserAccountExist && (
											<span onClick={() => window.open('/auth', '_blank')} style={{ color: theme.textColor?.greenSecondary?.main ?? '#2e7d32', textDecoration: 'underline', cursor: 'pointer', fontFamily: FONT }}> Buraya tıklayın</span>
										)}
										{errorMessage?.includes('e-posta adresinizi doğrulayın') && !verificationSent && (
											<Box sx={{ mt: 1 }}>
												<Button onClick={handleResendVerification} disabled={isResendingVerification} sx={{ color: theme.textColor?.greenSecondary?.main ?? '#2e7d32', textDecoration: 'underline', fontFamily: FONT, textTransform: 'none', fontSize: isMobileSize ? '0.65rem' : '0.75rem' }}>
													{isResendingVerification ? 'Gönderiliyor...' : 'Doğrulama e-postasını tekrar gönder'}
												</Button>
											</Box>
										)}
									</span>
								</CustomErrorMessage>
							)}

							<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: 1 }}>
								<CustomDialogActions
									onCancel={handleClose}
									showCancelBtn={false}
									submitBtnText={isProcessing ? 'İşleniyor' : isCourseFree ? 'Kayıt Ol' : 'Ödemeyi Tamamla'}
									submitBtnSx={{
										background: 'linear-gradient(135deg, #FF6B3D 0%, #ff7d55 100%) !important',
										backgroundColor: 'transparent !important',
										fontFamily: FONT,
										color: 'white !important',
										width: '100%',
										py: '1.15rem',
										'&:hover': { background: 'white !important', color: '#FF6B3D !important', border: '1px solid #FF6B3D !important' },
										'&.Mui-disabled': { background: 'rgba(0,0,0,0.12) !important', color: 'rgba(0,0,0,0.26) !important' },
									}}
									disableBtn={isProcessing || (!!course?.groups?.length && !selectedGroupName.trim())}
									submitBtnType="submit"
									actionSx={{ flexDirection: 'column', gap: 1, px: 0, width: '100%' }}
								/>
								<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25 }}>
									<Typography sx={{ fontFamily: FONT, fontSize: '0.75rem', color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
										<Lock sx={{ fontSize: 12, opacity: 0.8 }} /> Güvenli ödeme (Stripe)
									</Typography>
									<Typography sx={{ fontFamily: FONT, fontSize: '0.7rem', color: 'text.secondary', opacity: 0.9 }}>
										Kart bilgileriniz saklanmaz
									</Typography>
								</Box>
							</Box>
						</Box>
					</Card>
				</Grid>
			</Grid>
		</form>
	);
}
