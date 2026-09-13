import {
	Alert,
	Box,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { Club, ClubPack } from '../../interfaces/club';
import { clubsService } from '../../services/clubsService';
import { setCurrencySymbol } from '../../utils/setCurrencySymbol';
import { useGeoLocation } from '../../hooks/useGeoLocation';
import CustomTextField from '../forms/customFields/CustomTextField';
import CustomSubmitButton from '../forms/customButtons/CustomSubmitButton';
import CustomCancelButton from '../forms/customButtons/CustomCancelButton';
import { useIsLpQaPreview } from '../../hooks/useIsLpQaPreview';

const countryCurrencyMap: Record<string, string> = {
	GB: 'gbp',
	US: 'usd',
	EU: 'eur',
	TR: 'try',
};

function pickPackPrice(pack: ClubPack, countryCode?: string | null) {
	const preferred = countryCurrencyMap[(countryCode || '').toUpperCase()] || 'usd';
	return (
		pack.prices.find((p) => p.currency?.toLowerCase() === preferred) ||
		pack.prices.find((p) => p.currency?.toLowerCase() === 'usd') ||
		pack.prices[0]
	);
}

export function resolveClientPurchasePrice(packs: ClubPack[] | undefined, sessionCount: number, countryCode?: string | null) {
	const count = Math.floor(Number(sessionCount));
	if (!Number.isFinite(count) || count < 1) {
		return { ok: false as const, message: 'En az 1 oturum seçin.' };
	}
	const list = packs || [];
	const exact = list.find((p) => p.sessionCount === count);
	if (exact) {
		const price = pickPackPrice(exact, countryCode);
		if (!price) return { ok: false as const, message: 'Bu paket için fiyat yok.' };
		const amount = parseFloat(String(price.amount).replace(',', '.'));
		if (!Number.isFinite(amount) || amount <= 0) return { ok: false as const, message: 'Geçersiz fiyat.' };
		return {
			ok: true as const,
			amount,
			currency: price.currency,
			pricingMode: 'exact_pack' as const,
			label: exact.label || `${count} oturum paketi`,
		};
	}
	const unit = list.find((p) => p.sessionCount === 1);
	if (!unit) {
		return { ok: false as const, message: '1 oturum fiyatı tanımlı değil.' };
	}
	const unitPrice = pickPackPrice(unit, countryCode);
	if (!unitPrice) return { ok: false as const, message: '1 oturum fiyatı yok.' };
	const unitAmount = parseFloat(String(unitPrice.amount).replace(',', '.'));
	if (!Number.isFinite(unitAmount) || unitAmount <= 0) return { ok: false as const, message: 'Geçersiz birim fiyat.' };
	return {
		ok: true as const,
		amount: Math.round(unitAmount * count * 100) / 100,
		currency: unitPrice.currency,
		pricingMode: 'unit_times_count' as const,
		label: `${count} × ${setCurrencySymbol(unitPrice.currency)}${unitPrice.amount}`,
		unitAmount,
	};
}

export { pickPackPrice };

type Props = {
	open: boolean;
	club: Club | null;
	orgId?: string | null;
	cancelUrl?: string;
	onClose: () => void;
};

const fieldSx = { mb: 2, '& .MuiInputBase-input': { fontFamily: "'Varela Round', sans-serif" } };
const font = "'Varela Round', sans-serif";

const ClubPurchaseDialog = ({ open, club, orgId, cancelUrl, onClose }: Props) => {
	const geoLocation = useGeoLocation();
	const isQaPreview = useIsLpQaPreview();
	const [sessionCount, setSessionCount] = useState(1);
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);

	const quote = useMemo(
		() => resolveClientPurchasePrice(club?.packs, sessionCount, geoLocation?.countryCode),
		[club, sessionCount, geoLocation?.countryCode],
	);

	const handleClose = () => {
		if (submitting) return;
		setFormError(null);
		setSessionCount(1);
		onClose();
	};

	const handleCheckout = async () => {
		if (!club || !orgId || !quote.ok) return;
		setFormError(null);
		if (!firstName.trim() || !lastName.trim() || !email.trim()) {
			setFormError('Ad, soyad ve e-posta zorunludur.');
			return;
		}
		setSubmitting(true);
		try {
			const result = await clubsService.checkout(orgId, club._id, {
				sessionCount: Math.floor(sessionCount),
				currency: quote.currency,
				amount: quote.amount,
				firstName: firstName.trim(),
				lastName: lastName.trim(),
				email: email.trim(),
				guestPhone: phone.trim() || undefined,
				cancelUrl: cancelUrl || `${window.location.origin}/landing-page-clubs`,
				...(isQaPreview ? { qaPreview: true } : {}),
			});
			if (result.checkoutUrl) {
				window.location.href = result.checkoutUrl;
				return;
			}
			setFormError('Ödeme başlatılamadı.');
		} catch (err: any) {
			setFormError(err?.response?.data?.error || 'Ödeme başlatılamadı.');
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onClose={handleClose} fullWidth maxWidth='xs'>
			<DialogContent sx={{ pt: 3, pb: 1 }}>
				<Typography variant='h6' sx={{ fontFamily: font, fontWeight: 700, mb: 0.5, color: '#0f172a' }}>
					Oturum Satın Al
				</Typography>
				<Typography variant='body2' color='text.secondary' sx={{ fontFamily: font, mb: 2 }}>
					{club?.title}
				</Typography>

				{formError && (
					<Alert severity='error' sx={{ mb: 2, fontFamily: font }}>
						{formError}
					</Alert>
				)}

				{(club?.packs || []).length > 0 && (
					<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
						{(club?.packs || [])
							.slice()
							.sort((a, b) => a.sessionCount - b.sessionCount)
							.map((pack) => {
								const price = pickPackPrice(pack, geoLocation?.countryCode);
								return (
									<Box
										key={pack._id}
										sx={{
											px: 1.25,
											py: 0.5,
											borderRadius: 1,
											bgcolor: 'rgba(0,82,163,0.06)',
											fontFamily: font,
											fontSize: '0.8rem',
										}}>
										{pack.label || `${pack.sessionCount} Oturum`}
										{price ? ` — ${setCurrencySymbol(price.currency)}${price.amount}` : ''}
									</Box>
								);
							})}
					</Box>
				)}

				<CustomTextField
					label='Oturum sayısı'
					type='number'
					value={sessionCount}
					onChange={(e) => setSessionCount(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
					fullWidth
					InputProps={{ inputProps: { min: 1, max: 100 } }}
					helperText='Özel paket yoksa 1 oturum fiyatı × adet hesaplanır.'
					sx={fieldSx}
					disabled={submitting}
				/>

				{quote.ok ? (
					<Alert severity={quote.pricingMode === 'exact_pack' ? 'success' : 'info'} sx={{ mb: 2, fontFamily: font }}>
						Toplam: <strong>{setCurrencySymbol(quote.currency)}{quote.amount}</strong>
						{' — '}
						{quote.label}
					</Alert>
				) : (
					<Alert severity='warning' sx={{ mb: 2, fontFamily: font }}>
						{quote.message}
					</Alert>
				)}

				<CustomTextField
					label='Ad'
					value={firstName}
					onChange={(e) => setFirstName(e.target.value)}
					fullWidth
					sx={fieldSx}
					disabled={submitting}
				/>
				<CustomTextField
					label='Soyad'
					value={lastName}
					onChange={(e) => setLastName(e.target.value)}
					fullWidth
					sx={fieldSx}
					disabled={submitting}
				/>
				<CustomTextField
					label='E-posta'
					type='email'
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					fullWidth
					sx={fieldSx}
					disabled={submitting}
				/>
				<CustomTextField
					label='Telefon (opsiyonel)'
					value={phone}
					onChange={(e) => setPhone(e.target.value)}
					fullWidth
					required={false}
					sx={fieldSx}
					disabled={submitting}
				/>
				<Typography sx={{ fontFamily: font, fontSize: '0.85rem', color: '#64748b', mb: 1 }}>
					Ödeme sonrası bilet kodunuz e-postanıza gelir. Hesap oluşturmanız gerekmez.
				</Typography>
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
				<CustomCancelButton onClick={handleClose} disabled={submitting} sx={{ fontFamily: font, textTransform: 'none' }}>
					İptal
				</CustomCancelButton>
				<CustomSubmitButton
					type='button'
					variant='contained'
					onClick={handleCheckout}
					disabled={submitting || !quote.ok}
					sx={{
						fontFamily: font,
						textTransform: 'none',
						background: 'linear-gradient(135deg, #0052a3 0%, #0066cc 100%)',
					}}
					startIcon={submitting ? <CircularProgress size={18} color='inherit' /> : undefined}>
					{submitting ? 'Yönlendiriliyor…' : 'Ödemeye Git'}
				</CustomSubmitButton>
			</DialogActions>
		</Dialog>
	);
};

export default ClubPurchaseDialog;
