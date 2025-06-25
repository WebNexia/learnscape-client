import { Box, Typography, Card, CardContent, CardMedia, Chip, Button, useMediaQuery, useTheme, MobileStepper, IconButton } from '@mui/material';
import { useState, useRef, useEffect, useContext } from 'react';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import SwipeableViews from 'react-swipeable-views';
import { responsiveStyles } from '../../styles/responsiveStyles';
import { EventsContext } from '../../contexts/EventsContextProvider';
import { dateTimeFormatter } from '@utils/dateFormatter';

function TimelineDesktop() {
	const { sortedPublicEventsData } = useContext(EventsContext);
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
					'justifyContent': sortedPublicEventsData.length <= 3 ? 'center' : 'flex-start',
					'gap': `${GAP}px`,
					'overflowX': sortedPublicEventsData.length > 3 ? 'auto' : 'visible',
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
				{sortedPublicEventsData.map((event, idx) => (
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
								image={event.coverImageUrl}
								alt={event.title}
								sx={{ objectFit: 'cover', borderTopLeftRadius: 16, borderTopRightRadius: 16, height: IMAGE_HEIGHT }}
							/>
							<CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
								<Box display='flex' alignItems='center' mb={1}>
									<Chip label={event.type} color={event.type === 'Webinar' ? 'primary' : 'secondary'} size='small' sx={{ mr: 1 }} />
									<Typography variant='body2' color='text.secondary'>
										{dateTimeFormatter(event.start)}
									</Typography>
								</Box>
								<Typography variant='h6' fontWeight={600} gutterBottom>
									{event.title}
								</Typography>
								<Typography variant='body2' color='text.secondary' mb={2}>
									{event.description}
								</Typography>
								<Button variant='contained' color='primary' size='small' sx={{ borderRadius: 2, textTransform: 'none', alignSelf: 'flex-end' }}>
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
						{idx < sortedPublicEventsData.length - 1 && (
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
	const { sortedPublicEventsData } = useContext(EventsContext);
	const [activeStep, setActiveStep] = useState(0);
	const maxSteps = sortedPublicEventsData.length;

	const handleStepChange = (step: number) => setActiveStep(step);

	return (
		<Box sx={{ maxWidth: 360, position: 'relative' }}>
			<SwipeableViews index={activeStep} onChangeIndex={handleStepChange} enableMouseEvents resistance>
				{sortedPublicEventsData.map((event, _) => (
					<div key={event._id}>
						<Card
							sx={{
								mt: '1.5rem',
								mb: '1rem',
								mx: 'auto',
								width: 280,
								borderRadius: 4,
								boxShadow: 3,
							}}>
							<CardMedia
								component='img'
								height='140'
								image={event.coverImageUrl}
								alt={event.title}
								sx={{ objectFit: 'cover', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
							/>
							<CardContent>
								<Box display='flex' alignItems='center' mb={1}>
									<Chip label={event?.type} size='small' sx={{ mr: 1 }} />
									<Typography variant='body2' color='text.secondary'>
										{dateTimeFormatter(event.start)}
									</Typography>
								</Box>
								<Typography variant='h6' fontWeight={600} gutterBottom>
									{event.title}
								</Typography>
								<Typography variant='body2' color='text.secondary' mb={2}>
									{event.description}
								</Typography>
								<Button variant='contained' color='primary' size='small' sx={{ borderRadius: 2, textTransform: 'none', float: 'right' }}>
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

export default function UpcomingEvents() {
	const theme = useTheme();
	const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
	const { sortedPublicEventsData } = useContext(EventsContext);
	return (
		<Box
			sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, background: 'linear-gradient(90deg, #f8fafc 0%, #e0e7ef 100%)' }}>
			<Typography
				sx={{
					fontSize: responsiveStyles.typography.h2,
					fontFamily: 'Varela Round',
					color: '#2C3E50',
					letterSpacing: '-0.02em',
					lineHeight: 1.2,
				}}>
				Yaklaşan Etkinlikler
			</Typography>
			{sortedPublicEventsData.length > 0 && (isDesktop ? <TimelineDesktop /> : <CarouselMobile />)}
			{sortedPublicEventsData.length === 0 && (
				<Typography
					variant='body1'
					color='text.secondary'
					sx={{ fontFamily: 'Varela Round', fontSize: { xs: '1rem', md: '1.2rem' }, marginTop: '1rem' }}>
					Henüz yaklaşan etkinlik bulunmamaktadır.
				</Typography>
			)}
		</Box>
	);
}
