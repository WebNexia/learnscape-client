import { useState, useEffect } from 'react';
import { Box, Button, Typography, Dialog, DialogContent, DialogActions } from '@mui/material';
import { Link } from 'react-router-dom';
import { Cookie } from '@mui/icons-material';
import theme from '../../themes';
import { useContext } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import { setCookieConsent } from '../../utils/cookieConsentStorage';

interface CookieConsentProps {
	forceOpen?: boolean;
	onClose?: () => void;
}

type BannerLocale = 'tr' | 'en';

const bannerContent: Record<
	BannerLocale,
	{
		title: string;
		body: string;
		learnMore: string;
		decline: string;
		accept: string;
	}
> = {
	tr: {
		title: 'Çerez Kullanımı',
		body: 'Web sitemizin temel işlevlerini güvenli ve kesintisiz şekilde sunabilmesi için zorunlu çerezler kullanıyoruz. Ayrıca, deneyiminizi iyileştirmek ve hizmetlerimizi geliştirmek amacıyla isteğe bağlı çerezler kullanabiliriz. Zorunlu olmayan çerezleri kabul edebilir veya reddedebilirsiniz. Tercihlerinizi dilediğiniz zaman güncelleyebilirsiniz.',
		learnMore: 'Daha fazla bilgi',
		decline: 'Reddet',
		accept: 'Tümünü Kabul Et',
	},
	en: {
		title: 'Cookie Usage',
		body: 'We use essential cookies to provide core website functionality securely and without interruption. We may also use optional cookies to improve your experience and develop our services. You may accept or decline non-essential cookies and update your preferences at any time.',
		learnMore: 'Learn more',
		decline: 'Decline',
		accept: 'Accept All',
	},
};

function detectBannerLocale(): BannerLocale {
	if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('en')) {
		return 'en';
	}
	return 'tr';
}

const CookieConsent = ({ forceOpen, onClose }: CookieConsentProps = { forceOpen: undefined, onClose: undefined }) => {
	const [open, setOpen] = useState<boolean>(false);
	const [locale, setLocale] = useState<BannerLocale>(detectBannerLocale);
	const { isRotatedMedium, isSmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const copy = bannerContent[locale];

	useEffect(() => {
		if (forceOpen === true) {
			setOpen(true);
		} else if (forceOpen === false) {
			setOpen(false);
		} else {
			const cookieConsent = localStorage.getItem('cookieConsent');
			if (!cookieConsent) {
				const timer = setTimeout(() => {
					setOpen(true);
				}, 1000);
				return () => clearTimeout(timer);
			}
		}
	}, [forceOpen]);

	const handleClose = () => {
		setOpen(false);
		onClose?.();
	};

	const handleAccept = () => {
		setCookieConsent('accepted');
		handleClose();
	};

	const handleDecline = () => {
		setCookieConsent('declined');
		handleClose();
	};

	if (!open) return null;

	return (
		<Dialog
			open={open}
			onClose={forceOpen ? handleClose : () => {}}
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
				<Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: '0.5rem', gap: '0.25rem' }}>
					<Button
						size='small'
						variant={locale === 'tr' ? 'contained' : 'outlined'}
						onClick={() => setLocale('tr')}
						sx={{ minWidth: '2.5rem', fontSize: '0.7rem', fontFamily: 'Varela Round, sans-serif', textTransform: 'none' }}>
						TR
					</Button>
					<Button
						size='small'
						variant={locale === 'en' ? 'contained' : 'outlined'}
						onClick={() => setLocale('en')}
						sx={{ minWidth: '2.5rem', fontSize: '0.7rem', fontFamily: 'Varela Round, sans-serif', textTransform: 'none' }}>
						EN
					</Button>
				</Box>
				<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
					<Cookie sx={{ fontSize: isMobileSize ? '1.5rem' : '2rem', color: theme.palette.primary.main, flexShrink: 0 }} />
					<Box sx={{ flex: 1 }}>
						<Typography
							variant='h6'
							sx={{ fontSize: isMobileSize ? '0.9rem' : '1rem', fontWeight: 600, mb: '0.5rem', fontFamily: 'Varela Round, sans-serif' }}>
							{copy.title}
						</Typography>
						<Typography
							variant='body2'
							sx={{
								fontSize: isMobileSize ? '0.75rem' : '0.85rem',
								color: 'text.secondary',
								lineHeight: 1.7,
								fontFamily: 'Varela Round, sans-serif',
							}}>
							{copy.body}{' '}
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
								{copy.learnMore}
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
					{copy.decline}
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
					{copy.accept}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default CookieConsent;
