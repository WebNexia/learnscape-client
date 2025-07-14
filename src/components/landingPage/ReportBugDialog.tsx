import React, { useState } from 'react';
import { DialogTitle, Box, Alert, Snackbar } from '@mui/material';
import axios from '@utils/axiosInstance';
import { CreateBugReportRequest } from '../../interfaces/bugReport';
import ReCAPTCHA from 'react-google-recaptcha';
import CustomTextField from '../forms/customFields/CustomTextField';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import CustomDialog from '../layouts/dialog/CustomDialog';
import CustomErrorMessage from '../forms/customFields/CustomErrorMessage';

interface ReportBugDialogProps {
	open: boolean;
	onClose: () => void;
}

const initialState: CreateBugReportRequest = {
	firstName: '',
	lastName: '',
	email: '',
	description: '',
	recaptchaToken: '',
};

const ReportBugDialog: React.FC<ReportBugDialogProps> = ({ open, onClose }) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const [formData, setFormData] = useState<CreateBugReportRequest>(initialState);
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [recaptchaValue, setRecaptchaValue] = useState<string | null>(null);

	const handleInputChange = (field: keyof CreateBugReportRequest) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		setFormData((prev) => ({ ...prev, [field]: e.target.value }));
	};

	const handleRecaptcha = (value: string | null) => {
		setRecaptchaValue(value);
		setFormData((prev) => ({ ...prev, recaptchaToken: value || '' }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);
		try {
			await axios.post(`${base_url}/bugReports`, formData);
			setSuccess(true);
			setFormData(initialState);
			setRecaptchaValue(null);
			setTimeout(() => {
				setSuccess(false);
				onClose();
			}, 2000);
		} catch (err: any) {
			setError(err.response?.data?.message || 'Hata raporu gönderilemedi');
		} finally {
			setLoading(false);
		}
	};

	const handleClose = () => {
		if (!loading) {
			onClose();
			setError(null);
			setSuccess(false);
			setFormData(initialState);
			setRecaptchaValue(null);
		}
	};

	const isFormValid =
		formData.firstName.length >= 1 &&
		formData.firstName.length <= 50 &&
		formData.lastName.length >= 1 &&
		formData.lastName.length <= 50 &&
		/^\S+@\S+\.\S+$/.test(formData.email) &&
		formData.description.length >= 1 &&
		formData.description.length <= 500 &&
		recaptchaValue;

	return (
		<CustomDialog
			title='HATA BİLDİR'
			openModal={open}
			closeModal={handleClose}
			maxWidth='xs'
			titleSx={{
				fontSize: '1.5rem',
				fontWeight: 600,
				fontFamily: 'Varela Round',
				color: '#2C3E50',
				textAlign: 'center',
				mb: -2,
			}}
			PaperProps={{
				sx: {
					height: 'auto',
					maxHeight: '90vh',
					overflow: 'visible',
					borderRadius: '1.5rem',
					background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.98))',
					boxShadow: '0 8px 32px rgba(44, 62, 80, 0.1)',
					backdropFilter: 'blur(8px)',
					border: '1px solid rgba(255, 255, 255, 0.18)',
				},
			}}>
			<DialogTitle
				sx={{
					color: '#2C3E50',
					fontFamily: 'Varela Round',
					textAlign: 'center',
					fontSize: { xs: '0.85rem', sm: '1rem' },
					opacity: 0.9,
					lineHeight: 1.6,
					mb: 1,
				}}>
				Karşılaştığınız sorunları bildirerek bize yardımcı olun.
			</DialogTitle>

			<Snackbar
				open={success}
				autoHideDuration={3500}
				onClose={() => {
					setError(null);
					setSuccess(false);
					onClose();
				}}
				anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
				<Alert
					severity='success'
					variant='filled'
					sx={{
						width: '100%',
						fontSize: { xs: '0.8rem', sm: '0.9rem' },
						letterSpacing: 0,
						color: '#fff',
					}}>
					Hata raporunuz için teşekkürler! Sorunu inceleyip size en kısa sürede geri döneceğiz.
				</Alert>
			</Snackbar>
			<form onSubmit={handleSubmit}>
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
					<Box sx={{ display: 'flex', gap: 2 }}>
						<CustomTextField
							label='İsminiz'
							value={formData.firstName}
							onChange={(e) => {
								handleInputChange('firstName')(e);
								setError(null);
							}}
							required
							sx={{
								'width': '48%',
								'mb': '1.25rem',
								'& .MuiOutlinedInput-root': {
									fontFamily: 'Varela Round',
									borderRadius: '0.5rem',
								},
								'& .MuiInputBase-input': {
									fontFamily: 'Varela Round',
									fontSize: '0.85rem',
								},
								'& .MuiInputBase-input::placeholder': {
									fontFamily: 'Varela Round',
									opacity: 1,
								},
								'& .MuiInputLabel-root': {
									fontFamily: 'Varela Round',
									fontSize: '0.85rem',
								},
							}}
							InputProps={{
								inputProps: {
									maxLength: 50,
								},
							}}
						/>
						<CustomTextField
							label='Soy Ìsminiz'
							value={formData.lastName}
							onChange={(e) => {
								handleInputChange('lastName')(e);
								setError(null);
							}}
							required
							sx={{
								'width': '48%',
								'mb': '1.25rem',
								'& .MuiOutlinedInput-root': {
									fontFamily: 'Varela Round',
									borderRadius: '0.5rem',
								},
								'& .MuiInputBase-input': {
									fontFamily: 'Varela Round',
									fontSize: '0.85rem',
								},
								'& .MuiInputBase-input::placeholder': {
									fontFamily: 'Varela Round',
									opacity: 1,
								},
								'& .MuiInputLabel-root': {
									fontFamily: 'Varela Round',
									fontSize: '0.85rem',
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
						value={formData.email}
						onChange={(e) => {
							handleInputChange('email')(e);
							setError(null);
						}}
						required
						sx={{
							'mb': '1.25rem',
							'& .MuiOutlinedInput-root': {
								fontFamily: 'Varela Round',
								borderRadius: '0.5rem',
							},
							'& .MuiInputBase-input': {
								fontFamily: 'Varela Round',
								fontSize: '0.85rem',
							},
							'& .MuiInputBase-input::placeholder': {
								fontFamily: 'Varela Round',
								opacity: 1,
							},
							'& .MuiInputLabel-root': {
								fontFamily: 'Varela Round',
								fontSize: '0.85rem',
							},
						}}
						InputProps={{
							inputProps: {
								maxLength: 254,
							},
						}}
					/>

					<CustomTextField
						fullWidth={false}
						label='Hata Açıklaması'
						multiline
						rows={4}
						value={formData.description}
						onChange={(e) => {
							handleInputChange('description')(e);
							setError(null);
						}}
						required
						InputProps={{ inputProps: { maxLength: 500 } }}
						placeholder='Lütfen karşılaştığınız hatayı veya sorunu açıklayın...'
						sx={{
							'width': '100%',
							'& .MuiOutlinedInput-root': {
								fontFamily: 'Varela Round',
								borderRadius: '0.5rem',
							},
							'& .MuiInputBase-input': {
								fontFamily: 'Varela Round',
								fontSize: '0.85rem',
							},
							'& .MuiInputBase-input::placeholder': {
								fontFamily: 'Varela Round',
								opacity: 0.5,
							},
							'& .MuiInputLabel-root': {
								fontFamily: 'Varela Round',
								fontSize: '0.85rem',
							},
						}}
					/>
					<Box sx={{ mt: 2, mb: 1, display: 'flex', justifyContent: 'center' }}>
						<ReCAPTCHA sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY} onChange={handleRecaptcha} theme='light' />
					</Box>
					{error && <CustomErrorMessage sx={{ fontSize: '0.75rem', mt: '1rem', fontFamily: 'Varela Round' }}>{error}</CustomErrorMessage>}
				</Box>

				<CustomDialogActions
					submitBtnText={loading ? 'Gönderiliyor...' : 'Gönder'}
					cancelBtnText='Kapat'
					disableBtn={!isFormValid || loading}
					disableCancelBtn={loading}
					actionSx={{ margin: '1rem' }}
					submitBtnSx={{ fontFamily: 'Varela Round', fontWeight: 600 }}
					cancelBtnSx={{ fontFamily: 'Varela Round', fontWeight: 600 }}
				/>
			</form>
		</CustomDialog>
	);
};

export default ReportBugDialog;
