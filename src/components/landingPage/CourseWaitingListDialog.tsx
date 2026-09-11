import { useContext, useEffect, useRef, useState } from 'react';
import {
	Alert,
	Autocomplete,
	Box,
	DialogContent,
	Snackbar,
	TextField,
	Typography,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import axios from '@utils/axiosInstance';
import CustomDialog from '../layouts/dialog/CustomDialog';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import CustomTextField from '../forms/customFields/CustomTextField';
import CustomErrorMessage from '../forms/customFields/CustomErrorMessage';
import TurnstileWidget from '../common/TurnstileWidget';
import { OrganisationContext } from '../../contexts/OrganisationContextProvider';
import { useGeoLocation } from '../../hooks/useGeoLocation';
import { COUNTRY_LIST, CountryOption } from '../../data/countries';

const base_url = import.meta.env.VITE_SERVER_BASE_URL;

type Props = {
	open: boolean;
	onClose: () => void;
	courseId: string;
	courseTitle?: string;
};

const CourseWaitingListDialog = ({ open, onClose, courseId, courseTitle }: Props) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const { orgId } = useContext(OrganisationContext);
	const location = useGeoLocation();

	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [country, setCountry] = useState<CountryOption | null>(null);
	const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [successOpen, setSuccessOpen] = useState(false);
	const recaptchaRef = useRef<any>(null);

	useEffect(() => {
		if (!open) return;
		const code = (location?.countryCode || 'TR').toUpperCase();
		const match = COUNTRY_LIST.find((c) => c.code === code) || COUNTRY_LIST.find((c) => c.code === 'TR') || null;
		setCountry(match);
	}, [open, location?.countryCode]);

	const resetForm = () => {
		setFirstName('');
		setLastName('');
		setEmail('');
		setPhone('');
		setErrorMsg(null);
		setRecaptchaToken(null);
		if (recaptchaRef.current?.reset) recaptchaRef.current.reset();
	};

	const handleClose = () => {
		if (submitting) return;
		resetForm();
		onClose();
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setErrorMsg(null);

		if (!orgId || !courseId) {
			setErrorMsg('Kurs bilgisi eksik.');
			return;
		}
		if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim() || !country) {
			setErrorMsg('Lütfen tüm alanları doldurun.');
			return;
		}
		if (!recaptchaToken) {
			setErrorMsg('Lütfen doğrulamayı tamamlayın.');
			return;
		}

		setSubmitting(true);
		try {
			await axios.post(`${base_url}/courseWaitingList`, {
				courseId,
				orgId,
				firstName: firstName.trim(),
				lastName: lastName.trim(),
				email: email.trim(),
				phone: phone.startsWith('+') ? phone : `+${phone}`,
				countryCode: country.code,
				country: country.label,
				recaptchaToken,
			});
			setSuccessOpen(true);
			resetForm();
			onClose();
		} catch (err: any) {
			const msg = err?.response?.data?.message || 'Kayıt sırasında bir hata oluştu.';
			setErrorMsg(msg);
			if (recaptchaRef.current?.reset) recaptchaRef.current.reset();
			setRecaptchaToken(null);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<>
			<CustomDialog
				openModal={open}
				closeModal={handleClose}
				title='Bekleme Listesi'
				maxWidth='xs'
				titleSx={{
					fontSize: '1.35rem',
					fontWeight: 600,
					fontFamily: 'Varela Round',
					color: '#1e293b',
					textAlign: 'center',
				}}
				PaperProps={{
					sx: {
						height: 'auto',
						maxHeight: '90vh',
						overflow: 'visible',
						borderRadius: '0.75rem',
					},
				}}>
				<DialogContent sx={{ pt: 1 }}>
					{courseTitle ? (
						<Typography
							sx={{
								fontFamily: 'Varela Round',
								fontSize: '0.85rem',
								color: '#64748b',
								mb: 1.5,
								textAlign: 'center',
							}}>
							{courseTitle} — kayıtlar şu an kapalı. Yer açıldığında sizinle iletişime geçeceğiz.
						</Typography>
					) : null}
					<form onSubmit={handleSubmit}>
						<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 1 }}>
							<CustomTextField
								label='İsim'
								value={firstName}
								onChange={(e) => {
									setFirstName(e.target.value);
									setErrorMsg(null);
								}}
								fullWidth={false}
								sx={{ width: '48%', mb: '1rem', fontFamily: 'Varela Round' }}
								InputProps={{ inputProps: { maxLength: 50 } }}
							/>
							<CustomTextField
								label='Soyisim'
								value={lastName}
								onChange={(e) => {
									setLastName(e.target.value);
									setErrorMsg(null);
								}}
								fullWidth={false}
								sx={{ width: '48%', mb: '1rem', fontFamily: 'Varela Round' }}
								InputProps={{ inputProps: { maxLength: 50 } }}
							/>
						</Box>
						<CustomTextField
							label='E-posta'
							type='email'
							value={email}
							onChange={(e) => {
								setEmail(e.target.value);
								setErrorMsg(null);
							}}
							sx={{ mb: '1rem', fontFamily: 'Varela Round' }}
							InputProps={{ inputProps: { maxLength: 254 } }}
						/>
						<Box sx={{ mb: '1rem' }}>
							<PhoneInput
								country={(location?.countryCode || 'tr').toLowerCase()}
								value={phone}
								onChange={(phoneNumber) => {
									setPhone(phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`);
									setErrorMsg(null);
								}}
								countryCodeEditable={false}
								enableSearch
								inputStyle={{
									width: '100%',
									height: '2.75rem',
									fontFamily: 'Varela Round',
									fontSize: '0.95rem',
									borderRadius: '0.35rem',
									border: '1px solid rgba(0, 0, 0, 0.23)',
								}}
								containerStyle={{ width: '100%' }}
								buttonStyle={{ borderRadius: '0.35rem 0 0 0.35rem', border: '1px solid rgba(0, 0, 0, 0.23)' }}
							/>
						</Box>
						<Autocomplete
							options={COUNTRY_LIST}
							value={country}
							onChange={(_, newValue) => {
								setCountry(newValue);
								setErrorMsg(null);
							}}
							getOptionLabel={(option) => (typeof option === 'string' ? option : option.label)}
							isOptionEqualToValue={(option, value) => option.code === value?.code}
							noOptionsText='Ülke bulunamadı'
							renderInput={(params) => (
								<TextField
									{...params}
									label='Ülke'
									required
									size='small'
									sx={{
										mb: '1rem',
										'& .MuiInputLabel-root': { fontFamily: 'Varela Round' },
										'& .MuiInputBase-input': { fontFamily: 'Varela Round', fontSize: '0.95rem' },
										'& .MuiOutlinedInput-root': { fontFamily: 'Varela Round', borderRadius: '0.5rem' },
									}}
								/>
							)}
							ListboxProps={{
								sx: { maxHeight: 300, fontFamily: 'Varela Round', '& .MuiAutocomplete-option': { fontSize: '0.85rem' } },
							}}
							filterOptions={(options, { inputValue }) =>
								options.filter((opt) => opt.label.toLowerCase().includes(inputValue.toLowerCase()))
							}
						/>
						<Box
							sx={{
								width: '100%',
								maxWidth: '100%',
								overflow: 'visible',
								display: 'flex',
								justifyContent: 'center',
								mb: 0.5,
							}}>
							<TurnstileWidget
								ref={recaptchaRef}
								action='course-waiting-list'
								onChange={(token) => setRecaptchaToken(token)}
								onExpired={() => setRecaptchaToken(null)}
								resetKey={open ? 'active' : 'inactive'}
								size='flexible'
							/>
						</Box>
						{errorMsg ? (
							<CustomErrorMessage sx={{ m: '0.75rem 0', fontFamily: 'Varela Round', fontSize: isMobile ? '0.7rem' : '0.8rem' }}>
								{errorMsg}
							</CustomErrorMessage>
						) : null}
						<CustomDialogActions
							onCancel={handleClose}
							cancelBtnText='Kapat'
							submitBtnText={submitting ? 'Gönderiliyor...' : 'Bekleme Listesine Kaydol'}
							submitBtnType='submit'
							disableBtn={submitting}
							disableCancelBtn={submitting}
							submitBtnSx={{
								background: '#FF6B3D !important',
								fontFamily: 'Varela Round',
								color: 'white !important',
								'&:hover': { background: '#ff7d55 !important' },
							}}
							cancelBtnSx={{ fontFamily: 'Varela Round' }}
							actionSx={{ mr: '-1rem', mb: '-0.5rem' }}
						/>
					</form>
				</DialogContent>
			</CustomDialog>

			<Snackbar
				open={successOpen}
				autoHideDuration={3500}
				anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
				onClose={() => setSuccessOpen(false)}
				sx={{ mt: '6rem' }}>
				<Alert severity='success' variant='filled' sx={{ fontFamily: 'Varela Round' }}>
					Bekleme listesine kaydınız alındı.
				</Alert>
			</Snackbar>
		</>
	);
};

export default CourseWaitingListDialog;
