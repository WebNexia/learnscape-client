import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuth, confirmPasswordReset, checkActionCode } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { PasswordUpdateErrorMessages, TextFieldTypes } from '../interfaces/enums';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import { Box, IconButton, InputAdornment, Typography } from '@mui/material';
import theme from '../themes';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import logo from '../assets/logo.png';

const PasswordResetPage = () => {
	const [newPassword, setNewPassword] = useState<string>('');
	const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
	const [resetErrorMsg, setResetErrorMsg] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [oobCode, setOobCode] = useState<string | null>(null);

	const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
	const [isLinkValid, setIsLinkValid] = useState<boolean | null>(null);

	const navigate = useNavigate();
	const location = useLocation();

	const validatePassword = (password: string): string | null => {
		const minLength = 6;
		// const hasUppercase = /[A-Z]/.test(password);
		// const hasLowercase = /[a-z]/.test(password);
		const hasNumber = /\d/.test(password);
		// const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
		const hasLetter = /[a-zA-Z]/.test(password);

		if (password.length < minLength) {
			return 'Şifre en az 6 karakter olmalıdır.';
		}

		if (!hasLetter) {
			return 'Şifre en az bir harf içermelidir.';
		}
		// if (!hasUppercase) {
		// 	return PasswordUpdateErrorMessages.PASSWORD_NO_UPPERCASE;
		// }
		// if (!hasLowercase) {
		// 	return PasswordUpdateErrorMessages.PASSWORD_NO_LOWERCASE;
		// }
		if (!hasNumber) {
			return 'Şifre en az bir rakam içermelidir.';
		}
		// if (!hasSpecialChar) {
		// 	return PasswordUpdateErrorMessages.PASSWORD_NO_SPECIAL_CHAR;
		// }
		return null;
	};

	// Extract the oobCode from the URL
	useEffect(() => {
		const queryParams = new URLSearchParams(location.search);
		const mode = queryParams.get('mode');
		const code = queryParams.get('oobCode');

		if (!mode || !code) {
			navigate('/');
			return;
		}

		if (mode === 'verifyEmail') {
			navigate(`/verify-email?oobCode=${code}`);
			return;
		}

		if (mode !== 'resetPassword') {
			navigate('/');
			return;
		}

		setOobCode(code); // Always set code if valid for reset

		const auth = getAuth();
		checkActionCode(auth, code)
			.then(() => setIsLinkValid(true))
			.catch(() => {
				setIsLinkValid(false);
				setResetErrorMsg('Bu bağlantı geçersiz veya süresi dolmuş. Lütfen yeni bir şifre sıfırlama isteğinde bulunun.');
			});
	}, [location, navigate]);

	const handlePasswordResetSubmit = async () => {
		if (!oobCode) {
			setResetErrorMsg('Şifre sıfırlama kodu eksik. Lütfen tekrar deneyin.');
			return;
		}

		// Validate the password
		const passwordValidationError = validatePassword(newPassword);
		if (passwordValidationError) {
			setResetErrorMsg(passwordValidationError);
			return;
		}

		// Ensure passwords match
		if (newPassword !== confirmNewPassword) {
			setResetErrorMsg('Şifreler eşleşmiyor. Lütfen tekrar deneyin.');
			return;
		}

		// Confirm the password reset
		try {
			const auth = getAuth();
			await confirmPasswordReset(auth, oobCode, newPassword);
			setSuccessMessage('Şifreniz başarıyla sıfırlandı. Giriş sayfasına yönlendiriliyorsunuz...');
			setTimeout(() => navigate('/auth'), 2000); // Redirect to login page
		} catch (error) {
			if (error instanceof FirebaseError) {
				if (error.code === 'auth/invalid-action-code') {
					setResetErrorMsg('Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.');
				} else {
					setResetErrorMsg('Bir hata oluştu. Lütfen tekrar deneyin.');
				}
			} else {
				setResetErrorMsg('Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.');
			}
		}
	};

	const togglePasswordVisibility = () => {
		setShowNewPassword((prevShowPassword) => !prevShowPassword);
	};

	const toggleConfirmPasswordVisibility = () => {
		setShowConfirmPassword((prevShowPassword) => !prevShowPassword);
	};

	return (
		<Box
			sx={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'flex-start',
				backgroundColor: theme.bgColor?.commonTwo,
				height: '100vh',
				padding: '3rem',
			}}>
			<Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center' }}>
				<img src={logo} alt='logo' style={{ height: '6rem', marginBottom: '2rem' }} />
				<Typography variant='h4' sx={{ textAlign: 'center', mb: '1rem', fontFamily: 'Varela Round' }}>
					Şifreni Yenile
				</Typography>

				{isLinkValid && (
					<>
						<CustomTextField
							label='Yeni Şifre'
							placeholder='Yeni şifrenizi girin'
							type={showNewPassword ? TextFieldTypes.TEXT : TextFieldTypes.PASSWORD}
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							InputProps={{
								endAdornment: (
									<InputAdornment position='end'>
										<IconButton
											onClick={togglePasswordVisibility}
											edge='end'
											sx={{
												':hover': {
													backgroundColor: 'transparent',
												},
											}}>
											{!showNewPassword ? <Visibility fontSize='small' /> : <VisibilityOff fontSize='small' />}
										</IconButton>
									</InputAdornment>
								),
							}}
						/>
						<CustomTextField
							label='Yeni Şifre (Tekrar)'
							placeholder='Yeni şifrenizi tekrar girin'
							type={showConfirmPassword ? TextFieldTypes.TEXT : TextFieldTypes.PASSWORD}
							value={confirmNewPassword}
							onChange={(e) => setConfirmNewPassword(e.target.value)}
							InputProps={{
								endAdornment: (
									<InputAdornment position='end'>
										<IconButton
											onClick={toggleConfirmPasswordVisibility}
											edge='end'
											sx={{
												':hover': {
													backgroundColor: 'transparent',
												},
											}}>
											{!showConfirmPassword ? <Visibility fontSize='small' /> : <VisibilityOff fontSize='small' />}
										</IconButton>
									</InputAdornment>
								),
							}}
						/>
						<CustomSubmitButton onClick={handlePasswordResetSubmit} sx={{ fontFamily: 'Varela Round' }}>
							Şifreyi Yenile
						</CustomSubmitButton>
					</>
				)}

				{resetErrorMsg && (
					<Typography variant='body2' sx={{ mt: '0.75rem', color: 'red', textAlign: 'center', fontFamily: 'Varela Round' }}>
						{resetErrorMsg}
					</Typography>
				)}
				{successMessage && (
					<Typography variant='body2' sx={{ mt: '0.75rem', color: 'green', textAlign: 'center', fontFamily: 'Varela Round' }}>
						{successMessage}
					</Typography>
				)}
			</Box>
		</Box>
	);
};

export default PasswordResetPage;
