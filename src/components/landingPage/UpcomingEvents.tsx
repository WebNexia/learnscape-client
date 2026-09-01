import {
	Box,
	Typography,
	Card,
	CardContent,
	CardMedia,
	Chip,
	Button,
	CircularProgress,
	useMediaQuery,
	useTheme,
	MobileStepper,
	IconButton,
	DialogContent,
	Snackbar,
	Alert,
} from '@mui/material';
import { useState, useRef, useEffect, useContext, useMemo } from 'react';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import EventOutlined from '@mui/icons-material/EventOutlined';
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import ScheduleOutlined from '@mui/icons-material/ScheduleOutlined';
import TodayOutlined from '@mui/icons-material/TodayOutlined';
import EventAvailableOutlined from '@mui/icons-material/EventAvailableOutlined';
import AccessTimeOutlined from '@mui/icons-material/AccessTimeOutlined';
import WatchLaterOutlined from '@mui/icons-material/WatchLaterOutlined';
import SwipeableViews from 'react-swipeable-views';
import { responsiveStyles } from '../../styles/responsiveStyles';
import { LandingPageUpcomingPublicEventsContext } from '../../contexts/LandingPageUpcomingPublicEventsContextProvider';
import { dateTimeFormatter } from '@utils/dateFormatter';
import axios from 'axios';
import CustomDialog from '../../components/layouts/dialog/CustomDialog';
import CustomTextField from '../../components/forms/customFields/CustomTextField';
import TurnstileWidget from '../common/TurnstileWidget';
import CustomDialogActions from '../../components/layouts/dialog/CustomDialogActions';
import CustomErrorMessage from '../../components/forms/customFields/CustomErrorMessage';
import logo from '../../assets/logo.png';
import { mulberry32, scatterNonOverlapping } from '../../utils/lpDecorScatter';
import LandingPageSectionHeader from './LandingPageSectionHeader';

/** LP etkinlik dekoru — Header ile uyumlu Outlined seti */
const EVENT_DECOR_ICONS = [
	EventOutlined,
	CalendarMonthOutlined,
	ScheduleOutlined,
	TodayOutlined,
	EventAvailableOutlined,
	AccessTimeOutlined,
	WatchLaterOutlined,
] as const;

const UPCOMING_EVENTS_DECOR_COUNT = 15;

const EVENTS_SECTION_BG =
	'linear-gradient(165deg, #e8f0f8 0%, #f0f4f8 38%, #eef6fc 72%, #e4eef8 100%), radial-gradient(ellipse 85% 55% at 18% 20%, rgba(0, 102, 204, 0.09) 0%, transparent 55%), radial-gradient(ellipse 70% 50% at 88% 75%, rgba(0, 76, 153, 0.07) 0%, transparent 50%)';

export default function UpcomingEvents() {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const defaultOrgId = import.meta.env.VITE_ORG_ID;
	const { upcomingEvents, loading: upcomingEventsLoading } = useContext(LandingPageUpcomingPublicEventsContext);
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

	const backgroundDecor = useMemo(() => {
		const positions = scatterNonOverlapping(0x4556454e, UPCOMING_EVENTS_DECOR_COUNT, {
			topMin: 0.12,
			minNormDist: 0.13,
		});
		const rand = mulberry32(0x4556454e ^ 0xace5);
		return positions.map((pos, i) => ({
			Icon: EVENT_DECOR_ICONS[i % EVENT_DECOR_ICONS.length],
			top: `${pos.y * 100}%`,
			left: `${pos.x * 100}%`,
			rotate: (rand() - 0.5) * 55,
			fontSize: 20 + rand() * 28,
			opacity: 0.04 + rand() * 0.1,
		}));
	}, []);

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
		const DOT_SIZE = 8;
		const LINE_THICKNESS = 2;
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
						left: 16,
						top: '50%',
						zIndex: 10,
						transform: 'translateY(-50%)',
						width: 48,
						height: 48,
						background: 'rgba(255, 255, 255, 0.92)',
						backdropFilter: 'blur(10px)',
						WebkitBackdropFilter: 'blur(10px)',
						border: '1px solid rgba(0, 82, 163, 0.18)',
						borderRadius: '50%',
						boxShadow: '0 4px 20px rgba(0, 82, 163, 0.12), 0 0 0 1px rgba(255,255,255,0.5) inset',
						color: '#0052a3',
						display: { xs: 'none', md: 'flex' },
						opacity: canScrollLeft ? 1 : 0.35,
						pointerEvents: canScrollLeft ? 'auto' : 'none',
						transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
						'&:hover': canScrollLeft
							? {
								background: 'rgba(255, 255, 255, 0.98)',
								borderColor: 'rgba(0, 82, 163, 0.35)',
								boxShadow: '0 8px 28px rgba(0, 82, 163, 0.18), 0 0 0 1px rgba(255,255,255,0.6) inset',
								transform: 'translateY(-50%) scale(1.05)',
							}
							: {},
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
									borderRadius: '0.75rem',
									border: '1px solid rgba(0, 82, 163, 0.15)',
									boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
									mb: 2,
									position: 'relative',
									zIndex: 2,
									overflow: 'hidden',
									display: 'flex',
									flexDirection: 'column',
									transition: 'transform 0.2s ease-out',
									'&::before': {
										content: '""',
										position: 'absolute',
										top: 0,
										left: 0,
										right: 0,
										height: '3px',
										background: '#0052a3',
										transform: 'scaleX(0)',
										transformOrigin: 'left',
										transition: 'transform 0.2s ease-out',
										zIndex: 1,
									},
									'&:hover': {
										transform: 'translate3d(0, -4px, 0)',
										'&::before': { transform: 'scaleX(1)' },
									},
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
										<Chip
											label={event.type}
											size='small'
											sx={{
												mr: 1,
												fontFamily: 'Varela Round',
												backgroundColor: event.type === 'Webinar' ? 'rgba(0, 82, 163, 0.12)' : 'rgba(78, 205, 196, 0.2)',
												color: event.type === 'Webinar' ? '#0052a3' : '#2c9c94',
											}}
										/>
										<Typography variant='body2' sx={{ color: 'rgba(0, 82, 163, 0.7)', fontSize: '0.8rem', fontFamily: 'Varela Round' }}>
											{dateTimeFormatter(event.start)}
										</Typography>
									</Box>
									<Typography variant='h6' fontWeight={600} gutterBottom sx={{ color: '#0052a3', fontFamily: 'Varela Round' }}>
										{event.title}
									</Typography>
									<Typography
										variant='body2'
										sx={{
											color: '#334155',
											mb: 2,
											fontSize: '0.85rem',
											display: '-webkit-box',
											WebkitLineClamp: 3,
											WebkitBoxOrient: 'vertical',
											overflow: 'hidden',
										}}>
										{event.description}
									</Typography>
									<Button
										variant='contained'
										size='small'
										sx={{
											'fontFamily': 'Varela Round',
											'fontWeight': 700,
											'letterSpacing': '0.02em',
											'textTransform': 'capitalize',
											'background': '#FF6B3D',
											'color': '#FFFFFF',
											'borderRadius': { xs: '0.75rem', sm: '1rem', md: '1.25rem' },
											'padding': isMobile ? '0.4rem 1rem' : '0.5rem 1.75rem',
											'fontSize': isMobile ? '0.85rem' : '1rem',
											'boxShadow': '0 4px 15px rgba(255, 107, 61, 0.35)',
											'&:hover': {
												background: '#ff7d55',
												transform: 'translateY(-2px)',
												boxShadow: '0 6px 20px rgba(255, 107, 61, 0.45)',
											},
											'transition': 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
											'height': '2rem',
										}}
										onClick={() => handleOpenRegisterDialog(event._id)}>
										Kayıt Ol
									</Button>
								</CardContent>
							</Card>
							{/* Timeline dot (below the card) – Aden blue */}
							<Box
								sx={{
									width: DOT_SIZE,
									height: DOT_SIZE,
									backgroundColor: 'rgba(0, 82, 163, 0.4)',
									borderRadius: '50%',
									position: 'absolute',
									left: '50%',
									top: DOT_OFFSET,
									transform: 'translateX(-50%)',
									zIndex: 3,
								}}
							/>
							{/* Timeline line segment (except after last card) – Aden blue */}
							{idx < upcomingEvents.length - 1 && (
								<Box
									sx={{
										position: 'absolute',
										left: `calc(50% + ${DOT_SIZE / 2}px)`,
										top: DOT_OFFSET + DOT_SIZE / 2 - LINE_THICKNESS / 2,
										width: GAP + CARD_WIDTH - DOT_SIZE,
										height: LINE_THICKNESS,
										backgroundColor: 'rgba(0, 82, 163, 0.15)',
										zIndex: 1,
										borderRadius: 1,
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
						right: 16,
						top: '50%',
						zIndex: 10,
						transform: 'translateY(-50%)',
						width: 48,
						height: 48,
						background: 'rgba(255, 255, 255, 0.92)',
						backdropFilter: 'blur(10px)',
						WebkitBackdropFilter: 'blur(10px)',
						border: '1px solid rgba(0, 82, 163, 0.18)',
						borderRadius: '50%',
						boxShadow: '0 4px 20px rgba(0, 82, 163, 0.12), 0 0 0 1px rgba(255,255,255,0.5) inset',
						color: '#0052a3',
						display: { xs: 'none', md: 'flex' },
						opacity: canScrollRight ? 1 : 0.35,
						pointerEvents: canScrollRight ? 'auto' : 'none',
						transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
						'&:hover': canScrollRight
							? {
								background: 'rgba(255, 255, 255, 0.98)',
								borderColor: 'rgba(0, 82, 163, 0.35)',
								boxShadow: '0 8px 28px rgba(0, 82, 163, 0.18), 0 0 0 1px rgba(255,255,255,0.6) inset',
								transform: 'translateY(-50%) scale(1.05)',
							}
							: {},
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
			<Box sx={{ maxWidth: 360, position: 'relative', backgroundColor: '#F6F9FC' }}>
				<SwipeableViews
					index={activeStep}
					onChangeIndex={handleStepChange}
					enableMouseEvents
					resistance
					style={{ backgroundColor: '#F6F9FC' }}
					containerStyle={{ backgroundColor: '#F6F9FC' }}>
					{upcomingEvents?.map((event, _) => (
						<div key={event._id} style={{ backgroundColor: '#F6F9FC' }}>
							<Card
								sx={{
									mt: '1.5rem',
									mb: '1rem',
									mx: 'auto',
									width: 250,
									borderRadius: '0.75rem',
									border: '1px solid rgba(0, 82, 163, 0.15)',
									boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
									height: 360,
									minHeight: 360,
									maxHeight: 360,
									position: 'relative',
									zIndex: 2,
									overflow: 'hidden',
									display: 'flex',
									flexDirection: 'column',
									transition: 'transform 0.2s ease-out',
									'&::before': {
										content: '""',
										position: 'absolute',
										top: 0,
										left: 0,
										right: 0,
										height: '3px',
										background: '#0052a3',
										transform: 'scaleX(0)',
										transformOrigin: 'left',
										transition: 'transform 0.2s ease-out',
										zIndex: 1,
									},
									'&:hover': {
										transform: 'translate3d(0, -4px, 0)',
										'&::before': { transform: 'scaleX(1)' },
									},
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
										<Chip
											label={event?.type}
											size='small'
											sx={{
												mr: 1,
												fontSize: '0.7rem',
												fontFamily: 'Varela Round',
												backgroundColor: event?.type === 'Webinar' ? 'rgba(0, 82, 163, 0.12)' : 'rgba(78, 205, 196, 0.2)',
												color: event?.type === 'Webinar' ? '#0052a3' : '#2c9c94',
											}}
										/>
										<Typography variant='body2' sx={{ color: 'rgba(0, 82, 163, 0.7)', fontSize: '0.7rem', fontFamily: 'Varela Round' }}>
											{dateTimeFormatter(event.start)}
										</Typography>
									</Box>
									<Typography variant='h6' fontWeight={600} gutterBottom sx={{ fontSize: '0.9rem', color: '#0052a3', fontFamily: 'Varela Round' }}>
										{event.title}
									</Typography>
									<Typography
										variant='body2'
										sx={{
											color: '#334155',
											mb: 2,
											fontSize: '0.75rem',
											display: '-webkit-box',
											WebkitLineClamp: 3,
											WebkitBoxOrient: 'vertical',
											overflow: 'hidden',
										}}>
										{event.description}
									</Typography>
									<Button
										variant='contained'
										size='small'
										sx={{
											'background': '#FF6B3D',
											'color': '#FFFFFF',
											'borderRadius': '0.75rem',
											'textTransform': 'capitalize',
											'float': 'right',
											'fontSize': '0.75rem',
											'fontFamily': 'Varela Round',
											'fontWeight': 700,
											'boxShadow': '0 4px 15px rgba(255, 107, 61, 0.35)',
											'&:hover': {
												background: '#ff7d55',
												transform: 'translateY(-2px)',
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
					sx={{
						justifyContent: 'center',
						mt: 2,
						backgroundColor: '#F6F9FC',
						'& .MuiMobileStepper-dot': {
							width: 6,
							height: 6,
							backgroundColor: 'rgba(0, 82, 163, 0.25)',
						},
						'& .MuiMobileStepper-dotActive': {
							backgroundColor: '#0052a3',
							width: 6,
							height: 6,
						},
					}}
				/>
			</Box>
		);
	}

	const theme = useTheme();
	const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
	const hasEvents = (upcomingEvents?.length ?? 0) > 0;

	return (
		<Box
			sx={{
				position: 'relative',
				overflow: 'hidden',
				width: '100%',
				boxSizing: 'border-box',
				py: 6,
				background: EVENTS_SECTION_BG,
			}}>
			<Box
				aria-hidden
				sx={{
					position: 'absolute',
					inset: 0,
					zIndex: 0,
					pointerEvents: 'none',
					overflow: 'hidden',
				}}>
				{backgroundDecor.map(({ Icon, top, left, rotate, fontSize, opacity }, index) => (
					<Icon
						key={index}
						sx={{
							position: 'absolute',
							top,
							left,
							transform: `translate(-50%, -50%) rotate(${rotate}deg)`,
							fontSize,
							opacity,
							color: '#004c99',
						}}
					/>
				))}
			</Box>
			<Box
				sx={{
					position: 'relative',
					zIndex: 1,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
				}}>
				<LandingPageSectionHeader
					title='Yaklaşan Etkinlikler'
					subtitle='Seminerler, deneme sınavları ve özel buluşmalarla akademik takvimimizi takip edin. Uygun etkinliğe kayıt olarak yerinizi ayırtın.'
				/>
				{upcomingEventsLoading ? (
					<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 6 }}>
						<CircularProgress sx={{ color: '#0052a3' }} aria-busy aria-label='Yükleniyor' />
						<Typography sx={{ fontFamily: 'Varela Round', color: '#64748b', fontSize: '1rem' }}>Yükleniyor</Typography>
					</Box>
				) : hasEvents ? (
					isDesktop ? <TimelineDesktop /> : <CarouselMobile />
				) : (
					<Typography
						sx={{
							textAlign: 'center',
							fontFamily: 'Varela Round',
							color: '#475569',
							fontSize: { xs: '1rem', sm: '1.05rem' },
							lineHeight: 1.65,
							py: 6,
							px: 2,
							maxWidth: 520,
						}}>
						Yeni etkinliklerimiz yakında duyurulacak. Güncel program için sayfayı düzenli kontrol edebilirsiniz.
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
								<TurnstileWidget
									ref={recaptchaRef}
									action="event-register"
									onChange={handleRecaptchaChange}
									onExpired={resetRecaptcha}
									resetKey={isRegisterForEventModalOpen ? 'active' : 'inactive'}
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
									'background': '#FF6B3D !important',
									'backgroundColor': '#FF6B3D !important',
									'fontFamily': 'Varela Round',
									'color': 'white !important',
									'transition': 'background 0.2s ease !important',
									'&:hover': {
										background: '#ff7d55 !important',
										backgroundColor: '#ff7d55 !important',
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
							backgroundColor: '#059669',
							'& .MuiAlert-icon': { color: 'inherit' },
						}}>
						Kaydınız alınmıştır, lütfen email'inizi kontrol edin.
					</Alert>
				</Snackbar>
			</Box>
		</Box>
	);
}
