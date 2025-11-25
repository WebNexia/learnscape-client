import { Alert, Box, DialogTitle, Snackbar, Typography } from '@mui/material';
import CustomDialog from '../layouts/dialog/CustomDialog';
import CustomTextField from '../forms/customFields/CustomTextField';
import PhoneInput from 'react-phone-input-2';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import theme from '../../themes';
import ReCAPTCHA from 'react-google-recaptcha';
import { useContext } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import CustomErrorMessage from '../forms/customFields/CustomErrorMessage';

interface ContactFormDialogProps {
	isGetMoreDetailsModalOpen: boolean;
	setIsGetMoreDetailsModalOpen: (value: boolean) => void;
	resetForm: () => void;
	setShowSuccess: (value: boolean) => void;
	showSuccess: boolean;
	firstName: string;
	setFirstName: (value: string) => void;
	lastName: string;
	setLastName: (value: string) => void;
	email: string;
	setEmail: (value: string) => void;
	phone: string;
	setPhone: (value: string) => void;
	message: string;
	setMessage: (value: string) => void;
	location: { countryCode: string };
	handleInquiry: (e: React.FormEvent<HTMLFormElement>) => void;
	sending: boolean;
	title: string;
	description: string;
	handleRecaptchaChange: (token: string | null) => void;
	resetRecaptcha: () => void;
	recaptchaRef: React.MutableRefObject<any>;
	errorDialogMsg: string;
	setErrorDialogMsg: (value: string) => void;
}
const ContactFormDialog = ({
	isGetMoreDetailsModalOpen,
	setIsGetMoreDetailsModalOpen,
	resetForm,
	setShowSuccess,
	showSuccess,
	firstName,
	setFirstName,
	lastName,
	setLastName,
	email,
	setEmail,
	phone,
	setPhone,
	message,
	setMessage,
	location,
	handleInquiry,
	sending,
	title,
	description,
	handleRecaptchaChange,
	resetRecaptcha,
	recaptchaRef,
	errorDialogMsg,
	setErrorDialogMsg,
}: ContactFormDialogProps) => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	return (
		<>
			<CustomDialog
				title={title}
				openModal={isGetMoreDetailsModalOpen}
				closeModal={() => {
					if (!sending) {
						setIsGetMoreDetailsModalOpen(false);
						resetForm();
						setShowSuccess(false);
						resetRecaptcha();
					}
				}}
				maxWidth='sm'
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
						overflow: 'auto',
						borderRadius: '0.75rem',
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
					{description}
				</DialogTitle>
				<form onSubmit={handleInquiry}>
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
								label='İsminiz'
								value={firstName}
								onChange={(e) => setFirstName(e.target.value)}
								fullWidth={false}
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
								label='Soy İsminiz'
								value={lastName}
								onChange={(e) => setLastName(e.target.value)}
								fullWidth={false}
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
						<Box>
							<CustomTextField
								label='E-posta Adresi'
								type='email'
								value={email}
								onChange={(e) => setEmail(e.target.value)}
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
						</Box>
						<Box>
							<Typography variant='body2' sx={{ marginBottom: '0.25rem', fontFamily: 'Varela Round', color: theme.textColor?.secondary.main }}>
								Telefon Numarası *
							</Typography>
							<Box
								component='div'
								sx={{
									'& > label': {
										display: 'none !important',
										visibility: 'hidden !important',
										height: '0 !important',
										width: '0 !important',
										overflow: 'hidden !important',
									},
									'& label': {
										display: 'none !important',
										visibility: 'hidden !important',
										height: '0 !important',
										width: '0 !important',
										overflow: 'hidden !important',
									},
									'& .react-tel-input label': {
										display: 'none !important',
										visibility: 'hidden !important',
										height: '0 !important',
										width: '0 !important',
										overflow: 'hidden !important',
									},
									'& .flag-dropdown + label': {
										display: 'none !important',
										visibility: 'hidden !important',
										height: '0 !important',
										width: '0 !important',
										overflow: 'hidden !important',
									},
									'& .react-tel-input > label': {
										display: 'none !important',
										visibility: 'hidden !important',
										height: '0 !important',
										width: '0 !important',
										overflow: 'hidden !important',
									},
									'& [for*="phone"]': {
										display: 'none !important',
										visibility: 'hidden !important',
										height: '0 !important',
										width: '0 !important',
										overflow: 'hidden !important',
									},
									'& [aria-label*="Phone"]': {
										display: 'none !important',
										visibility: 'hidden !important',
										height: '0 !important',
										width: '0 !important',
										overflow: 'hidden !important',
									},
									'& .react-tel-input::before': {
										display: 'none !important',
										content: '""',
									},
									'& .react-tel-input > *:first-child:not(.flag-dropdown):not(input)': {
										display: 'none !important',
										visibility: 'hidden !important',
										height: '0 !important',
										width: '0 !important',
										overflow: 'hidden !important',
									},
								}}>
								<PhoneInput
									country={location?.countryCode?.toLowerCase() || 'tr'}
									enableSearch={true}
									searchPlaceholder='Ülke arayın...'
									searchNotFound='Ülke bulunamadı'
									enableAreaCodes={false}
									countryCodeEditable={false}
									specialLabel=''
									value={phone}
									onChange={(phoneNumber, _) => {
										const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
										setPhone(formattedNumber);
										setErrorDialogMsg('');
									}}
									inputProps={{
										required: true,
										maxLength: 20,
										style: {
											width: '100%',
											height: '2.25rem',
											fontFamily: 'Varela Round',
											fontSize: '0.9rem',
											borderRadius: '0.5rem',
											border: '1px solid rgba(0, 0, 0, 0.23)',
											transition: 'all 0.2s ease',
										},
									}}
									containerStyle={{
										marginBottom: '0.5rem',
										color: theme.textColor?.secondary.main,
										fontFamily: 'Varela Round',
										transition: 'all 0.2s ease',
									}}
									buttonStyle={{
										borderRadius: '0.35rem 0 0 0.35rem',
										border: '1px solid rgba(0, 0, 0, 0.23)',
										backgroundColor: 'transparent',
									}}
									dropdownStyle={{
										borderRadius: '0.35rem',
										border: '1px solid rgba(0, 0, 0, 0.23)',
										boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
										fontFamily: 'Varela Round',
									}}
									searchStyle={{
										width: '100%',
										height: '2rem',
										fontFamily: 'Varela Round',
										fontSize: '0.85rem',
										borderRadius: '0.5rem',
										border: '1px solid rgba(0, 0, 0, 0.23)',
										margin: '0.5rem 0',
									}}
								/>
							</Box>
						</Box>
						<CustomTextField
							label='Mesajınız'
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							fullWidth={false}
							multiline
							rows={4}
							sx={{
								'width': '100%',
								'mt': '1.25rem',
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
									maxLength: 500,
								},
							}}
						/>
						<Typography
							variant='body2'
							sx={{
								fontSize: isMobileSize ? '0.7rem' : '0.8rem',
								fontFamily: 'Varela Round',
								color: theme.textColor?.secondary.main,
								textAlign: 'right',
								mb: '0.5rem',
							}}>
							{message.length}/500
						</Typography>
						<Box sx={{ display: 'flex', justifyContent: 'center' }}>
							<ReCAPTCHA
								sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
								onChange={handleRecaptchaChange}
								onExpired={() => resetRecaptcha()}
								ref={recaptchaRef}
								key={isGetMoreDetailsModalOpen ? 'active' : 'inactive'}
							/>
						</Box>
					</Box>
					<Box sx={{ margin: { xs: '0 0.75rem', sm: '0 1rem', md: '0 2rem', lg: '0 2rem' } }}>
						{errorDialogMsg && (
							<CustomErrorMessage sx={{ width: '100%', fontSize: isMobileSize ? '0.7rem' : '0.8rem', fontFamily: 'Varela Round', mt: '1rem' }}>
								{errorDialogMsg}
							</CustomErrorMessage>
						)}
					</Box>
					<CustomDialogActions
						onCancel={() => {
							if (!sending) {
								setIsGetMoreDetailsModalOpen(false);
								resetForm();
								setShowSuccess(false);
								resetRecaptcha();
							}
						}}
						submitBtnText={sending ? 'Gönderiliyor...' : 'Gönder'}
						cancelBtnText='Kapat'
						submitBtnSx={{
							'background': 'linear-gradient(135deg, #FF6B3D 0%, #ff7d55 100%) !important',
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
						cancelBtnSx={{ fontFamily: 'Varela Round' }}
						disableBtn={sending}
						disableCancelBtn={sending}
						actionSx={{
							padding: { xs: '1rem 0.5rem 0.75rem 0', sm: '1rem 1rem 0.75rem 0', md: '1rem 2rem 0.75rem 0', lg: '1.5rem 1.5rem 0rem 0' },
						}}
					/>
				</form>
			</CustomDialog>
			<Snackbar
				open={showSuccess}
				autoHideDuration={3500}
				anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
				onClose={() => {
					setShowSuccess(false);
				}}
				sx={{ mt: '6rem' }}>
				<Alert
					severity='success'
					variant='filled'
					sx={{
						width: '100%',
						fontFamily: 'Varela Round',
						fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem', lg: '1rem' },
						letterSpacing: 0,
						color: theme.textColor?.common.main,
						backgroundColor: 'rgba(147, 51, 234, 1)',
					}}>
					Bilgileriniz alınmıştır, lütfen email'inizi kontrol edin
				</Alert>
			</Snackbar>
		</>
	);
};

export default ContactFormDialog;
