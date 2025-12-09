import { Box, Container, Typography, TextField, Button, Rating, FormLabel, Alert, CircularProgress, Paper, Divider } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { feedbackFormsService } from '../services/feedbackFormsService';
import { FeedbackForm, FeedbackFormField } from '../interfaces/feedbackForm';
import theme from '../themes';
import logo from '../assets/logo.png';
import LondonBg from '../assets/london-bg.jpg';
import { CheckCircle, Error as ErrorIcon, Check } from '@mui/icons-material';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';

const PublicFeedbackFormPage = () => {
	const { publicLink } = useParams<{ publicLink: string }>();
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
				setError('Invalid form link');
				setLoading(false);
				return;
			}

			try {
				setLoading(true);
				const formData = await feedbackFormsService.getFeedbackFormByPublicLink(publicLink);

				// Check if form deadline has passed
				if (formData.submissionDeadline && new Date(formData.submissionDeadline) < new Date()) {
					setError('This form submission deadline has passed and is no longer accepting responses.');
					setForm(null);
				} else {
					setForm(formData);
					setError(null);
				}
			} catch (err: any) {
				setError(err?.response?.data?.message || 'Form not found or no longer available');
			} finally {
				setLoading(false);
			}
		};

		fetchForm();
	}, [publicLink]);

	const handleFieldChange = (fieldId: string, value: any) => {
		setResponses((prev) => ({
			...prev,
			[fieldId]: value,
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
			}
		}

		// If not anonymous, require name/email
		if (!form.allowAnonymous) {
			if (!userName.trim() || !userEmail.trim()) {
				return false;
			}
		}

		return true;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!form || !publicLink) return;

		if (!validateForm()) {
			setSubmitError('Please fill in all required fields');
			return;
		}

		try {
			setSubmitting(true);
			setSubmitError(null);

			const submissionData = {
				responses: Object.entries(responses).map(([fieldId, value]) => ({
					fieldId,
					value,
				})),
				...(form.allowAnonymous
					? {}
					: {
							userName: userName.trim(),
							userEmail: userEmail.trim(),
						}),
			};

			await feedbackFormsService.submitFeedbackForm(publicLink, submissionData);

			// Mark as submitted in localStorage to prevent duplicate submissions on refresh
			if (!form.allowMultipleSubmissions && publicLink) {
				localStorage.setItem(`form_submitted_${publicLink}`, 'true');
			}

			setSubmitted(true);
		} catch (err: any) {
			setSubmitError(err?.response?.data?.message || 'Failed to submit form. Please try again.');
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
						<TextField
							key={field.fieldId}
							fullWidth
							placeholder={field.placeholder}
							required={isRequired}
							value={value || ''}
							onChange={(e) => handleFieldChange(field.fieldId, e.target.value)}
							variant='outlined'
							sx={{
								'mb': '1.5rem',
								'& .MuiOutlinedInput-root': {
									'backgroundColor': 'rgba(255, 255, 255, 0.95)',
									'borderRadius': '12px',
									'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
										transition: 'all 0.3s ease',
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
									transition: 'all 0.3s ease',
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
						<TextField
							key={field.fieldId}
							fullWidth
							placeholder={field.placeholder}
							required={isRequired}
							value={value || ''}
							onChange={(e) => handleFieldChange(field.fieldId, e.target.value)}
							multiline
							rows={4}
							variant='outlined'
							sx={{
								'mb': '2rem',
								'& .MuiOutlinedInput-root': {
									'backgroundColor': 'rgba(255, 255, 255, 0.95)',
									'borderRadius': '12px',
									'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
										transition: 'all 0.3s ease',
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
									transition: 'all 0.3s ease',
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
							'transition': 'all 0.3s ease',
							'&:hover': {
								boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)',
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
									transition: 'all 0.2s ease',
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
							'transition': 'all 0.3s ease',
							'&:hover': {
								boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)',
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
											'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
												transition: 'all 0.3s ease',
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
												'transition': 'all 0.3s ease',
												'position': 'relative',
												'flexShrink': 0,
												'&::after': {
													content: '""',
													position: 'absolute',
													width: isSelected ? '8px' : '0',
													height: isSelected ? '8px' : '0',
													borderRadius: '50%',
													backgroundColor: 'white',
													transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
												transition: 'all 0.3s ease',
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
							'transition': 'all 0.3s ease',
							'&:hover': {
								boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)',
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
											'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
												transition: 'all 0.3s ease',
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
												transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
												position: 'relative',
												flexShrink: 0,
												overflow: 'hidden',
											}}>
											{isSelected && (
												<Check
													sx={{
														'color': 'white',
														'fontSize': '18px',
														'position': 'absolute',
														'animation': 'checkmarkAppear 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
														'@keyframes checkmarkAppear': {
															'0%': {
																opacity: 0,
																transform: 'scale(0) rotate(-45deg)',
															},
															'100%': {
																opacity: 1,
																transform: 'scale(1) rotate(0deg)',
															},
														},
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
												transition: 'all 0.3s ease',
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
						<TextField
							key={field.fieldId}
							fullWidth
							placeholder={field.placeholder}
							required={isRequired}
							type='date'
							value={value || ''}
							onChange={(e) => handleFieldChange(field.fieldId, e.target.value)}
							InputLabelProps={{
								shrink: true,
							}}
							variant='outlined'
							sx={{
								'mb': '1.5rem',
								'& .MuiOutlinedInput-root': {
									'backgroundColor': 'rgba(255, 255, 255, 0.95)',
									'borderRadius': '12px',
									'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
										transition: 'all 0.3s ease',
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
									transition: 'all 0.3s ease',
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
						position: 'absolute',
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
						position: 'absolute',
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
					Loading form...
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
						position: 'absolute',
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
						position: 'absolute',
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
					<img src={logo} alt='Logo' style={{ height: '80px', marginBottom: '2rem' }} />
				</Box>
				<Paper
					elevation={8}
					sx={{
						p: 4,
						maxWidth: 500,
						width: '100%',
						backgroundColor: 'rgba(255, 255, 255, 0.95)',
						backdropFilter: 'blur(10px)',
						borderRadius: 3,
						position: 'relative',
						zIndex: 1,
					}}>
					<Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
						<ErrorIcon color='error' sx={{ mr: 1 }} />
						<Typography variant='h5' sx={{ color: theme.textColor?.primary.main, fontWeight: 600 }}>
							Form Not Available
						</Typography>
					</Box>
					<Typography variant='body1' sx={{ color: theme.textColor?.secondary.main }}>
						{error || 'This form is no longer available or the link is invalid.'}
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
						position: 'absolute',
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
						position: 'absolute',
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
					<img src={logo} alt='Logo' style={{ height: '80px', marginBottom: '2rem' }} />
				</Box>
				<Paper
					elevation={8}
					sx={{
						p: 4,
						maxWidth: 600,
						width: '100%',
						backgroundColor: 'rgba(255, 255, 255, 0.95)',
						backdropFilter: 'blur(10px)',
						borderRadius: 3,
						textAlign: 'center',
						position: 'relative',
						zIndex: 1,
					}}>
					<CheckCircle sx={{ fontSize: 64, color: theme.palette.success.main, mb: 2 }} />
					<Typography variant='h4' sx={{ color: theme.textColor?.primary.main, fontWeight: 600, mb: 2 }}>
						Thank You!
					</Typography>
					<Typography variant='body1' sx={{ color: theme.textColor?.secondary.main, mb: 3 }}>
						Your response has been submitted successfully.
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
				'overflow': 'hidden',
				'backgroundImage': `url(${LondonBg})`,
				'backgroundSize': 'cover',
				'backgroundPosition': 'center',
				'backgroundRepeat': 'no-repeat',
				'backgroundAttachment': 'fixed',
				'&::before': {
					content: '""',
					position: 'absolute',
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
					position: 'absolute',
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
				'& *': {
					fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif",
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
					'background': 'linear-gradient(135deg, #4f46e5 0%, #5b21b6 50%, #7c3aed 100%)',
					'WebkitBackgroundClip': 'text',
					'WebkitTextFillColor': 'transparent',
					'backgroundClip': 'text',
					'backgroundSize': '200% 200%',
					'animation': 'gradientShift 6s ease infinite',
					'@keyframes gradientShift': {
						'0%': { backgroundPosition: '0% 50%' },
						'50%': { backgroundPosition: '100% 50%' },
						'100%': { backgroundPosition: '0% 50%' },
					},
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
					<img src={logo} alt='Logo' style={{ height: '80px', marginBottom: '1rem', filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }} />
				</Box>

				{/* Form Card */}
				<Paper
					elevation={8}
					sx={{
						p: { xs: 3, sm: 5 },
						backgroundColor: 'rgba(255, 255, 255, 0.95)',
						backdropFilter: 'blur(10px)',
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
								Your Information
							</Typography>
							<TextField
								fullWidth
								label='Name'
								required
								value={userName}
								onChange={(e) => setUserName(e.target.value)}
								variant='outlined'
								sx={{
									'mb': 2,
									'& .MuiOutlinedInput-root': {
										'backgroundColor': 'rgba(255, 255, 255, 0.95)',
										'borderRadius': '12px',
										'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
											transition: 'all 0.3s ease',
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
							<TextField
								fullWidth
								label='Email'
								type='email'
								required
								value={userEmail}
								onChange={(e) => setUserEmail(e.target.value)}
								variant='outlined'
								sx={{
									'& .MuiOutlinedInput-root': {
										'backgroundColor': 'rgba(255, 255, 255, 0.95)',
										'borderRadius': '12px',
										'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
											transition: 'all 0.3s ease',
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
						{sortedFields.map((field) => renderField(field))}

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
									'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
									'textTransform': 'uppercase',
									'borderRadius': '0.5rem',
								}}>
								{submitting ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Submit'}
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
						&copy; 2025 Webnexia Software Solutions Ltd. Tüm hakları saklıdır.
					</Typography>
				</Box>
			</Container>
		</Box>
	);
};

export default PublicFeedbackFormPage;
