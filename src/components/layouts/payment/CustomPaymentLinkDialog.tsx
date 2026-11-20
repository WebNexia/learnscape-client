import { useContext, useEffect, useState } from 'react';
import { Box, DialogActions, DialogContent, MenuItem, TextField, Typography } from '@mui/material';
import axios from '@utils/axiosInstance';
import CustomDialog from '../dialog/CustomDialog';
import CustomTextField from '../../forms/customFields/CustomTextField';
import CustomCancelButton from '../../forms/customButtons/CustomCancelButton';
import CustomSubmitButton from '../../forms/customButtons/CustomSubmitButton';
import { setCurrencySymbol } from '../../../utils/setCurrencySymbol';
import { applyProcessingFee, formatMoneyAmount } from '../../../utils/processingFee';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import { OrganisationContext } from '../../../contexts/OrganisationContextProvider';
import theme from '../../../themes';

type CatalogItem = { id: string; label: string };
type Catalog = Record<'course' | 'document' | 'club' | 'consultation', CatalogItem[]>;

const EMPTY_CATALOG: Catalog = { course: [], document: [], club: [], consultation: [] };

const ITEM_LABELS: Record<keyof Catalog, string> = {
	course: 'Course',
	document: 'Book',
	club: 'Club',
	consultation: 'Consultation',
};

const KINDS = [
	{ value: 'course', label: 'Course' },
	{ value: 'document', label: 'Book' },
	{ value: 'club', label: 'Club' },
	{ value: 'consultation', label: 'Consultation' },
	{ value: 'other', label: 'Other' },
];

const CURRENCIES = ['gbp', 'usd', 'eur', 'try'];

interface CustomPaymentLinkDialogProps {
	open: boolean;
	onClose: () => void;
}

const CustomPaymentLinkDialog = ({ open, onClose }: CustomPaymentLinkDialogProps) => {
	const baseUrl = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const fieldFont = isMobileSize ? '0.75rem' : '0.85rem';
	const selectSx = {
		'marginBottom': '0.85rem',
		'backgroundColor': theme.bgColor?.common,
		'& .MuiInputBase-input': { fontSize: fieldFont },
		'& .MuiInputLabel-root': { fontSize: fieldFont },
	};
	const [fullName, setFullName] = useState('');
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [amount, setAmount] = useState('');
	const [currency, setCurrency] = useState('gbp');
	const [kind, setKind] = useState('course');
	const [itemId, setItemId] = useState('');
	const [description, setDescription] = useState('');
	const [catalog, setCatalog] = useState<Catalog>(EMPTY_CATALOG);
	const [catalogLoading, setCatalogLoading] = useState(false);
	const [checkoutUrl, setCheckoutUrl] = useState('');
	const [sessionId, setSessionId] = useState('');
	const [emailed, setEmailed] = useState(false);
	const [confirmEmail, setConfirmEmail] = useState(false);
	const [error, setError] = useState('');
	const [copied, setCopied] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	const reset = () => {
		setFullName('');
		setEmail('');
		setPhone('');
		setAmount('');
		setCurrency('gbp');
		setKind('course');
		setItemId('');
		setDescription('');
		setCheckoutUrl('');
		setSessionId('');
		setEmailed(false);
		setConfirmEmail(false);
		setError('');
		setCopied(false);
	};

	useEffect(() => {
		if (!open || !orgId) return;
		let cancelled = false;
		const loadCatalog = async () => {
			setCatalogLoading(true);
			try {
				const [coursesRes, booksRes, clubsRes, consultationsRes] = await Promise.all([
					axios.get(`${baseUrl}/courses/organisation/${orgId}`, { params: { page: 1, limit: 500, sortBy: 'title', sortOrder: 'asc' } }),
					axios.get(`${baseUrl}/documents/organisation/${orgId}`, { params: { page: 1, limit: 500, sortBy: 'name', sortOrder: 'asc' } }),
					axios.get(`${baseUrl}/clubs/organisation/${orgId}`, { params: { page: 1, limit: 200, sortBy: 'title', sortOrder: 'asc' } }),
					axios.get(`${baseUrl}/consultations/organisation/${orgId}`, { params: { page: 1, limit: 200, sortBy: 'title', sortOrder: 'asc' } }),
				]);
				const toItems = (rows: { _id?: string; title?: string; name?: string }[] | undefined, labelKey: 'title' | 'name') =>
					(rows || [])
						.filter((row) => row._id && row[labelKey])
						.map((row) => ({ id: String(row._id), label: String(row[labelKey]) }))
						.sort((a, b) => a.label.localeCompare(b.label));
				if (cancelled) return;
				setCatalog({
					course: toItems(coursesRes.data?.data, 'title'),
					document: toItems(booksRes.data?.data, 'name'),
					club: toItems(clubsRes.data?.data, 'title'),
					consultation: toItems(consultationsRes.data?.data, 'title'),
				});
			} catch {
				if (!cancelled) setError('Could not load courses, books, clubs, and consultations.');
			} finally {
				if (!cancelled) setCatalogLoading(false);
			}
		};
		void loadCatalog();
		return () => {
			cancelled = true;
		};
	}, [open, orgId, baseUrl]);

	const handleClose = () => {
		if (submitting) return;
		reset();
		onClose();
	};

	const itemLabel = () => {
		if (kind === 'other') return description.trim();
		return catalog[kind as keyof Catalog].find((item) => item.id === itemId)?.label || '';
	};
	const priceQuote = applyProcessingFee(Number(amount) || 0, null);
	const money = (value: number) => `${setCurrencySymbol(currency)}${formatMoneyAmount(value)}`;

	const validate = () => {
		if (!fullName.trim() || !email.trim()) return 'Full name and email are required.';
		if (kind === 'other' && !description.trim()) return 'Describe what this payment is for.';
		if (kind !== 'other' && !itemId) return `Choose a ${ITEM_LABELS[kind as keyof Catalog].toLowerCase()}.`;
		const parsedAmount = Number(amount);
		if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return 'Enter an amount greater than 0.';
		return '';
	};

	const handleCreate = async () => {
		const validationError = validate();
		if (validationError) {
			setError(validationError);
			return;
		}
		setError('');
		setCopied(false);
		setSubmitting(true);
		try {
			const response = await axios.post(`${baseUrl}/payments/admin/custom-link`, {
				fullName: fullName.trim(),
				email: email.trim(),
				phone: phone.trim(),
				amount: Number(amount),
				currency,
				kind,
				itemId,
				description: description.trim(),
			});
			setCheckoutUrl(response.data?.checkoutUrl || '');
			setSessionId(response.data?.sessionId || '');
		} catch (err: any) {
			setError(err?.response?.data?.message || 'Payment link could not be created.');
		} finally {
			setSubmitting(false);
		}
	};

	const handleEmail = async () => {
		if (!sessionId) return;
		setError('');
		setSubmitting(true);
		try {
			await axios.post(`${baseUrl}/payments/admin/custom-link/email`, { sessionId });
			setEmailed(true);
			setConfirmEmail(false);
		} catch (err: any) {
			setError(err?.response?.data?.message || 'Payment link could not be emailed.');
			setConfirmEmail(false);
		} finally {
			setSubmitting(false);
		}
	};

	const handleCopy = async () => {
		if (!checkoutUrl) return;
		try {
			await navigator.clipboard.writeText(checkoutUrl);
			setCopied(true);
		} catch {
			setCopied(false);
		}
	};

	return (
		<CustomDialog openModal={open} closeModal={handleClose} title='Payment Link' maxWidth='sm'>
			<Box sx={{ display: 'flex', flexDirection: 'column', px: isMobileSize ? '1rem' : '1.5rem', pt: '0.75rem' }}>
				<CustomTextField label='Full name' value={fullName} onChange={(e) => setFullName(e.target.value)} required fullWidth disabled={!!checkoutUrl} />
				<CustomTextField label='Email' type='email' value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth disabled={!!checkoutUrl} />
				<CustomTextField
					label='Phone'
					type='tel'
					value={phone}
					onChange={(e) => setPhone(e.target.value)}
					required={false}
					fullWidth
					disabled={!!checkoutUrl}
				/>
				<Box sx={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
					<CustomTextField
						label='Amount'
						type='number'
						value={amount}
						onChange={(e) => setAmount(e.target.value)}
						required
						fullWidth
						disabled={!!checkoutUrl}
						sx={{ flex: 1 }}
					/>
					<TextField
						select
						label='Currency'
						value={currency}
						onChange={(e) => setCurrency(e.target.value)}
						size='small'
						required
						disabled={!!checkoutUrl}
						sx={{ ...selectSx, width: '7.5rem', flexShrink: 0 }}>
						{CURRENCIES.map((code) => (
							<MenuItem key={code} value={code} sx={{ fontSize: fieldFont }}>
								{code.toUpperCase()}
							</MenuItem>
						))}
					</TextField>
				</Box>
				<TextField
					select
					label='For'
					value={kind}
					onChange={(e) => {
						setKind(e.target.value);
						setItemId('');
						setDescription('');
					}}
					size='small'
					fullWidth
					required
					disabled={!!checkoutUrl}
					sx={selectSx}>
					{KINDS.map((option) => (
						<MenuItem key={option.value} value={option.value} sx={{ fontSize: fieldFont }}>
							{option.label}
						</MenuItem>
					))}
				</TextField>
				{kind !== 'other' && (
					<TextField
						select
						label={ITEM_LABELS[kind as keyof Catalog]}
						value={itemId}
						onChange={(e) => setItemId(e.target.value)}
						size='small'
						fullWidth
						required
						disabled={!!checkoutUrl || catalogLoading}
						sx={selectSx}>
						<MenuItem value='' disabled sx={{ fontSize: fieldFont }}>
							{catalogLoading ? 'Loading...' : catalog[kind as keyof Catalog].length === 0 ? 'None found' : 'Select'}
						</MenuItem>
						{catalog[kind as keyof Catalog].map((item) => (
							<MenuItem key={item.id} value={item.id} sx={{ fontSize: fieldFont }}>
								{item.label}
							</MenuItem>
						))}
					</TextField>
				)}
				{kind === 'other' && (
					<CustomTextField
						label='What is this payment for?'
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						required
						fullWidth
						disabled={!!checkoutUrl}
						placeholder='e.g. Exam fee'
					/>
				)}
				{error && (
					<Typography variant='body2' sx={{ color: 'error.main', mb: '0.75rem', fontSize: fieldFont }}>
						{error}
					</Typography>
				)}
				{checkoutUrl && (
					<Box sx={{ mb: '0.85rem' }}>
						<Typography variant='body2' sx={{ mb: '0.5rem', fontSize: fieldFont }}>
							{emailed ? `The payment link was emailed to ${email.trim()}.` : 'Copy this link and send it to the payer.'}
						</Typography>
						<CustomTextField value={checkoutUrl} fullWidth required={false} disableSanitization InputProps={{ readOnly: true }} sx={{ marginBottom: 0 }} />
					</Box>
				)}
			</Box>
			<DialogActions sx={{ px: isMobileSize ? '1rem' : '1.5rem', mb: isMobileSize ? '0.5rem' : '1rem' }}>
				<CustomCancelButton disabled={submitting || confirmEmail} onClick={handleClose} sx={{ margin: '0 0.5rem 0.5rem 0' }}>
					Close
				</CustomCancelButton>
				{checkoutUrl ? (
					<>
						<CustomSubmitButton type='button' disabled={submitting} onClick={handleCopy} sx={{ margin: '0 0.5rem 0.5rem 0' }}>
							{copied ? 'Copied' : 'Copy link'}
						</CustomSubmitButton>
						<CustomSubmitButton type='button' disabled={submitting || confirmEmail} onClick={() => setConfirmEmail(true)} sx={{ margin: '0 0.5rem 0.5rem 0' }}>
							Email link
						</CustomSubmitButton>
					</>
				) : (
					<CustomSubmitButton type='button' disabled={submitting} onClick={handleCreate} sx={{ margin: '0 0.5rem 0.5rem 0' }}>
						{submitting ? 'Creating...' : 'Create link'}
					</CustomSubmitButton>
				)}
			</DialogActions>
			<CustomDialog
				openModal={confirmEmail}
				closeModal={() => {
					if (!submitting) setConfirmEmail(false);
				}}
				disableDismiss={submitting}
				maxWidth='xs'
				title='Are you sure?'>
				<DialogContent>
					<Typography variant='body2' sx={{ fontSize: fieldFont, mb: '0.75rem' }}>
						Are you sure you want to email this payment link to {email.trim()}?
					</Typography>
					<Typography variant='body2' sx={{ fontSize: fieldFont }}>
						Name: {fullName.trim()}
					</Typography>
					<Typography variant='body2' sx={{ fontSize: fieldFont }}>
						Email: {email.trim()}
					</Typography>
					{phone.trim() && (
						<Typography variant='body2' sx={{ fontSize: fieldFont }}>
							Phone: {phone.trim()}
						</Typography>
					)}
					<Typography variant='body2' sx={{ fontSize: fieldFont }}>
						Amount: {money(priceQuote.baseAmount)}
					</Typography>
					<Typography variant='body2' sx={{ fontSize: fieldFont }}>
						Processing fee ({priceQuote.processingFeePercent}%): {money(priceQuote.processingFee)}
					</Typography>
					<Typography variant='body2' sx={{ fontSize: fieldFont }}>
						Total: {money(priceQuote.total)}
					</Typography>
					<Typography variant='body2' sx={{ fontSize: fieldFont }}>
						For: {KINDS.find((option) => option.value === kind)?.label}
						{itemLabel() ? ` — ${itemLabel()}` : ''}
					</Typography>
				</DialogContent>
				<DialogActions>
					<CustomCancelButton sx={{ margin: '0 0.5rem 0.5rem 0' }} disabled={submitting} onClick={() => setConfirmEmail(false)}>
						Cancel
					</CustomCancelButton>
					<CustomSubmitButton type='button' disabled={submitting} onClick={handleEmail} sx={{ margin: '0 1rem 0.5rem 0' }}>
						{submitting ? 'Sending...' : 'Send'}
					</CustomSubmitButton>
				</DialogActions>
			</CustomDialog>
		</CustomDialog>
	);
};

export default CustomPaymentLinkDialog;
