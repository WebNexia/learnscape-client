import { useState, useEffect } from 'react';
import { Box, Button, Typography, Dialog, DialogContent, DialogActions } from '@mui/material';
import { Link } from 'react-router-dom';
import { Cookie } from '@mui/icons-material';
import theme from '../../themes';
import { useContext } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';

interface CookieConsentProps {
	forceOpen?: boolean;
	onClose?: () => void;
}

const CookieConsent = ({ forceOpen, onClose }: CookieConsentProps = { forceOpen: undefined, onClose: undefined }) => {
	const [open, setOpen] = useState<boolean>(false);
	const { isRotatedMedium, isSmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	useEffect(() => {
		if (forceOpen === true) {
			// Force open from footer/preferences link
			setOpen(true);
		} else if (forceOpen === false) {
			// Force close
			setOpen(false);
		} else {
			// Initial load - check if user has already made a choice
			const cookieConsent = localStorage.getItem('cookieConsent');
			if (!cookieConsent) {
				// Show banner after a short delay for better UX
				const timer = setTimeout(() => {
					setOpen(true);
				}, 1000);
				return () => clearTimeout(timer);
			}
		}
	}, [forceOpen]);

	const handleClose = () => {
		setOpen(false);
		if (onClose) {
			onClose();
		}
	};

	const handleAccept = () => {
		localStorage.setItem('cookieConsent', 'accepted');
		handleClose();
	};

	const handleDecline = () => {
		localStorage.setItem('cookieConsent', 'declined');

		// Clear optional localStorage data (GDPR/CCPA compliance)
		clearOptionalLocalStorageData();

		handleClose();
		// Note: Essential cookies (Firebase Auth, Stripe security, reCAPTCHA) will still work
		// Only optional analytics cookies would be disabled
	};

	// Function to clear optional localStorage data when user declines cookies
	const clearOptionalLocalStorageData = () => {
		try {
			// Get all localStorage keys
			const keys = Object.keys(localStorage);

			// Keys to preserve (essential for website functionality)
			const essentialKeys = [
				'cookieConsent', // User's cookie preference
				'sessionTimestamp', // Firebase Auth session
				'learnerSessionId', // Learner single-device session
				'rateLimitInfo', // Rate limiting (security)
			];

			// Patterns for optional data that should be cleared
			const optionalPatterns = [
				/^zm-/, // Zoom Meeting SDK preferences (zm-*)
				/^zoom-/i, // Zoom-related data (zoom-*)
				/^Zoom-/, // Zoom-related data (Zoom-*)
				/^tinymce-/i, // TinyMCE editor preferences (tinymce-*)
				/^TinyMCE-/, // TinyMCE editor preferences (TinyMCE-*)
				/^form_submitted_/, // Form submission tracking (form_submitted_*)
			];

			// Clear optional localStorage items
			keys.forEach((key) => {
				// Skip essential keys
				if (essentialKeys.includes(key)) {
					return;
				}

				// Check if key matches optional patterns
				const isOptional = optionalPatterns.some((pattern) => pattern.test(key));

				if (isOptional) {
					localStorage.removeItem(key);
				}
			});
		} catch (error) {
			console.error('Error clearing optional localStorage data:', error);
		}
	};

	if (!open) return null;

	return (
		<Dialog
			open={open}
			onClose={forceOpen ? handleClose : () => { }} // Allow closing if forced open, otherwise prevent
			maxWidth='sm'
			fullWidth
			PaperProps={{
				sx: {
					position: 'fixed',
					bottom: isMobileSize ? 0 : '2rem',
					left: isMobileSize ? 0 : '2rem',
					right: isMobileSize ? 0 : '2rem',
					m: isMobileSize ? 0 : 'auto',
					marginTop: 0,
					borderRadius: isMobileSize ? 0 : '0.5rem',
					boxShadow: '0 0.25rem 1rem rgba(0, 0, 0, 0.3)',
				},
			}}
			BackdropProps={{
				sx: {
					backgroundColor: 'rgba(0, 0, 0, 0.5)',
				},
			}}>
			<DialogContent
				sx={{
					padding: isMobileSize ? '1rem' : '1.5rem',
					backgroundColor: theme.palette.background.paper,
				}}>
				<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
					<Cookie sx={{ fontSize: isMobileSize ? '1.5rem' : '2rem', color: theme.palette.primary.main, flexShrink: 0 }} />
					<Box sx={{ flex: 1 }}>
						<Typography
							variant='h6'
							sx={{ fontSize: isMobileSize ? '0.9rem' : '1rem', fontWeight: 600, mb: '0.5rem', fontFamily: 'Varela Round, sans-serif' }}>
							Çerez Kullanımı
						</Typography>
						<Typography
							variant='body2'
							sx={{
								fontSize: isMobileSize ? '0.75rem' : '0.85rem',
								color: 'text.secondary',
								lineHeight: 1.7,
								fontFamily: 'Varela Round, sans-serif',
							}}>
							Web sitemizin temel işlevlerini güvenli ve kesintisiz şekilde sunabilmesi için zorunlu çerezler kullanıyoruz.
							Ayrıca, deneyiminizi iyileştirmek ve hizmetlerimizi geliştirmek amacıyla isteğe bağlı çerezler kullanabiliriz.
							Zorunlu olmayan çerezleri kabul edebilir veya reddedebilirsiniz. Tercihlerinizi dilediğiniz zaman güncelleyebilirsiniz.{' '}
							<Link
								to='/cookie-policy'
								onClick={() => setOpen(false)}
								style={{
									fontSize: 'inherit',
									textDecoration: 'underline',
									color: theme.palette.primary.main,
									cursor: 'pointer',
									fontFamily: 'Varela Round, sans-serif',
								}}>
								Daha fazla bilgi
							</Link>
						</Typography>
					</Box>
				</Box>
			</DialogContent>
			<DialogActions
				sx={{
					padding: isMobileSize ? '0.75rem 1rem' : '1rem 1.5rem',
					gap: '0.5rem',
					flexDirection: isMobileSize ? 'column' : 'row',
					justifyContent: 'flex-end',
				}}>
				<Button
					onClick={handleDecline}
					variant='outlined'
					size='small'
					sx={{
						fontSize: isMobileSize ? '0.75rem' : '0.85rem',
						padding: isMobileSize ? '0.25rem 0.75rem' : '0.25rem 1rem',
						minWidth: isMobileSize ? '100%' : 'auto',
						borderColor: theme.palette.text.secondary,
						color: theme.palette.text.secondary,
						textTransform: 'capitalize',
						fontFamily: 'Varela Round, sans-serif',
					}}>
					Reddet
				</Button>
				<Button
					onClick={handleAccept}
					variant='contained'
					size='small'
					sx={{
						'fontSize': isMobileSize ? '0.75rem' : '0.85rem',
						'padding': isMobileSize ? '0.25rem 0.75rem' : '0.25rem 1rem',
						'minWidth': isMobileSize ? '100%' : 'auto',
						'backgroundColor': theme.bgColor?.greenPrimary || theme.palette.primary.main,
						'&:hover': {
							backgroundColor: theme.bgColor?.greenSecondary || theme.palette.primary.dark,
						},
						'fontFamily': 'Varela Round, sans-serif',
						'textTransform': 'capitalize',
					}}>
					Tümünü Kabul Et
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default CookieConsent;
