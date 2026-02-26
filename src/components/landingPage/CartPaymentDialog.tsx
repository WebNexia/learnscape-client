import { Box, Typography, LinearProgress } from '@mui/material';
import CustomDialog from '../layouts/dialog/CustomDialog';
import CustomTextField from '../forms/customFields/CustomTextField';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import CustomErrorMessage from '../forms/customFields/CustomErrorMessage';
import { useContext, useState } from 'react';
import { CardCvcElement, CardExpiryElement, CardNumberElement, useElements, useStripe } from '@stripe/react-stripe-js';
import axios from 'axios';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import visaIcon from '../../assets/visa.png';
import masterCardIcon from '../../assets/mastercard.png';
import defaultCardIcon from '../../assets/credit-card.png';

const base_url = import.meta.env.VITE_SERVER_BASE_URL;
const DIALOG_FONT = 'Varela Round';

export interface CartPaymentItem {
	type: 'document' | 'consultation';
	clientSecret: string;
	paymentIntentId: string;
	capturePayload: Record<string, unknown>;
	/** For display only */
	title?: string;
	amount?: string;
	currency?: string;
	/** Consultation only: link form submission to appointment after payment */
	formSubmissionId?: string;
	appointmentId?: string;
}

interface CartPaymentDialogProps {
	open: boolean;
	onClose: () => void;
	queue: CartPaymentItem[];
	firstName: string;
	lastName: string;
	email: string;
	onSuccess: () => void;
}

export default function CartPaymentDialog({
	open,
	onClose,
	queue,
	firstName,
	lastName,
	email,
	onSuccess,
}: CartPaymentDialogProps) {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const [errorMessage, setErrorMessage] = useState('');
	const [isProcessing, setIsProcessing] = useState(false);
	const [cardHolderName, setCardHolderName] = useState('');
	const [cardComplete, setCardComplete] = useState({ number: false, expiry: false, cvc: false });
	const [cardBrand, setCardBrand] = useState<string>('unknown');
	const [currentIndex, setCurrentIndex] = useState(0);

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

	const stripe = useStripe();
	const elements = useElements();

	const handlePayment = async () => {
		setErrorMessage('');
		if (!stripe || !elements || queue.length === 0) {
			setErrorMessage('Ödeme sistemi yüklenemedi.');
			return;
		}
		const cardNumber = elements.getElement(CardNumberElement);
		const cardExpiry = elements.getElement(CardExpiryElement);
		const cardCvc = elements.getElement(CardCvcElement);
		if (!cardNumber || !cardExpiry || !cardCvc) {
			setErrorMessage('Lütfen kart bilgilerini girin.');
			return;
		}
		if (!cardComplete.number || !cardComplete.expiry || !cardComplete.cvc) {
			setErrorMessage('Lütfen tüm kart alanlarını doldurun.');
			return;
		}
		const holderName = cardHolderName.trim() || `${firstName} ${lastName}`.trim();
		if (!holderName) {
			setErrorMessage('Lütfen kart sahibinin adını girin.');
			return;
		}
		setIsProcessing(true);
		try {
			const { error: methodError, paymentMethod } = await stripe.createPaymentMethod({
				type: 'card',
				card: cardNumber,
				billing_details: { name: holderName, email },
			});
			if (methodError) {
				setErrorMessage(methodError.message ?? 'Kart doğrulanamadı.');
				setIsProcessing(false);
				return;
			}

			for (let i = 0; i < queue.length; i++) {
				setCurrentIndex(i + 1);
				const item = queue[i];
				const { error } = await stripe.confirmCardPayment(item.clientSecret, {
					payment_method: paymentMethod!.id,
					return_url: typeof window !== 'undefined' ? window.location.href : undefined,
				});
				if (error) {
					let msg = error.message ?? (error as { decline_code?: string }).decline_code ?? `Ödeme başarısız (${i + 1}. kalem).`;
					if ((error as { code?: string }).code === 'payment_intent_unexpected_state') {
						msg = 'Bu ödeme zaten işlendi veya iptal edildi. Sepetinizi kontrol edin.';
					} else if (msg.toLowerCase().includes('processing error')) {
						msg = 'Ödeme işlenirken bir hata oluştu. Lütfen tekrar deneyin veya farklı bir kart kullanın.';
					}
					setErrorMessage(msg);
					setIsProcessing(false);
					return;
				}
				await axios.patch(`${base_url}/payments/capture/${item.paymentIntentId}`, item.capturePayload);
			}

			onSuccess();
			onClose();
		} catch (err: unknown) {
			const e = err as { message?: string; response?: { data?: { error?: { message?: string }; message?: string } } };
			const msg = e?.response?.data?.error?.message ?? e?.response?.data?.message ?? e?.message ?? 'Ödeme işlemi sırasında bir hata oluştu.';
			setErrorMessage(msg);
		} finally {
			setIsProcessing(false);
			setCurrentIndex(0);
		}
	};

	const progress = queue.length > 0 ? (currentIndex / queue.length) * 100 : 0;

	return (
		<CustomDialog
			title="Sepet ödemesi"
			titleSx={{ fontFamily: DIALOG_FONT, fontWeight: 600, fontSize: '1.25rem' }}
			openModal={open}
			closeModal={() => !isProcessing && onClose()}
			maxWidth="sm"
			PaperProps={{
				sx: {
					borderRadius: '1rem',
					background: 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,255,255,0.95))',
					boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
					fontFamily: DIALOG_FONT,
				},
			}}>
			<Box sx={{ px: 3.5, pb: 1, mb: 2 }}>
				{isProcessing && currentIndex > 0 && (
					<Box sx={{ mt: 1, mb: 1 }}>
						<Typography variant="body2" sx={{ fontFamily: DIALOG_FONT, mb: 0.5 }}>
							Ödeme {currentIndex}/{queue.length}...
						</Typography>
						<LinearProgress variant="determinate" value={progress} sx={{ borderRadius: 1, height: 6 }} />
					</Box>
				)}
				<Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
					<Box>
						<Typography
							variant="h6"
							sx={{
								fontFamily: DIALOG_FONT,
								fontWeight: 500,
								mb: 0.5,
								fontSize: isMobileSize ? '0.75rem' : '0.9rem',
								color: '#2C3E50',
							}}>
							Kart Sahibinin Adı*
						</Typography>
						<CustomTextField
							placeholder="Kartın üzerindeki isim"
							value={cardHolderName}
							onChange={(e) => setCardHolderName(e.target.value)}
							fullWidth
							size="small"
							sx={{
								'& .MuiOutlinedInput-root': {
									borderRadius: '8px',
									fontFamily: DIALOG_FONT,
									fontSize: isMobileSize ? '0.875rem' : '0.9rem',
								},
							}}
						/>
					</Box>
					<Box>
						<Typography
							variant="h6"
							sx={{
								fontFamily: DIALOG_FONT,
								fontWeight: 500,
								mb: 0.5,
								fontSize: isMobileSize ? '0.75rem' : '0.9rem',
								color: '#2C3E50',
							}}>
							Kart Numarası*
						</Typography>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
							<Box
								sx={{
									border: '1px solid #ccc',
									padding: '0.6rem',
									borderRadius: '8px',
									backgroundColor: '#fff',
									flex: 1,
									fontFamily: DIALOG_FONT,
								}}>
								<CardNumberElement
									options={{
										style: {
											base: {
												fontSize: isMobileSize ? '11px' : '14px',
												color: '#223354',
												fontFamily: `${DIALOG_FONT}, sans-serif`,
												'::placeholder': { color: '#aab7c4' },
											},
											invalid: { color: '#9e2146' },
										},
									}}
									onReady={(el) => el.focus()}
									onChange={(e) => {
										setCardComplete((c) => ({ ...c, number: e.complete }));
										setCardBrand(e.brand || 'unknown');
									}}
								/>
							</Box>
							<img src={getCardIcon(cardBrand)} alt={`${cardBrand}`} style={{ width: 40, flexShrink: 0 }} />
						</Box>
					</Box>
					<Box sx={{ display: 'flex', gap: 2 }}>
						<Box sx={{ width: '50%' }}>
							<Typography
								variant="h6"
								sx={{
									fontFamily: DIALOG_FONT,
									fontWeight: 500,
									mb: 0.5,
									fontSize: isMobileSize ? '0.75rem' : '0.9rem',
									color: '#2C3E50',
								}}>
								Son Kullanma Tarihi*
							</Typography>
							<Box
								sx={{
									border: '1px solid #ccc',
									padding: '0.6rem',
									borderRadius: '8px',
									backgroundColor: '#fff',
									fontFamily: DIALOG_FONT,
								}}>
								<CardExpiryElement
									options={{
										style: {
											base: {
												fontSize: isMobileSize ? '11px' : '14px',
												color: '#223354',
												fontFamily: `${DIALOG_FONT}, sans-serif`,
												'::placeholder': { color: '#aab7c4' },
											},
											invalid: { color: '#9e2146' },
										},
									}}
									onChange={(e) => setCardComplete((c) => ({ ...c, expiry: e.complete }))}
								/>
							</Box>
						</Box>
						<Box sx={{ width: '50%' }}>
							<Typography
								variant="h6"
								sx={{
									fontFamily: DIALOG_FONT,
									fontWeight: 500,
									mb: 0.5,
									fontSize: isMobileSize ? '0.75rem' : '0.9rem',
									color: '#2C3E50',
								}}>
								CVC*
							</Typography>
							<Box
								sx={{
									border: '1px solid #ccc',
									padding: '0.6rem',
									borderRadius: '8px',
									backgroundColor: '#fff',
									fontFamily: DIALOG_FONT,
								}}>
								<CardCvcElement
									options={{
										style: {
											base: {
												fontSize: isMobileSize ? '11px' : '14px',
												color: '#223354',
												fontFamily: `${DIALOG_FONT}, sans-serif`,
												'::placeholder': { color: '#aab7c4' },
											},
											invalid: { color: '#9e2146' },
										},
									}}
									onChange={(e) => setCardComplete((c) => ({ ...c, cvc: e.complete }))}
								/>
							</Box>
						</Box>
					</Box>
				</Box>
				{errorMessage && (
					<CustomErrorMessage sx={{ mt: 2, fontFamily: DIALOG_FONT }}>{errorMessage}</CustomErrorMessage>
				)}
			</Box>
			<CustomDialogActions
				onCancel={() => !isProcessing && onClose()}
				cancelBtnText="İptal"
				onSubmit={handlePayment}
				submitBtnText="Ödeme Yap"
				disableBtn={isProcessing}
				isSubmitting={isProcessing}
				cancelBtnSx={{
					fontFamily: DIALOG_FONT,
				}}
				submitBtnSx={{
					'background': '#FF6B3D !important',
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
				}}
				actionSx={{ padding: '0 1.25rem' }}
			/>
		</CustomDialog>
	);
}
