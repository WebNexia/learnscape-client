import { Box, Checkbox, FormControlLabel, Typography } from '@mui/material';
import CustomDialog from '../dialog/CustomDialog';
import CustomTextField from '../../forms/customFields/CustomTextField';
import TermsConditions from './TermsConditions';
import CustomDialogActions from '../dialog/CustomDialogActions';
import CustomSubmitButton from '../../forms/customButtons/CustomSubmitButton';
import { useContext, useState } from 'react';
import { CardCvcElement, CardExpiryElement, CardNumberElement, useElements, useStripe } from '@stripe/react-stripe-js';
import axios from 'axios';
import visaIcon from '../../../assets/visa.png';
import masterCardIcon from '../../../assets/mastercard.png';
import defaultCardIcon from '../../../assets/credit-card.png';
import { SingleCourse } from '../../../interfaces/course';
import { useParams } from 'react-router-dom';
import { OrganisationContext } from '../../../contexts/OrganisationContextProvider';
import CustomErrorMessage from '../../forms/customFields/CustomErrorMessage';
import theme from '../../../themes';
import { setCurrencySymbol } from '../../../utils/setCurrencySymbol';
import { UserAuthContext } from '../../../contexts/UserAuthContextProvider';
import { getPriceForCountry } from '../../../utils/getPriceForCountry';

interface PaymentDialogProps {
	course: SingleCourse;
	isPaymentDialogOpen: boolean;
	setIsPaymentDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
	courseRegistration: () => Promise<void>;
}

const PaymentDialog = ({ course, isPaymentDialogOpen, setIsPaymentDialogOpen, courseRegistration }: PaymentDialogProps) => {
	const { userId } = useParams();
	const { orgId } = useContext(OrganisationContext);
	const { user } = useContext(UserAuthContext);

	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const [isProcessing, setIsProcessing] = useState<boolean>(false);
	const [termsConditionsModalOpen, setTermsConditionsModalOpen] = useState<boolean>(false);
	const [agreed, setAgreed] = useState<boolean>(false);
	const [cardBrand, setCardBrand] = useState<string>('unknown');
	const [errorMessage, setErrorMessage] = useState<string>('');

	const [firstName, setFirstName] = useState<string>('');
	const [lastName, setLastName] = useState<string>('');
	const [promoCode, setPromoCode] = useState<string>('');
	const [discountedAmount, setDiscountedAmount] = useState<number>(+getPriceForCountry(course, user?.countryCode!).amount);
	const [isPromoCodeApplied, setIsPromoCodeApplied] = useState<boolean>(false);
	const [usersUsedPromoCode, setUsersUsedPromoCode] = useState<string[]>([]);

	const [promoCodeId, setPromoCodeId] = useState<string>('');

	const stripe = useStripe();
	const elements = useElements();

	const handleCardNumberChange = (event: any) => {
		// Set the card brand based on the Stripe event
		setCardBrand(event.brand || 'unknown');
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

	const handlePayment = async () => {
		setIsProcessing(true);

		let usersUsedCode = [...usersUsedPromoCode];

		if (!stripe || !elements) {
			setErrorMessage('Stripe has not loaded properly.');
			console.log('Stripe has not loaded properly.');
			return;
		}

		// Retrieve individual elements
		const cardNumberElement = elements.getElement(CardNumberElement);
		const cardExpiryElement = elements.getElement(CardExpiryElement);
		const cardCvcElement = elements.getElement(CardCvcElement);

		// Ensure all elements are not null before proceeding
		if (!cardNumberElement || !cardExpiryElement || !cardCvcElement) {
			setErrorMessage('One or more card elements are not loaded properly.');
			setIsProcessing(false);
			return;
		}

		try {
			// 1. Make a request to your backend to create a Payment Intent
			const response = await axios.post(`${base_url}/payments`, {
				firstName: firstName.trim(),
				lastName: lastName.trim(),
				amount: discountedAmount, // Assuming course.price is in currency units (not cents)
				currency: getPriceForCountry(course, user?.countryCode!).currency, // Set your preferred currency
				orgId,
				userId,
				courseId: course._id,
			});

			const { clientSecret } = response.data; // Make sure _id and clientSecret are present in the response

			// 2. Create a payment method using the cardNumberElement
			const { error: methodError, paymentMethod } = await stripe.createPaymentMethod({
				type: 'card',
				card: cardNumberElement, // Pass only the card number element
				billing_details: {
					name: `${firstName} ${lastName}`,
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
					firstName,
					lastName,
				});

				if (!user?.firstName && !user?.lastName) {
					await axios.patch(`${base_url}/users/${user?._id}`, {
						firstName,
						lastName,
					});
				}

				setUsersUsedPromoCode((prevData) => {
					prevData.push(user?._id!);

					return prevData;
				});

				usersUsedCode.push(user?._id!);

				if (isPromoCodeApplied) {
					await axios.patch(`${base_url}/promocodes/${promoCodeId}`, {
						usersUsed: usersUsedCode,
					});
				}
			}
			setIsPaymentDialogOpen(false);
			await courseRegistration();
		} catch (error) {
			setErrorMessage('An error occurred while processing the payment.');
		}

		setIsProcessing(false);
	};

	const handleApplyPromoCode = async () => {
		try {
			const response = await axios.post(`${base_url}/promocodes/apply`, {
				code: promoCode.trim(),
				courseId: course._id,
				userId,
				orgId,
			});
			const { discountAmount, discountType, usersUsed, _id } = response.data;

			setPromoCodeId(_id);

			// Calculate the discounted amount based on the type
			let newTotal: number = +getPriceForCountry(course, user?.countryCode!).amount;
			if (discountType === 'percentage') {
				newTotal -= (+getPriceForCountry(course, user?.countryCode!).amount * discountAmount) / 100;
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
			setDiscountedAmount(+getPriceForCountry(course, user?.countryCode!).amount); // Reset to original price
		}
	};
	const resetForm = () => {
		setFirstName('');
		setLastName('');
		setPromoCode('');
		setDiscountedAmount(+getPriceForCountry(course, user?.countryCode!).amount);
		setIsPromoCodeApplied(false);
		setAgreed(false);
		setErrorMessage('');
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
					resetForm();
				}}>
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						gap: '1rem',
						padding: '0 0.75rem',
					}}>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0 0.75rem', mb: '-1rem' }}>
						<CustomTextField
							label='First Name'
							size='small'
							sx={{ mr: '0.5rem' }}
							value={firstName}
							onChange={(e) => {
								setFirstName(e.target.value);
							}}
						/>
						<CustomTextField
							label='Last Name'
							size='small'
							value={lastName}
							onChange={(e) => {
								setLastName(e.target.value);
							}}
						/>
					</Box>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0 0.75rem', mb: '-1rem' }}>
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
								setDiscountedAmount(+getPriceForCountry(course, user?.countryCode!).amount);
								setUsersUsedPromoCode((prevData) => prevData.filter((id) => id !== userId));
							}}
						/>
						<CustomSubmitButton size='small' type='button' sx={{ height: '2.15rem' }} onClick={handleApplyPromoCode}>
							Apply
						</CustomSubmitButton>
					</Box>
					<Box sx={{ display: 'flex', alignItems: 'center', width: '100%', padding: '0 0.75rem' }}>
						<Typography variant='h6' sx={{ boxShadow: '0.1rem 0.1rem 0.5rem 0.1rem rgba(0,0,0,0.3)', borderRadius: '0.35rem', padding: '0.75rem' }}>
							Final Price: {setCurrencySymbol(getPriceForCountry(course, user?.countryCode!).currency)}
							{discountedAmount}
						</Typography>
						{isPromoCodeApplied && (
							<Typography variant='body2' sx={{ color: theme.textColor?.greenPrimary.main, ml: '2rem' }}>
								Promo Code is applied
							</Typography>
						)}
					</Box>
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							justifyContent: 'space-between',
							alignItems: 'center',
							width: '100%',
							padding: '0.75rem',
							margin: '0 0.75rem',
						}}>
						<Box sx={{ width: '100%', textAlign: 'left' }}>
							<Typography variant='body2'>Card Number</Typography>
						</Box>
						<Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
							<Box
								sx={{
									border: '1px solid #ccc',
									padding: '0.5rem',
									borderRadius: '0.35rem',
									backgroundColor: '#fff',
									width: '100%',
								}}>
								<CardNumberElement
									options={{
										style: {
											base: {
												fontSize: '14px',
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
									onChange={handleCardNumberChange}
								/>
							</Box>
							<Box>
								<img src={getCardIcon(cardBrand)} alt={`${cardBrand} icon`} style={{ marginLeft: '10px', width: '40px' }} />
							</Box>
						</Box>
					</Box>

					<Box sx={{ display: 'flex', width: '100%', padding: '0 0.75rem 2rem 0.75rem', mb: '-2rem' }}>
						<Box
							sx={{
								width: '100%',
								mr: '0.75rem',
							}}>
							<Typography variant='body2'>Expiry Date</Typography>
							<Box sx={{ border: '1px solid #ccc', padding: '0.5rem', borderRadius: '0.35rem', backgroundColor: '#fff' }}>
								<Box>
									<CardExpiryElement
										options={{
											style: {
												base: {
													fontSize: '14px',

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
									/>
								</Box>
							</Box>
						</Box>

						{/* CVC Field */}
						<Box
							sx={{
								width: '100%',
							}}>
							<Typography variant='body2'>CVC</Typography>
							<Box sx={{ border: '1px solid #ccc', padding: '0.5rem', borderRadius: '0.35rem', backgroundColor: '#fff' }}>
								<CardCvcElement
									options={{
										style: {
											base: {
												fontSize: '14px',
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
								/>
							</Box>
						</Box>
					</Box>
					<Box sx={{ display: 'flex', alignItems: 'center', textAlign: 'left', width: '100%', padding: '0 0.75rem' }}>
						<FormControlLabel
							required
							control={
								<Checkbox
									checked={agreed}
									onChange={(e) => {
										setAgreed(e.target.checked);
									}}
									sx={{
										'& .MuiSvgIcon-root': {
											fontSize: '1.25rem', // Adjust the checkbox icon size
										},
									}}
								/>
							}
							label='I agree to the Terms & Conditions'
							sx={{
								mt: '0.5rem',
								'& .MuiFormControlLabel-label': {
									fontSize: '0.8rem', // Adjust the label font size
								},
							}}
						/>
						<Typography sx={{ fontSize: '0.75rem', mb: '-0.5rem', cursor: 'pointer' }} onClick={() => setTermsConditionsModalOpen(true)}>
							(<span style={{ textDecoration: 'underline' }}>Read T&C</span>)
						</Typography>
					</Box>
				</Box>

				<TermsConditions termsConditionsModalOpen={termsConditionsModalOpen} setTermsConditionsModalOpen={setTermsConditionsModalOpen} />

				{errorMessage && <CustomErrorMessage sx={{ width: '100%', padding: '0.75rem 1.25rem' }}>{errorMessage}</CustomErrorMessage>}

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
