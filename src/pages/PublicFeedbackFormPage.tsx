import { Box, Container, Typography, Button, Rating, FormLabel, Alert, CircularProgress, Paper, Divider } from '@mui/material';
import { useContext, useEffect, useState, useRef, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { feedbackFormsService } from '../services/feedbackFormsService';
import { FeedbackForm, FeedbackFormField } from '../interfaces/feedbackForm';
import theme from '../themes';
import logo from '../assets/logo.png';
import LondonBg from '../assets/london-bg.jpg';
import { CheckCircle, Error as ErrorIcon, Check } from '@mui/icons-material';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import { sanitizeTextInput, sanitizeEmailInput, validateInputLength } from '../utils/sanitizeHtml';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import ReCAPTCHA from 'react-google-recaptcha';

// Email validation regex (RFC 5322 compliant, simplified)
const isValidEmail = (email: string): boolean => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email) && email.length <= 254;
};

const PublicFeedbackFormPage = () => {
	const { publicLink } = useParams<{ publicLink: string }>();
	const navigate = useNavigate();
	const { isSmallScreen } = useContext(MediaQueryContext);
	const [form, setForm] = useState<FeedbackForm | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState<boolean>(false);
	const [submitted, setSubmitted] = useState<boolean>(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [responses, setResponses] = useState<Record<string, any>>({});
	const [userName, setUserName] = useState<string>('');
	const [userEmail, setUserEmail] = useState<string>('');
	const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
	const recaptchaRef = useRef<any>(null);

	// Check if form has already been submitted (using localStorage)
	useEffect(() => {
		if (form && publicLink) {
			const submissionKey = `form_submitted_${publicLink}`;
			const hasSubmitted = localStorage.getItem(submissionKey);
			if (hasSubmitted === 'true' && !form.allowMultipleSubmissions) {
				setSubmitted(true);
			}
		}
	}, [form, publicLink]);

	useEffect(() => {
		const fetchForm = async () => {
			if (!publicLink) {
				setError('Geçersiz form bağlantısı');
				setLoading(false);
				return;
			}

			try {
				setLoading(true);
				const formData = await feedbackFormsService.getFeedbackFormByPublicLink(publicLink);

				// Check if form deadline has passed
				if (formData.submissionDeadline && new Date(formData.submissionDeadline) < new Date()) {
					setError('Bu formun gönderim süresi dolmuştur.');
					setForm(null);
				} else {
					setForm(formData);
					setError(null);
				}
			} catch (err: any) {
				setError(err?.response?.data?.message || 'Form bulunamadı veya erişilebilir değil');
			} finally {
				setLoading(false);
			}
		};

		fetchForm();
	}, [publicLink]);

	// Security constants
	const MAX_TEXT_LENGTH = 500;
	const MAX_TEXTAREA_LENGTH = 2000;
	const MAX_NAME_LENGTH = 100;
	const MAX_EMAIL_LENGTH = 254;

	const handleFieldChange = (fieldId: string, value: any) => {
		// Sanitize value based on field type
		const field = form?.fields.find((f) => f.fieldId === fieldId);
		let sanitizedValue = value;

		if (field) {
			switch (field.type) {
				case 'text':
					// Sanitize text input and enforce length limit
					if (typeof value === 'string') {
						sanitizedValue = validateInputLength(sanitizeTextInput(value), MAX_TEXT_LENGTH);
					}
					break;
				case 'textarea':
					if (typeof value === 'string') {
						const withoutHtml = value.replace(/<[^>]*>/g, '');
						sanitizedValue = withoutHtml.length > MAX_TEXTAREA_LENGTH ? withoutHtml.substring(0, MAX_TEXTAREA_LENGTH) : withoutHtml;
					}
					break;
				case 'rating':
					// Validate rating is a number within range
					if (value !== null && value !== undefined) {
						const numValue = Number(value);
						if (!isNaN(numValue)) {
							const minRating = field.minRating || 1;
							const maxRating = field.maxRating || 5;
							sanitizedValue = Math.max(minRating, Math.min(maxRating, numValue));
						} else {
							sanitizedValue = null;
						}
					}
					break;
				case 'multiple-choice':
					// Validate option is in allowed options and sanitize
					if (field.options && typeof value === 'string') {
						const sanitizedOption = sanitizeTextInput(value).trim();
						if (field.options.includes(sanitizedOption)) {
							sanitizedValue = sanitizedOption;
						} else {
							return; // Invalid option, don't update
						}
					}
					break;
				case 'checkbox':
					// Validate all selected options are in allowed options and sanitize
					if (Array.isArray(value)) {
						const validOptions = value
							.filter((v) => field.options?.includes(String(v)))
							.map((v) => sanitizeTextInput(String(v)).trim())
							.filter((v) => field.options?.includes(v));
						sanitizedValue = validOptions;
					}
					break;
				case 'date':
					// Validate date format
					if (typeof value === 'string' && value) {
						// Basic date format validation (YYYY-MM-DD)
						if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
							return; // Invalid date format, don't update
						}
					}
					break;
			}
		}

		setResponses((prev) => ({
			...prev,
			[fieldId]: sanitizedValue,
		}));
	};

	const validateForm = (): boolean => {
		if (!form) return false;

		// Check required fields
		for (const field of form.fields) {
			if (field.required) {
				const value = responses[field.fieldId];
				if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
					return false;
				}

				// Additional type-specific validation
				if (field.type === 'text' && typeof value === 'string' && value.trim().length === 0) {
					return false;
				}
				if (field.type === 'textarea' && typeof value === 'string' && value.trim().length === 0) {
					return false;
				}
				if (field.type === 'rating' && (value === null || value === undefined || value === 0)) {
					return false;
				}
			}

			// Validate field values match their types
			const value = responses[field.fieldId];
			if (value !== undefined && value !== null && value !== '') {
				if (field.type === 'rating') {
					const numValue = Number(value);
					if (isNaN(numValue)) return false;
					const minRating = field.minRating || 1;
					const maxRating = field.maxRating || 5;
					if (numValue < minRating || numValue > maxRating) return false;
				}
				if (field.type === 'multiple-choice' && field.options && !field.options.includes(value)) {
					return false;
				}
				if (field.type === 'checkbox' && Array.isArray(value)) {
					for (const v of value) {
						if (!field.options?.includes(v)) return false;
					}
				}
			}
		}

		// If not anonymous, require and validate name/email
		if (!form.allowAnonymous) {
			const sanitizedName = sanitizeTextInput(userName).trim();
			const sanitizedEmail = sanitizeEmailInput(userEmail).trim();

			if (!sanitizedName || sanitizedName.length === 0 || sanitizedName.length > MAX_NAME_LENGTH) {
				return false;
			}

			if (!sanitizedEmail || sanitizedEmail.length === 0 || sanitizedEmail.length > MAX_EMAIL_LENGTH) {
				return false;
			}

			// Validate email format
			if (!isValidEmail(sanitizedEmail)) {
				return false;
			}
		}

		return true;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!form || !publicLink) return;

		// Check reCAPTCHA
		if (!recaptchaToken) {
			setSubmitError('Lütfen reCAPTCHA doğrulamasını tamamlayın');
			return;
		}

		if (!validateForm()) {
			// Provide more specific error messages
			if (!form.allowAnonymous) {
				const sanitizedName = sanitizeTextInput(userName).trim();
				const sanitizedEmail = sanitizeEmailInput(userEmail).trim();

				if (!sanitizedName || sanitizedName.length === 0) {
					setSubmitError('Lütfen adınızı girin');
					return;
				}
				if (!sanitizedEmail || sanitizedEmail.length === 0) {
					setSubmitError('Lütfen e-posta adresinizi girin');
					return;
				}
				if (!isValidEmail(sanitizedEmail)) {
					setSubmitError('Lütfen geçerli bir e-posta adresi girin');
					return;
				}
			}

			// Check for missing required fields
			for (const field of form.fields) {
				if (field.required) {
					const value = responses[field.fieldId];
					if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
						setSubmitError(`Lütfen zorunlu alanı doldurun: ${field.label}`);
						return;
					}
				}
			}

			setSubmitError('Lütfen tüm zorunlu alanları doldurun');
			return;
		}

		try {
			setSubmitting(true);
			setSubmitError(null);

			// Sanitize all responses before sending
			const sanitizedResponses = Object.entries(responses).map(([fieldId, value]) => {
				const field = form.fields.find((f) => f.fieldId === fieldId);
				let sanitizedValue = value;

				if (field) {
					switch (field.type) {
						case 'text':
						case 'textarea':
							if (typeof value === 'string') {
								sanitizedValue = sanitizeTextInput(value).trim();
							}
							break;
						case 'date':
							// Date is already validated format, just ensure it's a string
							if (typeof value === 'string') {
								sanitizedValue = value.trim();
							}
							break;
						case 'rating':
							// Ensure rating is a number
							sanitizedValue = Number(value);
							break;
						case 'multiple-choice':
							// Ensure value is a string and in allowed options
							if (typeof value === 'string' && field.options?.includes(value)) {
								sanitizedValue = sanitizeTextInput(value).trim();
							}
							break;
						case 'checkbox':
							// Sanitize each option in array
							if (Array.isArray(value)) {
								sanitizedValue = value.filter((v) => field.options?.includes(v)).map((v) => sanitizeTextInput(String(v)).trim());
							}
							break;
					}
				}

				return {
					fieldId,
					value: sanitizedValue,
				};
			});

			const submissionData = {
				responses: sanitizedResponses,
				recaptchaToken,
				...(form.allowAnonymous
					? {}
					: {
							userName: validateInputLength(sanitizeTextInput(userName).trim(), MAX_NAME_LENGTH),
							userEmail: validateInputLength(sanitizeEmailInput(userEmail).trim().toLowerCase(), MAX_EMAIL_LENGTH),
						}),
			};

			// Final validation before submission
			if (!form.allowAnonymous && submissionData.userEmail) {
				if (!isValidEmail(submissionData.userEmail)) {
					setSubmitError('Lütfen geçerli bir e-posta adresi girin');
					return;
				}
			}

			await feedbackFormsService.submitFeedbackForm(publicLink, submissionData);

			// Mark as submitted in localStorage to prevent duplicate submissions on refresh
			if (!form.allowMultipleSubmissions && publicLink) {
				localStorage.setItem(`form_submitted_${publicLink}`, 'true');
			}

			// Reset reCAPTCHA
			if (recaptchaRef.current) {
				recaptchaRef.current.reset();
			}
			setRecaptchaToken(null);

			setSubmitted(true);
		} catch (err: any) {
			setSubmitError(err?.response?.data?.message || 'Form gönderilemedi. Lütfen tekrar deneyin.');
			// Reset reCAPTCHA on error
			if (recaptchaRef.current) {
				recaptchaRef.current.reset();
			}
			setRecaptchaToken(null);
		} finally {
			setSubmitting(false);
		}
	};

	const renderField = (field: FeedbackFormField) => {
		const value = responses[field.fieldId];
		const isRequired = field.required;

		switch (field.type) {
			case 'text':
				return (
					<>
						<FormLabel
							required={isRequired}
							sx={{
								mb: '0.5rem',
								display: 'block',
								color: theme.textColor?.primary.main,
								fontWeight: 600,
								fontSize: '0.95rem',
								fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
							}}>
							{field.label}
						</FormLabel>
						<CustomTextField
							key={field.fieldId}
							fullWidth
							placeholder={field.placeholder}
							required={isRequired}
							value={value || ''}
							onChange={(e) => handleFieldChange(field.fieldId, e.target.value)}
							variant='outlined'
							type='text'
							sx={{
								'mb': '1.5rem',
								'& .MuiOutlinedInput-root': {
									'backgroundColor': 'rgba(255, 255, 255, 0.95)',
									'borderRadius': '12px',

									'boxShadow': '0 2px 8px rgba(0, 0, 0, 0.08)',
									'&:hover': {
										backgroundColor: 'rgba(255, 255, 255, 1)',
										boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)',
									},
									'&.Mui-focused': {
										backgroundColor: 'rgba(255, 255, 255, 1)',
										boxShadow: '0 6px 20px rgba(102, 126, 234, 0.25)',
									},
									'& fieldset': {
										borderColor: 'rgba(102, 126, 234, 0.3)',
										borderWidth: '2px',
									},
									'&:hover fieldset': {
										borderColor: 'rgba(102, 126, 234, 0.5)',
									},
									'&.Mui-focused fieldset': {
										borderColor: 'rgba(102, 126, 234, 0.8)',
										borderWidth: '2px',
									},
								},
								'& .MuiInputLabel-root': {
									fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
									fontSize: '0.95rem',
								},
								'& .MuiInputBase-input': {
									fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif",
									fontSize: '0.95rem',
									padding: '14px 16px',
								},
								'& .MuiInputBase-input::placeholder': {
									fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
									opacity: 0.6,
								},
							}}
						/>
					</>
				);

			case 'textarea':
				return (
					<>
						<FormLabel
							required={isRequired}
							sx={{
								mb: '0.5rem',
								display: 'block',
								color: theme.textColor?.primary.main,
								fontWeight: 600,
								fontSize: '0.95rem',
								fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
							}}>
							{field.label}
						</FormLabel>
						<CustomTextField
							key={field.fieldId}
							fullWidth
							placeholder={field.placeholder}
							required={isRequired}
							value={value || ''}
							onChange={(e) => {
								const rawValue = e.target.value;
								const withoutHtml = rawValue.replace(/<[^>]*>/g, '');
								const limited = withoutHtml.length > MAX_TEXTAREA_LENGTH ? withoutHtml.substring(0, MAX_TEXTAREA_LENGTH) : withoutHtml;
								handleFieldChange(field.fieldId, limited);
							}}
							multiline
							rows={4}
							variant='outlined'
							disableSanitization={true}
							InputProps={{
								inputProps: {
									maxLength: MAX_TEXTAREA_LENGTH,
								},
							}}
							sx={{
								'mb': '2rem',
								'& .MuiOutlinedInput-root': {
									'backgroundColor': 'rgba(255, 255, 255, 0.95)',
									'borderRadius': '12px',
									'boxShadow': '0 2px 8px rgba(0, 0, 0, 0.08)',
									'&:hover': {
										boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
									},
									'&.Mui-focused': {
										boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
									},
									'& fieldset': {
										borderColor: 'rgba(102, 126, 234, 0.3)',
										borderWidth: '2px',
									},
									'&:hover fieldset': {
										borderColor: 'rgba(102, 126, 234, 0.3)',
									},
									'&.Mui-focused fieldset': {
										borderColor: 'rgba(102, 126, 234, 0.8)',
										borderWidth: '2px',
									},
								},
								'& .MuiInputLabel-root': {
									fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
									fontSize: '0.95rem',
								},
								'& .MuiInputBase-input': {
									fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif",
									fontSize: '0.95rem',
									padding: '0 0.5rem',
									lineHeight: 1.6,
								},
								'& .MuiInputBase-input::placeholder': {
									fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
									opacity: 0.6,
								},
							}}
						/>
					</>
				);

			case 'rating':
				return (
					<Box
						key={field.fieldId}
						sx={{
							'mb': '2rem',
							'p': 2,
							'borderRadius': '12px',
							'backgroundColor': 'rgba(255, 255, 255, 0.95)',
							'boxShadow': '0 2px 8px rgba(0, 0, 0, 0.08)',
							'border': '2px solid rgba(102, 126, 234, 0.3)',
							'&:hover': {
								boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)',
								borderColor: 'rgba(102, 126, 234, 0.5)',
							},
						}}>
						<FormLabel
							required={isRequired}
							sx={{
								mb: '0.5rem',
								display: 'block',
								color: theme.textColor?.primary.main,
								fontWeight: 600,
								fontSize: '0.95rem',
								fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
							}}>
							{field.label}
						</FormLabel>
						<Rating
							value={value || 0}
							onChange={(_, newValue) => {
								// Ensure value is within min/max range
								const min = field.minRating || 1;
								const max = field.maxRating || 5;
								const clampedValue = newValue ? Math.max(min, Math.min(max, newValue)) : null;
								handleFieldChange(field.fieldId, clampedValue);
							}}
							max={field.maxRating || 5}
							size='large'
							sx={{
								'& .MuiRating-iconFilled': {
									color: '#667eea',
									filter: 'drop-shadow(0 2px 4px rgba(102, 126, 234, 0.3))',
									// Removed transition
								},
								'& .MuiRating-iconEmpty': {
									color: 'rgba(102, 126, 234, 0.3)',
								},
								'& .MuiRating-icon:hover': {
									transform: 'scale(1.2)',
								},
							}}
						/>
					</Box>
				);

			case 'multiple-choice':
				return (
					<Box
						key={field.fieldId}
						sx={{
							'mb': '2rem',
							'p': 2,
							'borderRadius': '12px',
							'backgroundColor': 'rgba(255, 255, 255, 0.95)',
							'boxShadow': '0 2px 8px rgba(0, 0, 0, 0.08)',
							'border': '2px solid rgba(102, 126, 234, 0.3)',
							// Removed transitions to prevent flashing
							'&:hover': {
								boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)',
								borderColor: 'rgba(102, 126, 234, 0.5)',
							},
						}}>
						<FormLabel
							required={isRequired}
							sx={{
								mb: '0.5rem',
								display: 'block',
								color: theme.textColor?.primary.main,
								fontWeight: 600,
								fontSize: '0.95rem',
								fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
							}}>
							{field.label}
						</FormLabel>
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
							{field.options?.map((option, index) => {
								const isSelected = value === option;
								return (
									<Box
										key={index}
										onClick={() => handleFieldChange(field.fieldId, option)}
										sx={{
											'display': 'flex',
											'alignItems': 'center',
											'p': 2,
											'borderRadius': '12px',
											'border': `2px solid ${isSelected ? '#667eea' : 'rgba(102, 126, 234, 0.2)'}`,
											'backgroundColor': isSelected ? 'rgba(102, 126, 234, 0.08)' : 'rgba(255, 255, 255, 0.6)',
											'cursor': 'pointer',
											// Removed transitions to prevent flashing
											'position': 'relative',
											'overflow': 'hidden',
											'&::before': {
												content: '""',
												position: 'absolute',
												top: 0,
												left: 0,
												right: 0,
												bottom: 0,
												background: isSelected
													? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)'
													: 'transparent',
												// Removed transition
											},
											'&:hover': {
												borderColor: '#667eea',
												backgroundColor: isSelected ? 'rgba(102, 126, 234, 0.12)' : 'rgba(102, 126, 234, 0.05)',
												boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
											},
											'&:active': {
												transform: 'translateY(0)',
											},
										}}>
										<Box
											sx={{
												'display': 'flex',
												'alignItems': 'center',
												'justifyContent': 'center',
												'width': 24,
												'height': 24,
												'borderRadius': '50%',
												'border': `2px solid ${isSelected ? '#667eea' : 'rgba(102, 126, 234, 0.4)'}`,
												'backgroundColor': isSelected ? '#667eea' : 'transparent',
												'mr': 2,
												// Removed transitions to prevent flashing
												'position': 'relative',
												'flexShrink': 0,
												'&::after': {
													content: '""',
													position: 'absolute',
													width: isSelected ? '8px' : '0',
													height: isSelected ? '8px' : '0',
													borderRadius: '50%',
													backgroundColor: 'white',
													// Removed transition
												},
											}}
										/>
										<Typography
											sx={{
												fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif",
												fontSize: '0.95rem',
												color: theme.textColor?.primary.main,
												fontWeight: isSelected ? 600 : 400,
												position: 'relative',
												zIndex: 1,
											}}>
											{option}
										</Typography>
									</Box>
								);
							})}
						</Box>
					</Box>
				);

			case 'checkbox':
				return (
					<Box
						key={field.fieldId}
						sx={{
							'mb': '2rem',
							'p': 2,
							'borderRadius': '12px',
							'backgroundColor': 'rgba(255, 255, 255, 0.95)',
							'boxShadow': '0 2px 8px rgba(0, 0, 0, 0.08)',
							'border': '2px solid rgba(102, 126, 234, 0.3)',
							'&:hover': {
								boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)',
								borderColor: 'rgba(102, 126, 234, 0.5)',
							},
						}}>
						<FormLabel
							required={isRequired}
							component='legend'
							sx={{
								mb: '0.5rem',
								display: 'block',
								color: theme.textColor?.primary.main,
								fontWeight: 600,
								fontSize: '0.95rem',
								fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
							}}>
							{field.label}
						</FormLabel>
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
							{field.options?.map((option, index) => {
								const isSelected = (value as string[])?.includes(option) || false;
								return (
									<Box
										key={index}
										onClick={() => {
											const currentValues = (value as string[]) || [];
											const newValues = isSelected ? currentValues.filter((v) => v !== option) : [...currentValues, option];
											handleFieldChange(field.fieldId, newValues);
										}}
										sx={{
											'display': 'flex',
											'alignItems': 'center',
											'p': 2,
											'borderRadius': '12px',
											'border': `2px solid ${isSelected ? '#667eea' : 'rgba(102, 126, 234, 0.2)'}`,
											'backgroundColor': isSelected ? 'rgba(102, 126, 234, 0.08)' : 'rgba(255, 255, 255, 0.6)',
											'cursor': 'pointer',
											'position': 'relative',
											'overflow': 'hidden',
											'&::before': {
												content: '""',
												position: 'absolute',
												top: 0,
												left: 0,
												right: 0,
												bottom: 0,
												background: isSelected
													? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)'
													: 'transparent',
											},
											'&:hover': {
												borderColor: '#667eea',
												backgroundColor: isSelected ? 'rgba(102, 126, 234, 0.12)' : 'rgba(102, 126, 234, 0.05)',
												boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
											},
											'&:active': {
												transform: 'translateY(0)',
											},
										}}>
										<Box
											sx={{
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												width: 24,
												height: 24,
												borderRadius: '6px',
												border: `2px solid ${isSelected ? '#667eea' : 'rgba(102, 126, 234, 0.4)'}`,
												backgroundColor: isSelected ? '#667eea' : 'transparent',
												mr: 2,
												position: 'relative',
												flexShrink: 0,
												overflow: 'hidden',
											}}>
											{isSelected && (
												<Check
													sx={{
														color: 'white',
														fontSize: '18px',
														position: 'absolute',
														// Removed animation to prevent flashing
													}}
												/>
											)}
										</Box>
										<Typography
											sx={{
												fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif",
												fontSize: '0.95rem',
												color: theme.textColor?.primary.main,
												fontWeight: isSelected ? 600 : 400,
												position: 'relative',
												zIndex: 1,
											}}>
											{option}
										</Typography>
									</Box>
								);
							})}
						</Box>
					</Box>
				);

			case 'date':
				return (
					<>
						<FormLabel
							required={isRequired}
							sx={{
								mb: '0.5rem',
								display: 'block',
								color: theme.textColor?.primary.main,
								fontWeight: 600,
								fontSize: '0.95rem',
								fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
							}}>
							{field.label}
						</FormLabel>
						<CustomTextField
							key={field.fieldId}
							fullWidth
							placeholder={field.placeholder}
							required={isRequired}
							type='date'
							value={value || ''}
							onChange={(e) => handleFieldChange(field.fieldId, e.target.value)}
							disableSanitization={true}
							InputLabelProps={{
								shrink: true,
							}}
							variant='outlined'
							sx={{
								'mb': '1.5rem',
								'& .MuiOutlinedInput-root': {
									'backgroundColor': 'rgba(255, 255, 255, 0.95)',
									'borderRadius': '12px',
									'boxShadow': '0 2px 8px rgba(0, 0, 0, 0.08)',
									'&:hover': {
										boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
									},
									'&.Mui-focused': {
										boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
									},
									'& fieldset': {
										borderColor: 'rgba(102, 126, 234, 0.3)',
										borderWidth: '2px',
									},
									'&:hover fieldset': {
										borderColor: 'rgba(102, 126, 234, 0.3)',
									},
									'&.Mui-focused fieldset': {
										borderColor: 'rgba(102, 126, 234, 0.8)',
										borderWidth: '2px',
									},
								},
								'& .MuiInputLabel-root': {
									fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
									fontSize: '0.95rem',
								},
								'& .MuiInputBase-input': {
									fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif",
									fontSize: '0.95rem',
									padding: '14px 16px',
								},
								'& .MuiInputBase-input::placeholder': {
									fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
									opacity: 0.6,
								},
							}}
						/>
					</>
				);

			default:
				return null;
		}
	};

	if (loading) {
		return (
			<Box
				sx={{
					'minHeight': '100vh',
					'display': 'flex',
					'flexDirection': 'column',
					'alignItems': 'center',
					'justifyContent': 'center',
					'position': 'relative',
					'overflow': 'hidden',
					'backgroundImage': `url(${LondonBg})`,
					'backgroundSize': 'cover',
					'backgroundPosition': 'center',
					'backgroundRepeat': 'no-repeat',
					'&::before': {
						content: '""',
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.75) 100%)',
						zIndex: 0,
						pointerEvents: 'none',
					},
					'&::after': {
						content: '""',
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background:
							'radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.08) 0%, transparent 50%)',
						zIndex: 0,
						pointerEvents: 'none',
					},
					'& h1, h2, h3, h4, h5, h6': {
						fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
						fontWeight: 500,
					},
					'& button': {
						fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
						fontWeight: 400,
					},
					'& label': {
						fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
					},
					'& .MuiFormLabel-root': {
						fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
					},
					'& .MuiInputLabel-root': {
						fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
					},
					'& input::placeholder': {
						fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
					},
					'& textarea::placeholder': {
						fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
					},
					'& .MuiInputBase-input::placeholder': {
						fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
					},
					'padding': 4,
				}}>
				<CircularProgress sx={{ color: theme.palette.primary.main, zIndex: 1 }} />
				<Typography variant='h6' sx={{ mt: 2, color: theme.textColor?.primary.main, zIndex: 1 }}>
					Form yükleniyor...
				</Typography>
			</Box>
		);
	}

	if (error || !form) {
		return (
			<Box
				sx={{
					'minHeight': '100vh',
					'display': 'flex',
					'flexDirection': 'column',
					'alignItems': 'center',
					'justifyContent': 'center',
					'position': 'relative',
					'overflow': 'hidden',
					'backgroundImage': `url(${LondonBg})`,
					'backgroundSize': 'cover',
					'backgroundPosition': 'center',
					'backgroundRepeat': 'no-repeat',
					'&::before': {
						content: '""',
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.75) 100%)',
						zIndex: 0,
						pointerEvents: 'none',
					},
					'&::after': {
						content: '""',
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background:
							'radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.08) 0%, transparent 50%)',
						zIndex: 0,
						pointerEvents: 'none',
					},
					'& h1, h2, h3, h4, h5, h6': {
						fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
						fontWeight: 500,
					},
					'& button': {
						fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
						fontWeight: 400,
					},
					'& label': {
						fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
					},
					'& .MuiFormLabel-root': {
						fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
					},
					'& .MuiInputLabel-root': {
						fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
					},
					'& input::placeholder': {
						fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
					},
					'& textarea::placeholder': {
						fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
					},
					'& .MuiInputBase-input::placeholder': {
						fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
					},
					'padding': 4,
				}}>
				<Box sx={{ textAlign: 'center', mb: 4 }}>
					<Box
						onClick={() => navigate('/')}
						sx={{
							'display': 'inline-block',
							'cursor': 'pointer',
							'&:hover': {
								opacity: 0.8,
							},
						}}>
						<img src={logo} alt='Logo' style={{ height: '80px', marginBottom: '2rem' }} />
					</Box>
				</Box>
				<Paper
					elevation={8}
					sx={{
						p: 4,
						maxWidth: 500,
						width: '100%',
						backgroundColor: 'rgba(255, 255, 255, 0.95)',
						borderRadius: 3,
						position: 'relative',
						zIndex: 1,
					}}>
					<Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
						<ErrorIcon color='error' sx={{ mr: 1 }} />
						<Typography variant='h5' sx={{ color: theme.textColor?.primary.main, fontWeight: 600 }}>
							Form Bulunamadı
						</Typography>
					</Box>
					<Typography variant='body1' sx={{ color: theme.textColor?.secondary.main }}>
						{error || 'Bu form bulunamadı veya bağlantı geçersiz.'}
					</Typography>
				</Paper>
			</Box>
		);
	}

	if (submitted) {
		return (
			<Box
				sx={{
					'minHeight': '100vh',
					'display': 'flex',
					'flexDirection': 'column',
					'alignItems': 'center',
					'justifyContent': 'center',
					'position': 'relative',
					'overflow': 'hidden',
					'backgroundImage': `url(${LondonBg})`,
					'backgroundSize': 'cover',
					'backgroundPosition': 'center',
					'backgroundRepeat': 'no-repeat',
					'&::before': {
						content: '""',
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.75) 100%)',
						zIndex: 0,
						pointerEvents: 'none',
					},
					'&::after': {
						content: '""',
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background:
							'radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.08) 0%, transparent 50%)',
						zIndex: 0,
						pointerEvents: 'none',
					},
					'& h1, h2, h3, h4, h5, h6': {
						fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
						fontWeight: 500,
					},
					'& button': {
						fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
						fontWeight: 400,
					},
					'& label': {
						fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
					},
					'& .MuiFormLabel-root': {
						fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
					},
					'& .MuiInputLabel-root': {
						fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
					},
					'& input::placeholder': {
						fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
					},
					'& textarea::placeholder': {
						fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
					},
					'& .MuiInputBase-input::placeholder': {
						fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
					},
					'padding': 4,
				}}>
				<Box sx={{ textAlign: 'center', mb: 4 }}>
					<Box
						onClick={() => navigate('/')}
						sx={{
							'display': 'inline-block',
							'cursor': 'pointer',
							'&:hover': {
								opacity: 0.8,
							},
						}}>
						<img src={logo} alt='Logo' style={{ height: '80px', marginBottom: '2rem' }} />
					</Box>
				</Box>
				<Paper
					elevation={8}
					sx={{
						p: 4,
						maxWidth: 600,
						width: '100%',
						backgroundColor: 'rgba(255, 255, 255, 0.95)',
						borderRadius: 3,
						textAlign: 'center',
						position: 'relative',
						zIndex: 1,
					}}>
					<CheckCircle sx={{ fontSize: 64, color: theme.palette.success.main, mb: 2 }} />
					<Typography variant='h4' sx={{ color: theme.textColor?.primary.main, fontWeight: 600, mb: 2 }}>
						Teşekkürler!
					</Typography>
					<Typography variant='body1' sx={{ color: theme.textColor?.secondary.main, mb: 3 }}>
						Yanıtınız başarıyla gönderildi.
					</Typography>
				</Paper>
			</Box>
		);
	}

	// Sort fields by order
	const sortedFields = [...form.fields].sort((a, b) => a.order - b.order);

	return (
		<Box
			sx={{
				'minHeight': '100vh',
				'position': 'relative',
				'overflow': 'auto',
				'backgroundImage': `url(${LondonBg})`,
				'backgroundSize': 'cover',
				'backgroundPosition': 'center',
				'backgroundRepeat': 'no-repeat',
				'backgroundAttachment': 'fixed',
				'&::before': {
					content: '""',
					position: 'fixed',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.75) 100%)',
					zIndex: 0,
					pointerEvents: 'none',
				},
				'&::after': {
					content: '""',
					position: 'fixed',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					background:
						'radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.08) 0%, transparent 50%)',
					zIndex: 0,
					pointerEvents: 'none',
				},
				'& h1, h2, h3, h4, h5, h6': {
					fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
					fontWeight: 500,
				},
				'& button': {
					fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
					fontWeight: 400,
				},
				'& label': {
					fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
				},
				'& .MuiFormLabel-root': {
					fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
				},
				'& .MuiInputLabel-root': {
					fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
				},
				'& input::placeholder': {
					fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
				},
				'& textarea::placeholder': {
					fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
				},
				'& .MuiInputBase-input::placeholder': {
					fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
				},
				'& .gradient-text': {
					background: 'linear-gradient(135deg, #4f46e5 0%, #5b21b6 50%, #7c3aed 100%)',
					WebkitBackgroundClip: 'text',
					WebkitTextFillColor: 'transparent',
					backgroundClip: 'text',
				},
				'& .accent-color': {
					color: '#1e293b',
				},
				'& .secondary-color': {
					color: '#6366f1',
				},
				'& .tertiary-color': {
					color: '#64748b',
				},
				'padding': { xs: 2, sm: 4 },
				'py': 4,
			}}>
			<Container maxWidth='md' sx={{ position: 'relative', zIndex: 1 }}>
				{/* Header with Logo */}
				<Box sx={{ textAlign: 'center', mb: 3 }}>
					<Box
						onClick={() => navigate('/')}
						sx={{
							'display': 'inline-block',
							'cursor': 'pointer',
							'&:hover': {
								opacity: 0.8,
							},
						}}>
						<img src={logo} alt='Logo' style={{ height: '80px', marginBottom: '1rem', filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }} />
					</Box>
				</Box>

				{/* Form Card */}
				<Paper
					elevation={8}
					sx={{
						p: { xs: 3, sm: 5 },
						backgroundColor: 'rgba(255, 255, 255, 0.95)',
						borderRadius: 3,
						boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
						position: 'relative',
						zIndex: 1,
						mb: '2rem',
					}}>
					{/* Form Title */}
					<Typography variant='h4' sx={{ color: theme.textColor?.primary.main, fontWeight: 700, mb: 1, textAlign: 'center' }}>
						{form.title}
					</Typography>

					{/* Form Description */}
					{form.description && (
						<Typography variant='body1' sx={{ color: theme.textColor?.secondary.main, mb: 4, textAlign: 'center' }}>
							{form.description}
						</Typography>
					)}

					<Divider sx={{ my: 3 }} />

					{/* User Info (if not anonymous) */}
					{!form.allowAnonymous && (
						<Box sx={{ mb: 4 }}>
							<Typography variant='h6' sx={{ color: theme.textColor?.primary.main, mb: 2, fontWeight: 600 }}>
								Bilgileriniz
							</Typography>
							<CustomTextField
								fullWidth
								label='İsim'
								required
								type='text'
								value={userName}
								onChange={(e) => {
									const sanitized = validateInputLength(sanitizeTextInput(e.target.value), MAX_NAME_LENGTH);
									setUserName(sanitized);
								}}
								variant='outlined'
								InputProps={{
									inputProps: {
										maxLength: MAX_NAME_LENGTH,
									},
								}}
								sx={{
									'mb': 2,
									'& .MuiOutlinedInput-root': {
										'backgroundColor': 'rgba(255, 255, 255, 0.95)',
										'borderRadius': '12px',
										'boxShadow': '0 2px 8px rgba(0, 0, 0, 0.08)',
										'&:hover': {
											backgroundColor: 'rgba(255, 255, 255, 1)',
											boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)',
										},
										'&.Mui-focused': {
											backgroundColor: 'rgba(255, 255, 255, 1)',
											boxShadow: '0 6px 20px rgba(102, 126, 234, 0.25)',
										},
										'& fieldset': {
											borderColor: 'rgba(102, 126, 234, 0.3)',
											borderWidth: '2px',
										},
										'&:hover fieldset': {
											borderColor: 'rgba(102, 126, 234, 0.5)',
										},
										'&.Mui-focused fieldset': {
											borderColor: 'rgba(102, 126, 234, 0.8)',
											borderWidth: '2px',
										},
									},
									'& .MuiInputLabel-root': {
										fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
										fontSize: '0.95rem',
									},
									'& .MuiInputBase-input': {
										fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif",
										fontSize: '0.95rem',
										padding: '14px 16px',
									},
								}}
							/>
							<CustomTextField
								fullWidth
								label='E-posta'
								type='email'
								required
								value={userEmail}
								onChange={(e) => {
									const sanitized = validateInputLength(sanitizeEmailInput(e.target.value), MAX_EMAIL_LENGTH);
									setUserEmail(sanitized);
								}}
								variant='outlined'
								InputProps={{
									inputProps: {
										maxLength: MAX_EMAIL_LENGTH,
									},
								}}
								sx={{
									'& .MuiOutlinedInput-root': {
										'backgroundColor': 'rgba(255, 255, 255, 0.95)',
										'borderRadius': '12px',
										'boxShadow': '0 2px 8px rgba(0, 0, 0, 0.08)',
										'&:hover': {
											backgroundColor: 'rgba(255, 255, 255, 1)',
											boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)',
										},
										'&.Mui-focused': {
											backgroundColor: 'rgba(255, 255, 255, 1)',
											boxShadow: '0 6px 20px rgba(102, 126, 234, 0.25)',
										},
										'& fieldset': {
											borderColor: 'rgba(102, 126, 234, 0.3)',
											borderWidth: '2px',
										},
										'&:hover fieldset': {
											borderColor: 'rgba(102, 126, 234, 0.5)',
										},
										'&.Mui-focused fieldset': {
											borderColor: 'rgba(102, 126, 234, 0.8)',
											borderWidth: '2px',
										},
									},
									'& .MuiInputLabel-root': {
										fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
										fontSize: '0.95rem',
									},
									'& .MuiInputBase-input': {
										fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif",
										fontSize: '0.95rem',
										padding: '14px 16px',
									},
								}}
							/>
						</Box>
					)}

					{/* Error Message */}
					{submitError && (
						<Alert severity='error' sx={{ mb: 3 }}>
							{submitError}
						</Alert>
					)}

					{/* Form Fields */}
					<form onSubmit={handleSubmit}>
						{sortedFields.map((field) => (
							<Fragment key={field.fieldId}>{renderField(field)}</Fragment>
						))}

						{/* reCAPTCHA */}
						<Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 2 }}>
							<ReCAPTCHA
								ref={recaptchaRef}
								sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
								onChange={(token) => {
									setRecaptchaToken(token);
									setSubmitError(null);
								}}
								onExpired={() => {
									setRecaptchaToken(null);
								}}
								onError={() => {
									setRecaptchaToken(null);
									setSubmitError('reCAPTCHA doğrulaması başarısız oldu. Lütfen tekrar deneyin.');
								}}
							/>
						</Box>

						{/* Submit Button */}
						<Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
							<Button
								type='submit'
								variant='contained'
								size='medium'
								disabled={submitting}
								sx={{
									'px': 3,
									'py': 1,
									'fontSize': '1rem',
									'fontWeight': 600,
									'fontFamily': "'Varela Round', 'Segoe UI', 'Arial', sans-serif",
									'background': 'linear-gradient(135deg, #FF6B3D 0%, #ff7d55 100%)',
									'color': '#FFFFFF',
									'boxShadow': '0 4px 15px rgba(255, 107, 61, 0.35)',
									'&:hover': {
										background: 'linear-gradient(135deg, #ff7d55 0%, #FF6B3D 100%)',
										boxShadow: '0 6px 20px rgba(255, 107, 61, 0.45)',
									},
									'textTransform': 'uppercase',
									'borderRadius': '0.5rem',
								}}>
								{submitting ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Gönder'}
							</Button>
						</Box>
					</form>
				</Paper>

				{/* Copyright */}
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'center',
						width: '100%',
						mt: 2,
						mb: 1,
						position: 'relative',
						zIndex: 1,
					}}>
					<Typography
						sx={{
							fontSize: isSmallScreen ? '0.5rem' : '0.65rem',
							color: theme.textColor?.primary.main || 'rgba(0, 0, 0, 0.6)',
							fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif",
							position: 'absolute',
							bottom: 0,
							left: 0,
							right: 0,
							textAlign: 'center',
						}}>
						&copy; {new Date().getFullYear()} Webnexia Software Solutions Ltd. Tüm hakları saklıdır.
					</Typography>
				</Box>
			</Container>
		</Box>
	);
};

export default PublicFeedbackFormPage;
