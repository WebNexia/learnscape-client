import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, confirmPasswordReset, checkActionCode } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { PasswordUpdateErrorMessages, TextFieldTypes } from '../interfaces/enums';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import { Box, IconButton, InputAdornment, Typography } from '@mui/material';
import theme from '../themes';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import { Visibility, VisibilityOff } from '@mui/icons-material';

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

	const validatePassword = (password: string): PasswordUpdateErrorMessages | null => {
		const minLength = 6;
		// const hasUppercase = /[A-Z]/.test(password);
		// const hasLowercase = /[a-z]/.test(password);
		const hasNumber = /\d/.test(password);
		// const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
		const hasLetter = /[a-zA-Z]/.test(password);

		if (password.length < minLength) {
			return PasswordUpdateErrorMessages.PASSWORD_TOO_SHORT;
		}

		if (!hasLetter) {
			return PasswordUpdateErrorMessages.PASSWORD_NO_LETTER;
		}
		// if (!hasUppercase) {
		// 	return PasswordUpdateErrorMessages.PASSWORD_NO_UPPERCASE;
		// }
		// if (!hasLowercase) {
		// 	return PasswordUpdateErrorMessages.PASSWORD_NO_LOWERCASE;
		// }
		if (!hasNumber) {
			return PasswordUpdateErrorMessages.PASSWORD_NO_NUMBER;
		}
		// if (!hasSpecialChar) {
		// 	return PasswordUpdateErrorMessages.PASSWORD_NO_SPECIAL_CHAR;
		// }
		return null;
	};

	// Extract the oobCode from the URL
	useEffect(() => {
		const code = new URLSearchParams(window.location.search).get('oobCode');
		if (code) {
			setOobCode(code);

			const auth = getAuth();
			checkActionCode(auth, code)
				.then(() => {
					setIsLinkValid(true);
				})
				.catch(() => {
					setIsLinkValid(false);
					setResetErrorMsg('This link is invalid or has expired. Please request a new password reset.');
				});
		} else {
			setResetErrorMsg('Invalid or missing password reset code. Please try again.');
			setIsLinkValid(false);
		}
	}, []);

	const handlePasswordResetSubmit = async () => {
		if (!oobCode) {
			setResetErrorMsg('Password reset code is missing. Please try again.');
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
			setResetErrorMsg('Passwords do not match. Please try again.');
			return;
		}

		// Confirm the password reset
		try {
			const auth = getAuth();
			await confirmPasswordReset(auth, oobCode, newPassword);
			setSuccessMessage('Your password has been successfully reset.');
			setTimeout(() => navigate('/auth'), 2000); // Redirect to login page
		} catch (error) {
			if (error instanceof FirebaseError) {
				if (error.code === 'auth/invalid-action-code') {
					setResetErrorMsg('The password reset link is invalid or has expired.');
				} else {
					setResetErrorMsg('An error occurred. Please try again.');
				}
			} else {
				setResetErrorMsg('An unexpected error occurred. Please try again.');
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
			<Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
				<Typography variant='h1' sx={{ textAlign: 'center', mb: '4rem' }}>
					KAIZEN
				</Typography>
				<Typography variant='h4' sx={{ textAlign: 'center', mb: '1rem' }}>
					Reset Your Password
				</Typography>

				{isLinkValid && (
					<>
						<CustomTextField
							label='New Password'
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
							label='Confirm New Password'
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
						<CustomSubmitButton onClick={handlePasswordResetSubmit}>Reset Password</CustomSubmitButton>
					</>
				)}

				{resetErrorMsg && (
					<Typography variant='body2' sx={{ mt: '0.75rem', color: 'red' }}>
						{resetErrorMsg}
					</Typography>
				)}
				{successMessage && (
					<Typography variant='body2' sx={{ mt: '0.75rem', color: 'green' }}>
						{successMessage}
					</Typography>
				)}
			</Box>
		</Box>
	);
};

export default PasswordResetPage;
