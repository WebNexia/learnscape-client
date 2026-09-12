import { MailOutlineRounded } from '@mui/icons-material';
import {
	Alert,
	Box,
	Button,
	Checkbox,
	DialogActions,
	DialogContent,
	FormControlLabel,
	Typography,
} from '@mui/material';
import { useContext, useRef, useState } from 'react';
import { OrganisationContext } from '../../contexts/OrganisationContextProvider';
import type { LevelResult } from '../../utils/levelTest/engine';
import { attemptsFromLevelResults } from '../../utils/levelTest/report';
import TurnstileWidget, { type TurnstileWidgetHandle } from '../common/TurnstileWidget';
import CustomTextField from '../forms/customFields/CustomTextField';
import CustomDialog from '../layouts/dialog/CustomDialog';
import { levelTestHeadingSx, primaryButtonSx } from './styles';

type Props = {
	open: boolean;
	onClose: () => void;
	results: LevelResult[];
	contentVersion: string;
};

const errorCopy: Record<string, string> = {
	invalid_fields: 'Geçerli bir e-posta adresi yazmalısın.',
	invalid_attempt: 'Rapor oluşturulamadı. Testi tekrarlayıp yeniden dene.',
	rate_limited: 'Kısa sürede çok fazla rapor istendi. Lütfen biraz sonra yeniden dene.',
	service_unavailable: 'Rapor servisi şu anda kullanılamıyor. Lütfen daha sonra yeniden dene.',
	send_failed: 'Rapor gönderilemedi. Lütfen daha sonra yeniden dene.',
	turnstile_failed: 'Güvenlik doğrulaması başarısız oldu. Lütfen yeniden dene.',
};

const LevelTestReportDialog = ({ open, onClose, results, contentVersion }: Props) => {
	const { orgId } = useContext(OrganisationContext);
	const [email, setEmail] = useState('');
	const [marketingConsent, setMarketingConsent] = useState(false);
	const [website, setWebsite] = useState('');
	const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
	const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
	const [error, setError] = useState('');
	const [resetKey, setResetKey] = useState(0);
	const widgetRef = useRef<TurnstileWidgetHandle>(null);
	const turnstileEnabled = Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY);

	const close = () => {
		if (status !== 'sending') onClose();
	};

	const send = async () => {
		const cleanEmail = email.trim().toLowerCase();
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
			setStatus('error');
			setError(errorCopy.invalid_fields);
			return;
		}
		if (turnstileEnabled && !recaptchaToken) {
			setStatus('error');
			setError(errorCopy.turnstile_failed);
			return;
		}
		setStatus('sending');
		setError('');
		try {
			const response = await fetch(`${import.meta.env.VITE_SERVER_BASE_URL}/level-test/report`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: cleanEmail,
					orgId,
					marketingConsent,
					contentVersion,
					attempts: attemptsFromLevelResults(results),
					website,
					recaptchaToken: recaptchaToken ?? '',
				}),
			});
			const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
			if (!response.ok || payload?.ok === false) {
				const code = payload?.error ?? 'send_failed';
				throw new Error(errorCopy[code] ?? errorCopy.send_failed);
			}
			setStatus('sent');
		} catch (requestError) {
			setStatus('error');
			setError(requestError instanceof Error ? requestError.message : errorCopy.send_failed);
			setRecaptchaToken(null);
			setResetKey((value) => value + 1);
			widgetRef.current?.reset();
		}
	};

	return (
		<CustomDialog
			openModal={open}
			closeModal={close}
			maxWidth='sm'
			disableDismiss={status === 'sending'}
			PaperProps={{ sx: { borderRadius: 4, bgcolor: '#fff !important' } }}>
			<DialogContent sx={{ pt: 3 }}>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#0052a3', mb: 1.5 }}>
					<MailOutlineRounded />
					<Typography component='h2' sx={{ ...levelTestHeadingSx, fontSize: '1.25rem' }}>
						PDF raporunu e-postana gönder
					</Typography>
				</Box>
				{status === 'sent' ? (
					<Alert severity='success'>
						Rapor başarıyla gönderildi. Gelen kutunu ve gerekirse spam klasörünü kontrol et.
					</Alert>
				) : (
					<Box
						component='form'
						id='level-test-report-form'
						onSubmit={(event) => {
							event.preventDefault();
							void send();
						}}>
						<Typography sx={{ color: '#526675', lineHeight: 1.6, mb: 2 }}>
							Cevaplarını, puanını ve beceri değerlendirmelerini içeren ayrıntılı PDF raporu alabilirsin.
						</Typography>
						<Box sx={{ position: 'absolute', left: -10000, width: 1, height: 1, overflow: 'hidden' }} aria-hidden='true'>
							<input tabIndex={-1} autoComplete='off' value={website} onChange={(event) => setWebsite(event.target.value)} />
						</Box>
						<CustomTextField
							type='email'
							label='E-posta adresin'
							value={email}
							onChange={(event) => setEmail(event.target.value)}
							InputProps={{ inputProps: { maxLength: 254 } }}
							required
						/>
						<FormControlLabel
							control={<Checkbox checked={marketingConsent} onChange={(event) => setMarketingConsent(event.target.checked)} />}
							label={
								<Box>
									<Typography sx={{ color: '#172b35', fontWeight: 700 }}>Aden Academy içeriklerinden haberdar olmak istiyorum</Typography>
									<Typography sx={{ color: '#6d7f87', fontSize: '.78rem' }}>İsteğe bağlıdır; dilediğin zaman abonelikten çıkabilirsin.</Typography>
								</Box>
							}
							sx={{ alignItems: 'flex-start', mb: 1.5 }}
						/>
						<TurnstileWidget
							ref={widgetRef}
							action='level-test-report'
							onChange={setRecaptchaToken}
							onError={() => {
								setStatus('error');
								setError(errorCopy.turnstile_failed);
							}}
							resetKey={resetKey}
						/>
						{status === 'error' && error ? <Alert severity='error' sx={{ mt: 1.5 }}>{error}</Alert> : null}
					</Box>
				)}
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 2.5 }}>
				<Button onClick={close} disabled={status === 'sending'} sx={{ textTransform: 'none', fontWeight: 700 }}>
					{status === 'sent' ? 'Kapat' : 'Vazgeç'}
				</Button>
				{status !== 'sent' ? (
					<Button
						type='submit'
						form='level-test-report-form'
						variant='contained'
						disabled={status === 'sending' || (turnstileEnabled && !recaptchaToken)}
						sx={primaryButtonSx}>
						{status === 'sending' ? 'Gönderiliyor...' : 'Raporumu gönder'}
					</Button>
				) : null}
			</DialogActions>
		</CustomDialog>
	);
};

export default LevelTestReportDialog;
