import { Box, Checkbox, FormControlLabel, Typography } from '@mui/material';
import CustomDialog from '../dialog/CustomDialog';
import CustomTextField from '../../forms/customFields/CustomTextField';
import TermsConditions from './TermsConditions';
import CustomDialogActions from '../dialog/CustomDialogActions';
import CustomSubmitButton from '../../forms/customButtons/CustomSubmitButton';
import { useContext, useEffect, useState } from 'react';
import { CardCvcElement, CardExpiryElement, CardNumberElement, useElements, useStripe } from '@stripe/react-stripe-js';
import axios from 'axios';
import visaIcon from '../../../assets/visa.png';
import masterCardIcon from '../../../assets/mastercard.png';
import defaultCardIcon from '../../../assets/credit-card.png';
import { SingleCourse } from '../../../interfaces/course';
import {  useNavigate, useParams } from 'react-router-dom';
import { OrganisationContext } from '../../../contexts/OrganisationContextProvider';
import CustomErrorMessage from '../../forms/customFields/CustomErrorMessage';
import theme from '../../../themes';
import { setCurrencySymbol } from '../../../utils/setCurrencySymbol';
import { UserAuthContext } from '../../../contexts/UserAuthContextProvider';
import { getPriceForCountry } from '../../../utils/getPriceForCountry';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import { useGeoLocation } from '../../../hooks/useGeoLocation';

interface PaymentDialogProps {
	course: SingleCourse;
	isPaymentDialogOpen: boolean;
	setIsPaymentDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
	courseRegistration: (resolvedUserId: string, resolvedOrgId: string) => Promise<string>;
	fromHomePage?: boolean;
	setDisplayEnrollmentMsg: React.Dispatch<React.SetStateAction<boolean>>
	setIsEnrolledStatus?: React.Dispatch<React.SetStateAction<boolean>> | undefined
}

const PaymentDialog = ({ course, isPaymentDialogOpen, setIsPaymentDialogOpen, courseRegistration, fromHomePage,setDisplayEnrollmentMsg,setIsEnrolledStatus }: PaymentDialogProps) => {
	const { userId } = useParams();
	const { orgId } = useContext(OrganisationContext);
	const { user } = useContext(UserAuthContext);


	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { isRotatedMedium, isSmallScreen } = useContext(MediaQueryContext);

	const location = useGeoLocation();
	const navigate = useNavigate();

	let resolvedCountryCode = user?.countryCode || location?.countryCode || 'US';

	useEffect(() => {
		const price = +getPriceForCountry(course, resolvedCountryCode).amount;
		setDiscountedAmount(price);
	}, [user, location, course]);

	const isMobileSize: boolean = isSmallScreen || isRotatedMedium;

	const [isProcessing, setIsProcessing] = useState<boolean>(false);
	const [termsConditionsModalOpen, setTermsConditionsModalOpen] = useState<boolean>(false);
	const [agreed, setAgreed] = useState<boolean>(false);
	const [cardBrand, setCardBrand] = useState<string>('unknown');
	const [errorMessage, setErrorMessage] = useState<string>('');

	const [email, setEmail] = useState<string>('');
	const [isUserAccountExist, setIsUserAccountExist] = useState<boolean>(false);
	const [promoCode, setPromoCode] = useState<string>('');
	const [discountedAmount, setDiscountedAmount] = useState<number>(+getPriceForCountry(course, resolvedCountryCode).amount);

	const [isPromoCodeApplied, setIsPromoCodeApplied] = useState<boolean>(false);
	const [usersUsedPromoCode, setUsersUsedPromoCode] = useState<string[]>([]);

	const [promoCodeId, setPromoCodeId] = useState<string>('');

	const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
	const [cardNumberComplete, setCardNumberComplete] = useState<boolean>(false);
	const [cardExpiryComplete, setCardExpiryComplete] = useState<boolean>(false);
	const [cardCvcComplete, setCardCvcComplete] = useState<boolean>(false);

	const stripe = useStripe();
	const elements = useElements();

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

	let resolvedUserId = userId || '';
	let resolvedOrgId = orgId;

	let resolvedFirstName = user?.firstName || '';
	let resolvedLastName = user?.lastName || '';

	const handlePayment = async () => {
		setIsProcessing(true);
		setIsSubmitted(true);
	
		if (fromHomePage) {
			try {
				const userExistsResponse = await axios.post(`${base_url}/users/check-user-exists`, { email, courseId: course._id });
	
				setIsUserAccountExist(userExistsResponse.data.exists);
	
				if (!userExistsResponse.data.exists) {
					setErrorMessage(`This email address isn't linked to any account.\nCreate a free account to join the course! - `);
					setIsProcessing(false);
					return;
				} else if (userExistsResponse.data.isEnrolledInCourse) {
					setErrorMessage(`You are already enrolled in this course!`);
					setIsProcessing(false);
					return;
				}
	
				// Override IDs and user info
				resolvedUserId = userExistsResponse.data.userId;
				resolvedOrgId = userExistsResponse.data.orgId;
				resolvedCountryCode = userExistsResponse.data.countryCode;
				resolvedFirstName = userExistsResponse.data.firstName;
				resolvedLastName = userExistsResponse.data.lastName;
			} catch (error) {
				console.log(error);
			}
		}
	
		let usersUsedCode = [...usersUsedPromoCode];
	
		if (!stripe || !elements) {
			setErrorMessage('Stripe has not loaded properly.');
			setIsProcessing(false);
			return;
		}
	
		const cardNumberElement = elements.getElement(CardNumberElement);
		const cardExpiryElement = elements.getElement(CardExpiryElement);
		const cardCvcElement = elements.getElement(CardCvcElement);
	
		if (!cardNumberElement || !cardExpiryElement || !cardCvcElement) {
			setErrorMessage('Please fill in all card details.');
			setIsProcessing(false);
			return;
		}
	
		try {
			// Step 1: Create PaymentIntent (manual capture)
			const response = await axios.post(`${base_url}/payments`, {
				amount: discountedAmount,
				currency: getPriceForCountry(course, resolvedCountryCode!).currency,
				orgId: resolvedOrgId,
				userId: resolvedUserId,
				courseId: course._id,
				email,
			});
	
			const { clientSecret, paymentIntentId } = response.data;
	
			// Step 2: Create Payment Method
			const { error: methodError, paymentMethod } = await stripe.createPaymentMethod({
				type: 'card',
				card: cardNumberElement,
				billing_details: {
					name: `${resolvedFirstName} ${resolvedLastName}`,
				},
			});
	
			if (methodError) {
				resetForm(true);
				setErrorMessage(methodError.message ?? 'An unknown error occurred while creating payment method');
				return;
			}
	
			// Step 3: Confirm the PaymentIntent (authorize only)
			const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
				payment_method: paymentMethod.id,
			});
	
			if (error || paymentIntent?.status !== 'requires_capture') {
				resetForm(true);
				setErrorMessage(error?.message ?? 'Payment confirmation failed.');
				return;
			}
	
			// Step 4: Register the course
			try {
				const userCourseId = await courseRegistration(resolvedUserId, resolvedOrgId);
	
				// Step 5: Capture the authorized payment
				try {
					await axios.patch(`${base_url}/payments/capture/${paymentIntentId}`, {
						userId: resolvedUserId,
						orgId: resolvedOrgId,
						courseId: course._id,
						firstName: resolvedFirstName,
						lastName: resolvedLastName,
					});
				} catch (captureError) {
					resetForm(true);
					console.error(`❌ Payment capture failed for paymentIntentId: ${paymentIntentId}, userId: ${resolvedUserId}`, captureError);
	
					try {
						await axios.delete(`${base_url}/userCourses/remove-by-user-course`, {
							data: {
								userId: resolvedUserId,
								courseId: course._id,
							},
						});
	
						if (isPromoCodeApplied && promoCodeId) {
							try {
								const rolledBackUsers = usersUsedPromoCode.filter((id) => id !== resolvedUserId);
								await axios.patch(`${base_url}/promocodes/${promoCodeId}`, {
									usersUsed: rolledBackUsers,
								});
								console.info(`🔁 Promo code rollback successful for userId: ${resolvedUserId}`);
							} catch (promoRollbackErr) {
								console.error(`❌ Failed to roll back promo code for userId: ${resolvedUserId}`, promoRollbackErr);
							}
						}
	
						// 🧹 LocalStorage cleanup
						const updatedCourses = JSON.parse(localStorage.getItem('userCourseData') || '[]').filter(
							(item: any) => item.courseId !== course._id
						);
						localStorage.setItem('userCourseData', JSON.stringify(updatedCourses));
	
						const updatedLessons = JSON.parse(localStorage.getItem('userLessonData') || '[]').filter(
							(item: any) => item.courseId !== course._id
						);
						localStorage.setItem('userLessonData', JSON.stringify(updatedLessons));
					} catch (cleanupErr) {
						resetForm(true);
						console.error(`❌ Rollback failed for userId: ${resolvedUserId}, courseId: ${course._id}`, cleanupErr);
					}
	
					resetForm(true);
					setErrorMessage('Payment failed after registration. You have not been charged, and your access was rolled back.');
					return;
				}
	
				// Step 6: Update promo code (if applied)
				const updatedUserId = fromHomePage && resolvedUserId ? resolvedUserId : user?._id!;
				const updatedUsersUsedCode = [...usersUsedPromoCode, updatedUserId];
	
				setUsersUsedPromoCode(updatedUsersUsedCode);
				usersUsedCode = [...updatedUsersUsedCode];
	
				if (isPromoCodeApplied) {
					await axios.patch(`${base_url}/promocodes/${promoCodeId}`, {
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
					navigate(`/course/${course._id}/user/${resolvedUserId}/userCourseId/${userCourseId}?isEnrolled=true`);
				}
			} catch (regErr) {
				resetForm(true);
				setErrorMessage('Course registration failed. You have not been charged.');
				return;
			}
		} catch (err) {
			console.log(err);
			resetForm(true);
			setErrorMessage('An error occurred while processing the payment.');
		}
	};
	
	

	const handleApplyPromoCode = async () => {
		try {
			if (fromHomePage) {
				const userExistsResponse = await axios.post(`${base_url}/users/check-user-exists`, { email });

				setIsUserAccountExist(userExistsResponse.data.exists);

				resolvedUserId = userExistsResponse?.data?.userId;

				if (!userExistsResponse.data.exists) {
					setErrorMessage(`This email address isn't linked to any account. Create a free account - `);
					setIsProcessing(false);
					return;
				}
			}

			if (!promoCode) {
				setErrorMessage('Enter a promo code');
				return;
			}

			const response = await axios.post(`${base_url}/promocodes/apply`, {
				code: promoCode.trim(),
				courseId: course._id,
				userId: resolvedUserId,
				orgId,
				email,
			});
			const { discountAmount, discountType, usersUsed, _id } = response.data;

			setPromoCodeId(_id);

			// Calculate the discounted amount based on the type
			let newTotal: number = +getPriceForCountry(course, resolvedCountryCode).amount;
			if (discountType === 'percentage') {
				newTotal -= (+getPriceForCountry(course, resolvedCountryCode).amount * discountAmount) / 100;
			} else if (discountType === 'fixed') {
				newTotal -= discountAmount;
			}

			setDiscountedAmount(Math.max(newTotal, 0)); // Ensure amount doesn't go negative
			setErrorMessage(''); // Clear any previous error messages
			setIsPromoCodeApplied(true);
			setUsersUsedPromoCode(usersUsed);
		} catch (error) {
			if (axios.isAxiosError(error) && error.response?.data?.message) {
				setErrorMessage(error.response.data.message);
			} else {
				// Fallback in case it's not an AxiosError or the message isn't available
				setErrorMessage('Invalid promo code');
			}
			setDiscountedAmount(+getPriceForCountry(course, resolvedCountryCode).amount); // Reset to original price
		}
	};

const resetForm = (preserveError = false) => {
	setEmail('');
	setPromoCode('');
	setDiscountedAmount(+getPriceForCountry(course, resolvedCountryCode).amount);
	setIsPromoCodeApplied(false);
	setAgreed(false);

	if (!preserveError) {
		setErrorMessage('');
	}


	setIsSubmitted(false);
	setIsProcessing(false);
};

	return (
		<CustomDialog
			openModal={isPaymentDialogOpen}
			closeModal={() => {
				resetForm();
				setIsPaymentDialogOpen(false);
			}}
			title='Make Payment'
			maxWidth='sm'>
			<form
				onSubmit={async (e) => {
					e.preventDefault();
					await handlePayment();
				}}>
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						gap: '1rem',
						padding: '0.5rem 0.75rem',
					}}>
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							justifyContent: 'space-between',
							alignItems: 'center',
							width: '100%',
							padding: isSmallScreen || isRotatedMedium ? '0rem 0.35rem' : '0 0.75rem 1rem 0.75rem',
							margin: '0 0.75rem -1.5rem 0.75rem',
						}}>
						<Box sx={{ width: '100%', textAlign: 'left' }}>
							<Typography sx={{ fontSize: isMobileSize ? '0.7rem' : '0.85rem' }}>Card Number*</Typography>
						</Box>
						<Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
							<Box
								sx={{
									border: isSubmitted && !cardNumberComplete ? '1px solid red' : '1px solid #ccc',
									padding: '0.5rem',
									borderRadius: '0.35rem',
									backgroundColor: '#fff',
									width: '100%',
								}}>
								<CardNumberElement
									options={{
										style: {
											base: {
												fontSize: isMobileSize ? '11px' : '14px',
												color: '#424770',
												'::placeholder': {
													color: '#aab7c4',
												},
											},
											invalid: {
												color: '#9e2146',
											},
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

					<Box
						sx={{
							display: 'flex',
							width: '100%',
							padding: isSmallScreen || isRotatedMedium ? '0rem 0.35rem' : '0 0.75rem 2rem 0.75rem',
							mb: isSmallScreen || isRotatedMedium ? '-0.5rem' : '-2rem',
						}}>
						<Box
							sx={{
								width: '100%',
								mr: '0.75rem',
							}}>
							<Typography sx={{ fontSize: isMobileSize ? '0.7rem' : '0.85rem', paddingBottom: '0.25rem' }}>Expiry Date*</Typography>
							<Box
								sx={{
									border: isSubmitted && !cardExpiryComplete ? '1px solid red' : '1px solid #ccc',
									padding: '0.5rem',
									borderRadius: '0.35rem',
									backgroundColor: '#fff',
								}}>
								<Box>
									<CardExpiryElement
										options={{
											style: {
												base: {
													fontSize: isMobileSize ? '11px' : '14px',
													color: '#424770',
													'::placeholder': {
														color: '#aab7c4',
													},
												},
												invalid: {
													color: '#9e2146',
												},
											},
										}}
										onChange={(event) => {
											setCardExpiryComplete(event.complete);
											setErrorMessage('');
										}}
									/>
								</Box>
							</Box>
						</Box>

						{/* CVC Field */}
						<Box
							sx={{
								width: '100%',
							}}>
							<Typography sx={{ fontSize: isMobileSize ? '0.7rem' : '0.85rem', paddingBottom: '0.25rem' }}>CVC*</Typography>
							<Box
								sx={{
									border: isSubmitted && !cardCvcComplete ? '1px solid red' : '1px solid #ccc',
									padding: '0.5rem',
									borderRadius: '0.35rem',
									backgroundColor: '#fff',
								}}>
								<CardCvcElement
									options={{
										style: {
											base: {
												fontSize: isMobileSize ? '11px' : '14px',

												color: '#424770',
												'::placeholder': {
													color: '#aab7c4',
												},
											},
											invalid: {
												color: '#9e2146',
											},
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
					{fromHomePage && (
						<Box
							sx={{
								display: 'flex',
								justifyContent: 'space-between',
								width: '100%',
								padding: isSmallScreen || isRotatedMedium ? '0 0.35rem' : '0 0.75rem',
								margin: '1.5rem 0 -1rem 0',
							}}>
							<CustomTextField
								label='Email Address'
								size='small'
								value={email}
								type='email'
								onChange={(e) => {
									setEmail(e.target.value);
									setIsPromoCodeApplied(false);
									setDiscountedAmount(+getPriceForCountry(course, resolvedCountryCode).amount);
									setUsersUsedPromoCode((prevData) => prevData.filter((id) => id !== userId));
									setErrorMessage('');
								}}
							/>
						</Box>
					)}

					<Box
						sx={{
							display: 'flex',
							justifyContent: 'space-between',
							width: '100%',
							padding: isSmallScreen || isRotatedMedium ? '0 0.35rem' : '0 0.75rem',
							mb: '-1rem',
						}}>
						<CustomTextField
							label='Promo Code'
							size='small'
							required={false}
							sx={{ mr: '0.75rem' }}
							value={promoCode}
							onChange={(e) => {
								setPromoCode(e.target.value);
								setErrorMessage('');
								setIsPromoCodeApplied(false);
								setDiscountedAmount(+getPriceForCountry(course, resolvedCountryCode).amount);
								setUsersUsedPromoCode((prevData) => prevData.filter((id) => id !== userId));
							}}
						/>
						<CustomSubmitButton
							size='small'
							type='button'
							sx={{ height: isMobileSize ? '1.85rem' : '2.15rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}
							onClick={handleApplyPromoCode}>
							Apply
						</CustomSubmitButton>
					</Box>
					{fromHomePage && (
						<Box sx={{ display: 'flex', justifyContent: 'flex-start', width: '100%', margin: '0 0 1rem 1.5rem' }}>
							<Typography variant='body2'>
								If you do not have account, please click{' '}
								<span
									onClick={() => window.open('/auth', '_blank')}
									style={{ color: theme.textColor?.greenSecondary.main, textDecoration: 'underline', cursor: 'pointer' }}>
									here
								</span>{' '}
								to create free account
							</Typography>
						</Box>
					)}
					<Box sx={{ display: 'flex', alignItems: 'center', width: '100%', padding: isSmallScreen || isRotatedMedium ? '0 0.35rem' : '0 0.75rem' }}>
						<Typography
							variant={isMobileSize ? 'body2' : 'h6'}
							sx={{
								boxShadow: '0.1rem 0.1rem 0.5rem 0.1rem rgba(0,0,0,0.3)',
								borderRadius: '0.35rem',
								padding: isMobileSize ? '0.5rem' : '0.75rem',
							}}>
							Final Price: {setCurrencySymbol(getPriceForCountry(course, resolvedCountryCode).currency)}
							{discountedAmount}
						</Typography>
						{isPromoCodeApplied && (
							<Typography variant='body2' sx={{ color: theme.textColor?.greenPrimary.main, ml: isMobileSize ? '1rem' : '2rem' }}>
								Promo Code is applied
							</Typography>
						)}
					</Box>
					<Box
						sx={{
							display: 'flex',
							alignItems: 'center',
							textAlign: 'left',
							width: '100%',
							padding: isSmallScreen || isRotatedMedium ? '0rem 0.35rem' : '0 0.75rem',
						}}>
						<FormControlLabel
							required
							control={
								<Checkbox
									checked={agreed}
									onChange={(e) => {
										setAgreed(e.target.checked);
										setErrorMessage('');
									}}
									sx={{
										display: 'flex',
										alignItems: 'center',
										'& .MuiSvgIcon-root': {
											fontSize: isMobileSize ? '0.8rem' : '1.25rem', // Adjust the checkbox icon size
										},
									}}
								/>
							}
							label='I agree to the Terms & Conditions'
							sx={{
								mt: isSmallScreen ? '0rem' : '0.5rem',
								'& .MuiFormControlLabel-label': {
									fontSize: isMobileSize ? '0.6rem' : '0.8rem', // Adjust the label font size
								},
							}}
						/>
						<Typography
							sx={{ fontSize: isSmallScreen ? '0.5rem' : '0.75rem', mb: '-0.5rem', cursor: 'pointer' }}
							onClick={() => setTermsConditionsModalOpen(true)}>
							(<span style={{ textDecoration: 'underline' }}>Read T&C</span>)
						</Typography>
					</Box>
				</Box>

				<TermsConditions termsConditionsModalOpen={termsConditionsModalOpen} setTermsConditionsModalOpen={setTermsConditionsModalOpen} />

				{errorMessage && (
					<CustomErrorMessage sx={{ width: '100%', padding: '0.75rem 1.25rem', fontSize: isMobileSize ? '0.65rem' : '0.75rem' }}>
					<span style={{whiteSpace: 'pre-line'}}>
					{errorMessage}{' '}
						{!isUserAccountExist && fromHomePage && (
							<span
								onClick={() => window.open('/auth', '_blank')}
								style={{
									color: theme.textColor?.greenSecondary.main,
									textDecoration: 'underline',
									cursor: 'pointer',
									fontSize: isMobileSize ? '0.65rem' : '0.75rem',
								}}>
								Click here
							</span>
						)}
					</span>
					</CustomErrorMessage>
				)}

				<CustomDialogActions
					onCancel={() => {
						resetForm();
						setIsPaymentDialogOpen(false);
					}}
					submitBtnText={isProcessing ? 'Processing' : 'Enroll'}
				/>
			</form>
		</CustomDialog>
	);
};

export default PaymentDialog;
