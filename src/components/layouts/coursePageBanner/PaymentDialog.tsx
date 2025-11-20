import { Box, Checkbox, FormControlLabel, Typography, Button } from '@mui/material';
import CustomDialog from '../dialog/CustomDialog';
import CustomTextField from '../../forms/customFields/CustomTextField';
import TermsConditions from './TermsConditions';
import CustomDialogActions from '../dialog/CustomDialogActions';
import CustomSubmitButton from '../../forms/customButtons/CustomSubmitButton';
import { useContext, useEffect, useState, useRef } from 'react';
import { useQueryClient } from 'react-query';
import { CardCvcElement, CardExpiryElement, CardNumberElement, useElements, useStripe } from '@stripe/react-stripe-js';
import axiosInstance from '@utils/axiosInstance';
import axios from 'axios';
import visaIcon from '../../../assets/visa.png';
import masterCardIcon from '../../../assets/mastercard.png';
import defaultCardIcon from '../../../assets/credit-card.png';
import { SingleCourse } from '../../../interfaces/course';
import { useNavigate } from 'react-router-dom';
import { OrganisationContext } from '../../../contexts/OrganisationContextProvider';
import CustomErrorMessage from '../../forms/customFields/CustomErrorMessage';
import theme from '../../../themes';
import { setCurrencySymbol } from '../../../utils/setCurrencySymbol';
import { UserAuthContext } from '../../../contexts/UserAuthContextProvider';
import { getPriceForCountry } from '../../../utils/getPriceForCountry';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import { useGeoLocation } from '../../../hooks/useGeoLocation';
import ReCAPTCHA from 'react-google-recaptcha';

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
	courseRegistration: (resolvedUserId: string, resolvedOrgId: string) => Promise<string>;
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
	const queryClient = useQueryClient();

	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { isRotatedMedium, isSmallScreen } = useContext(MediaQueryContext);

	const location = useGeoLocation();
	const navigate = useNavigate();

	const recaptchaRef = useRef<any>(null);

	const [isPromoCodeApplied, setIsPromoCodeApplied] = useState<boolean>(false);

	let resolvedCountryCode = user?.countryCode || location?.countryCode || 'US';

	const isCourseFree: boolean =
		getPriceForCountry(course!, resolvedCountryCode!)?.amount === 'Free' ||
		getPriceForCountry(course!, resolvedCountryCode!)?.amount === '' ||
		getPriceForCountry(course!, resolvedCountryCode!)?.amount === '0';

	useEffect(() => {
		if (!course) return;
		const amount = +getPriceForCountry(course, resolvedCountryCode).amount;
		// Only update if no promo code is applied to prevent price changes during payment
		if (!isPromoCodeApplied) {
			setDiscountedAmount(isNaN(amount) ? 0 : amount);
		}
	}, [user, location, course, isPromoCodeApplied]);

	const isMobileSize: boolean = isSmallScreen || isRotatedMedium;

	const [isProcessing, setIsProcessing] = useState<boolean>(false);
	const [termsConditionsModalOpen, setTermsConditionsModalOpen] = useState<boolean>(false);
	const [agreed, setAgreed] = useState<boolean>(false);
	const [cardBrand, setCardBrand] = useState<string>('unknown');
	const [errorMessage, setErrorMessage] = useState<string>('');

	const [email, setEmail] = useState<string>('');
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
	const [cardNumberComplete, setCardNumberComplete] = useState<boolean>(false);
	const [cardExpiryComplete, setCardExpiryComplete] = useState<boolean>(false);
	const [cardCvcComplete, setCardCvcComplete] = useState<boolean>(false);

	const stripe = useStripe();
	const elements = useElements();

	const [isResendingVerification, setIsResendingVerification] = useState<boolean>(false);
	const [verificationSent, setVerificationSent] = useState<boolean>(false);

	const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

	const handleRecaptchaChange = (token: string | null) => {
		setRecaptchaToken(token);
		setErrorMessage('');
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
			setErrorMessage(fromHomePage ? 'Lütfen reCAPTCHA doğrulamasını tamamlayın.' : 'Please complete the reCAPTCHA verification.');
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
				return defaultCardIcon; // Default icon for unknown or unsupported brands
		}
	};

	let resolvedUserId = user?._id || '';
	let resolvedOrgId = orgId;

	let resolvedFirstName = user?.firstName || '';
	let resolvedLastName = user?.lastName || '';

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

		// Lock the price during payment processing to prevent changes
		const lockedAmount = discountedAmount;

		if (!validateRecaptchaToken()) {
			setIsProcessing(false);
			setIsSubmitted(false);
			return;
		}

		try {
			// Add timeout to axios requests
			const axiosInstanceWithTimeout = axios.create({
				...axiosInstance.defaults,
				timeout: 10000, // 10 seconds timeout
			});

			// Check email registration for all homepage registrations
			if (fromHomePage) {
				try {
					const userExistsResponse = await axiosInstanceWithTimeout.post(`${base_url}/users/check-user-exists`, {
						email,
						courseId: course._id,
					});

					setIsUserAccountExist(userExistsResponse.data.exists);

					if (!userExistsResponse.data.exists) {
						setErrorMessage(
							fromHomePage
								? `Bu e-posta adresi herhangi bir hesaba bağlı değil.\nKursa katılmak için ücretsiz hesap oluşturun! - `
								: `This email address isn't linked to any account.\nCreate a free account to join the course! - `
						);
						setIsUserAccountExist(false);
						setIsProcessing(false);
						resetRecaptcha();
						return;
					}

					// Add email verification check
					if (!userExistsResponse.data.isEmailVerified) {
						setErrorMessage(
							fromHomePage
								? `Lütfen önce e-posta adresinizi doğrulayın. E-posta adresinize gönderilen doğrulama bağlantısını kontrol edin.`
								: `Please verify your email address first. Check your inbox for the verification link.`
						);
						setIsEmailVerified(false);
						setIsProcessing(false);
						resetRecaptcha();
						return;
					}

					if (userExistsResponse.data.isEnrolledInCourse) {
						setErrorMessage(fromHomePage ? `Bu kursa zaten kayıtlısınız!` : `You are already enrolled in this course!`);
						setIsAlreadyEnrolled(true);
						setIsProcessing(false);
						resetRecaptcha();
						return;
					}

					// Override IDs and user info for homepage registrations
					resolvedUserId = userExistsResponse.data.userId;
					resolvedOrgId = userExistsResponse.data.orgId;
					resolvedCountryCode = userExistsResponse.data.countryCode;
					resolvedFirstName = userExistsResponse.data.firstName;
					resolvedLastName = userExistsResponse.data.lastName;

					// For free courses, proceed with registration
					if (isCourseFree) {
						try {
							await courseRegistration(resolvedUserId, resolvedOrgId);

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
							setErrorMessage(fromHomePage ? 'Bağlantı zaman aşımına uğradı. Lütfen tekrar deneyin.' : 'Connection timed out. Please try again.');
							resetRecaptcha();
						} else if (!error.response) {
							setErrorMessage(
								fromHomePage ? 'İnternet bağlantınızı kontrol edin ve tekrar deneyin.' : 'Please check your internet connection and try again.'
							);
							resetRecaptcha();
						} else if (error.response?.data?.message) {
							const backendMsg = error.response.data.message;
							if (backendMsg.toLowerCase()?.includes('recaptcha')) {
								setErrorMessage(
									fromHomePage
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
							setErrorMessage(fromHomePage ? 'Bir hata oluştu. Lütfen tekrar deneyin.' : 'An error occurred. Please try again.');
							resetRecaptcha();
						}
					} else {
						setErrorMessage(fromHomePage ? 'Beklenmeyen bir hata oluştu.' : 'An unexpected error occurred.');
						resetRecaptcha();
					}
					setIsProcessing(false);
					return;
				}
			}

			if (!stripe || !elements) {
				setErrorMessage(fromHomePage ? 'Stripe düzgün yüklenemedi.' : 'Stripe has not loaded properly.');
				resetRecaptcha();
				setIsProcessing(false);
				return;
			}

			const cardNumberElement = elements.getElement(CardNumberElement);
			const cardExpiryElement = elements.getElement(CardExpiryElement);
			const cardCvcElement = elements.getElement(CardCvcElement);

			if (!cardNumberComplete || !cardExpiryComplete || !cardCvcComplete) {
				setErrorMessage(fromHomePage ? 'Lütfen tüm kart bilgilerini doldurun.' : 'Please fill in all card details.');
				setIsProcessing(false);
				resetRecaptcha();
				return;
			}

			let usersUsedCode = [...usersUsedPromoCode];

			try {
				// Step 1: Create PaymentIntent (manual capture)
				const response = await axiosInstance.post(`${base_url}/payments`, {
					amount: lockedAmount, // Use locked amount to prevent price changes
					currency: getPriceForCountry(course, resolvedCountryCode!).currency,
					orgId: resolvedOrgId,
					userId: resolvedUserId,
					courseId: course._id,
					email: email || user?.email,
					firstName: resolvedFirstName,
					lastName: resolvedLastName,
					paymentType: 'course',
					recaptchaToken,
				});

				const { clientSecret, paymentIntentId } = response.data;

				// Step 2: Create Payment Method
				if (!cardNumberElement) {
					setErrorMessage(fromHomePage ? 'Kart bilgileri eksik.' : 'Card details are missing.');
					resetRecaptcha();
					return;
				}
				const { error: methodError, paymentMethod } = await stripe.createPaymentMethod({
					type: 'card',
					card: cardNumberElement,
					billing_details: {
						name: `${resolvedFirstName} ${resolvedLastName}`,
					},
				});

				if (methodError) {
					resetForm(true);
					setErrorMessage(
						methodError.message
							? fromHomePage
								? `Ödeme yöntemi oluşturulurken bir hata oluştu`
								: `An error occurred while creating payment method: ${methodError.message}`
							: fromHomePage
								? 'Ödeme yöntemi oluşturulurken bilinmeyen bir hata oluştu'
								: 'An unknown error occurred while creating payment method'
					);
					resetRecaptcha();
					return;
				}

				// Step 3: Confirm the PaymentIntent (authorize only)
				const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
					payment_method: paymentMethod.id,
				});

				if (error || paymentIntent?.status !== 'requires_capture') {
					resetForm(true);
					setErrorMessage(
						error?.message
							? fromHomePage
								? `Ödeme onayı başarısız: ${error.message}`
								: `Payment confirmation failed: ${error.message}`
							: fromHomePage
								? 'Ödeme onayı başarısız oldu.'
								: 'Payment confirmation failed.'
					);
					resetRecaptcha();
					return;
				}

				// Step 4: Register the course
				try {
					const userCourseId = await courseRegistration(resolvedUserId, resolvedOrgId);

					// Step 5: Capture the authorized payment
					try {
						await axiosInstance.patch(`${base_url}/payments/capture/${paymentIntentId}`, {
							userId: resolvedUserId,
							orgId: resolvedOrgId,
							courseId: course?._id,
							firstName: resolvedFirstName,
							lastName: resolvedLastName,
							email: email || user?.email,
							paymentType: 'course',
						});

						// Update hasRegisteredCourse using public endpoint (no authentication required)
						if (!user?.hasRegisteredCourse && !isCourseFree && !course?.courseManagement.isExternal) {
							await axiosInstance.post(`${base_url}/users/public-update-registration-status`, {
								userId: resolvedUserId,
								email: email || user?.email,
								courseId: course?._id,
								paymentIntentId: paymentIntentId,
							});

							setUser((prevUser) => {
								if (prevUser) {
									return { ...prevUser, hasRegisteredCourse: true };
								}
								return prevUser;
							});
						}
					} catch (captureError) {
						resetForm(true);
						console.error(`❌ Payment capture failed for paymentIntentId: ${paymentIntentId}, userId: ${resolvedUserId}`, captureError);

						try {
							// Use public rollback endpoint that doesn't require authentication
							await axiosInstance.post(`${base_url}/userCourses/public-rollback`, {
								userId: resolvedUserId,
								courseId: course?._id,
								email: email || user?.email,
								paymentIntentId: paymentIntentId,
							});

							if (isPromoCodeApplied && promoCodeId) {
								try {
									const rolledBackUsers = usersUsedPromoCode?.filter((id) => id !== resolvedUserId) || [];
									await axiosInstance.patch(`${base_url}/promocodes/${promoCodeId}`, {
										usersUsed: rolledBackUsers,
									});
									console.info(`🔁 Promo code rollback successful for userId: ${resolvedUserId}`);
								} catch (promoRollbackErr) {
									console.error(`❌ Failed to roll back promo code for userId: ${resolvedUserId}`, promoRollbackErr);
								}
							}

							// Invalidate React Query cache to refresh context data
							await queryClient.invalidateQueries(['userCourseData']);
							await queryClient.invalidateQueries(['userLessonsForCourse', course?._id, resolvedUserId]);
						} catch (cleanupErr) {
							resetForm(true);
							console.error(`❌ Rollback failed for userId: ${resolvedUserId}, courseId: ${course?._id}`, cleanupErr);
						}

						resetForm(true);
						setErrorMessage(
							fromHomePage
								? 'Ödeme işlemi tamamlanamadı. Lütfen tekrar deneyin veya destek ile iletişime geçin.'
								: 'Payment processing failed. Please try again or contact support.'
						);
						return;
					}

					// Step 6: Update promo code (if applied)
					const updatedUserId = fromHomePage && resolvedUserId ? resolvedUserId : user?._id!;
					const updatedUsersUsedCode = [...usersUsedPromoCode, updatedUserId];

					setUsersUsedPromoCode(updatedUsersUsedCode);
					usersUsedCode = [...updatedUsersUsedCode];

					if (isPromoCodeApplied) {
						await axiosInstance.patch(`${base_url}/promocodes/${promoCodeId}`, {
							usersUsed: usersUsedCode,
						});
					}

					// ✅ Final UI actions (ONLY if everything succeeded)
					setIsPaymentDialogOpen(false);
					resetForm();
					setIsProcessing(false);

					if (setIsEnrolledStatus) setIsEnrolledStatus(true);

					setDisplayEnrollmentMsg(true); // ✅ success message after capture + reg

					if (!fromHomePage) {
						navigate(`/course/${course?._id}/userCourseId/${userCourseId}?isEnrolled=true`);
					}
				} catch (regErr) {
					resetForm(true);
					setErrorMessage(
						fromHomePage ? 'Kurs kaydı başarısız oldu. Ücretlendirilmediniz.' : 'Course registration failed. You have not been charged.'
					);
					resetRecaptcha();
					return;
				}
			} catch (err) {
				console.log(err);
				resetForm(true);
				setErrorMessage(fromHomePage ? 'Ödeme işlenirken bir hata oluştu.' : 'An error occurred while processing the payment.');
				resetRecaptcha();
			}
		} catch (error) {
			console.error(error);
			resetForm(true);
			setErrorMessage(fromHomePage ? 'Ödeme işlenirken bir hata oluştu.' : 'An error occurred while processing the payment.');
			resetRecaptcha();
		} finally {
			setIsProcessing(false);
		}
	};

	const handleApplyPromoCode = async () => {
		if (!course) return;
		if (!email && fromHomePage) {
			setErrorMessage(fromHomePage ? 'Lütfen e-posta adresinizi giriniz.' : 'Please enter your email address.');
			resetRecaptcha();
			return;
		}

		if (!promoCode) {
			setErrorMessage(fromHomePage ? 'Promosyon kodu girin' : 'Enter a promo code');
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
						fromHomePage
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
				setErrorMessage(fromHomePage ? `Geçersiz promosyon kodu` : error.response.data.message);
			} else {
				// Fallback in case it's not an AxiosError or the message isn't available
				setErrorMessage(fromHomePage ? 'Geçersiz promosyon kodu' : 'Invalid promo code');
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
				fromHomePage ? 'Doğrulama e-postası gönderildi. Lütfen gelen kutunuzu kontrol edin.' : 'Verification email sent. Please check your inbox.'
			);
			resetRecaptcha();
		} catch (error) {
			if (axios.isAxiosError(error)) {
				if (error.response?.data?.isEmailVerified) {
					setErrorMessage(fromHomePage ? 'E-posta adresiniz zaten doğrulanmış.' : 'Your email is already verified.');
				} else {
					setErrorMessage(
						fromHomePage
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
		setEmail('');
		setPromoCode('');
		if (!course) return;
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

	return (
		<CustomDialog
			openModal={isPaymentDialogOpen}
			closeModal={() => {
				if (!isProcessing) {
					resetForm();
					setIsPaymentDialogOpen(false);
				}
			}}
			title={fromHomePage && !isCourseFree ? 'Ödeme Yap' : isCourseFree ? 'Kayıt Ol' : 'Make Payment'}
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
					{fromHomePage && (
						<Box>
							<CustomTextField
								label={fromHomePage ? 'E-posta Adresi' : 'Email Address'}
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

					<Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
						<CustomTextField
							label={fromHomePage ? 'Promosyon Kodu' : 'Promo Code'}
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
							{fromHomePage ? 'Uygula' : 'Apply'}
						</CustomSubmitButton>
					</Box>

					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3, mt: 2 }}>
						<Typography
							variant='h6'
							sx={
								fromHomePage
									? {
											fontFamily: 'Varela Round',
											fontWeight: 500,
											mb: '-1rem',
											fontSize: isMobileSize ? '0.75rem' : '0.9rem',
											color: isCourseFree ? '#aab7c4' : '#2C3E50',
										}
									: { fontSize: '0.9rem', mb: '-1rem' }
							}>
							{fromHomePage ? 'Kart Numarası*' : 'Card Number*'}
						</Typography>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
							<Box
								sx={
									fromHomePage
										? {
												border:
													isSubmitted &&
													!isCourseFree &&
													isUserAccountExist &&
													!isAlreadyEnrolled &&
													!cardNumberComplete &&
													isEmailVerified &&
													recaptchaToken
														? '1px solid red'
														: '1px solid #ccc',
												padding: '0.6rem',
												borderRadius: '8px',
												backgroundColor: '#fff',
												width: '100%',
												fontFamily: 'Varela Round',
											}
										: {
												border:
													isSubmitted &&
													!isCourseFree &&
													isUserAccountExist &&
													!isAlreadyEnrolled &&
													!cardNumberComplete &&
													isEmailVerified &&
													recaptchaToken
														? '1px solid red'
														: '1px solid #ccc',
												padding: '0.6rem',
												borderRadius: '4px',
												backgroundColor: '#fff',
												width: '100%',
											}
								}>
								<CardNumberElement
									options={{
										disabled: isCourseFree,
										style: {
											base: {
												'fontSize': isMobileSize ? '11px' : '14px',
												'color': '#223354',
												'fontFamily': 'Arial, sans-serif',
												'::placeholder': { color: '#aab7c4' },
											},
											invalid: { color: '#9e2146' },
										},
									}}
									onChange={(event) => {
										setCardNumberComplete(event.complete);
										setCardBrand(event.brand || 'unknown');
										setErrorMessage('');
									}}
								/>
							</Box>
							<Box>
								<img src={getCardIcon(cardBrand)} alt={`${cardBrand} icon`} style={{ marginLeft: '10px', width: '40px' }} />
							</Box>
						</Box>
					</Box>

					<Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
						<Box sx={{ width: '50%' }}>
							<Typography
								variant='h6'
								sx={
									fromHomePage
										? {
												fontFamily: 'Varela Round',
												fontWeight: 500,
												mb: 0.5,
												fontSize: isMobileSize ? '0.75rem' : '0.9rem',
												color: isCourseFree ? '#aab7c4' : '#2C3E50',
											}
										: { fontSize: '0.9rem', mb: 0.5 }
								}>
								{fromHomePage ? 'Son Kullanma Tarihi*' : 'Expiry Date*'}
							</Typography>
							<Box
								sx={
									fromHomePage
										? {
												border:
													isSubmitted &&
													!cardExpiryComplete &&
													!isCourseFree &&
													isUserAccountExist &&
													!isAlreadyEnrolled &&
													isEmailVerified &&
													recaptchaToken
														? '1px solid red'
														: '1px solid #ccc',
												padding: '0.6rem',
												borderRadius: '8px',
												backgroundColor: '#fff',
												fontFamily: 'Varela Round',
											}
										: {
												border:
													isSubmitted &&
													!cardExpiryComplete &&
													!isCourseFree &&
													isUserAccountExist &&
													!isAlreadyEnrolled &&
													isEmailVerified &&
													recaptchaToken
														? '1px solid red'
														: '1px solid #ccc',
												padding: '0.6rem',
												borderRadius: '4px',
												backgroundColor: '#fff',
											}
								}>
								<CardExpiryElement
									options={{
										disabled: isCourseFree,
										style: {
											base: {
												'fontSize': isMobileSize ? '11px' : '14px',
												'color': '#223354',
												'fontFamily': 'Arial, sans-serif',
												'::placeholder': { color: '#aab7c4' },
											},
											invalid: { color: '#9e2146' },
										},
									}}
									onChange={(event) => {
										setCardExpiryComplete(event.complete);
										setErrorMessage('');
									}}
								/>
							</Box>
						</Box>
						<Box sx={{ width: '50%' }}>
							<Typography
								variant='h6'
								sx={
									fromHomePage
										? {
												fontFamily: 'Varela Round',
												color: isCourseFree ? '#aab7c4' : '#2C3E50',
												fontWeight: 500,
												mb: 0.5,
												fontSize: isMobileSize ? '0.75rem' : '0.9rem',
											}
										: { fontSize: '0.9rem', mb: 0.5 }
								}>
								CVC*
							</Typography>
							<Box
								sx={
									fromHomePage
										? {
												border:
													isSubmitted &&
													!cardCvcComplete &&
													!isCourseFree &&
													isUserAccountExist &&
													!isAlreadyEnrolled &&
													isEmailVerified &&
													recaptchaToken
														? '1px solid red'
														: '1px solid #ccc',
												padding: '0.6rem',
												borderRadius: '8px',
												backgroundColor: '#fff',
												fontFamily: 'Varela Round',
											}
										: {
												border:
													isSubmitted &&
													!cardCvcComplete &&
													!isCourseFree &&
													isUserAccountExist &&
													!isAlreadyEnrolled &&
													isEmailVerified &&
													recaptchaToken
														? '1px solid red'
														: '1px solid #ccc',
												padding: '0.6rem',
												borderRadius: '4px',
												backgroundColor: '#fff',
											}
								}>
								<CardCvcElement
									options={{
										disabled: isCourseFree,
										style: {
											base: {
												'fontSize': isMobileSize ? '11px' : '14px',
												'color': '#223354',
												'fontFamily': 'Arial, sans-serif',
												'::placeholder': { color: '#aab7c4' },
											},
											invalid: { color: '#9e2146' },
										},
									}}
									onChange={(event) => {
										setCardCvcComplete(event.complete);
										setErrorMessage('');
									}}
								/>
							</Box>
						</Box>
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
							{fromHomePage ? 'Toplam Tutar: ' : 'Total Amount: '}
							{course && setCurrencySymbol(getPriceForCountry(course, resolvedCountryCode).currency)}
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
								{fromHomePage ? 'Promosyon Kodu Uygulandı' : 'Promo Code is applied'}
							</Typography>
						)}
					</Box>

					<Box
						sx={{
							display: 'flex',
							flexDirection: isSmallScreen ? 'column' : 'row',
							alignItems: 'center',
							textAlign: 'left',
							width: '100%',
							mt: isSmallScreen ? '1rem' : '1.5rem',
							mb: '1rem',
						}}>
						<Box
							sx={{
								display: 'flex',
								flexDirection: isSmallScreen ? 'row' : 'column',
								alignItems: isSmallScreen ? 'center' : 'flex-start',
								justifyContent: isSmallScreen ? 'flex-start' : 'space-between',
								width: '100%',
								height: '5rem',
								flex: 2,
								py: '0.5rem',
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
										sx={{
											'display': 'flex',
											'alignItems': 'center',
											'& .MuiSvgIcon-root': {
												fontSize: isMobileSize ? '0.9rem' : '1.15rem',
											},
										}}
									/>
								}
								label={fromHomePage ? 'Kabul ediyorum' : 'I agree to the Terms & Conditions'}
								sx={{
									'& .MuiFormControlLabel-label': {
										fontSize: isMobileSize ? '0.65rem' : '0.8rem',
										fontFamily: fromHomePage ? DIALOG_FONT : theme.fontFamily?.main,
									},
								}}
							/>
							<Typography
								sx={{
									fontSize: isSmallScreen ? '0.5rem' : '0.75rem',
									cursor: 'pointer',
									fontFamily: fromHomePage ? DIALOG_FONT : theme.fontFamily?.main,
								}}
								onClick={() => setTermsConditionsModalOpen(true)}>
								(<span style={{ textDecoration: 'underline' }}>{fromHomePage ? 'Şartlar ve Koşullar' : 'Read T&C'} </span>)
							</Typography>
						</Box>
						<Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
							<ReCAPTCHA
								ref={recaptchaRef}
								sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
								onChange={handleRecaptchaChange}
								onExpired={() => setRecaptchaToken(null)}
								key={isPaymentDialogOpen ? 'active' : 'inactive'}
							/>
						</Box>
					</Box>
				</Box>

				<TermsConditions
					termsConditionsModalOpen={termsConditionsModalOpen}
					setTermsConditionsModalOpen={setTermsConditionsModalOpen}
					fromHomePage={fromHomePage}
				/>

				{errorMessage && (
					<CustomErrorMessage
						sx={{
							width: '100%',
							padding: { xs: '1.5rem 0.75rem 0 0.75rem', sm: '1.5rem 1rem 0 1rem', md: '1.5rem 2rem 0 2rem', lg: '1.5rem 2rem 0 2rem' },
							fontSize: isMobileSize ? '0.65rem' : '0.75rem',
							fontFamily: fromHomePage ? DIALOG_FONT : theme.fontFamily?.main,
						}}>
						<span style={{ whiteSpace: 'pre-line' }}>
							{errorMessage}
							{!isUserAccountExist && fromHomePage && (
								<span
									onClick={() => window.open('/auth', '_blank')}
									style={{
										color: theme.textColor?.greenSecondary.main,
										textDecoration: 'underline',
										cursor: 'pointer',
										fontSize: isMobileSize ? '0.65rem' : '0.75rem',
										fontFamily: fromHomePage ? DIALOG_FONT : theme.fontFamily?.main,
									}}>
									{fromHomePage ? 'Buraya tıklayın' : 'Click here'}
								</span>
							)}
							{errorMessage?.includes('e-posta adresinizi doğrulayın') && !verificationSent && (
								<Box sx={{ mt: 1 }}>
									<Button
										onClick={handleResendVerification}
										disabled={isResendingVerification}
										sx={{
											'color': theme.textColor?.greenSecondary.main,
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
											? fromHomePage
												? 'Gönderiliyor...'
												: 'Sending...'
											: fromHomePage
												? 'Doğrulama e-postasını tekrar gönder'
												: 'Resend verification email'}
									</Button>
								</Box>
							)}
							{verificationSent && (
								<Typography color='success.main' sx={{ mt: 1 }}>
									{fromHomePage
										? 'Doğrulama e-postası gönderildi. Lütfen gelen kutunuzu kontrol edin.'
										: 'Verification email sent. Please check your inbox.'}
								</Typography>
							)}
						</span>
					</CustomErrorMessage>
				)}

				<CustomDialogActions
					onCancel={() => {
						if (!isProcessing) {
							resetForm();
							setIsPaymentDialogOpen(false);
						}
					}}
					cancelBtnText={fromHomePage ? 'Kapat' : 'Cancel'}
					cancelBtnSx={{
						fontFamily: fromHomePage ? DIALOG_FONT : '',
					}}
					submitBtnText={
						isProcessing
							? fromHomePage
								? 'İşleniyor'
								: 'Processing'
							: fromHomePage && !isCourseFree
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
					disableBtn={isProcessing}
					disableCancelBtn={isProcessing}
					actionSx={{ mr: '1rem', mb: '0.5rem' }}
				/>
			</form>
		</CustomDialog>
	);
};

export default PaymentDialog;
