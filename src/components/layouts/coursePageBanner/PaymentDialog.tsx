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
import { useNavigate, useParams } from 'react-router-dom';
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
	courseRegistration: (resolvedUserId: string, resolvedOrgId: string) => Promise<void>;
	fromHomePage?: boolean;
}

const PaymentDialog = ({ course, isPaymentDialogOpen, setIsPaymentDialogOpen, courseRegistration, fromHomePage }: PaymentDialogProps) => {
	const { userId } = useParams();
	const { orgId } = useContext(OrganisationContext);
	const { user } = useContext(UserAuthContext);

	const navigate = useNavigate();

	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { isRotatedMedium, isSmallScreen } = useContext(MediaQueryContext);

	const location = useGeoLocation();

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
			const userExistsResponse = await axios.post(`${base_url}/users/check-user-exists`, { email });

			setIsUserAccountExist(userExistsResponse.data.exists);

			if (!userExistsResponse.data.exists) {
				setErrorMessage(`Create a free account to make payment.`);
				setIsProcessing(false);
				return;
			}

			// Override userId and orgId with response data
			resolvedUserId = userExistsResponse.data.userId;
			resolvedOrgId = userExistsResponse.data.orgId;
			resolvedCountryCode = userExistsResponse.data.countryCode;
			resolvedFirstName = userExistsResponse.data.firstName;
			resolvedLastName = userExistsResponse.data.lastName;
		}

		let usersUsedCode = [...usersUsedPromoCode];

		if (!stripe || !elements) {
			setErrorMessage('Stripe has not loaded properly.');
			setIsProcessing(false);
			console.log('Stripe has not loaded properly.');
			return;
		}

		// Retrieve individual elements
		const cardNumberElement = elements.getElement(CardNumberElement);
		const cardExpiryElement = elements.getElement(CardExpiryElement);
		const cardCvcElement = elements.getElement(CardCvcElement);

		// Ensure all elements are not null before proceeding
		if (!cardNumberElement || !cardExpiryElement || !cardCvcElement) {
			setErrorMessage('Please fill in all card details.');
			setIsProcessing(false);
			return;
		}

		if (!cardNumberComplete || !cardExpiryComplete || !cardCvcComplete) {
			setErrorMessage('Please fill in all card details.');
			setIsProcessing(false);
			return;
		}

		try {
			// 1. Make a request to your backend to create a Payment Intent
			const response = await axios.post(`${base_url}/payments`, {
				amount: discountedAmount, // Assuming course.price is in currency units (not cents)
				currency: getPriceForCountry(course, resolvedCountryCode!).currency, // Set your preferred currency
				orgId: resolvedOrgId,
				userId: resolvedUserId,
				courseId: course._id,
				email,
			});

			const { clientSecret } = response.data; // Make sure _id and clientSecret are present in the response

			// 2. Create a payment method using the cardNumberElement
			const { error: methodError, paymentMethod } = await stripe.createPaymentMethod({
				type: 'card',
				card: cardNumberElement, // Pass only the card number element
				billing_details: {
					name: `${resolvedFirstName} ${resolvedLastName}`,
				},
			});

			if (methodError) {
				setErrorMessage(methodError.message ?? 'An unknown error occurred while creating payment method');
				setIsProcessing(false);
				return;
			}

			// 3. Confirm the payment using the payment method
			const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
				payment_method: paymentMethod.id, // Pass the payment method ID
			});

			if (error) {
				setErrorMessage(error.message ?? 'An unknown error occurred');
			} else {
				// 3. Send the paymentIntentId and details to your backend to update the payment record
				await axios.patch(`${base_url}/payments/${paymentIntent.id}`, {
					paymentIntentId: paymentIntent.id,
				});

				setUsersUsedPromoCode((prevData) => {
					if (fromHomePage && resolvedUserId) {
						prevData.push(resolvedUserId);
					} else {
						prevData.push(user?._id!);
					}

					return prevData;
				});

				if (fromHomePage && resolvedUserId) {
					usersUsedCode.push(resolvedUserId);
				} else {
					usersUsedCode.push(user?._id!);
				}

				if (isPromoCodeApplied) {
					await axios.patch(`${base_url}/promocodes/${promoCodeId}`, {
						usersUsed: usersUsedCode,
					});
				}
			}
			setIsPaymentDialogOpen(false);
			await courseRegistration(resolvedUserId, resolvedOrgId);
			resetForm();
			setIsProcessing(false);
		} catch (error) {
			setErrorMessage('An error occurred while processing the payment.');
			setIsProcessing(false);
		}
	};

	const handleApplyPromoCode = async () => {
		try {
			const response = await axios.post(`${base_url}/promocodes/apply`, {
				code: promoCode.trim(),
				courseId: course._id,
				userId,
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

	const resetForm = () => {
		setEmail('');
		setPromoCode('');
		setDiscountedAmount(+getPriceForCountry(course, resolvedCountryCode).amount);
		setIsPromoCodeApplied(false);
		setAgreed(false);
		setErrorMessage('');
		setCardCvcComplete(false);
		setCardExpiryComplete(false);
		setCardNumberComplete(false);
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
										onChange={(event) => setCardExpiryComplete(event.complete)}
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
									onChange={(event) => setCardCvcComplete(event.complete)}
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
									onClick={() => navigate('/auth')}
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
					<CustomErrorMessage sx={{ width: '100%', padding: '0.75rem 1.25rem', fontSize: isMobileSize ? '0.7rem' : '0.85rem' }}>
						{errorMessage}{' '}
						{!isUserAccountExist && (
							<span
								onClick={() => navigate('/auth')}
								style={{ color: theme.textColor?.greenSecondary.main, textDecoration: 'underline', cursor: 'pointer' }}>
								Click here
							</span>
						)}
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
