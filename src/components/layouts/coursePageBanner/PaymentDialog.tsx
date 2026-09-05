import { Box, Checkbox, FormControlLabel, Typography, Button, Card, CardActionArea, CardContent, Collapse, IconButton, Alert } from '@mui/material';
import { ExpandMore, } from '@mui/icons-material';
import CustomDialog from '../dialog/CustomDialog';
import CustomTextField from '../../forms/customFields/CustomTextField';
import CustomDialogActions from '../dialog/CustomDialogActions';
import CustomSubmitButton from '../../forms/customButtons/CustomSubmitButton';
import { useContext, useEffect, useState, useRef } from 'react';
import axiosInstance from '@utils/axiosInstance';
import axios from 'axios';
import { CourseEnrollmentProof, SingleCourse } from '../../../interfaces/course';
import { Link } from 'react-router-dom';
import {
	CHECKOUT_LOOKUP_TIMEOUT_MS,
	CHECKOUT_PAYMENT_TIMEOUT_MS,
	redirectToHostedCheckout,
	saveCheckoutReturnContext,
	useSlowNetworkHint,
} from '../../../utils/hostedCheckout';
import { OrganisationContext } from '../../../contexts/OrganisationContextProvider';
import theme from '../../../themes';
import { setCurrencySymbol } from '../../../utils/setCurrencySymbol';
import { UserAuthContext } from '../../../contexts/UserAuthContextProvider';
import { getListPriceIfDifferent, getPriceForCountry } from '../../../utils/getPriceForCountry';
import { resolvePricingCountryCode } from '../../../utils/resolvePricingCountryCode';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import { useGeoLocation } from '../../../hooks/useGeoLocation';
import TurnstileWidget from '../../common/TurnstileWidget';
import { getPostEnrollmentUserPatch } from '../../../utils/learnerPlatformAccess';
import { getCourseAccessCheckoutCopy } from '../../../utils/courseAccessCheckoutCopy';

const DIALOG_BG = 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.98))';
const DIALOG_BORDERRADIUS = '0.75rem';
const DIALOG_BOXSHADOW = '0 0.5rem 2rem rgba(44, 62, 80, 0.1)';
const DIALOG_BORDER = '0.5rem solid rgba(255, 255, 255, 0.18)';
const DIALOG_FONT = 'Varela Round';
const INPUT_BORDERRADIUS = '0.5rem';
const INPUT_FONT = 'Varela Round';
const INPUT_FONTSIZE = '0.85rem';

interface PaymentDialogProps {
	course: SingleCourse | undefined;
	isPaymentDialogOpen: boolean;
	setIsPaymentDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
	courseRegistration: (
		resolvedUserId: string,
		resolvedOrgId: string,
		groupName?: string,
		proof?: CourseEnrollmentProof
	) => Promise<string>;
	fromHomePage?: boolean;
	setDisplayEnrollmentMsg: React.Dispatch<React.SetStateAction<boolean>>;
	setIsEnrolledStatus?: React.Dispatch<React.SetStateAction<boolean>> | undefined;
}

const PaymentDialog = ({
	course,
	isPaymentDialogOpen,
	setIsPaymentDialogOpen,
	courseRegistration,
	fromHomePage,
	setDisplayEnrollmentMsg,
	setIsEnrolledStatus,
}: PaymentDialogProps) => {
	const { orgId } = useContext(OrganisationContext);
	const { user, setUser } = useContext(UserAuthContext);

	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { isRotatedMedium, isSmallScreen } = useContext(MediaQueryContext);

	const location = useGeoLocation();

	const recaptchaRef = useRef<any>(null);

	const [isPromoCodeApplied, setIsPromoCodeApplied] = useState<boolean>(false);

	const resolvedCountryCode = resolvePricingCountryCode(user?.countryCode, location?.countryCode);
	const sellingPrice = course ? getPriceForCountry(course, resolvedCountryCode) : undefined;
	const listPrice = course ? getListPriceIfDifferent(course, resolvedCountryCode) : undefined;

	const isCourseFree: boolean =
		sellingPrice?.amount === 'Free' ||
		sellingPrice?.amount === '' ||
		sellingPrice?.amount === '0';

	useEffect(() => {
		if (!course) return;
		const amount = +getPriceForCountry(course, resolvedCountryCode).amount;
		// Only update if no promo code is applied to prevent price changes during payment
		if (!isPromoCodeApplied) {
			setDiscountedAmount(isNaN(amount) ? 0 : amount);
		}
	}, [user, location, course, isPromoCodeApplied]);

	const isMobileSize: boolean = isSmallScreen || isRotatedMedium;
	const isTrUi = Boolean(fromHomePage || user);
	const checkoutCopy = getCourseAccessCheckoutCopy(course, isTrUi ? 'tr' : 'en');

	const [isProcessing, setIsProcessing] = useState<boolean>(false);
	const [agreed, setAgreed] = useState<boolean>(false);
	const [agreedWithdrawalWaiver, setAgreedWithdrawalWaiver] = useState<boolean>(false);
	const [errorMessage, setErrorMessage] = useState<string>('');

	const [email, setEmail] = useState<string>(() => user?.email || '');
	const [isUserAccountExist, setIsUserAccountExist] = useState<boolean>(true);
	const [isAlreadyEnrolled, setIsAlreadyEnrolled] = useState<boolean>(false);
	const [isEmailVerified, setIsEmailVerified] = useState<boolean>(true);
	const [promoCode, setPromoCode] = useState<string>('');
	const [discountedAmount, setDiscountedAmount] = useState<number>(() => {
		if (!course) return 0;
		const amount = +getPriceForCountry(course, resolvedCountryCode).amount;
		return isNaN(amount) ? 0 : amount;
	});

	const [usersUsedPromoCode, setUsersUsedPromoCode] = useState<string[]>([]);

	const [promoCodeId, setPromoCodeId] = useState<string>('');

	const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

	const [isResendingVerification, setIsResendingVerification] = useState<boolean>(false);
	const [verificationSent, setVerificationSent] = useState<boolean>(false);

	const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
	const [selectedGroupName, setSelectedGroupName] = useState<string>('');
	const [isGroupSelectionExpanded, setIsGroupSelectionExpanded] = useState<boolean>(true);
	const showSlowNetworkHint = useSlowNetworkHint(isProcessing);

	const syncEnrollmentAccessOnClient = () => {
		const patch = getPostEnrollmentUserPatch(user, course);
		if (patch) {
			setUser((prevUser) => (prevUser ? { ...prevUser, ...patch } : prevUser));
		}
	};

	useEffect(() => {
		if (user?.email) {
			setEmail((prev) => prev || user.email || '');
		}
	}, [user?.email]);

	const handleRecaptchaChange = (token: string | null) => {
		setRecaptchaToken(token);
	};

	const resetRecaptcha = () => {
		setRecaptchaToken(null);
		if (recaptchaRef.current) {
			recaptchaRef.current.reset();
		}
	};

	// Add function to validate reCAPTCHA token
	const validateRecaptchaToken = () => {
		if (!recaptchaToken) {
			setErrorMessage(isTrUi ? 'Lütfen reCAPTCHA doğrulamasını tamamlayın.' : 'Please complete the reCAPTCHA verification.');
			return false;
		}
		return true;
	};

	let resolvedUserId = user?._id || '';
	let resolvedOrgId = orgId;

	let resolvedFirstName = user?.firstName || '';
	let resolvedLastName = user?.lastName || '';

	// Reset selected group when dialog closes
	useEffect(() => {
		if (!isPaymentDialogOpen) {
			setSelectedGroupName('');
		}
	}, [isPaymentDialogOpen]);

	// Add cleanup on unmount
	useEffect(() => {
		return () => {
			setIsProcessing(false);
			setIsSubmitted(false);
			setErrorMessage('');
			setIsAlreadyEnrolled(false);
			resetRecaptcha();
		};
	}, []);

	const handlePayment = async () => {
		if (!course) return;
		setIsProcessing(true);
		setIsSubmitted(true);
		let redirecting = false;

		// Lock the price during payment processing to prevent changes
		const lockedAmount = discountedAmount;

		// Validate agreement to User Agreement and Privacy Policy
		if (!agreed) {
			setErrorMessage(isTrUi ? 'Lütfen Kullanıcı Sözleşmesi ve Gizlilik Politikası\'nı kabul edin.' : 'Please accept the User Agreement and Privacy Policy.');
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

		// Validate reCAPTCHA only for paid courses
		if (!isCourseFree && !validateRecaptchaToken()) {
			setIsProcessing(false);
			setIsSubmitted(false);
			return;
		}

		// Validate group selection if groups exist
		if (course?.groups && course.groups.length > 0 && !selectedGroupName.trim()) {
			setErrorMessage(isTrUi ? 'Lütfen bir grup seçin.' : 'Please select a group.');
			setIsProcessing(false);
			setIsSubmitted(false);
			return;
		}

		// Validate selected group is not full
		if (selectedGroupName.trim()) {
			const selectedGroup = course?.groups?.find((g) => g.name === selectedGroupName);
			if (selectedGroup?.isFull) {
				setErrorMessage(isTrUi ? 'Seçilen grup dolu. Lütfen başka bir grup seçin.' : 'Selected group is full. Please select another group.');
				setSelectedGroupName(''); // Clear selection if group is full
				setIsProcessing(false);
				setIsSubmitted(false);
				return;
			}
		}

		try {
			// Check email registration for all homepage registrations
			if (fromHomePage) {
				const sessionEmail = (user?.email || '').trim();
				const usingSessionUser = Boolean(
					user?._id && sessionEmail && (email || '').trim().toLowerCase() === sessionEmail.toLowerCase()
				);
				try {
					const userExistsResponse = await axiosInstance.post(
						`${base_url}/users/check-user-exists`,
						{ email, courseId: course._id },
						{ timeout: CHECKOUT_LOOKUP_TIMEOUT_MS }
					);

					setIsUserAccountExist(userExistsResponse.data.exists || usingSessionUser);

					if (!userExistsResponse.data.exists && !usingSessionUser) {
						setErrorMessage(
							isTrUi
								? `Bu e-posta adresi herhangi bir hesaba bağlı değil.\nKursa katılmak için ücretsiz hesap oluşturun! - `
								: `This email address isn't linked to any account.\nCreate a free account to join the course! - `
						);
						setIsUserAccountExist(false);
						setIsProcessing(false);
						resetRecaptcha();
						return;
					}

					// Add email verification check
					if (!userExistsResponse.data.isEmailVerified && !usingSessionUser) {
						setErrorMessage(
							isTrUi
								? `Lütfen önce e-posta adresinizi doğrulayın. E-posta adresinize gönderilen doğrulama bağlantısını kontrol edin.`
								: `Please verify your email address first. Check your inbox for the verification link.`
						);
						setIsEmailVerified(false);
						setIsProcessing(false);
						resetRecaptcha();
						return;
					}

					if (userExistsResponse.data.isEnrolledInCourse) {
						setErrorMessage(isTrUi ? `Bu kursa zaten kayıtlısınız!` : `You are already enrolled in this course!`);
						setIsAlreadyEnrolled(true);
						setIsProcessing(false);
						resetRecaptcha();
						return;
					}

					// Override IDs for homepage registrations (names/country stay from session or geo)
					resolvedUserId = userExistsResponse.data.userId || user?._id || '';
					resolvedOrgId = userExistsResponse.data.orgId || user?.orgId || orgId;
					if (!resolvedFirstName) {
						resolvedFirstName = (email || '').split('@')[0] || 'Guest';
					}

					// For free courses, proceed with registration
					if (isCourseFree) {
						try {
							await courseRegistration(resolvedUserId, resolvedOrgId, selectedGroupName || undefined, {
								email: email || user?.email,
							});
							syncEnrollmentAccessOnClient();

							setIsPaymentDialogOpen(false);
							resetForm();
							setIsProcessing(false);
							setDisplayEnrollmentMsg(true);
							return;
						} catch (error) {
							console.log(error);
						}
					}
				} catch (error) {
					if (axios.isAxiosError(error)) {
						if (error.code === 'ECONNABORTED') {
							setErrorMessage(isTrUi ? 'Bağlantı yavaş veya zaman aşımına uğradı. Lütfen tekrar deneyin.' : 'The connection timed out. Please try again.');
							resetRecaptcha();
						} else if (!error.response) {
							setErrorMessage(
								isTrUi ? 'İnternet bağlantınızı kontrol edin ve tekrar deneyin.' : 'Please check your internet connection and try again.'
							);
							resetRecaptcha();
						} else if (error.response?.data?.message) {
							const backendMsg = error.response.data.message;
							if (backendMsg.toLowerCase()?.includes('recaptcha')) {
								setErrorMessage(
									isTrUi
										? "reCAPTCHA doğrulaması başarısız. Lütfen reCAPTCHA'yı tekrar tamamlayın ve deneyin."
										: 'reCAPTCHA verification failed. Please complete the reCAPTCHA again and try.'
								);
								// Don't reset reCAPTCHA on reCAPTCHA errors - let user retry
								setIsProcessing(false);
								return;
							} else {
								setErrorMessage(backendMsg);
								resetRecaptcha();
							}
						} else {
							setErrorMessage(isTrUi ? 'Bir hata oluştu. Lütfen tekrar deneyin.' : 'An error occurred. Please try again.');
							resetRecaptcha();
						}
					} else {
						setErrorMessage(isTrUi ? 'Beklenmeyen bir hata oluştu.' : 'An unexpected error occurred.');
						resetRecaptcha();
					}
					setIsProcessing(false);
					return;
				}
			}

			// For free courses (logged-in users, not from homepage), skip payment and register directly
			if (isCourseFree && !fromHomePage) {
				try {
					await courseRegistration(resolvedUserId, resolvedOrgId, selectedGroupName || undefined, {
						email: email || user?.email,
					});
					syncEnrollmentAccessOnClient();

					setIsPaymentDialogOpen(false);
					resetForm();
					setIsProcessing(false);
					setDisplayEnrollmentMsg(true);
					if (setIsEnrolledStatus) setIsEnrolledStatus(true);
					return;
				} catch (regErr) {
					resetForm(true);
					setErrorMessage(isTrUi ? 'Kurs kaydı başarısız oldu.' : 'Course registration failed.');
					resetRecaptcha();
					setIsProcessing(false);
					return;
				}
			}

			try {
				const response = await axiosInstance.post(`${base_url}/payments`, {
					amount: lockedAmount,
					currency: getPriceForCountry(course, resolvedCountryCode).currency,
					orgId: resolvedOrgId,
					userId: resolvedUserId,
					courseId: course._id,
					email: email || user?.email,
					firstName: resolvedFirstName,
					lastName: resolvedLastName,
					paymentType: 'course',
					recaptchaToken,
					hostedCheckout: true,
					cancelUrl: window.location.href,
					...(selectedGroupName.trim() ? { groupName: selectedGroupName.trim() } : {}),
					...(isPromoCodeApplied && promoCodeId ? { promoCodeId } : {}),
				}, { timeout: CHECKOUT_PAYMENT_TIMEOUT_MS });

				const checkoutUrl = response.data?.checkoutUrl;
				if (!checkoutUrl) {
					resetForm(true);
					setErrorMessage(isTrUi ? 'Ödeme sayfası oluşturulamadı. Lütfen tekrar deneyin.' : 'Could not start checkout. Please try again.');
					resetRecaptcha();
					return;
				}

				saveCheckoutReturnContext({
					kind: 'course',
					source: fromHomePage ? 'landing' : 'app',
					courseId: course._id,
					courseTitle: course.title,
					fromHomePage,
				});
				if (!redirectToHostedCheckout(checkoutUrl)) {
					setErrorMessage(isTrUi ? 'Ödeme sayfası oluşturulamadı. Lütfen tekrar deneyin.' : 'Could not start checkout. Please try again.');
					resetRecaptcha();
					return;
				}
				redirecting = true;
				return;
			} catch (err) {
				console.log(err);
				resetForm(true);
				const timedOut = axios.isAxiosError(err) && err.code === 'ECONNABORTED';
				const serverMsg = axios.isAxiosError(err) ? err.response?.data?.message || err.response?.data?.error : null;
				setErrorMessage(
					timedOut
						? isTrUi
							? 'Bağlantı yavaş veya zaman aşımına uğradı. Lütfen tekrar deneyin.'
							: 'The connection timed out. Please try again.'
						: serverMsg || (isTrUi ? 'Ödeme işlenirken bir hata oluştu.' : 'An error occurred while processing the payment.')
				);
				resetRecaptcha();
			}
		} catch (error) {
			console.error(error);
			resetForm(true);
			setErrorMessage(isTrUi ? 'Ödeme işlenirken bir hata oluştu.' : 'An error occurred while processing the payment.');
			resetRecaptcha();
		} finally {
			if (!redirecting) {
				setIsProcessing(false);
			}
		}
	};

	const handleApplyPromoCode = async () => {
		if (!course) return;
		if (!email && fromHomePage) {
			setErrorMessage(isTrUi ? 'Lütfen e-posta adresinizi giriniz.' : 'Please enter your email address.');
			resetRecaptcha();
			return;
		}

		if (!promoCode) {
			setErrorMessage(isTrUi ? 'Promosyon kodu girin' : 'Enter a promo code');
			resetRecaptcha();
			return;
		}
		try {
			if (fromHomePage && email) {
				const userExistsResponse = await axiosInstance.post(`${base_url}/users/check-user-exists`, { email });

				setIsUserAccountExist(userExistsResponse.data.exists);

				resolvedUserId = userExistsResponse?.data?.userId;

				if (!userExistsResponse.data.exists) {
					setErrorMessage(
						isTrUi
							? `Bu e-posta adresi herhangi bir hesaba bağlı değil.\nKursa katılmak için ücretsiz hesap oluşturun! - `
							: `This email address isn't linked to any account.\nCreate a free account to join the course! - `
					);
					setIsUserAccountExist(false);
					setIsProcessing(false);
					return;
				}
			}

			const response = await axiosInstance.post(`${base_url}/promocodes/apply`, {
				code: promoCode.trim(),
				courseId: course?._id,
				userId: resolvedUserId,
				orgId,
				email,
			});
			const { discountAmount, usersUsed, _id } = response.data;

			setPromoCodeId(_id);

			// Calculate the discounted amount based on the type
			let newTotal: number = +getPriceForCountry(course, resolvedCountryCode).amount;
			if (isNaN(newTotal)) {
				newTotal = 0;
			}

			newTotal -= (newTotal * discountAmount) / 100;

			setDiscountedAmount(Math.max(newTotal, 0)); // Ensure amount doesn't go negative
			setErrorMessage(''); // Clear any previous error messages
			setIsPromoCodeApplied(true);
			setUsersUsedPromoCode(usersUsed);
		} catch (error) {
			if (axios.isAxiosError(error) && error.response?.data?.message) {
				setErrorMessage(isTrUi ? `Geçersiz promosyon kodu` : error.response.data.message);
			} else {
				// Fallback in case it's not an AxiosError or the message isn't available
				setErrorMessage(isTrUi ? 'Geçersiz promosyon kodu' : 'Invalid promo code');
			}
			const amount = +getPriceForCountry(course, resolvedCountryCode).amount;
			setDiscountedAmount(isNaN(amount) ? 0 : amount); // Reset to original price
			resetRecaptcha();
		}
	};

	const handleResendVerification = async () => {
		if (!email) return;
		setIsResendingVerification(true);
		try {
			await axiosInstance.post(`${base_url}/users/resend-verification`, { email });
			setVerificationSent(true);
			setErrorMessage(
				isTrUi ? 'Doğrulama e-postası gönderildi. Lütfen gelen kutunuzu kontrol edin.' : 'Verification email sent. Please check your inbox.'
			);
			resetRecaptcha();
		} catch (error) {
			if (axios.isAxiosError(error)) {
				if (error.response?.data?.isEmailVerified) {
					setErrorMessage(isTrUi ? 'E-posta adresiniz zaten doğrulanmış.' : 'Your email is already verified.');
				} else {
					setErrorMessage(
						isTrUi
							? 'Doğrulama e-postası gönderilirken bir hata oluştu. Lütfen tekrar deneyin.'
							: 'Error sending verification email. Please try again.'
					);
				}
				resetRecaptcha();
			}
			resetRecaptcha();
		} finally {
			setIsResendingVerification(false);
			resetRecaptcha();
		}
	};

	const resetForm = (preserveError = false) => {
		setEmail(user?.email || '');
		setPromoCode('');
		setSelectedGroupName('');
		if (!course) return;
		const amount = +getPriceForCountry(course, resolvedCountryCode).amount;
		setDiscountedAmount(isNaN(amount) ? 0 : amount);
		setIsPromoCodeApplied(false);
		setAgreed(false);
		setAgreedWithdrawalWaiver(false);

		if (!preserveError) {
			setErrorMessage('');
		}

		setIsSubmitted(false);
		setIsProcessing(false);
		setIsAlreadyEnrolled(false);
		setIsEmailVerified(true);
		setRecaptchaToken(null);
		if (recaptchaRef.current) {
			recaptchaRef.current.reset();
		}
	};

	return (
		<CustomDialog
			openModal={isPaymentDialogOpen}
			closeModal={() => {
				if (!isProcessing) {
					resetForm();
					setIsPaymentDialogOpen(false);
				}
			}}
			title={isCourseFree ? 'Kayıt Ol' : isTrUi ? 'Ödeme Yap' : 'Make Payment'}
			maxWidth='sm'
			{...(fromHomePage
				? {
					titleSx: {
						fontSize: '1.5rem',
						fontWeight: 600,
						fontFamily: DIALOG_FONT,
						color: '#2C3E50',
						ml: '0.5rem',
						textAlign: 'center',
						mb: 1,
					},
					PaperProps: {
						sx: {
							height: 'auto',
							maxHeight: '100vh',
							overflow: 'auto',
							borderRadius: DIALOG_BORDERRADIUS,
							background: DIALOG_BG,
							boxShadow: DIALOG_BOXSHADOW,
							backdropFilter: 'blur(8px)',
							border: DIALOG_BORDER,
							fontFamily: DIALOG_FONT,
						},
					},
				}
				: {})}>
			<form
				onSubmit={async (e) => {
					e.preventDefault();
					await handlePayment();
				}}>
				<Box
					sx={{
						margin: { xs: '0 0.75rem', sm: '0 1rem', md: '0 2rem', lg: '0 2rem' },
						...(fromHomePage
							? {
								'& .MuiOutlinedInput-root': {
									'&:hover fieldset': {
										borderColor: '#3498DB',
									},
									'&.Mui-focused fieldset': {
										borderColor: '#3498DB',
									},
								},
							}
							: {}),
					}}>


					{/* Group Selection */}
					{course?.groups && course.groups.length > 0 && (
						<Box sx={{ mb: 3 }}>
							<Box
								sx={{
									backgroundColor: theme.bgColor?.primary,
									padding: isMobileSize ? '0.5rem' : '0.75rem 1rem 0.75rem 0.5rem',
									cursor: 'pointer',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									borderRadius: '0.35rem',
									transition: 'background-color 0.2s ease',
									mb: 1.5,
									'&:hover': {
										backgroundColor: theme.bgColor?.primary,
									},
								}}
								onClick={() => setIsGroupSelectionExpanded(!isGroupSelectionExpanded)}>
								<Typography
									variant='h6'
									sx={
										fromHomePage
											? {
												fontFamily: 'Varela Round',
												fontWeight: 500,
												fontSize: isMobileSize ? '0.85rem' : '0.95rem',
												color: 'white',
												textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
												ml: '0.5rem',
											}
											: {
												fontSize: isMobileSize ? '0.85rem' : '0.9rem',
												fontWeight: 500,
												color: 'white',
												textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
												ml: '0.5rem',
											}
									}>
									{selectedGroupName
										? `${isTrUi ? 'Seçilen Grup: ' : 'Selected Group: '}${selectedGroupName}`
										: isTrUi
											? 'Grup Seçin*'
											: 'Select Group*'}
								</Typography>
								<IconButton
									size='small'
									sx={{
										color: 'white',
										padding: '0.25rem',
										marginLeft: isMobileSize ? '0.5rem' : '1rem',
										transform: isGroupSelectionExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
										transition: 'transform 0.3s ease',
										'&:hover': {
											border: 'solid 0.5px white',
										},
									}}>
									<ExpandMore fontSize='small' />
								</IconButton>
							</Box>
							<Collapse in={isGroupSelectionExpanded}>
								<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
									{course.groups.map((group) => (
										<Card
											key={group.name}
											sx={{
												border: selectedGroupName === group.name ? '2px solid' : '1px solid',
												borderColor: selectedGroupName === group.name
													? theme.palette.primary.main
													: group.isFull
														? '#ef4444'
														: theme.palette.divider,
												borderRadius: '0.75rem',
												transition: 'all 0.2s ease',
												backgroundColor: selectedGroupName === group.name
													? 'rgba(25, 118, 210, 0.04)'
													: group.isFull
														? 'rgba(239, 68, 68, 0.04)'
														: 'transparent',
												opacity: group.isFull ? 0.7 : 1,
												'&:hover': {
													borderColor: group.isFull ? '#ef4444' : theme.palette.primary.main,
													boxShadow: group.isFull ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.1)',
												},
											}}>
											<CardActionArea
												onClick={() => {
													if (!group.isFull) {
														setSelectedGroupName(group.name);
														setErrorMessage('');
														setIsGroupSelectionExpanded(false); // Collapse after selection
													}
												}}
												disabled={group.isFull}
												sx={{ p: 0, cursor: group.isFull ? 'not-allowed' : 'pointer' }}>
												<CardContent sx={{ p: '1rem !important', '&:last-child': { pb: '1rem' } }}>
													<Box sx={{ flex: 1, minWidth: 0 }}>
														<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
															<Typography
																variant='subtitle1'
																sx={{
																	fontWeight: 600,
																	fontSize: isMobileSize ? '0.85rem' : '0.95rem',
																	color: group.isFull ? '#ef4444' : '#2C3E50',
																	fontFamily: fromHomePage ? DIALOG_FONT : theme.fontFamily?.main,
																}}>
																{group.name}
															</Typography>
															{group.isFull && (
																<Typography
																	variant='body2'
																	sx={{
																		fontSize: isMobileSize ? '0.65rem' : '0.75rem',
																		color: '#ef4444',
																		fontWeight: 600,
																		fontFamily: fromHomePage ? DIALOG_FONT : theme.fontFamily?.main,
																	}}>
																	{isTrUi ? '(Kontenjan Doldu)' : '(No seats available)'}
																</Typography>
															)}
														</Box>
														<Typography
															variant='body2'
															sx={{
																fontSize: isMobileSize ? '0.75rem' : '0.85rem',
																color: group.isFull ? '#94a3b8' : '#475569',
																lineHeight: 1.5,
																fontFamily: fromHomePage ? DIALOG_FONT : theme.fontFamily?.main,
																whiteSpace: 'pre-line',
															}}>
															{group.description}
														</Typography>

													</Box>
												</CardContent>
											</CardActionArea>
										</Card>
									))}
								</Box>
							</Collapse>
						</Box>
					)}

					{fromHomePage && (
						<Box>
							<CustomTextField
								label={isTrUi ? 'E-posta Adresi' : 'Email Address'}
								size='small'
								value={email}
								type='email'
								onChange={(e) => {
									setEmail(e.target.value);
									setIsPromoCodeApplied(false);
									if (!course) return;
									const amount = +getPriceForCountry(course, resolvedCountryCode).amount;
									setDiscountedAmount(isNaN(amount) ? 0 : amount);
									setUsersUsedPromoCode((prevData) => prevData?.filter((id) => id !== resolvedUserId) || []);
									setErrorMessage('');
									setIsUserAccountExist(true);
								}}
								sx={{
									'mb': '1.25rem',
									'& .MuiOutlinedInput-root': {
										fontFamily: INPUT_FONT,
										borderRadius: INPUT_BORDERRADIUS,
									},
									'& .MuiInputBase-input': {
										fontFamily: INPUT_FONT,
										fontSize: INPUT_FONTSIZE,
									},
									'& .MuiInputBase-input::placeholder': {
										fontFamily: INPUT_FONT,
										opacity: 1,
									},
									'& .MuiInputLabel-root': {
										fontFamily: INPUT_FONT,
										fontSize: INPUT_FONTSIZE,
									},
								}}
								InputProps={{
									inputProps: {
										maxLength: 254,
									},
								}}
							/>
						</Box>
					)}

					{!isCourseFree && (
						<Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
							<CustomTextField
								label={isTrUi ? 'Promosyon Kodu' : 'Promo Code'}
								size='small'
								required={false}
								disabled={isCourseFree}
								sx={
									fromHomePage
										? {
											'fontFamily': 'Varela Round',
											'mb': 2,
											'& .MuiOutlinedInput-root': {
												fontFamily: 'Varela Round',
												borderRadius: '8px',
											},
											'& .MuiInputBase-input': {
												fontFamily: 'Varela Round',
												fontSize: '0.85rem',
											},
											'& .MuiInputBase-input::placeholder': {
												fontFamily: 'Varela Round',
												opacity: 1,
											},
											'& .MuiInputLabel-root': {
												fontFamily: 'Varela Round',
												fontSize: '0.85rem',
											},
										}
										: {}
								}
								value={promoCode}
								onChange={(e) => {
									setPromoCode(e.target.value);
									setErrorMessage('');
									setIsPromoCodeApplied(false);
									if (!course) return;
									const amount = +getPriceForCountry(course, resolvedCountryCode).amount;
									setDiscountedAmount(isNaN(amount) ? 0 : amount);
									setUsersUsedPromoCode((prevData) => prevData?.filter((id) => id !== resolvedUserId) || []);
								}}
								InputProps={{
									inputProps: {
										maxLength: 25,
									},
								}}
							/>
							<CustomSubmitButton
								size='small'
								type='button'
								disabled={isCourseFree}
								sx={
									fromHomePage
										? {
											'background': 'linear-gradient(135deg, #FF6B3D 0%, #ff7d55 100%) !important',
											'backgroundColor': 'transparent !important',
											'fontFamily': 'Varela Round',
											'color': 'white !important',
											'transition': 'all 0.2s ease !important',
											'&:hover': {
												background: 'white !important',
												backgroundColor: 'white !important',
												color: '#FF6B3D !important',
												border: '1px solid #FF6B3D !important',
											},
											'&.Mui-disabled': {
												background: 'rgba(0, 0, 0, 0.12) !important',
												backgroundColor: 'rgba(0, 0, 0, 0.12) !important',
												color: 'rgba(0, 0, 0, 0.26) !important',
											},
										}
										: undefined
								}
								onClick={handleApplyPromoCode}>
								{isTrUi ? 'Uygula' : 'Apply'}
							</CustomSubmitButton>
						</Box>
					)}

					{!isCourseFree && (
						<>
							<Box
								sx={{
									display: 'flex',
									flexDirection: 'column',
									gap: 0.5,
									mb: 2,
									mt: 2,
									px: 0.5,
								}}>
								<Typography
									sx={{
										fontFamily: fromHomePage ? DIALOG_FONT : theme.fontFamily?.main,
										fontSize: isMobileSize ? '0.72rem' : '0.8rem',
										color: 'text.secondary',
										lineHeight: 1.5,
									}}>
									{isTrUi
										? 'Kart bilgilerinizi Stripe’ın güvenli ödeme sayfasında gireceksiniz. Ödeme onaylanmadan kurs kaydı yapılmaz.'
										: 'You will enter your card details on Stripe’s secure checkout page. You will not be enrolled until payment is authorized.'}
								</Typography>
							</Box>

							<Box
								sx={{
									display: 'flex',
									alignItems: 'center',
									width: '100%',
									padding: isSmallScreen || isRotatedMedium ? '0 0.35rem' : '0rem',
									fontFamily: DIALOG_FONT,
									mt: '2rem',
								}}>
								<Typography
									variant={isMobileSize ? 'body2' : 'h6'}
									sx={{
										boxShadow: '0.1rem 0.1rem 0.5rem 0.1rem rgba(0,0,0,0.3)',
										borderRadius: INPUT_BORDERRADIUS,
										padding: isMobileSize ? '0.5rem' : '0.75rem',
										fontFamily: fromHomePage ? DIALOG_FONT : theme.fontFamily?.main,
										color: '#223354',
									}}>
									{isTrUi ? 'Toplam Tutar: ' : 'Total Amount: '}
									{listPrice && String(discountedAmount) !== String(listPrice.amount) ? (
										<Box
											component='span'
											sx={{
												fontWeight: 700,
												color: '#475569',
												textDecoration: 'line-through',
												textDecorationThickness: '2px',
												mr: 1,
												fontSize: isMobileSize ? '0.85em' : '0.9em',
											}}>
											{setCurrencySymbol(listPrice.currency)}
											{listPrice.amount}
										</Box>
									) : null}
									{setCurrencySymbol(sellingPrice?.currency ?? '')}
									{discountedAmount}
								</Typography>
								{isPromoCodeApplied && (
									<Typography
										variant='body2'
										sx={{
											color: theme.textColor?.greenPrimary.main,
											ml: isMobileSize ? '1rem' : '2rem',
											fontFamily: fromHomePage ? DIALOG_FONT : theme.fontFamily?.main,
										}}>
										{isTrUi ? 'Promosyon Kodu Uygulandı' : 'Promo Code is applied'}
									</Typography>
								)}
							</Box>

							<Box
								sx={{
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'flex-start',
									textAlign: 'left',
									width: '100%',
									mt: isSmallScreen ? '1rem' : '1.5rem',
									mb: '1rem',
									gap: 1,
								}}>
								<Box
									sx={{
										display: 'flex',
										flexDirection: isSmallScreen ? 'column' : 'row',
										alignItems: 'flex-start',
										width: '100%',
										gap: isSmallScreen ? 1 : 2,
									}}>
									<FormControlLabel
										required
										control={
											<Checkbox
												checked={agreed}
												onChange={(e) => {
													setAgreed(e.target.checked);
													setErrorMessage('');
													resetRecaptcha();
												}}
												size="small"
												sx={{
													'display': 'flex',
													'alignItems': 'center',
													'color': 'rgba(0,0,0,0.6)',
													'&.Mui-checked': { color: theme.palette?.primary?.main ?? '#0052a3' },
													'& .MuiSvgIcon-root': {
														fontSize: isMobileSize ? '0.9rem' : '1.15rem',
													},
												}}
											/>
										}
										label={
											<Typography component="span" sx={{ fontSize: isMobileSize ? '0.65rem' : '0.7rem', fontFamily: fromHomePage ? DIALOG_FONT : theme.fontFamily?.main, color: 'text.secondary' }}>
												{isTrUi ? null : 'I have read and agree to the '}
												<Link to="/terms" target="_blank" rel="noopener noreferrer" style={{ color: theme.palette?.primary?.main ?? '#0052a3', textDecoration: 'underline' }}>{isTrUi ? 'Kullanıcı Sözleşmesi' : 'User Agreement'}</Link>
												{isTrUi ? ' ve ' : ' and '}
												<Link to="/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: theme.palette?.primary?.main ?? '#0052a3', textDecoration: 'underline' }}>{isTrUi ? 'Gizlilik Politikası' : 'Privacy Policy'}</Link>
												{isTrUi ? " nı okudum ve kabul ediyorum." : '.'}
											</Typography>
										}
										sx={{
											alignItems: 'flex-start',
											flex: 1,
											mr: 0,
											'& .MuiFormControlLabel-label': { mt: '2px' },
										}}
									/>
									{checkoutCopy.showCohortNotice && (
										<Typography
											component="p"
											sx={{
												flex: 1,
												fontSize: isMobileSize ? '0.62rem' : '0.68rem',
												fontFamily: fromHomePage ? DIALOG_FONT : theme.fontFamily?.main,
												color: 'text.secondary',
												lineHeight: 1.6,
												pt: '0.35rem',
											}}>
											{checkoutCopy.cohortNotice}
										</Typography>
									)}
								</Box>
								{checkoutCopy.needsWithdrawalWaiver && (
									<FormControlLabel
										required
										control={
											<Checkbox
												checked={agreedWithdrawalWaiver}
												onChange={(e) => {
													setAgreedWithdrawalWaiver(e.target.checked);
													setErrorMessage('');
													resetRecaptcha();
												}}
												size="small"
												sx={{
													'color': 'rgba(0,0,0,0.6)',
													'&.Mui-checked': { color: theme.palette?.primary?.main ?? '#0052a3' },
													'& .MuiSvgIcon-root': {
														fontSize: isMobileSize ? '0.9rem' : '1.15rem',
													},
												}}
											/>
										}
										label={
											<Typography
												component="span"
												sx={{
													fontSize: isMobileSize ? '0.62rem' : '0.68rem',
													fontFamily: fromHomePage ? DIALOG_FONT : theme.fontFamily?.main,
													color: 'text.secondary',
													lineHeight: 1.6,
												}}>
												{checkoutCopy.withdrawalWaiverLabel}
											</Typography>
										}
										sx={{ alignItems: 'flex-start', '& .MuiFormControlLabel-label': { mt: '2px' } }}
									/>
								)}
								<Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', pt: 1.5 }}>
									<TurnstileWidget
										ref={recaptchaRef}
										action="course-payment"
										onChange={handleRecaptchaChange}
										onExpired={() => setRecaptchaToken(null)}
										resetKey={isPaymentDialogOpen ? 'active' : 'inactive'}
									/>
								</Box>
							</Box>
						</>
					)}
				</Box>

				{errorMessage && (
					<Alert
						severity='error'
						sx={{
							width: '100%',
							mx: { xs: 1, sm: 2 },
							mt: 1.5,
							fontSize: isMobileSize ? '0.7rem' : '0.8rem',
							fontFamily: fromHomePage ? DIALOG_FONT : theme.fontFamily?.main,
							whiteSpace: 'pre-line',
						}}>
						{errorMessage}
						{!isUserAccountExist && fromHomePage && (
							<>
								<Box
									component='span'
									onClick={() => window.open('/auth', '_blank')}
									sx={{
										color: theme.textColor?.greenSecondary?.main,
										textDecoration: 'underline',
										cursor: 'pointer',
										fontSize: isMobileSize ? '0.65rem' : '0.75rem',
										fontFamily: fromHomePage ? DIALOG_FONT : theme.fontFamily?.main,
										ml: 0.5,
										fontWeight: 600,
									}}>
									{isTrUi ? 'Buraya tıklayın' : 'Click here'}
								</Box>
								<Box component="span" sx={{ display: 'block', mt: 0.75 }}>
									{isTrUi
										? 'Hesabınızda "Courses" sayfasından da kursu satın alabilirsiniz'
										: 'You can also purchase the course from the "Courses" page in your account'}
								</Box>
							</>
						)}
						{errorMessage?.includes('e-posta adresinizi doğrulayın') && !verificationSent && (
							<Box sx={{ mt: 1 }}>
								<Button
									onClick={handleResendVerification}
									disabled={isResendingVerification}
									sx={{
										'color': theme.textColor?.greenSecondary?.main,
										'textDecoration': 'underline',
										'cursor': 'pointer',
										'fontSize': isMobileSize ? '0.65rem' : '0.75rem',
										'fontFamily': fromHomePage ? DIALOG_FONT : theme.fontFamily?.main,
										'textTransform': 'none',
										'&:hover': {
											backgroundColor: 'transparent',
											textDecoration: 'underline',
										},
									}}>
									{isResendingVerification
										? isTrUi
											? 'Gönderiliyor...'
											: 'Sending...'
										: isTrUi
											? 'Doğrulama e-postasını tekrar gönder'
											: 'Resend verification email'}
								</Button>
							</Box>
						)}
						{verificationSent && (
							<Typography color='success.main' sx={{ mt: 1, fontSize: isMobileSize ? '0.7rem' : '0.8rem' }}>
								{isTrUi
									? 'Doğrulama e-postası gönderildi. Lütfen gelen kutunuzu kontrol edin.'
									: 'Verification email sent. Please check your inbox.'}
							</Typography>
						)}
					</Alert>
				)}

				<CustomDialogActions
					onCancel={() => {
						if (!isProcessing) {
							resetForm();
							setIsPaymentDialogOpen(false);
						}
					}}
					cancelBtnText={isTrUi ? 'Kapat' : 'Cancel'}
					cancelBtnSx={{
						fontFamily: fromHomePage ? DIALOG_FONT : '',
					}}
					submitBtnText={
						isProcessing
							? showSlowNetworkHint
								? isTrUi
									? 'Hâlâ bağlanıyor...'
									: 'Still connecting...'
								: isTrUi
									? 'İşleniyor'
									: 'Processing'
							: isTrUi && !isCourseFree
								? 'Ödeme Yap'
								: isCourseFree
									? 'Kayıt Ol'
									: 'Make Payment'
					}
					submitBtnSx={{
						...(fromHomePage
							? {
								'background': 'linear-gradient(135deg, #FF6B3D 0%, #ff7d55 100%) !important',
								'backgroundColor': 'transparent !important',
								'fontFamily': DIALOG_FONT,
								'color': 'white !important',
								'transition': 'all 0.2s ease !important',
								'&:hover': {
									background: 'white !important',
									backgroundColor: 'white !important',
									color: '#FF6B3D !important',
									border: '1px solid #FF6B3D !important',
								},
								'&.Mui-disabled': {
									background: 'rgba(0, 0, 0, 0.12) !important',
									backgroundColor: 'rgba(0, 0, 0, 0.12) !important',
									color: 'rgba(0, 0, 0, 0.26) !important',
								},
							}
							: {
								fontFamily: '',
								cursor: isProcessing ? 'not-allowed' : 'pointer',
								cursorEvents: isProcessing ? 'none' : 'auto',
								pointerEvents: isProcessing ? 'none' : 'auto',
							}),
					}}
					disableBtn={
						isProcessing ||
						(course?.groups && course.groups.length > 0 && !selectedGroupName.trim())
					}
					disableCancelBtn={isProcessing}
					actionSx={{ mr: '1rem', mb: 0, marginBottom: 0 }}
				/>
				{!!course?.groups?.length && !selectedGroupName.trim() && (
					<Alert
						severity="error"
						sx={{
							mx: 2,
							mb: 1,
							mt: 0.75,
							fontFamily: fromHomePage ? DIALOG_FONT : theme.fontFamily?.main,
							fontSize: isMobileSize ? '0.7rem' : '0.75rem',
							backgroundColor: '#FFF1F2',
							color: '#9F1239',
							border: '1px solid #FDA4AF',
							borderRadius: 2,
							'& .MuiAlert-icon': { color: '#E11D48' },
						}}>
						{isTrUi ? 'Grup Seçin' : 'Select a group'}
					</Alert>
				)}
			</form>
		</CustomDialog>
	);
};

export default PaymentDialog;
