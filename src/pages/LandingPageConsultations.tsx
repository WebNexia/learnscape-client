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
import LondonBg from '../assets/london-bg.jpg';
import { setCurrencySymbol } from '../utils/setCurrencySymbol';
import { useNavigate } from 'react-router-dom';

const DEFAULT_COVER_PLACEHOLDER = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=300&fit=crop';

function getDisplayPrice(prices: ConsultationPrice[] | undefined): { label: string; currency?: string; amount?: string } {
	if (!prices?.length) return { label: 'Ücretsiz' };
	const first = prices[0];
	const amt = first?.amount?.trim();
	if (amt === '' || amt === '0' || amt?.toLowerCase() === 'free') return { label: 'Ücretsiz' };
	return {
		label: `${setCurrencySymbol(first.currency)}${first.amount}`,
		currency: first.currency,
		amount: first.amount,
	};
}

const LandingPageConsultations = () => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const { consultations, loading, error, hasMore, loadMore } = useContext(LandingPageConsultationsContext);
	const navigate = useNavigate();
	const [bookingModalOpen, setBookingModalOpen] = useState(false);
	const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);

	const openBookingModal = (c: Consultation) => {
		setSelectedConsultation(c);
		setBookingModalOpen(true);
	};

	const baseUrl = import.meta.env.VITE_SITE_URL || 'https://learnscape-qa.netlify.app';

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
					'& .gradient-text': {
						'background': 'linear-gradient(135deg, #4f46e5 0%, #5b21b6 50%, #7c3aed 100%)',
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

						<Box sx={{ width: '85%', maxWidth: 1000, mx: 'auto', pb: 4 }}>
							{error ? (
								<Typography sx={{ textAlign: 'center', fontSize: '1.25rem', color: 'error.main', fontFamily: 'Varela Round', mt: 5 }}>
									{error}
								</Typography>
							) : consultations && consultations.length > 0 ? (
								<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
									{consultations.map((c: Consultation) => {
										return (
											<Card
												key={c._id}
												sx={{
													display: 'flex',
													flexDirection: isMobileSize ? 'column' : 'row',
													width: '100%',
													borderRadius: 2,
													overflow: 'hidden',
													boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
													'&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.12)' },
													transition: 'box-shadow 0.3s ease',
												}}>
												<CardMedia
													component='img'
													image={c.coverImageUrl || DEFAULT_COVER_PLACEHOLDER}
													alt={c.title}
													sx={{
														width: isMobileSize ? '100%' : 280,
														minWidth: isMobileSize ? undefined : 280,
														height: isMobileSize ? 180 : 220,
														objectFit: 'cover',
													}}
												/>
												<CardContent
													sx={{
														flex: 1,
														display: 'flex',
														flexDirection: 'column',
														justifyContent: 'space-between',
														py: 2,
														px: 2.5,
													}}>
													<Box>
														<Typography
															variant='h6'
															component='h2'
															sx={{
																fontFamily: 'Varela Round',
																fontWeight: 600,
																color: '#0f172a',
																mb: 0.5,
																fontSize: { xs: '1.1rem', sm: '1.25rem' },
															}}>
															{c.title}
														</Typography>
														{c.description && (
															<Typography
																sx={{
																	fontFamily: 'Varela Round',
																	color: '#64748b',
																	fontSize: '0.9rem',
																	lineHeight: 1.5,
																	display: '-webkit-box',
																	WebkitLineClamp: 5,
																	WebkitBoxOrient: 'vertical',
																	overflow: 'auto',
																}}>
																{c.description}
															</Typography>
														)}

													</Box>
													<Box
														sx={{
															display: 'flex',
															flexWrap: 'wrap',
															alignItems: 'center',
															gap: 1.5,
															mt: '2rem',
														}}>
														{getDisplayPrice(c.prices).label === 'Ücretsiz' && (
															<Typography
																sx={{
																	fontFamily: 'Varela Round',
																	fontWeight: 600,
																	color: 'text.primary',
																	fontSize: '0.95rem',
																	mt: 1,
																	textDecoration: 'underline',
																	textUnderlineOffset: '2px',
																}}>
																Ücretsiz
															</Typography>
														)}
														<Button
															variant='contained'
															size='medium'
															onClick={() => openBookingModal(c)}
															sx={{
																ml: 'auto',
																fontFamily: 'Varela Round',
																textTransform: 'capitalize',
																background: 'linear-gradient(135deg, #FF6B3D 0%, #ff7d55 100%)',
																'&:hover': {
																	background: 'linear-gradient(135deg, #ff7d55 0%, #FF6B3D 100%)',
																	boxShadow: '0 4px 14px rgba(255, 107, 61, 0.4)',
																},
															}}>
															Randevu Al
														</Button>
													</Box>
												</CardContent>
											</Card>
										);
									})}
								</Box>
							) : !loading ? (
								<Typography
									sx={{
										textAlign: 'center',
										fontSize: { xs: '1rem', sm: '1.25rem' },
										color: 'text.secondary',
										fontFamily: 'Varela Round',
										mt: 5,
										mb: 3,
									}}>
									Henüz yayınlanmış danışmanlık bulunmamaktadır.
								</Typography>
							) : null}

							{loading && (
								<Typography sx={{ textAlign: 'center', fontFamily: 'Varela Round', py: 3 }}>Yükleniyor...</Typography>
							)}

							{hasMore && consultations.length > 0 && (
								<Box sx={{ textAlign: 'center', mt: 3 }}>
									<Button
										onClick={loadMore}
										disabled={loading}
										variant='outlined'
										sx={{
											fontFamily: 'Varela Round',
											textTransform: 'capitalize',
											borderColor: '#6366f1',
											color: '#6366f1',
											'&:hover': { borderColor: '#4f46e5', backgroundColor: 'rgba(99, 102, 241, 0.04)' },
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
