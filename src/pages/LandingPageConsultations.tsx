import { Box, Typography, Button, Card, CardContent, CardMedia, CircularProgress } from '@mui/material';
import LandingPageLayout from '../components/landingPage/LandingPageLayout';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import React, { useContext, useState, Suspense } from 'react';
import { LandingPageConsultationsContext } from '../contexts/LandingPageConsultationsContextProvider';
import { Consultation, ConsultationPrice } from '../interfaces/consultation';
import ChatWhatsApp from '../components/landingPage/ChatWhatsApp';
import ScrollToTopButton from '../components/landingPage/ScrollToTopButton';
const ConsultationBookingModal = React.lazy(() => import('../components/landingPage/ConsultationBookingModal'));
import { SEO, StructuredData } from '../components/seo';
import { setCurrencySymbol } from '../utils/setCurrencySymbol';
import { decodeHtmlEntities } from '../utils/utilText';
import { useNavigate } from 'react-router-dom';
import { useGeoLocation } from '../hooks/useGeoLocation';
import { getConsultationPriceForCountry } from '../utils/getConsultationPriceForCountry';
const DEFAULT_COVER_PLACEHOLDER = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=300&fit=crop';

function getDisplayPrice(price: ConsultationPrice | null | undefined): { label: string; currency?: string; amount?: string } {
	if (!price) return { label: 'Ücretsiz' };
	const amt = price.amount?.trim();
	if (amt === '' || amt === '0' || amt?.toLowerCase() === 'free') return { label: 'Ücretsiz' };
	return {
		label: `${setCurrencySymbol(price.currency)}${price.amount}`,
		currency: price.currency,
		amount: price.amount,
	};
}

const LandingPageConsultations = () => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const { consultations, loading, error, hasMore, loadMore } = useContext(LandingPageConsultationsContext);
	const geoLocation = useGeoLocation();
	const navigate = useNavigate();
	const [bookingModalOpen, setBookingModalOpen] = useState(false);
	const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);

	const openBookingModal = (c: Consultation) => {
		setSelectedConsultation(c);
		setBookingModalOpen(true);
	};

	const baseUrl = import.meta.env.VITE_SITE_URL || 'https://adenacademy.co.uk';

	return (
		<>
			<SEO
				title='Danışmanlık - LearnScape'
				description='Uzman danışmanlarımızla bire bir görüşme randevusu alın. Online danışmanlık seansları ile hedeflerinize ulaşın.'
				keywords='danışmanlık, online danışmanlık, bire bir görüşme, randevu, LearnScape danışmanlık'
				type='website'
			/>
			<StructuredData type='Organization' />
			<StructuredData type='WebSite' />
			<StructuredData
				type='BreadcrumbList'
				data={{
					breadcrumbs: [
						{ name: 'Ana Sayfa', url: baseUrl },
						{ name: 'Danışmanlık', url: `${baseUrl}/landing-page-consultations` },
					],
				}}
			/>
			<StructuredData
				type='WebPage'
				data={{
					url: `${baseUrl}/landing-page-consultations`,
					name: 'Danışmanlık - LearnScape',
					description: 'Uzman danışmanlarımızla bire bir görüşme randevusu alın. Online danışmanlık seansları.',
				}}
			/>
			<Box
				sx={{
					'position': 'relative',
					'overflow': 'hidden',
					'minHeight': '100vh',
					// Aden solid gradient (no image - cleaner UX)
					'background':
						'linear-gradient(180deg, #ffffff 0%, #f8fafc 40%, rgba(0, 82, 163, 0.05) 100%)',
					'&::before': {
						content: '""',
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background:
							'radial-gradient(circle at 20% 30%, rgba(0, 82, 163, 0.06) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(0, 102, 204, 0.04) 0%, transparent 50%)',
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
					'& .gradient-text': {
						'background': 'linear-gradient(135deg, #004c99 0%, #0052a3 50%, #0066CC 100%)',
						'WebkitBackgroundClip': 'text',
						'WebkitTextFillColor': 'transparent',
						'backgroundClip': 'text',
					},
				}}>
				<Box sx={{ position: 'relative', zIndex: 2 }}>
					<LandingPageLayout>
						<Box
							sx={{
								position: 'sticky',
								top: 0,
								zIndex: 1000,
								paddingTop: isMobileSize ? '10vh' : '13vh',
								width: '100%',
								backgroundColor: 'transparent',
								mb: 2,
							}}>
							{/* Introduction */}
							<Box sx={{ width: '85%', maxWidth: 900, mx: 'auto', textAlign: 'center', py: 3, position: 'relative' }}>
								<Typography
									sx={{
										fontFamily: 'Varela Round',
										color: '#475569',
										fontSize: { xs: '0.9rem', sm: '1rem' },
										lineHeight: 1.6,
									}}>
									Uzman danışmanlarımızla bire bir online görüşme randevusu alın. Seans süresi ve ücreti danışmanlık türüne göre değişmektedir.
								</Typography>
							</Box>
						</Box>

						<Box sx={{ width: '90%', maxWidth: 960, mx: 'auto', pb: '3rem' }}>
							{error ? (
								<Typography sx={{ textAlign: 'center', fontSize: '1.25rem', color: 'error.main', fontFamily: 'Varela Round', mt: 5 }}>
									{error}
								</Typography>
							) : loading && consultations.length === 0 ? (
								<Box
									sx={{
										display: 'flex',
										flexDirection: 'column',
										alignItems: 'center',
										justifyContent: 'center',
										gap: 2,
										minHeight: '40vh',
										width: '100%',
										mb: 3,
									}}>
									<CircularProgress sx={{ color: '#0052a3' }} aria-busy aria-label='Yükleniyor' />
									<Typography sx={{ fontFamily: 'Varela Round', color: '#64748b', fontSize: '1rem' }}>Yükleniyor</Typography>
								</Box>
							) : consultations && consultations.length > 0 ? (
								<Box
									sx={{
										display: 'grid',
										gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
										gap: isMobileSize ? 5 : 3,
									}}>
									{consultations.map((c: Consultation) => {
										const displayPrice = getDisplayPrice(getConsultationPriceForCountry(c, geoLocation?.countryCode));
										return (
											<Card
												key={c._id}
												sx={{
													display: 'flex',
													flexDirection: isMobileSize ? 'column' : 'row',
													width: isMobileSize ? '90%' : '100%',
													mx: isMobileSize ? 'auto' : 0,
													maxWidth: { md: 480 },
													minHeight: isMobileSize ? undefined : 280,
													borderRadius: '0.75rem',
													overflow: 'hidden',
													position: 'relative',
													border: '1px solid rgba(0, 82, 163, 0.15)',
													boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
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
													image={c.coverImageUrl || DEFAULT_COVER_PLACEHOLDER}
													alt={c.title}
													sx={{
														width: isMobileSize ? '100%' : 220,
														minWidth: isMobileSize ? undefined : 220,
														height: isMobileSize ? 200 : 280,
														objectFit: 'cover',
														flexShrink: 0,
													}}
												/>
												<CardContent
													sx={{
														flex: 1,
														display: 'flex',
														flexDirection: 'column',
														justifyContent: 'space-between',
														py: 2.5,
														px: 2.5,
														minHeight: 0,
														overflow: 'hidden',
													}}>
													<Box sx={{ minHeight: 0, overflow: 'hidden', flex: 1 }}>
														<Typography
															variant='h6'
															component='h2'
															sx={{
																fontFamily: 'Varela Round',
																fontWeight: 600,
																color: '#0f172a',
																mb: 0.5,
																fontSize: { xs: '0.95rem', sm: '1rem' },
																display: '-webkit-box',
																WebkitLineClamp: 2,
																WebkitBoxOrient: 'vertical',
																overflow: 'hidden',
															}}>
															{c.title}
														</Typography>
														{c.description && (
															<Typography
																sx={{
																	fontFamily: 'Varela Round',
																	color: '#64748b',
																	fontSize: { xs: '0.75rem', sm: '0.8rem' },
																	lineHeight: 1.45,
																	display: '-webkit-box',
																	WebkitLineClamp: 7,
																	WebkitBoxOrient: 'vertical',
																	overflow: 'hidden',
																	wordBreak: 'break-word',
																}}>
																{decodeHtmlEntities(c.description)}
															</Typography>
														)}
													</Box>
													<Box
														sx={{
															display: 'flex',
															flexWrap: 'wrap',
															alignItems: 'center',
															gap: 1,
															mt: 1.5,
														}}>
														{displayPrice.label !== 'Ücretsiz' && (
															<Typography
																sx={{
																	fontFamily: 'Varela Round',
																	fontWeight: 700,
																	color: '#0052a3',
																	fontSize: '0.9rem',
																	px: 1,
																	py: 0.25,
																	borderRadius: '0.5rem',
																	bgcolor: 'rgba(0, 82, 163, 0.1)',
																}}>
																{displayPrice.label}
															</Typography>
														)}
														{displayPrice.label === 'Ücretsiz' && (
															<Typography
																sx={{
																	fontFamily: 'Varela Round',
																	fontWeight: 600,
																	color: '#059669',
																	fontSize: '0.9rem',
																}}>
																Ücretsiz
															</Typography>
														)}
														<Button
															variant='contained'
															size='small'
															onClick={() => openBookingModal(c)}
															sx={{
																ml: 'auto',
																fontFamily: 'Varela Round',
																fontWeight: 600,
																textTransform: 'capitalize',
																fontSize: '0.8rem',
																py: 0.5,
																px: 1.5,
																borderRadius: '0.75rem',
																background: 'linear-gradient(135deg, #FF6B3D 0%, #ff7d55 100%)',
																boxShadow: '0 4px 14px rgba(255, 107, 61, 0.35)',
																'&:hover': {
																	background: 'linear-gradient(135deg, #ff7d55 0%, #FF6B3D 100%)',
																	boxShadow: '0 6px 20px rgba(255, 107, 61, 0.45)',
																	transform: 'translateY(-2px)',
																},
																transition: 'all 0.25s ease',
															}}>
															Randevu Al
														</Button>
													</Box>
												</CardContent>
											</Card>
										);
									})}
								</Box>
							) : (
								<Typography
									sx={{
										textAlign: 'center',
										fontSize: '1.25rem',
										color: '#334155',
										fontFamily: 'Varela Round',
										mt: 5,
										mb: 3,
									}}>
									Danışmanlıklarımız yakında eklenecektir
								</Typography>
							)}

							{hasMore && consultations.length > 0 && (
								<Box sx={{ textAlign: 'center', mt: 3 }}>
									<Button
										onClick={loadMore}
										disabled={loading}
										variant='contained'
										sx={{
											fontFamily: 'Varela Round',
											fontWeight: 600,
											textTransform: 'capitalize',
											borderRadius: '0.75rem',
											background: '#FF6B3D',
											boxShadow: '0 4px 15px rgba(255, 107, 61, 0.35)',
											'&:hover': {
												background: '#ff7d55',
												transform: 'translateY(-2px)',
												boxShadow: '0 6px 20px rgba(255, 107, 61, 0.45)',
											},
											'&:disabled': {
												backgroundColor: 'rgba(0, 0, 0, 0.12)',
												color: 'rgba(0, 0, 0, 0.26)',
											},
											transition: 'all 0.25s ease',
										}}>
										{loading ? 'Yükleniyor...' : 'Daha Fazla Yükle'}
									</Button>
								</Box>
							)}
						</Box>

						<ChatWhatsApp />
						<ScrollToTopButton />
					</LandingPageLayout>
				</Box>
			</Box>

			{bookingModalOpen && (
				<Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>}>
					<ConsultationBookingModal
						open={bookingModalOpen}
						onClose={() => { setBookingModalOpen(false); setSelectedConsultation(null); }}
						consultation={selectedConsultation}
						consultationId={selectedConsultation?._id}
						onAddedToCart={() => navigate('/landing-page-cart')}
					/>
				</Suspense>
			)}
		</>
	);
};

export default LandingPageConsultations;
