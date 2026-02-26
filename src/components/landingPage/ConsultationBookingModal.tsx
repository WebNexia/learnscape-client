import {
	Box,
	Typography,
	Button,
	Stepper,
	Step,
	StepLabel,
	Dialog,
	DialogContent,
	DialogTitle,
	IconButton,
	CircularProgress,
	Alert,
	FormLabel,
	Radio,
	RadioGroup,
	FormControlLabel,
	Checkbox,
} from '@mui/material';
import { Close, ArrowBack, ArrowForward, ShoppingCart, EventAvailable, Check } from '@mui/icons-material';
import { useContext, useEffect, useState, Fragment } from 'react';
import { OrganisationContext } from '../../contexts/OrganisationContextProvider';
import { Consultation } from '../../interfaces/consultation';
import { useConsultationCart } from '../../contexts/ConsultationCartContextProvider';
import { consultationsService, SlotWithConsultants } from '../../services/consultationsService';
import { feedbackFormsService } from '../../services/feedbackFormsService';
import { FeedbackForm, FeedbackFormField } from '../../interfaces/feedbackForm';
import CustomTextField from '../forms/customFields/CustomTextField';
import CustomErrorMessage from '../forms/customFields/CustomErrorMessage';
import { setCurrencySymbol } from '../../utils/setCurrencySymbol';
import { format, addDays, isBefore, startOfToday } from 'date-fns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { useGeoLocation } from '../../hooks/useGeoLocation';
import theme from '../../themes';

const STEP_LABELS = ['Tarih', 'Oturum', 'Danışman', 'Özet', 'Anket'];

function getPriceForConsultation(c: Consultation): { currency: string; amount: string } | null {
	if (!c.prices?.length) return { currency: 'try', amount: '0' };
	const first = c.prices[0];
	if (first.amount === '0' || first.amount?.toLowerCase() === 'free' || !first.amount?.trim())
		return { currency: first.currency || 'try', amount: '0' };
	return { currency: first.currency, amount: first.amount };
}

const FORM_ERROR_TR: Record<string, string> = {
	'Network Error': 'Bağlantı hatası.',
	'Request failed with status code 400': 'Geçersiz istek.',
	'Request failed with status code 401': 'Yetkisiz erişim.',
	'Request failed with status code 403': 'Erişim engellendi.',
	'Request failed with status code 404': 'Bulunamadı.',
	'Request failed with status code 500': 'Sunucu hatası.',
	timeout: 'İstek zaman aşımına uğradı.',
	'path `value` is required': 'Lütfen tüm zorunlu alanları doldurun.',
	'validation failed': 'Lütfen tüm zorunlu alanları doldurun.',
};

function toFormErrorTr(msg: string | undefined): string {
	if (!msg?.trim()) return 'Anket gönderilemedi.';
	const lower = msg.toLowerCase();
	for (const [en, tr] of Object.entries(FORM_ERROR_TR)) {
		if (lower.includes(en.toLowerCase())) return tr;
	}
	return msg;
}

interface ConsultationBookingModalProps {
	open: boolean;
	onClose: () => void;
	consultation: Consultation | null;
	consultationId?: string;
	onAddedToCart?: () => void;
}

export default function ConsultationBookingModal({
	open,
	onClose,
	consultation: consultationProp,
	consultationId,
	onAddedToCart,
}: ConsultationBookingModalProps) {
	const { orgId } = useContext(OrganisationContext);
	const location = useGeoLocation();
	const { items: consultationCartItems, addItem } = useConsultationCart();
	const [consultation, setConsultation] = useState<Consultation | null>(consultationProp ?? null);
	const [loadingConsultation, setLoadingConsultation] = useState(false);
	const [activeStep, setActiveStep] = useState(0);
	const [error, setError] = useState<string | null>(null);

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	// Step 1: date
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);
	// Step 2: slots
	const [slots, setSlots] = useState<SlotWithConsultants[]>([]);
	const [slotsLoading, setSlotsLoading] = useState(false);
	const [selectedSlot, setSelectedSlot] = useState<SlotWithConsultants | null>(null);
	// Step 3: consultant
	const [selectedConsultant, setSelectedConsultant] = useState<{ _id: string; firstName?: string; lastName?: string } | null>(null);
	// Step 4: form (contact collected at checkout)
	const [form, setForm] = useState<FeedbackForm | null>(null);
	const [formResponses, setFormResponses] = useState<Record<string, unknown>>({});
	const [formSubmitted, setFormSubmitted] = useState(false);
	const [formSubmissionId, setFormSubmissionId] = useState<string | null>(null);
	const [formSubmitting, setFormSubmitting] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);
	// Free consultation: contact collected in modal (no cart)
	const [freeGuestFirstName, setFreeGuestFirstName] = useState('');
	const [freeGuestLastName, setFreeGuestLastName] = useState('');
	const [freeGuestEmail, setFreeGuestEmail] = useState('');
	const [freeGuestPhone, setFreeGuestPhone] = useState('');
	const [freeConfirmLoading, setFreeConfirmLoading] = useState(false);

	const isSlotInCart = consultation && selectedSlot ? consultationCartItems.some((i) => i.consultationId === consultation._id && i.slotId === selectedSlot._id) : false;
	const priceObj = consultation ? getPriceForConsultation(consultation) : null;
	const isFree = priceObj?.amount === '0';
	const requireForm = Boolean(consultation?.requireFormSubmission && consultation?.feedbackFormId);
	const feedbackForm = consultation?.feedbackFormId as unknown as { publicLink?: string } | undefined;
	const publicLink = feedbackForm?.publicLink ?? (consultation as unknown as { feedbackForm?: { publicLink?: string } })?.feedbackForm?.publicLink;

	const stepCount = requireForm ? 5 : 4;
	const stepLabels = requireForm ? STEP_LABELS : STEP_LABELS.filter((_, i) => i !== 4);

	const resetState = () => {
		setActiveStep(0);
		setSelectedDate(null);
		setSlots([]);
		setSelectedSlot(null);
		setSelectedConsultant(null);
		setFormResponses({});
		setFormSubmitted(false);
		setFormSubmissionId(null);
		setFormError(null);
		setError(null);
		setFreeGuestFirstName('');
		setFreeGuestLastName('');
		setFreeGuestEmail('');
		setFreeGuestPhone('');
	};

	useEffect(() => {
		if (!open) return;
		resetState();
	}, [open]);

	useEffect(() => {
		if (!open || !orgId) return;
		const id = consultationId ?? consultationProp?._id;
		if (!id) {
			setConsultation(consultationProp ?? null);
			return;
		}
		setLoadingConsultation(true);
		consultationsService
			.getConsultationByIdPublic(orgId, id)
			.then(setConsultation)
			.catch(() => setConsultation(null))
			.finally(() => setLoadingConsultation(false));
	}, [open, orgId, consultationId, consultationProp]);

	useEffect(() => {
		if (!open || !consultation) return;
		const reqForm = Boolean(consultation.requireFormSubmission && consultation.feedbackFormId);
		const fb = consultation.feedbackFormId as unknown as { publicLink?: string } | undefined;
		const link = fb?.publicLink ?? (consultation as unknown as { feedbackForm?: { publicLink?: string } }).feedbackForm?.publicLink;
		if (reqForm && link) {
			feedbackFormsService.getFeedbackFormByPublicLink(link).then(setForm).catch(() => setForm(null));
		} else {
			setForm(null);
		}
	}, [open, consultation]);

	useEffect(() => {
		if (!open || !selectedDate || !consultation?._id) return;
		setSlotsLoading(true);
		setError(null);
		const dateStr = format(selectedDate, 'yyyy-MM-dd');
		consultationsService
			.getAvailableSlots(consultation?._id, { date: dateStr })
			.then((data) => {
				setSlots(data);
				setSelectedSlot(null);
				setSelectedConsultant(null);
			})
			.catch(() => {
				setError('Uygun oturumlar yüklenemedi.');
				setSlots([]);
			})
			.finally(() => setSlotsLoading(false));
	}, [open, selectedDate, consultation?._id]);

	useEffect(() => {
		if (!selectedSlot) {
			setSelectedConsultant(null);
			return;
		}
		const consultants = selectedSlot.consultants?.length ? selectedSlot.consultants : [];
		if (consultants.length === 1) setSelectedConsultant(consultants[0]);
		else setSelectedConsultant(null);
	}, [selectedSlot]);

	const handleNext = () => {
		setError(null);
		if (activeStep === stepCount - 1) {
			if (isFree) {
				handleFreeConfirm();
				return;
			}
			handleAddToCart();
			return;
		}
		setActiveStep((s) => s + 1);
	};

	const handleBack = () => {
		setError(null);
		setActiveStep((s) => Math.max(0, s - 1));
	};

	const canProceed = () => {
		if (activeStep === 0) return !!selectedDate && !isBefore(selectedDate, startOfToday());
		if (activeStep === 1) return !!selectedSlot;
		if (activeStep === 2) return !!selectedConsultant;
		if (activeStep === 4 && requireForm) return formSubmitted;
		if (activeStep === stepCount - 1 && isFree) {
			const fn = freeGuestFirstName.trim();
			const ln = freeGuestLastName.trim();
			const em = freeGuestEmail.trim();
			return !!fn && !!ln && !!em && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em);
		}
		if (activeStep === stepCount - 1) return true;
		return true;
	};

	const handleFormSubmit = async () => {
		if (!form || !publicLink) {
			setFormError('Lütfen anketi doldurun.');
			return;
		}
		const responses = form.fields.map((f) => ({ fieldId: f.fieldId, value: formResponses[f.fieldId] }));
		const missing = form.fields.filter((f) => f.required && (formResponses[f.fieldId] === undefined || formResponses[f.fieldId] === ''));
		if (missing.length) {
			setFormError('Lütfen tüm zorunlu alanları doldurun.');
			return;
		}
		setFormSubmitting(true);
		setFormError(null);
		try {
			const saved = await feedbackFormsService.submitFeedbackForm(publicLink, {
				responses,
				userName: '',
				userEmail: '',
				consultationId: consultation?._id,
			});
			setFormSubmitted(true);
			if (saved && typeof (saved as { _id?: string })._id === 'string') {
				setFormSubmissionId((saved as { _id: string })._id);
			}
		} catch (e: unknown) {
			const apiMsg = (e as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ?? (e as { message?: string })?.message;
			setFormError(toFormErrorTr(apiMsg) || 'Anket gönderilemedi.');
		} finally {
			setFormSubmitting(false);
		}
	};

	const handleFreeConfirm = async () => {
		if (!consultation || !selectedSlot || !selectedConsultant) return;
		const firstName = freeGuestFirstName.trim();
		const lastName = freeGuestLastName.trim();
		const email = freeGuestEmail.trim();
		const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
		if (!firstName) {
			setError('Lütfen adınızı girin.');
			return;
		}
		if (!lastName) {
			setError('Lütfen soyadınızı girin.');
			return;
		}
		if (!email) {
			setError('Lütfen e-posta adresinizi girin.');
			return;
		}
		if (!emailValid) {
			setError('Geçerli bir e-posta adresi girin.');
			return;
		}
		setFreeConfirmLoading(true);
		setError(null);
		try {
			const guestName = `${firstName} ${lastName}`.trim();
			const { appointmentId } = await consultationsService.createFreeAppointment(consultation._id, {
				slotId: selectedSlot._id,
				consultantId: selectedConsultant._id,
				guestName,
				guestEmail: email,
				guestPhone: freeGuestPhone.trim() || undefined,
			});
			if (formSubmissionId) {
				try {
					await feedbackFormsService.linkSubmissionToAppointment(formSubmissionId, {
						firstName,
						lastName,
						userEmail: email,
						consultationAppointmentId: appointmentId,
					});
				} catch (_e) {
					// non-blocking
				}
			}
			onAddedToCart?.();
			onClose();
		} catch (e: unknown) {
			const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
			setError(msg || 'Ücretsiz randevu oluşturulamadı.');
		} finally {
			setFreeConfirmLoading(false);
		}
	};

	const handleAddToCart = () => {
		if (!consultation || !selectedSlot || !selectedConsultant || !priceObj) return;
		addItem({
			consultationId: consultation._id,
			consultationTitle: consultation.title,
			consultationDuration: consultation.duration ?? 60,
			coverImageUrl: consultation.coverImageUrl,
			slotId: selectedSlot._id,
			slotStart: selectedSlot.slotStart,
			slotDuration: selectedSlot.duration,
			consultantId: selectedConsultant._id,
			consultantName: [selectedConsultant.firstName, selectedConsultant.lastName].filter(Boolean).join(' ') || 'Danışman',
			guestName: '',
			guestEmail: '',
			guestPhone: '',
			price: { currency: priceObj.currency, amount: priceObj.amount },
			formSubmissionId: formSubmissionId ?? undefined,
		});
		onAddedToCart?.();
		onClose();
	};

	const minDate = startOfToday();
	const maxDate = addDays(minDate, 60);

	const renderStepContent = () => {
		if (activeStep === 0) {
			return (
				<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: '2rem', pb: '1rem', margin: '0 auto', }}>
					<Typography sx={{ mb: 2, fontFamily: 'Varela Round', textAlign: 'center', fontSize: isMobileSize ? '0.85rem' : '0.95rem' }}>Randevu tarihini seçin</Typography>
					<LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="tr">
						<DatePicker
							label="Tarih"
							value={selectedDate ? dayjs(selectedDate) : null}
							onChange={(d) => setSelectedDate(d ? d.toDate() : null)}
							minDate={dayjs(minDate)}
							maxDate={dayjs(maxDate)}
							slotProps={{
								textField: {
									sx: { fontFamily: 'Varela Round', },
									InputLabelProps: {
										sx: { fontFamily: 'Varela Round', fontSize: '0.9rem' },
									},
								},
								desktopPaper: {
									sx: {
										fontFamily: 'Varela Round',
										'& .MuiPickersCalendarHeader-label': { fontFamily: 'Varela Round', fontWeight: 600 },
										'& .MuiDayCalendar-weekDayLabel': { fontFamily: 'Varela Round' },
										'& .MuiPickersDay-root': { fontFamily: 'Varela Round' },
										'& .MuiPickersDay-root.Mui-selected': {
											background: '#FF6B3D',
											'&:hover': { background: '#ff7d55' },
										},
										'& .MuiPickersDay-root:not(.Mui-selected):hover': {
											backgroundColor: 'rgba(255, 107, 61, 0.12)',
										},
										'& .MuiPickersArrowSwitcher-button': { color: '#2d3a4a' },
										'& .MuiPickersLayout-actionBar .MuiButton-root': {
											fontFamily: 'Varela Round',
											color: '#FF6B3D',
										},
									},
								},
							}}
							sx={{
								'& .MuiInputBase-root': { fontFamily: 'Varela Round' },
								'& .MuiInputLabel-root': { fontFamily: 'Varela Round' },
							}}
						/>
					</LocalizationProvider>
				</Box>
			);
		}

		if (activeStep === 1) {
			return (
				<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: '2rem', pb: '1rem' }}>
					<Typography sx={{ mb: 2, fontFamily: 'Varela Round', fontWeight: 600 }}>Uygun oturumlar</Typography>
					{slotsLoading ? (
						<Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
							<CircularProgress />
						</Box>
					) : slots.length === 0 ? (
						<Typography color="text.secondary" sx={{ fontFamily: 'Varela Round', fontSize: isMobileSize ? '0.85rem' : '0.9rem' }}>
							Bu tarihte uygun oturum yok
						</Typography>
					) : (
						<Box
							sx={{
								display: 'grid',
								gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
								gap: 1.5,
								width: '100%',
								maxWidth: 360,
							}}
						>
							{slots.map((slot) => {
								const start = new Date(slot.slotStart);
								const isSelected = selectedSlot?._id === slot._id;
								return (
									<Box
										key={slot._id}
										onClick={() => setSelectedSlot(slot)}
										role="button"
										tabIndex={0}
										onKeyDown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
												e.preventDefault();
												setSelectedSlot(slot);
											}
										}}
										sx={{
											fontFamily: 'Varela Round',
											py: 1.5,
											px: 2,
											borderRadius: 2,
											border: '2px solid',
											borderColor: isSelected ? 'primary.main' : 'divider',
											bgcolor: isSelected ? 'primary.main' : 'grey.50',
											color: isSelected ? 'primary.contrastText' : 'text.primary',
											fontWeight: isSelected ? 600 : 500,
											fontSize: '0.95rem',
											textAlign: 'center',
											cursor: 'pointer',
											transition: 'all 0.2s ease',
											'& .slot-duration': {
												color: isSelected ? 'primary.contrastText' : 'inherit',
											},
											'&:hover': {
												borderColor: 'primary.main',
												bgcolor: isSelected ? 'primary.main' : 'primary.light',
												color: 'primary.contrastText',
												'& .slot-duration': { color: 'primary.contrastText' },
											},
										}}
									>
										{format(start, 'HH:mm')}
										<Typography className="slot-duration" component="span" sx={{ display: 'block', fontSize: '0.75rem', opacity: 0.9, mt: 0.25 }}>
											{slot.duration} dk
										</Typography>
									</Box>
								);
							})}
						</Box>
					)}
				</Box>
			);
		}

		if (activeStep === 2) {
			const consultants = selectedSlot?.consultants?.length ? selectedSlot.consultants : [];
			return (
				<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: '2rem', pb: '1rem' }}>
					<Typography sx={{ mb: 2, fontFamily: 'Varela Round', fontWeight: 600 }}>Danışman seçin</Typography>
					{consultants.length === 0 ? (
						<Typography color="text.secondary" sx={{ fontFamily: 'Varela Round' }}>Danışman bilgisi yok.</Typography>
					) : (
						<Box
							sx={{
								display: 'grid',
								gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
								gap: 1.5,
								width: '100%',
								maxWidth: 400,
							}}
						>
							{consultants.map((c) => {
								const name = [c.firstName, c.lastName].filter(Boolean).join(' ') || 'Danışman';
								const isSelected = selectedConsultant?._id === c._id;
								return (
									<Box
										key={c._id}
										onClick={() => setSelectedConsultant(c)}
										role="button"
										tabIndex={0}
										onKeyDown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
												e.preventDefault();
												setSelectedConsultant(c);
											}
										}}
										sx={{
											fontFamily: 'Varela Round',
											py: 1.5,
											px: 2,
											borderRadius: 2,
											border: '2px solid',
											borderColor: isSelected ? 'primary.main' : 'divider',
											bgcolor: isSelected ? 'primary.main' : 'grey.50',
											color: isSelected ? 'primary.contrastText' : 'text.primary',
											fontWeight: isSelected ? 600 : 500,
											fontSize: '0.95rem',
											textAlign: 'center',
											cursor: 'pointer',
											transition: 'all 0.2s ease',
											'&:hover': {
												borderColor: 'primary.main',
												bgcolor: isSelected ? 'primary.main' : 'primary.light',
												color: 'primary.contrastText',
											},
										}}
									>
										{name}
									</Box>
								);
							})}
						</Box>
					)}
				</Box>
			);
		}


		// Summary step (step 3 – before Form when requireForm)
		if (activeStep === 3) {
			const rows: { label: string; value: string }[] = [
				{ label: 'Tarih / Oturum', value: selectedSlot ? format(new Date(selectedSlot.slotStart), 'dd.MM.yyyy HH:mm') : '—' },
				{ label: 'Danışman', value: selectedConsultant ? [selectedConsultant.firstName, selectedConsultant.lastName].filter(Boolean).join(' ') || '—' : '—' },
				{ label: 'Süre', value: `${consultation?.duration ?? 60} dk` },
				{ label: 'Tutar', value: priceObj ? (priceObj.amount === '0' ? 'Ücretsiz' : `${setCurrencySymbol(priceObj.currency ?? 'try')}${priceObj.amount}`) : '—' },
				{ label: 'İletişim', value: isFree ? 'Aşağıda girin' : 'Ödeme sayfasında girilecek' },
			];
			return (
				<Box sx={{ pt: '2rem', pb: '1rem', width: '100%', maxWidth: 420, mx: 'auto' }}>
					{isFree && (
						<Box sx={{ mb: 2 }}>
							<Typography sx={{ fontFamily: 'Varela Round', fontWeight: 600, fontSize: '0.9rem', mb: 1.5 }}>İletişim bilgileriniz</Typography>
							<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
								<CustomTextField fullWidth size="small" label="Ad" value={freeGuestFirstName} onChange={(e) => setFreeGuestFirstName(e.target.value)} placeholder="Adınız" required />
								<CustomTextField fullWidth size="small" label="Soyad" value={freeGuestLastName} onChange={(e) => setFreeGuestLastName(e.target.value)} placeholder="Soyadınız" required />
								<CustomTextField fullWidth size="small" type="email" label="E-posta" value={freeGuestEmail} onChange={(e) => setFreeGuestEmail(e.target.value)} placeholder="ornek@email.com" required InputProps={{ inputProps: { maxLength: 254 } }} />
								<Box sx={{ '& .react-tel-input': { fontFamily: 'Varela Round' }, '& .form-control': { width: '100% !important', fontFamily: 'Varela Round' } }}>
									<PhoneInput
										country={location?.countryCode?.toLowerCase() || 'tr'}
										enableSearch
										searchPlaceholder="Ülke arayın..."
										searchNotFound="Ülke bulunamadı"
										countryCodeEditable={false}
										specialLabel=""
										value={freeGuestPhone}
										onChange={(phoneNumber: string) => {
											const formatted = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
											setFreeGuestPhone(formatted);
										}}
										inputProps={{
											placeholder: 'Telefon (isteğe bağlı)',
											style: {
												width: '100%',
												height: '2.25rem',
												fontFamily: 'Varela Round',
												fontSize: '0.9rem',
												borderRadius: '0.5rem',
												border: '1px solid rgba(0, 0, 0, 0.23)',
											},
										}}
										containerStyle={{ marginBottom: '0.5rem', color: theme.textColor?.secondary?.main, fontFamily: 'Varela Round' }}
										buttonStyle={{ borderRadius: '0.35rem 0 0 0.35rem', border: '1px solid rgba(0, 0, 0, 0.23)', backgroundColor: 'transparent' }}
										dropdownStyle={{ borderRadius: '0.35rem', border: '1px solid rgba(0, 0, 0, 0.23)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', fontFamily: 'Varela Round' }}
										searchStyle={{ width: '100%', height: '2rem', fontFamily: 'Varela Round', fontSize: '0.85rem', borderRadius: '0.5rem', border: '1px solid rgba(0, 0, 0, 0.23)', margin: '0.5rem 0' }}
									/>
								</Box>
							</Box>
						</Box>
					)}
					<Box
						sx={{
							fontFamily: 'Varela Round',
							display: 'grid',
							gridTemplateColumns: 'auto 1fr',
							gap: 0,
							borderRadius: 2,
							overflow: 'hidden',
							border: '1px solid',
							borderColor: 'divider',
							boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
						}}
					>
						{rows.map((row, i) => (
							<Fragment key={row.label}>
								<Box
									sx={{
										px: 2,
										py: 1.25,
										bgcolor: i % 2 === 0 ? 'grey.50' : 'background.paper',
										fontWeight: 600,
										fontSize: isMobileSize ? '0.8rem' : '0.9rem',
										color: 'text.secondary',
										borderBottom: i < rows.length - 1 ? '1px solid' : 'none',
										borderColor: 'divider',
									}}
								>
									{row.label}
								</Box>
								<Box
									sx={{
										px: 2,
										py: 1.25,
										bgcolor: i % 2 === 0 ? 'grey.50' : 'background.paper',
										fontSize: isMobileSize ? '0.8rem' : '0.9rem',
										borderBottom: i < rows.length - 1 ? '1px solid' : 'none',
										borderColor: 'divider',
									}}
								>
									{row.value}
								</Box>
							</Fragment>
						))}
					</Box>
				</Box>
			);
		}

		// Anket step (step 4 – after Özet when requireForm)
		if (requireForm && activeStep === 4) {
			return (
				<Box sx={{ py: 2 }}>
					{formSubmitted ? (
						<Alert severity="success" sx={{ fontFamily: 'Varela Round' }}>Anket gönderildi.</Alert>
					) : form ? (
						<Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
							{form.fields.map((field) => (
								<Box key={field.fieldId}>
									<FormLabel required={field.required} sx={{ fontFamily: 'Varela Round', display: 'block', mb: 0.5 }}>
										{field.label}
									</FormLabel>
									{renderFormField(field)}
								</Box>
							))}
							<Button
								variant="contained"
								onClick={handleFormSubmit}
								disabled={formSubmitting || isSlotInCart}
								sx={{ fontFamily: 'Varela Round', textTransform: 'capitalize' }}
							>
								{formSubmitting ? 'Gönderiliyor...' : isSlotInCart ? 'Eklendi' : 'Anketi Gönder'}
							</Button>
							{formError && (
								<CustomErrorMessage sx={{ fontFamily: 'Varela Round', mt: 1 }}>
									{formError}
								</CustomErrorMessage>
							)}
						</Box>
					) : (
						<Typography color="text.secondary">Anket yükleniyor...</Typography>
					)}
					{isFree && (
						<Box sx={{ mt: 2 }}>
							<Typography sx={{ fontFamily: 'Varela Round', fontWeight: 600, fontSize: '0.9rem', mb: 1.5 }}>İletişim bilgileriniz</Typography>
							<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
								<CustomTextField fullWidth size="small" label="Ad" value={freeGuestFirstName} onChange={(e) => setFreeGuestFirstName(e.target.value)} placeholder="İsminiz" required InputProps={{ inputProps: { maxLength: 50 } }} />
								<CustomTextField fullWidth size="small" label="Soyad" value={freeGuestLastName} onChange={(e) => setFreeGuestLastName(e.target.value)} placeholder="Soy İsminiz" required InputProps={{ inputProps: { maxLength: 50 } }} />
								<CustomTextField fullWidth size="small" type="email" label="E-posta" value={freeGuestEmail} onChange={(e) => setFreeGuestEmail(e.target.value)} placeholder="ornek@email.com" required InputProps={{ inputProps: { maxLength: 254 } }} />
								<Box sx={{ '& .react-tel-input': { fontFamily: 'Varela Round' }, '& .form-control': { width: '100% !important', fontFamily: 'Varela Round' } }}>
									<PhoneInput
										country={location?.countryCode?.toLowerCase() || 'tr'}
										enableSearch
										searchPlaceholder="Ülke arayın..."
										searchNotFound="Ülke bulunamadı"
										countryCodeEditable={false}
										specialLabel=""
										value={freeGuestPhone}
										onChange={(phoneNumber: string) => {
											const formatted = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
											setFreeGuestPhone(formatted);
										}}
										inputProps={{
											placeholder: 'Telefon (isteğe bağlı)',
											style: {
												width: '100%',
												height: '2.25rem',
												fontFamily: 'Varela Round',
												fontSize: '0.9rem',
												borderRadius: '0.5rem',
												border: '1px solid rgba(0, 0, 0, 0.23)',
											},
										}}
										containerStyle={{ marginBottom: '0.5rem', color: theme.textColor?.secondary?.main, fontFamily: 'Varela Round' }}
										buttonStyle={{ borderRadius: '0.35rem 0 0 0.35rem', border: '1px solid rgba(0, 0, 0, 0.23)', backgroundColor: 'transparent' }}
										dropdownStyle={{ borderRadius: '0.35rem', border: '1px solid rgba(0, 0, 0, 0.23)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', fontFamily: 'Varela Round' }}
										searchStyle={{ width: '100%', height: '2rem', fontFamily: 'Varela Round', fontSize: '0.85rem', borderRadius: '0.5rem', border: '1px solid rgba(0, 0, 0, 0.23)', margin: '0.5rem 0' }}
									/>
								</Box>
							</Box>
						</Box>
					)}
				</Box>
			);
		}

		return null;
	};

	function renderFormField(field: FeedbackFormField) {
		const value = formResponses[field.fieldId];
		const setValue = (v: unknown) => setFormResponses((prev) => ({ ...prev, [field.fieldId]: v }));

		switch (field.type) {
			case 'text':
				return (
					<CustomTextField
						fullWidth
						value={(value as string) ?? ''}
						onChange={(e) => setValue(e.target.value)}
						placeholder={field.placeholder}
					/>
				);
			case 'textarea':
				return (
					<CustomTextField
						fullWidth
						multiline
						rows={3}
						value={(value as string) ?? ''}
						onChange={(e) => setValue(e.target.value)}
						placeholder={field.placeholder}
					/>
				);
			case 'rating':
				const min = field.minRating ?? 1;
				const max = field.maxRating ?? 5;
				return (
					<Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
						{[...Array(max - min + 1)].map((_, i) => {
							const v = min + i;
							return (
								<Button
									key={v}
									variant={value === v ? 'contained' : 'outlined'}
									size="small"
									onClick={() => setValue(v)}
									sx={{ minWidth: 40, fontFamily: 'Varela Round' }}
								>
									{v}
								</Button>
							);
						})}
					</Box>
				);
			case 'multiple-choice':
				return (
					<RadioGroup value={(value as string) ?? ''} onChange={(e) => setValue(e.target.value)}>
						{field.options?.map((opt) => (
							<FormControlLabel key={opt} value={opt} control={<Radio />} label={opt} sx={{ fontFamily: 'Varela Round' }} />
						))}
					</RadioGroup>
				);
			case 'checkbox':
				const arr = (value as string[]) ?? [];
				return (
					<Box>
						{field.options?.map((opt) => (
							<FormControlLabel
								key={opt}
								control={
									<Checkbox
										checked={arr.includes(opt)}
										onChange={(e) =>
											setValue(e.target.checked ? [...arr, opt] : arr.filter((x) => x !== opt))
										}
									/>
								}
								label={opt}
								sx={{ fontFamily: 'Varela Round', display: 'block' }}
							/>
						))}
					</Box>
				);
			case 'date':
				return (
					<CustomTextField
						fullWidth
						type="date"
						value={(value as string) ?? ''}
						onChange={(e) => setValue(e.target.value)}
						InputLabelProps={{ shrink: true }}
					/>
				);
			default:
				return (
					<CustomTextField
						fullWidth
						value={(value as string) ?? ''}
						onChange={(e) => setValue(e.target.value)}
					/>
				);
		}
	}

	if (!consultation && !loadingConsultation) return null;

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="sm"
			fullWidth
			PaperProps={{
				sx: {
					borderRadius: 2,
					boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
					fontFamily: 'Varela Round',
					padding: '0.5rem',
				},
			}}
		>
			<DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: '1rem' }}>
				<Typography component="span" variant="h6" sx={{ fontFamily: 'Varela Round', fontWeight: 600 }}>
					{consultation?.title ?? 'Yükleniyor...'}
				</Typography>
				<IconButton onClick={onClose} size="small" aria-label="kapat">
					<Close fontSize='small' />
				</IconButton>
			</DialogTitle>
			<DialogContent>
				<Stepper activeStep={activeStep} sx={{ pt: 1, pb: 2 }} alternativeLabel>
					{stepLabels.map((label) => (
						<Step key={label}>
							<StepLabel sx={{ '& .MuiStepLabel-label': { fontFamily: 'Varela Round' } }}>{label}</StepLabel>
						</Step>
					))}
				</Stepper>

				{error && (
					<Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
						{error}
					</Alert>
				)}

				{renderStepContent()}

				<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
					<IconButton
						onClick={handleBack}
						disabled={activeStep === 0}
						aria-label="Geri"
						sx={{
							width: 36,
							height: 36,
							border: '1px solid',
							borderColor: 'divider',
							'&:hover': { backgroundColor: 'action.hover' },
							'&.Mui-disabled': { borderColor: 'divider' },
						}}
					>
						<ArrowBack fontSize='small' />
					</IconButton>
					{activeStep === 4 && requireForm && !formSubmitted && !isSlotInCart ? (
						<span />
					) : activeStep === stepCount - 1 || (activeStep === 4 && requireForm && isSlotInCart) ? (
						<Button
							variant="contained"
							onClick={handleNext}
							disabled={!canProceed() || freeConfirmLoading || (!isFree && isSlotInCart)}
							startIcon={isFree ? <EventAvailable /> : isSlotInCart ? <Check /> : <ShoppingCart />}
							sx={{
								fontFamily: 'Varela Round',
								textTransform: 'capitalize',
								background: isSlotInCart && !isFree ? 'grey.300' : '#FF6B3D',
								color: 'white',
								'&:hover': !isSlotInCart || isFree ? { background: '#ff7d55' } : {},
								'&.Mui-disabled': { background: 'action.disabledBackground', color: 'action.disabled' },
							}}
						>
							{freeConfirmLoading ? 'Oluşturuluyor...' : isFree ? 'Randevuyu Onayla' : isSlotInCart ? 'Eklendi' : 'Sepete Ekle'}
						</Button>
					) : (
						<IconButton
							onClick={handleNext}
							disabled={!canProceed()}
							aria-label="İleri"
							sx={{
								width: 36,
								height: 36,
								background: '#FF6B3D',
								color: 'white',
								'&:hover': { background: '#ff7d55' },
								'&.Mui-disabled': { background: 'action.disabledBackground', color: 'action.disabled' },
							}}
						>
							<ArrowForward fontSize='small' />
						</IconButton>
					)}
				</Box>
			</DialogContent>
		</Dialog>
	);
}
