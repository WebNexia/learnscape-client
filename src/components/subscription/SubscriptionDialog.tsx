import React, { useState, useEffect, useContext, useRef } from 'react';
import { Box, Typography, FormControl, FormControlLabel, RadioGroup, Radio, Checkbox, Alert, Divider, Chip, Snackbar } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { CardCvcElement, CardExpiryElement, CardNumberElement, useElements, useStripe } from '@stripe/react-stripe-js';
import CustomDialog from '../layouts/dialog/CustomDialog';
import CustomTextField from '../forms/customFields/CustomTextField';
import CustomSubmitButton from '../forms/customButtons/CustomSubmitButton';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import CustomErrorMessage from '../forms/customFields/CustomErrorMessage';
import SubscriptionBenefits from './SubscriptionBenefits';
import { UserAuthContext } from '../../contexts/UserAuthContextProvider';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import { OrganisationContext } from '../../contexts/OrganisationContextProvider';
import { SubscriptionFormData, SubscriptionPrice, SubscriptionPlans, SubscriptionResponse, PromoCodeResponse } from '../../interfaces/subscription';
import theme from '../../themes';
import { setCurrencySymbol } from '../../utils/setCurrencySymbol';
import ReCAPTCHA from 'react-google-recaptcha';
import axiosInstance from '@utils/axiosInstance';

interface SubscriptionDialogProps {
	open: boolean;
	onClose: () => void;
	onSuccess?: (subscriptionId: string) => void;
}

const SubscriptionDialog: React.FC<SubscriptionDialogProps> = ({ open, onClose, onSuccess }) => {
	const { user } = useContext(UserAuthContext);
	const { orgId } = useContext(OrganisationContext);
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);

	// Local state for subscription data
	const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlans | null>(null);
	const [error, setError] = useState<string | null>(null);

	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const stripe = useStripe();
	const elements = useElements();
	const recaptchaRef = useRef<any>(null);

	const isMobileSize = isSmallScreen || isRotatedMedium;

	// Form state
	const [formData, setFormData] = useState<SubscriptionFormData>({
		subscriptionType: 'monthly',
		promoCode: '',
		email: user?.email || '',
		firstName: user?.firstName || '',
		lastName: user?.lastName || '',
		agreed: false,
	});

	// Payment state
	const [isProcessing, setIsProcessing] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [cardNumberComplete, setCardNumberComplete] = useState(false);
	const [cardExpiryComplete, setCardExpiryComplete] = useState(false);
	const [cardCvcComplete, setCardCvcComplete] = useState(false);
	const [cardBrand, setCardBrand] = useState<string>('unknown');

	// Promo code state
	const [isPromoCodeApplied, setIsPromoCodeApplied] = useState(false);
	const [discountedAmount, setDiscountedAmount] = useState<number>(0);
	const [promoCodeError, setPromoCodeError] = useState<string>('');

	// reCAPTCHA state
	const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

	// Snackbar state
	const [showSuccess, setShowSuccess] = useState<boolean>(false);

	// API functions
	const fetchSubscriptionPlans = async (): Promise<void> => {
		try {
			// Pass orgId as query parameter for organization-specific plans
			const response = await axiosInstance.get(`${base_url}/subscriptions/plans?orgId=${orgId}`);

			if (response.data.status === 200) {
				setSubscriptionPlans(response.data.data.plans);
			} else {
				throw new Error(response.data.message || 'Failed to fetch subscription plans');
			}
		} catch (err: any) {
			console.error('❌ Fetch Subscription Plans Error:', err);
		}
	};

	const createSubscription = async (
		formData: SubscriptionFormData & { currency?: string; paymentMethodId?: string }
	): Promise<SubscriptionResponse> => {
		try {
			// Get currency from subscription plans
			const currentPrice = getCurrentPrice();
			const currency = currentPrice?.currency || 'gbp';

			const response = await axiosInstance.post(`${base_url}/subscriptions`, {
				subscriptionType: formData.subscriptionType,
				email: formData.email,
				firstName: formData.firstName,
				lastName: formData.lastName,
				promoCode: formData.promoCode || undefined,
				orgId: orgId,
				userId: user?._id,
				currency: currency,
				paymentMethodId: formData.paymentMethodId,
				recaptchaToken: recaptchaToken,
			});

			if (response.data.status === 200 || response.data.status === 201) {
				return response.data;
			} else {
				throw new Error(response.data.error || 'Failed to create subscription');
			}
		} catch (err: any) {
			console.error('❌ Create Subscription Error:', err);
			const errorMessage = err.response?.data?.error || err.message || 'Failed to create subscription';
			throw new Error(errorMessage);
		}
	};

	const applyPromoCode = async (promoCode: string): Promise<PromoCodeResponse> => {
		try {
			const response = await axiosInstance.post(`${base_url}/promocodes/apply`, {
				code: promoCode.trim(),
				orgId: orgId,
				userId: user?._id,
				email: user?.email,
				// For subscriptions, we don't have a specific courseId, so we'll pass null
				// The backend should handle subscription-specific promo codes
				courseId: null,
			});

			// Backend returns 200 status with data directly, not wrapped in status field
			if (response.status === 200 && response.data) {
				return response.data;
			} else {
				throw new Error(response.data?.message || 'Invalid promo code');
			}
		} catch (err: any) {
			console.error('❌ Apply Promo Code Error:', err);
			const errorMessage = err.response?.data?.message || err.message || 'Invalid promo code';
			throw new Error(errorMessage);
		}
	};

	const clearError = (): void => {
		setError(null);
	};

	// Reset form when dialog opens/closes
	useEffect(() => {
		if (open) {
			setFormData({
				subscriptionType: 'monthly',
				promoCode: '',
				email: user?.email || '',
				firstName: user?.firstName || '',
				lastName: user?.lastName || '',
				agreed: false,
			});
			setIsPromoCodeApplied(false);
			setDiscountedAmount(0);
			setPromoCodeError('');
			clearError();
			// Fetch subscription plans when dialog opens
			fetchSubscriptionPlans();
		}
	}, [open, user]);

	// Calculate current price
	const getCurrentPrice = (): SubscriptionPrice | null => {
		if (!subscriptionPlans) return null;
		const plan = subscriptionPlans[formData.subscriptionType];
		return plan?.userPrice || null;
	};

	// Calculate final amount
	const getFinalAmount = (): number => {
		const currentPrice = getCurrentPrice();
		if (!currentPrice) return 0;

		if (isPromoCodeApplied && discountedAmount > 0) {
			return discountedAmount;
		}

		return currentPrice.amount;
	};

	// Handle form field changes
	const handleFieldChange = (field: keyof SubscriptionFormData, value: any) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		if (field === 'subscriptionType') {
			setIsPromoCodeApplied(false);
			setDiscountedAmount(0);
			setPromoCodeError('');
		}
		clearError();
	};

	// Handle promo code application
	const handleApplyPromoCode = async () => {
		if (!formData.promoCode.trim()) {
			setPromoCodeError('Please enter a promo code');
			return;
		}

		try {
			setPromoCodeError('');
			const response = await applyPromoCode(formData.promoCode);

			if (response && response.discountAmount !== undefined) {
				const currentPrice = getCurrentPrice();
				if (currentPrice) {
					const discountAmount = response.discountAmount;
					const newAmount = currentPrice.amount - (currentPrice.amount * discountAmount) / 100;
					setDiscountedAmount(Math.max(newAmount, 0));
					setIsPromoCodeApplied(true);
				}
			}
		} catch (err: any) {
			setPromoCodeError(err.message || 'Invalid promo code');
		}
	};

	// Handle reCAPTCHA
	const handleRecaptchaChange = (token: string | null) => {
		setRecaptchaToken(token);
		// Clear any existing errors when reCAPTCHA changes
		if (token) {
			clearError();
		}
	};

	const resetRecaptcha = () => {
		setRecaptchaToken(null);
		if (recaptchaRef.current) {
			recaptchaRef.current.reset();
		}
		// Force reCAPTCHA to reload completely with a slight delay
		setTimeout(() => {
			if (recaptchaRef.current) {
				recaptchaRef.current.reset();
			}
		}, 200);
	};

	// Handle subscription creation
	const handleSubscribe = async () => {
		if (!stripe || !elements) {
			return;
		}

		if (!cardNumberComplete || !cardExpiryComplete || !cardCvcComplete) {
			return;
		}

		if (!recaptchaToken) {
			return;
		}

		setIsProcessing(true);
		setIsSubmitted(true);

		try {
			// Create payment method first
			const cardNumberElement = elements.getElement(CardNumberElement);
			if (!cardNumberElement) {
				throw new Error('Card details are missing');
			}

			const { error: methodError, paymentMethod } = await stripe.createPaymentMethod({
				type: 'card',
				card: cardNumberElement,
				billing_details: {
					name: `${formData.firstName} ${formData.lastName}`,
					email: formData.email,
				},
			});

			if (methodError) {
				console.error('❌ Payment method creation failed:', methodError);

				// Provide user-friendly error messages for payment method creation
				let userFriendlyMessage = 'Failed to process your card. Please try again.';

				if (methodError.code === 'card_declined') {
					userFriendlyMessage = 'Your card was declined. Please check your card details or try a different card.';
				} else if (methodError.code === 'expired_card') {
					userFriendlyMessage = 'Your card has expired. Please use a different card.';
				} else if (methodError.code === 'incorrect_cvc') {
					userFriendlyMessage = 'The CVC code is incorrect. Please check and try again.';
				} else if (methodError.code === 'incorrect_number') {
					userFriendlyMessage = 'The card number is incorrect. Please check and try again.';
				} else if (methodError.code === 'invalid_expiry_month' || methodError.code === 'invalid_expiry_year') {
					userFriendlyMessage = 'The expiry date is invalid. Please check and try again.';
				} else if (methodError.code === 'processing_error') {
					userFriendlyMessage = 'There was an error processing your card. Please try again.';
				} else if (methodError.message) {
					// Use the original message if it's already user-friendly
					userFriendlyMessage = methodError.message;
				}

				throw new Error(userFriendlyMessage);
			}

			// Get currency from current price
			const currentPrice = getCurrentPrice();
			if (!currentPrice) {
				throw new Error('Unable to determine subscription price');
			}

			// Create subscription with payment method
			const subscriptionResponse = await createSubscription({
				...formData,
				currency: currentPrice.currency,
				paymentMethodId: paymentMethod.id,
			});

			if (subscriptionResponse.data) {
				const { clientSecret, stripeSubscriptionId, isStripeConnect } = subscriptionResponse.data;

				// Only confirm payment if clientSecret is provided AND it's not a Stripe Connect subscription
				if (clientSecret && !isStripeConnect) {
					const { error: confirmError } = await stripe.confirmCardPayment(clientSecret, {
						payment_method: paymentMethod.id,
					});

					if (confirmError) {
						// Provide user-friendly error messages based on the error type
						let userFriendlyMessage = 'Payment failed. Please try again.';

						if (confirmError.code === 'card_declined') {
							userFriendlyMessage = 'Your card was declined. Please check your card details or try a different card.';
						} else if (confirmError.code === 'expired_card') {
							userFriendlyMessage = 'Your card has expired. Please use a different card.';
						} else if (confirmError.code === 'incorrect_cvc') {
							userFriendlyMessage = 'The CVC code is incorrect. Please check and try again.';
						} else if (confirmError.code === 'incorrect_number') {
							userFriendlyMessage = 'The card number is incorrect. Please check and try again.';
						} else if (confirmError.code === 'invalid_expiry_month' || confirmError.code === 'invalid_expiry_year') {
							userFriendlyMessage = 'The expiry date is invalid. Please check and try again.';
						} else if (confirmError.code === 'processing_error') {
							userFriendlyMessage = 'There was an error processing your card. Please try again.';
						} else if (confirmError.code === 'insufficient_funds') {
							userFriendlyMessage = 'Your card has insufficient funds. Please try a different card.';
						} else if (confirmError.message) {
							// Use the original message if it's already user-friendly
							userFriendlyMessage = confirmError.message;
						}

						throw new Error(userFriendlyMessage);
					}
				}

				// Only capture and activate subscription if payment confirmation succeeded
				if (stripeSubscriptionId) {
					try {
						const captureResponse = await axiosInstance.post(`/subscriptions/capture/${stripeSubscriptionId}`, {
							recaptchaToken: recaptchaToken,
						});

						if (captureResponse.data && captureResponse.data.data) {
							const { subscriptionId } = captureResponse.data.data;
							onSuccess?.(subscriptionId);
							setShowSuccess(true);
							onClose();
						} else {
							throw new Error('Failed to activate subscription');
						}
					} catch (captureError: any) {
						console.error('❌ Capture and Activate Error:', captureError);
						throw new Error(captureError.response?.data?.error || captureError.response?.data?.message || 'Failed to activate subscription');
					}
				} else {
					throw new Error('No subscription ID received');
				}
			}
		} catch (err: any) {
			// Check if this is a reCAPTCHA error
			if (err.message && err.message.includes('reCAPTCHA')) {
				// This is a reCAPTCHA token issue - show a helpful message
				setError('Please complete the verification again and try subscribing.');
				// Reset reCAPTCHA immediately
				resetRecaptcha();
			} else if (err.message && (err.message.includes('card') || err.message.includes('payment') || err.message.includes('declined'))) {
				// This is a payment-related error - show the specific error message
				setError(err.message);
				// Reset reCAPTCHA for retry attempts
				resetRecaptcha();
			} else {
				// For other errors, show a generic message
				setError('Failed to create subscription. Please try again.');
				// Also reset reCAPTCHA for retry attempts
				resetRecaptcha();
			}
		} finally {
			setIsProcessing(false);
		}
	};

	// Get card icon
	const getCardIcon = (brand: string) => {
		switch (brand) {
			case 'visa':
				return '/src/assets/visa.png';
			case 'mastercard':
				return '/src/assets/mastercard.png';
			default:
				return '/src/assets/credit-card.png';
		}
	};

	const currentPrice = getCurrentPrice();
	const finalAmount = getFinalAmount();

	return (
		<>
			<CustomDialog
				openModal={open}
				closeModal={() => {
					if (!isProcessing) {
						onClose();
					}
				}}
				title='Subscribe to Platform'
				maxWidth='md'
				titleSx={{
					fontSize: '1.5rem',
					fontWeight: 600,
					color: '#2C3E50',
					textAlign: 'center',
					mb: 1,
				}}
				PaperProps={{
					sx: {
						height: 'auto',
						maxHeight: '90vh',
						overflow: 'auto',

						backdropFilter: 'blur(8px)',
					},
				}}>
				<Box sx={{ p: isMobileSize ? 2 : 3 }}>
					{/* Subscription Type Selection */}
					<Box sx={{ mb: 4 }}>
						<Typography
							variant='h6'
							sx={{
								fontWeight: 600,
								mb: 2,
							}}>
							Choose Your Plan
						</Typography>

						<FormControl component='fieldset' sx={{ display: 'flex', width: '100%' }}>
							<RadioGroup
								value={formData.subscriptionType}
								onChange={(e) => handleFieldChange('subscriptionType', e.target.value)}
								sx={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'space-between' }}>
								{subscriptionPlans &&
									Object.entries(subscriptionPlans)
										.filter(([_type, plan]) => plan && plan.userPrice)
										.map(([type, plan]) => (
											<Box
												key={type}
												sx={{
													'border': formData.subscriptionType === type ? `2px solid ${theme.textColor?.greenPrimary.main}` : '2px solid #e0e0e0',
													'borderRadius': 2,
													'p': 2,
													'cursor': 'pointer',
													'transition': 'all 0.2s ease-in-out',
													'&:hover': {
														borderColor: theme.textColor?.greenPrimary.main,
													},
													'width': '47.5%',
												}}
												onClick={() => handleFieldChange('subscriptionType', type)}>
												<FormControlLabel
													value={type}
													control={<Radio />}
													label={
														<Box
															sx={{
																display: 'flex',
																flexDirection: 'column',
																alignItems: 'flex-start',
																justifyContent: 'flex-start',
																width: '100%',
															}}>
															<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', width: '100%' }}>
																<Typography variant='h6' sx={{ fontWeight: 600 }}>
																	{type === 'monthly' ? 'Monthly' : 'Yearly'} Plan -
																</Typography>
																<Typography variant='h5' sx={{ fontWeight: 600, ml: 0.5 }}>
																	{setCurrencySymbol(plan.userCurrency)}
																	{plan.userPrice.amount}
																</Typography>
															</Box>
															<Box sx={{ textAlign: 'left' }}>
																<Typography variant='body2'>{type === 'yearly' ? 'Save 2 months with yearly billing' : 'Billed monthly'}</Typography>
															</Box>
														</Box>
													}
													sx={{ width: '100%' }}
												/>
												{type === 'yearly' && plan.savings && (
													<Chip
														label={`Save ${setCurrencySymbol(plan.savings.currency)}${plan.savings.amount.toFixed(0)} (${plan.savings.percentage.toFixed(0)}%)`}
														color='success'
														size='small'
														sx={{ alignSelf: 'center', mt: 1, width: '100%' }}
													/>
												)}
											</Box>
										))}
							</RadioGroup>
						</FormControl>
					</Box>

					<Divider sx={{ my: 1 }} />

					{/* Benefits Section */}
					<SubscriptionBenefits subscriptionType={formData.subscriptionType} />

					<Divider sx={{ my: 2 }} />

					{/* Payment Form */}
					<Box sx={{ mb: 4, width: '80%', mx: 'auto' }}>
						<Typography
							variant='h6'
							sx={{
								fontWeight: 600,
								mb: 2,
							}}>
							Payment Information
						</Typography>

						{/* Promo Code */}
						<Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
							<CustomTextField
								label='Promo Code (Optional)'
								size='small'
								value={formData.promoCode}
								onChange={(e) => {
									handleFieldChange('promoCode', e.target.value);
									setPromoCodeError('');
									setIsPromoCodeApplied(false);
								}}
								sx={{
									flex: 1,
								}}
							/>
							<CustomSubmitButton size='small' type='button' onClick={handleApplyPromoCode} disabled={!formData.promoCode.trim()}>
								Apply
							</CustomSubmitButton>
						</Box>

						{promoCodeError && (
							<CustomErrorMessage sx={{ mt: '-2rem', mb: '1rem', fontSize: isMobileSize ? '0.65rem' : '0.8rem' }}>
								{promoCodeError}
							</CustomErrorMessage>
						)}

						{isPromoCodeApplied && (
							<Alert severity='success' sx={{ mb: '1rem', fontSize: isMobileSize ? '0.65rem' : '0.8rem', mt: '-2rem' }} icon={<CheckCircle />}>
								Promo code applied successfully!
							</Alert>
						)}

						{/* Card Information */}
						<Box sx={{ mb: 3 }}>
							<Typography
								variant='h6'
								sx={{
									fontWeight: 500,
									mb: 1,
								}}>
								Card Number*
							</Typography>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
								<Box
									sx={{
										border: isSubmitted && !cardNumberComplete ? '1px solid red' : '1px solid #ccc',
										padding: '0.6rem',
										backgroundColor: '#fff',
										width: '100%',
									}}>
									<CardNumberElement
										options={{
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
											clearError();
										}}
									/>
								</Box>
								<Box>
									<img src={getCardIcon(cardBrand)} alt={`${cardBrand} icon`} style={{ width: '40px' }} />
								</Box>
							</Box>
						</Box>

						<Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
							<Box sx={{ width: '50%' }}>
								<Typography
									variant='h6'
									sx={{
										fontWeight: 500,
										mb: 1,
									}}>
									Expiry Date*
								</Typography>
								<Box
									sx={{
										border: isSubmitted && !cardExpiryComplete ? '1px solid red' : '1px solid #ccc',
										padding: '0.6rem',
										backgroundColor: '#fff',
									}}>
									<CardExpiryElement
										options={{
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
											clearError();
										}}
									/>
								</Box>
							</Box>
							<Box sx={{ width: '50%' }}>
								<Typography
									variant='h6'
									sx={{
										fontWeight: 500,
										mb: 1,
									}}>
									CVC*
								</Typography>
								<Box
									sx={{
										border: isSubmitted && !cardCvcComplete ? '1px solid red' : '1px solid #ccc',
										padding: '0.6rem',
										backgroundColor: '#fff',
									}}>
									<CardCvcElement
										options={{
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
											clearError();
										}}
									/>
								</Box>
							</Box>
						</Box>

						{/* Total Amount */}
						<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
							<Typography
								variant='h6'
								sx={{
									fontWeight: 600,
								}}>
								Total Amount:
							</Typography>
							<Typography
								variant='h5'
								sx={{
									fontWeight: 600,
									color: theme.textColor?.greenPrimary.main,
								}}>
								{currentPrice && setCurrencySymbol(currentPrice.currency)}
								{finalAmount}
								{currentPrice && ` / ${formData.subscriptionType === 'monthly' ? 'month' : 'year'}`}
							</Typography>
						</Box>

						{/* Terms and Conditions */}
						<Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
							<FormControlLabel
								control={
									<Checkbox
										checked={formData.agreed}
										onChange={(e) => handleFieldChange('agreed', e.target.checked)}
										sx={{
											'& .MuiSvgIcon-root': {
												fontSize: isMobileSize ? '0.9rem' : '1.15rem',
											},
										}}
									/>
								}
								label='I agree to the Terms & Conditions'
								sx={{
									'& .MuiFormControlLabel-label': {
										fontSize: isMobileSize ? '0.65rem' : '0.8rem',
									},
								}}
							/>
						</Box>

						{/* reCAPTCHA */}
						<Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
							<ReCAPTCHA
								ref={recaptchaRef}
								sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
								onChange={handleRecaptchaChange}
								onExpired={() => setRecaptchaToken(null)}
								key={open ? 'active' : 'inactive'}
							/>
						</Box>
					</Box>

					{/* Error Display */}
					{error && (
						<CustomErrorMessage
							sx={{
								width: '80%',
								mb: 2,
								fontSize: isMobileSize ? '0.65rem' : '0.8rem',
								mx: 'auto',
							}}>
							{error}
						</CustomErrorMessage>
					)}

					{/* Actions */}
					<CustomDialogActions
						onCancel={() => {
							if (!isProcessing) {
								setShowSuccess(false);
								onClose();
							}
						}}
						cancelBtnText='Cancel'
						submitBtnText={isProcessing ? 'Processing...' : `Subscribe - ${currentPrice && setCurrencySymbol(currentPrice.currency)}${finalAmount}`}
						submitBtnSx={{
							cursor: isProcessing ? 'not-allowed' : 'pointer',
						}}
						disableBtn={isProcessing || !formData.agreed || !recaptchaToken || !cardNumberComplete || !cardExpiryComplete || !cardCvcComplete}
						disableCancelBtn={isProcessing}
						onSubmit={handleSubscribe}
						actionSx={{ width: '80%', mx: 'auto', padding: '0' }}
					/>
				</Box>
			</CustomDialog>

			{/* Success Snackbar */}
			<Snackbar
				open={showSuccess}
				autoHideDuration={4000}
				anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
				onClose={() => setShowSuccess(false)}
				sx={{ mt: { xs: '1.5rem', sm: '1.5rem', md: '2.5rem', lg: '2.5rem' } }}>
				<Alert
					severity='success'
					variant='filled'
					sx={{
						width: '100%',
						fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem', lg: '1rem' },
						letterSpacing: 0,
						color: theme.textColor?.common.main,
					}}>
					Subscription created successfully! Welcome to the platform.
				</Alert>
			</Snackbar>
		</>
	);
};

export default SubscriptionDialog;
