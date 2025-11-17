import {
	Box,
	Typography,
	Card,
	CardContent,
	CardMedia,
	Chip,
	Button,
	useMediaQuery,
	useTheme,
	MobileStepper,
	IconButton,
	DialogContent,
	Snackbar,
	Alert,
} from '@mui/material';
import { useState, useRef, useEffect, useContext } from 'react';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import SwipeableViews from 'react-swipeable-views';
import { responsiveStyles } from '../../styles/responsiveStyles';
import { LandingPageUpcomingPublicEventsContext } from '../../contexts/LandingPageUpcomingPublicEventsContextProvider';
import { dateTimeFormatter } from '@utils/dateFormatter';
import axios from 'axios';
import CustomDialog from '../../components/layouts/dialog/CustomDialog';
import CustomTextField from '../../components/forms/customFields/CustomTextField';
import ReCAPTCHA from 'react-google-recaptcha';
import CustomDialogActions from '../../components/layouts/dialog/CustomDialogActions';
import CustomErrorMessage from '../../components/forms/customFields/CustomErrorMessage';
import logo from '../../assets/logo.png';

export default function UpcomingEvents() {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const defaultOrgId = import.meta.env.VITE_ORG_ID;
	const { upcomingEvents } = useContext(LandingPageUpcomingPublicEventsContext);
	const [isRegisterForEventModalOpen, setIsRegisterForEventModalOpen] = useState<boolean>(false);
	const [isRegisterForEventSuccess, setIsRegisterForEventSuccess] = useState<boolean>(false);
	const [isRegisterForEventSending, setIsRegisterForEventSending] = useState<boolean>(false);
	const [firstName, setFirstName] = useState<string>('');
	const [lastName, setLastName] = useState<string>('');
	const [email, setEmail] = useState<string>('');
	const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
	const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
	const [registerErrorMsg, setRegisterErrorMsg] = useState<string | null>(null);

	const recaptchaRef = useRef<any>(null);
	const isMobile = useMediaQuery('(max-width:600px)');

	const resetRecaptcha = () => {
		setRecaptchaToken(null);
		if (recaptchaRef.current) {
			recaptchaRef.current.reset();
		}
	};

	const handleRecaptchaChange = (token: string | null) => {
		setRecaptchaToken(token);
		setRegisterErrorMsg(null);
	};

	const handleRegisterForEvent = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!selectedEventId || !recaptchaToken) {
			setRegisterErrorMsg('Lütfen reCAPTCHA doğrulamasını tamamlayın');
			return;
		}
		try {
			setIsRegisterForEventSending(true);
			setRegisterErrorMsg(null);
			await axios.post(`${base_url}/eventRegistrations`, {
				eventId: selectedEventId,
				firstName,
				lastName,
				email,
				recaptchaToken,
				orgId: defaultOrgId,
			});
			setFirstName('');
			setLastName('');
			setEmail('');
			resetRecaptcha();
			setIsRegisterForEventSuccess(true);
			setIsRegisterForEventSending(false);
			setIsRegisterForEventModalOpen(false);
		} catch (error: any) {
			if (axios.isAxiosError(error) && error.response?.status === 409) {
				setRegisterErrorMsg('Bu etkinliğe bu email adresiyle daha önce kayıt oldunuz');
			} else {
				setRegisterErrorMsg('Kayıt işlemi sırasında bir hata oluştu');
			}
			resetRecaptcha();
		} finally {
			setIsRegisterForEventSending(false);
		}
	};

	const handleOpenRegisterDialog = (eventId: string) => {
		setSelectedEventId(eventId);
		setIsRegisterForEventModalOpen(true);
		setIsRegisterForEventSuccess(false);
		setFirstName('');
		setLastName('');
		setEmail('');
		resetRecaptcha();
	};

	function TimelineDesktop() {
		const { upcomingEvents } = useContext(LandingPageUpcomingPublicEventsContext);
		const scrollRef = useRef<HTMLDivElement>(null);
		const CARD_HEIGHT = 360;
		const IMAGE_HEIGHT = 120;
		const DOT_SIZE = 20;
		const LINE_THICKNESS = 4;
		const DOT_OFFSET = CARD_HEIGHT + 16;
		const GAP = 32; // 4 * 8px (theme.spacing(4))
		const CONTAINER_WIDTH = 1180;
		const CARD_WIDTH = (960 - 64) / 3;

		const [canScrollLeft, setCanScrollLeft] = useState(false);
		const [canScrollRight, setCanScrollRight] = useState(false);

		const checkScroll = () => {
			if (!scrollRef.current) return;
			const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
			setCanScrollLeft(scrollLeft > 0);
			setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
		};

		useEffect(() => {
			checkScroll();
			const ref = scrollRef.current;
			if (ref) {
				ref.addEventListener('scroll', checkScroll);
				window.addEventListener('resize', checkScroll);
			}
			return () => {
				if (ref) ref.removeEventListener('scroll', checkScroll);
				window.removeEventListener('resize', checkScroll);
			};
		}, []);

		const scrollBy = (offset: number) => {
			if (scrollRef.current) {
				scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
				setTimeout(checkScroll, 300); // ensure state updates after scroll
			}
		};

		// Touch/drag support
		let startX = 0;
		let scrollLeft = 0;

		const handleTouchStart = (e: React.TouchEvent) => {
			if (!scrollRef.current) return;
			startX = e.touches[0].pageX - scrollRef.current.offsetLeft;
			scrollLeft = scrollRef.current.scrollLeft;
		};

		const handleTouchMove = (e: React.TouchEvent) => {
			if (!scrollRef.current) return;
			const x = e.touches[0].pageX - scrollRef.current.offsetLeft;
			const walk = startX - x;
			scrollRef.current.scrollLeft = scrollLeft + walk;
		};

		return (
			<Box
				sx={{
					position: 'relative',
					width: { md: CONTAINER_WIDTH },
					maxWidth: '100%',
					mx: 'auto',
					py: 2,
					px: 8,
					overflow: 'hidden',
					display: 'flex',
					justifyContent: 'center',
				}}>
				<IconButton
					onClick={() => scrollBy(-(CARD_WIDTH + GAP))}
					disabled={!canScrollLeft}
					sx={{
						position: 'absolute',
						left: 10,
						top: '50%',
						zIndex: 10,
						transform: 'translateY(-50%)',
						background: 'white',
						boxShadow: 2,
						display: { xs: 'none', md: 'flex' },
						opacity: canScrollLeft ? 1 : 0.3,
						pointerEvents: canScrollLeft ? 'auto' : 'none',
					}}
					aria-label='Sola kaydır'>
					<KeyboardArrowLeft />
				</IconButton>
				<Box
					ref={scrollRef}
					sx={{
						'display': 'flex',
						'flexDirection': 'row',
						'justifyContent': upcomingEvents.length <= 3 ? 'center' : 'flex-start',
						'gap': `${GAP}px`,
						'overflowX': upcomingEvents.length > 3 ? 'auto' : 'visible',
						'scrollBehavior': 'smooth',
						'py': 2,
						'px': 0,
						'position': 'relative',
						'scrollbarWidth': 'none',
						'msOverflowStyle': 'none',
						'&::-webkit-scrollbar': {
							display: 'none',
						},
						'mx': '2rem',
						'width': 960,
					}}
					onTouchStart={handleTouchStart}
					onTouchMove={handleTouchMove}>
					{upcomingEvents?.map((event, idx) => (
						<Box
							key={event._id}
							sx={{
								minWidth: CARD_WIDTH,
								maxWidth: CARD_WIDTH,
								flex: '0 0 auto',
								position: 'relative',
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								height: CARD_HEIGHT + 40,
							}}>
							<Card
								sx={{
									width: CARD_WIDTH,
									minHeight: CARD_HEIGHT,
									maxHeight: CARD_HEIGHT,
									borderRadius: 4,
									boxShadow: 3,
									mb: 2,
									position: 'relative',
									zIndex: 2,
									display: 'flex',
									flexDirection: 'column',
								}}>
								<CardMedia
									component='img'
									height={IMAGE_HEIGHT}
									image={event.coverImageUrl || logo}
									alt={event.title}
									sx={{
										objectFit: event.coverImageUrl ? 'cover' : 'contain',
										borderTopLeftRadius: 16,
										borderTopRightRadius: 16,
										height: IMAGE_HEIGHT,
									}}
								/>
								<CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
									<Box display='flex' alignItems='center' mb={1}>
										<Chip label={event.type} color={event.type === 'Webinar' ? 'primary' : 'secondary'} size='small' sx={{ mr: 1 }} />
										<Typography variant='body2' sx={{ color: '#5A6C7D', fontSize: '0.8rem' }}>
											{dateTimeFormatter(event.start)}
										</Typography>
									</Box>
									<Typography variant='h6' fontWeight={600} gutterBottom>
										{event.title}
									</Typography>
									<Typography variant='body2' sx={{ color: '#334155', mb: 2 }}>
										{event.description}
									</Typography>
									<Button
										variant='contained'
										size='small'
										sx={{
											'fontFamily': 'Varela Round',
											'fontWeight': 800,
											'letterSpacing': '0.03em',
											'textShadow': '0 1px 2px rgba(0, 0, 0, 0.1)',
											'textTransform': 'capitalize',
											'background': 'linear-gradient(135deg, rgba(79, 70, 229, 0.7) 0%, rgba(91, 33, 182, 0.7) 50%, rgba(124, 58, 237, 0.7) 100%)',
											'color': '#FFFFFF',
											'borderRadius': { xs: '0.75rem', sm: '1rem', md: '1.25rem' },
											'padding': isMobile ? '0.4rem 1rem' : '0.5rem 1.75rem',
											'fontSize': isMobile ? '0.85rem' : '1rem',
											'boxShadow': '0 4px 15px rgba(79, 70, 229, 0.4)',
											'&:hover': {
												background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, rgba(124, 58, 237, 0.9) 50%, rgba(147, 51, 234, 0.9) 100%)',
												transform: 'translateY(-3px)',
												boxShadow: '0 4px 15px rgba(79, 70, 229, 0.4)',
											},
											'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
											'height': '2rem',
										}}
										onClick={() => handleOpenRegisterDialog(event._id)}>
										Kayıt Ol
									</Button>
								</CardContent>
							</Card>
							{/* Timeline dot (below the card) */}
							<Box
								sx={{
									width: DOT_SIZE,
									height: DOT_SIZE,
									background: '#8ec5fc',
									borderRadius: '50%',
									border: '4px solid white',
									position: 'absolute',
									left: '50%',
									top: DOT_OFFSET,
									transform: 'translateX(-50%)',
									zIndex: 3,
									boxShadow: 2,
								}}
							/>
							{/* Timeline line segment (except after last card) */}
							{idx < upcomingEvents.length - 1 && (
								<Box
									sx={{
										position: 'absolute',
										left: `calc(50% + ${DOT_SIZE / 2}px)`,
										top: DOT_OFFSET + DOT_SIZE / 2 - LINE_THICKNESS / 2,
										width: GAP + CARD_WIDTH - DOT_SIZE,
										height: LINE_THICKNESS,
										background: 'linear-gradient(90deg, #e0e7ef 0%, #c3dafe 100%)',
										zIndex: 1,
										borderRadius: 2,
									}}
								/>
							)}
						</Box>
					))}
				</Box>
				<IconButton
					onClick={() => scrollBy(CARD_WIDTH + GAP)}
					disabled={!canScrollRight}
					sx={{
						position: 'absolute',
						right: 10,
						top: '50%',
						zIndex: 10,
						transform: 'translateY(-50%)',
						background: 'white',
						boxShadow: 2,
						display: { xs: 'none', md: 'flex' },
						opacity: canScrollRight ? 1 : 0.3,
						pointerEvents: canScrollRight ? 'auto' : 'none',
					}}
					aria-label='Sağa kaydır'>
					<KeyboardArrowRight />
				</IconButton>
			</Box>
		);
	}

	function CarouselMobile() {
		const { upcomingEvents } = useContext(LandingPageUpcomingPublicEventsContext);
		const [activeStep, setActiveStep] = useState(0);
		const maxSteps = upcomingEvents.length;

		const handleStepChange = (step: number) => setActiveStep(step);

		return (
			<Box sx={{ maxWidth: 360, position: 'relative', backgroundColor: 'transparent' }}>
				<SwipeableViews
					index={activeStep}
					onChangeIndex={handleStepChange}
					enableMouseEvents
					resistance
					style={{ backgroundColor: 'transparent' }}
					containerStyle={{ backgroundColor: 'transparent' }}>
					{upcomingEvents?.map((event, _) => (
						<div key={event._id} style={{ backgroundColor: 'transparent' }}>
							<Card
								sx={{
									mt: '1.5rem',
									mb: '1rem',
									mx: 'auto',
									width: 250,
									borderRadius: 4,
									boxShadow: 3,
									height: 360,
									minHeight: 360,
									maxHeight: 360,
									position: 'relative',
									zIndex: 2,
									display: 'flex',
									flexDirection: 'column',
								}}>
								<CardMedia
									component='img'
									height='120'
									image={event.coverImageUrl || logo}
									alt={event.title}
									sx={{ objectFit: event.coverImageUrl ? 'cover' : 'contain', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
								/>
								<CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
									<Box display='flex' alignItems='center' mb={1}>
										<Chip label={event?.type} size='small' sx={{ mr: 1, fontSize: '0.7rem' }} />
										<Typography variant='body2' sx={{ color: '#334155', fontSize: '0.7rem' }}>
											{dateTimeFormatter(event.start)}
										</Typography>
									</Box>
									<Typography variant='h6' fontWeight={600} gutterBottom sx={{ fontSize: '0.9rem' }}>
										{event.title}
									</Typography>
									<Typography variant='body2' sx={{ color: '#334155', mb: 2, fontSize: '0.75rem' }}>
										{event.description}
									</Typography>
									<Button
										variant='contained'
										size='small'
										sx={{
											'background': 'linear-gradient(135deg, #FF6B3D 0%, #ff7d55 100%)',
											'color': '#FFFFFF',
											'borderRadius': 2,
											'textTransform': 'none',
											'float': 'right',
											'fontSize': '0.75rem',
											'fontFamily': 'Varela Round',
											'boxShadow': '0 4px 15px rgba(255, 107, 61, 0.35)',
											'&:hover': {
												background: 'linear-gradient(135deg, #ff7d55 0%, #FF6B3D 100%)',
												boxShadow: '0 6px 20px rgba(255, 107, 61, 0.45)',
											},
											'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
										}}
										onClick={() => handleOpenRegisterDialog(event._id)}>
										Kayıt Ol
									</Button>
								</CardContent>
							</Card>
						</div>
					))}
				</SwipeableViews>
				<MobileStepper
					steps={maxSteps}
					position='static'
					activeStep={activeStep}
					nextButton={
						<IconButton
							size='small'
							onClick={() => setActiveStep((prev) => Math.min(prev + 1, maxSteps - 1))}
							disabled={activeStep === maxSteps - 1}
							aria-label='Sonraki'>
							<KeyboardArrowRight />
						</IconButton>
					}
					backButton={
						<IconButton size='small' onClick={() => setActiveStep((prev) => Math.max(prev - 1, 0))} disabled={activeStep === 0} aria-label='Önceki'>
							<KeyboardArrowLeft />
						</IconButton>
					}
					sx={{ justifyContent: 'center', mt: 2, background: 'transparent' }}
				/>
			</Box>
		);
	}

	const theme = useTheme();
	const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				py: 6,
				backgroundColor: 'transparent',
			}}>
			<Typography
				sx={{
					'fontSize': responsiveStyles.typography.h2,
					'fontFamily': 'Varela Round',
					'background': 'linear-gradient(135deg, #4f46e5 0%, #5b21b6 25%, #7c3aed 50%, #3b82f6 75%, #2563eb 100%)',
					'WebkitBackgroundClip': 'text',
					'WebkitTextFillColor': 'transparent',
					'backgroundClip': 'text',
					'backgroundSize': '200% 200%',
					'animation': 'gradientShift 5s ease infinite',
					'letterSpacing': '-0.02em',
					'lineHeight': 1.2,
					'fontWeight': 700,
					'@keyframes gradientShift': {
						'0%': { backgroundPosition: '0% 50%' },
						'50%': { backgroundPosition: '100% 50%' },
						'100%': { backgroundPosition: '0% 50%' },
					},
				}}>
				Yaklaşan Etkinlikler
			</Typography>
			{upcomingEvents && upcomingEvents.length > 0 && (isDesktop ? <TimelineDesktop /> : <CarouselMobile />)}
			{upcomingEvents && upcomingEvents.length === 0 && (
				<Typography variant='body1' sx={{ color: '#334155', fontFamily: 'Varela Round', fontSize: { xs: '1rem', md: '1.2rem' }, marginTop: '5rem' }}>
					Henüz yaklaşan etkinlik bulunmamaktadır.
				</Typography>
			)}
			<CustomDialog
				title={'Kayıt Ol'}
				openModal={isRegisterForEventModalOpen}
				closeModal={() => {
					if (!isRegisterForEventSending) {
						setIsRegisterForEventModalOpen(false);
						setIsRegisterForEventSuccess(false);
						setRegisterErrorMsg(null);
					}
				}}
				maxWidth='xs'
				titleSx={{
					fontSize: '1.5rem',
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
						background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.98))',
						boxShadow: '0 8px 32px rgba(44, 62, 80, 0.1)',
						backdropFilter: 'blur(8px)',
						border: '1px solid rgba(255, 255, 255, 0.18)',
					},
				}}>
				<DialogContent sx={{ paddingTop: '1rem' }}>
					<form onSubmit={handleRegisterForEvent}>
						<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mt: '1rem' }}>
							<CustomTextField
								label='İsminiz'
								value={firstName}
								onChange={(e) => {
									setFirstName(e.target.value);
									setRegisterErrorMsg(null);
								}}
								fullWidth={false}
								sx={{ width: '48%', mb: '1.25rem', fontFamily: 'Varela Round' }}
								InputProps={{
									inputProps: {
										maxLength: 50,
									},
								}}
							/>
							<CustomTextField
								label='Soy İsminiz'
								value={lastName}
								onChange={(e) => {
									setLastName(e.target.value);
									setRegisterErrorMsg(null);
								}}
								fullWidth={false}
								sx={{ width: '48%', mb: '1.25rem', fontFamily: 'Varela Round' }}
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
								onChange={(e) => {
									setEmail(e.target.value);
									setRegisterErrorMsg(null);
								}}
								sx={{ mb: '1.25rem', fontFamily: 'Varela Round' }}
								InputProps={{
									inputProps: {
										maxLength: 254,
									},
								}}
							/>
						</Box>
						<div
							style={{
								transform: isMobile ? 'scale(0.9)' : 'scale(1)',
								transformOrigin: '0 0',
								width: isMobile ? 304 * 0.9 : 304,
								maxWidth: '100%',
								margin: '0 auto',
								overflow: 'hidden',
							}}>
							<ReCAPTCHA
								sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
								onChange={handleRecaptchaChange}
								onExpired={resetRecaptcha}
								ref={recaptchaRef}
								key={isRegisterForEventModalOpen ? 'active' : 'inactive'}
								style={{ marginBottom: '1rem' }}
							/>
						</div>
						{registerErrorMsg && (
							<CustomErrorMessage
								sx={{ m: isMobile ? '0.5rem 0' : '0.85rem 0', fontFamily: 'Varela Round', fontSize: isMobile ? '0.7rem' : '0.8rem' }}>
								{registerErrorMsg}
							</CustomErrorMessage>
						)}
						<CustomDialogActions
							onCancel={() => {
								if (!isRegisterForEventSending) {
									setIsRegisterForEventModalOpen(false);
									setIsRegisterForEventSuccess(false);
									setRegisterErrorMsg(null);
								}
							}}
							cancelBtnText='Kapat'
							submitBtnText={isRegisterForEventSending ? 'İşleniyor...' : 'Kayıt Ol'}
							disableBtn={isRegisterForEventSending}
							disableCancelBtn={isRegisterForEventSending}
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
							actionSx={{ mr: '-1rem', mb: '-0.5rem' }}
						/>
					</form>
				</DialogContent>
			</CustomDialog>

			<Snackbar
				open={isRegisterForEventSuccess}
				autoHideDuration={3500}
				anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
				onClose={() => {
					setIsRegisterForEventSuccess(false);
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
						color: theme.palette.common.white,
						backgroundColor: 'rgba(147, 51, 234, 1)',
					}}>
					Kaydınız alınmıştır, lütfen email'inizi kontrol edin.
				</Alert>
			</Snackbar>
		</Box>
	);
}
