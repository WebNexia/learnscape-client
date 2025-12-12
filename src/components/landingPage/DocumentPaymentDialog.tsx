import { Box, Checkbox, FormControlLabel, Typography } from '@mui/material';
import CustomDialog from '../layouts/dialog/CustomDialog';
import CustomTextField from '../forms/customFields/CustomTextField';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import { useContext, useState, useRef } from 'react';
import { CardCvcElement, CardExpiryElement, CardNumberElement, useElements, useStripe } from '@stripe/react-stripe-js';
import axios from 'axios';
import visaIcon from '../../assets/visa.png';
import masterCardIcon from '../../assets/mastercard.png';
import defaultCardIcon from '../../assets/credit-card.png';
import { Document } from '../../interfaces/document';
import CustomErrorMessage from '../forms/customFields/CustomErrorMessage';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import { setCurrencySymbol } from '../../utils/setCurrencySymbol';
import DocumentTermsConditions from './DocumentTermsConditions';
import ReCAPTCHA from 'react-google-recaptcha';
import { decodeHtmlEntities } from '../../utils/utilText';

interface DocumentPaymentDialogProps {
	document: Pick<Document, '_id' | 'name' | 'prices' | 'documentUrl' | 'orgId'>;
	isPaymentDialogOpen: boolean;
	setIsPaymentDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
	userCurrency: string;
	fromHomePage?: boolean;
	showSuccess: boolean;
	setShowSuccess: React.Dispatch<React.SetStateAction<boolean>>;
	showEmailWarning: boolean;
	setShowEmailWarning: React.Dispatch<React.SetStateAction<boolean>>;
}

const DIALOG_BG = 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.98))';
const DIALOG_BORDERRADIUS = '0.75rem';
const DIALOG_BOXSHADOW = '0 0.5rem 2rem rgba(44, 62, 80, 0.1)';
const DIALOG_BORDER = '0.5rem solid rgba(255, 255, 255, 0.18)';
const DIALOG_FONT = 'Varela Round';
const INPUT_BORDERRADIUS = '0.5rem';
const INPUT_FONT = 'Varela Round';
const INPUT_FONTSIZE = '0.85rem';

const DocumentPaymentDialog = ({
	document,
	isPaymentDialogOpen,
	setIsPaymentDialogOpen,
	userCurrency,
	fromHomePage,
	setShowSuccess,
	setShowEmailWarning,
}: DocumentPaymentDialogProps) => {
	const { isRotatedMedium, isSmallScreen } = useContext(MediaQueryContext);
	const isMobileSize: boolean = isSmallScreen || isRotatedMedium;

	const [isProcessing, setIsProcessing] = useState<boolean>(false);
	const [cardBrand, setCardBrand] = useState<string>('unknown');
	const [errorMessage, setErrorMessage] = useState<string>('');
	const [firstName, setFirstName] = useState<string>('');
	const [lastName, setLastName] = useState<string>('');
	const [email, setEmail] = useState<string>('');
	const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
	const [cardNumberComplete, setCardNumberComplete] = useState<boolean>(false);
	const [cardExpiryComplete, setCardExpiryComplete] = useState<boolean>(false);
	const [cardCvcComplete, setCardCvcComplete] = useState<boolean>(false);
	const [agreed, setAgreed] = useState<boolean>(false);
	const [termsConditionsModalOpen, setTermsConditionsModalOpen] = useState<boolean>(false);
	const recaptchaRef = useRef<any>(null);
	const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

	const stripe = useStripe();
	const elements = useElements();
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

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

	const handlePayment = async () => {
		setIsProcessing(true);
		setIsSubmitted(true);

		if (!recaptchaToken) {
			setErrorMessage('Lütfen reCAPTCHA doğrulamasını tamamlayın.');
			setIsProcessing(false);
			return;
		}

		if (!stripe || !elements) {
			setErrorMessage('Stripe yüklenemedi.');
			setIsProcessing(false);
			resetRecaptcha();
			return;
		}

		const cardNumberElement = elements.getElement(CardNumberElement);
		const cardExpiryElement = elements.getElement(CardExpiryElement);
		const cardCvcElement = elements.getElement(CardCvcElement);

		if (!cardNumberElement || !cardExpiryElement || !cardCvcElement) {
			setErrorMessage('Lütfen tüm kart bilgilerini doldurun.');
			setIsProcessing(false);
			resetRecaptcha();
			return;
		}

		if (!cardNumberComplete || !cardExpiryComplete || !cardCvcComplete) {
			setErrorMessage('Lütfen tüm kart bilgilerini doldurun.');
			setIsProcessing(false);
			resetRecaptcha();
			return;
		}

		try {
			// Step 1: Create PaymentIntent
			const response = await axios.post(`${base_url}/payments`, {
				amount: document.prices?.find((p) => p.currency === userCurrency)?.amount,
				currency: userCurrency,
				documentId: document._id,
				orgId: document.orgId,
				email,
				firstName,
				lastName,
				paymentType: 'document',
				recaptchaToken,
			});

			const { clientSecret, paymentIntentId } = response.data;

			// Step 2: Create Payment Method
			const { error: methodError, paymentMethod } = await stripe.createPaymentMethod({
				type: 'card',
				card: cardNumberElement,
				billing_details: {
					name: `${firstName} ${lastName}`,
					email: email,
				},
			});

			if (methodError) {
				setErrorMessage(methodError.message ?? 'Ödeme yöntemi oluşturulurken bir hata oluştu');
				setIsProcessing(false);
				return;
			}

			// Step 3: Confirm the PaymentIntent
			const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
				payment_method: paymentMethod.id,
			});

			if (error) {
				setErrorMessage(error.message ?? 'Ödeme başarısız oldu');
				setIsProcessing(false);
				resetRecaptcha();
				return;
			}

			// Step 4: Capture the payment
			const captureResponse = await axios.patch(`${base_url}/payments/capture/${paymentIntentId}`, {
				documentId: document._id,
				orgId: document.orgId,
				email,
				firstName,
				lastName,
				paymentType: 'document',
			});

			if (captureResponse.data && captureResponse.data.emailWarning) {
				setShowEmailWarning(true);
				setIsProcessing(false);
			} else {
				setIsPaymentDialogOpen(false);
				setShowSuccess(true);
				setIsProcessing(false);
			}
		} catch (err) {
			console.error(err);
			setErrorMessage('Ödeme işlemi sırasında bir hata oluştu.');
			setIsProcessing(false);
			resetRecaptcha();
		}
	};

	const resetForm = () => {
		setFirstName('');
		setLastName('');
		setEmail('');
		setErrorMessage('');
		setIsSubmitted(false);
		setIsProcessing(false);
		resetRecaptcha();
		setAgreed(false);
	};

	return (
		<CustomDialog
			title={`Kaynak Satın Al (${decodeHtmlEntities(document.name || '')})`}
			titleSx={{
				fontSize: '1.5rem',
				fontWeight: 600,
				fontFamily: DIALOG_FONT,
				color: '#2C3E50',
				ml: '0.5rem',
				textAlign: 'center',
				mb: 1,
			}}
			openModal={isPaymentDialogOpen}
			closeModal={() => {
				if (!isProcessing) {
					resetForm();
					setIsPaymentDialogOpen(false);
				}
			}}
			maxWidth='sm'
			PaperProps={{
				sx: {
					height: 'auto',
					maxHeight: '90vh',
					overflow: 'auto',
					borderRadius: DIALOG_BORDERRADIUS,
					background: DIALOG_BG,
					boxShadow: DIALOG_BOXSHADOW,
					backdropFilter: 'blur(8px)',
					border: DIALOG_BORDER,
					fontFamily: DIALOG_FONT,
				},
			}}>
			<form
				onSubmit={async (e) => {
					e.preventDefault();
					await handlePayment();
				}}>
				<Box
					sx={{
						'margin': { xs: '0 0.75rem', sm: '0 1rem', md: '0 2rem', lg: '0 2rem' },
						'& .MuiOutlinedInput-root': {
							'&:hover fieldset': {
								borderColor: '#3498DB',
							},
							'&.Mui-focused fieldset': {
								borderColor: '#3498DB',
							},
						},
					}}>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
						<CustomTextField
							label='İsim'
							value={firstName}
							onChange={(e) => setFirstName(e.target.value)}
							fullWidth={false}
							sx={{
								'width': '48%',
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
									maxLength: 50,
								},
							}}
						/>
						<CustomTextField
							label='Soyisim'
							value={lastName}
							onChange={(e) => setLastName(e.target.value)}
							fullWidth={false}
							sx={{
								'width': '48%',
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
									maxLength: 50,
								},
							}}
						/>
					</Box>
					<CustomTextField
						label='E-posta Adresi'
						type='email'
						value={email}
						onChange={(e) => setEmail(e.target.value)}
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

					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							justifyContent: 'space-between',
							alignItems: 'center',
							width: '100%',
							padding: isSmallScreen || isRotatedMedium ? '0rem 0.35rem' : '0rem',
							fontFamily: DIALOG_FONT,
							mb: '1.25rem',
						}}>
						<Box sx={{ width: '100%', textAlign: 'left' }}>
							<Typography sx={{ fontSize: isMobileSize ? '0.75rem' : '0.9rem', fontFamily: DIALOG_FONT, color: '#223354' }}>
								Kart Numarası*
							</Typography>
						</Box>
						<Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
							<Box
								sx={{
									'border': isSubmitted && !cardNumberComplete && recaptchaToken ? '1px solid red' : '1px solid #ccc',
									'padding': '0.6rem',
									'borderRadius': INPUT_BORDERRADIUS,
									'backgroundColor': '#fff',
									'width': '100%',
									'fontFamily': DIALOG_FONT,
									'& .MuiOutlinedInput-root': {
										'&:hover fieldset': {
											borderColor: '#3498DB',
										},
										'&.Mui-focused fieldset': {
											borderColor: '#3498DB',
										},
									},
								}}>
								<CardNumberElement
									options={{
										style: {
											base: {
												'fontSize': isMobileSize ? '11px' : '14px',
												'color': '#223354',
												'fontFamily': 'Arial, sans-serif',
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
							padding: isSmallScreen || isRotatedMedium ? '0rem 0.35rem' : '0rem',
							mb: isSmallScreen || isRotatedMedium ? '-0.5rem' : '1.25rem',
							fontFamily: DIALOG_FONT,
						}}>
						<Box
							sx={{
								width: '100%',
								mr: '0.75rem',
							}}>
							<Typography sx={{ fontSize: isMobileSize ? '0.7rem' : '0.9rem', paddingBottom: '0.25rem', fontFamily: DIALOG_FONT, color: '#223354' }}>
								Son Kullanma Tarihi*
							</Typography>
							<Box
								sx={{
									border: isSubmitted && !cardExpiryComplete && recaptchaToken ? '1px solid red' : '1px solid #ccc',
									padding: '0.6rem',
									borderRadius: INPUT_BORDERRADIUS,
									backgroundColor: '#fff',
									fontFamily: DIALOG_FONT,
								}}>
								<CardExpiryElement
									options={{
										style: {
											base: {
												'fontSize': isMobileSize ? '11px' : '14px',
												'color': '#223354',
												'fontFamily': 'Arial, sans-serif',
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

						<Box
							sx={{
								width: '100%',
							}}>
							<Typography sx={{ fontSize: isMobileSize ? '0.7rem' : '0.9rem', paddingBottom: '0.25rem', fontFamily: DIALOG_FONT, color: '#223354' }}>
								CVC*
							</Typography>
							<Box
								sx={{
									border: isSubmitted && !cardCvcComplete && recaptchaToken ? '1px solid red' : '1px solid #ccc',
									padding: '0.6rem',
									borderRadius: INPUT_BORDERRADIUS,
									backgroundColor: '#fff',
									fontFamily: DIALOG_FONT,
								}}>
								<CardCvcElement
									options={{
										style: {
											base: {
												'fontSize': isMobileSize ? '11px' : '14px',
												'color': '#223354',
												'fontFamily': 'Arial, sans-serif',
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
								fontFamily: DIALOG_FONT,
								color: '#223354',
							}}>
							Toplam Tutar: {setCurrencySymbol(userCurrency)}
							{document.prices?.find((p) => p.currency === userCurrency)?.amount}
						</Typography>
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
										fontFamily: DIALOG_FONT,
									},
								}}
							/>
							<Typography
								sx={{
									fontSize: isSmallScreen ? '0.5rem' : '0.75rem',
									cursor: 'pointer',
									fontFamily: DIALOG_FONT,
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

				<DocumentTermsConditions
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
							fontFamily: DIALOG_FONT,
						}}>
						{errorMessage}
					</CustomErrorMessage>
				)}

				<CustomDialogActions
					onCancel={() => {
						if (!isProcessing) {
							resetForm();
							setIsPaymentDialogOpen(false);
						}
					}}
					cancelBtnText='Kapat'
					cancelBtnSx={{ fontFamily: DIALOG_FONT, borderRadius: '' }}
					submitBtnText={isProcessing ? 'İşleniyor' : 'Satın Al'}
					submitBtnSx={{
						'background': 'linear-gradient(135deg, #FF6B3D 0%, #ff7d55 100%) !important',
						'backgroundColor': 'transparent !important',
						'fontFamily': DIALOG_FONT,
						'color': 'white !important',
						'transition': 'all 0.2s ease !important',
						'borderRadius': '',
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
					}}
					disableBtn={isProcessing}
					disableCancelBtn={isProcessing}
					actionSx={{ padding: '0rem 1.5rem', marginBottom: '1rem', marginTop: '2rem' }}
				/>
			</form>
		</CustomDialog>
	);
};

export default DocumentPaymentDialog;
