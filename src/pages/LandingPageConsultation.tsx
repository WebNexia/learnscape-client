import React, { useContext, Suspense, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { ArrowBack, EventAvailable } from '@mui/icons-material';
import { useQuery } from 'react-query';
import LandingPageLayout from '../components/landingPage/LandingPageLayout';
import ChatWhatsApp from '../components/landingPage/ChatWhatsApp';
import ScrollToTopButton from '../components/landingPage/ScrollToTopButton';
import { SEO, StructuredData } from '../components/seo';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import { Consultation } from '../interfaces/consultation';
import { DocumentDetailBlock } from '../interfaces/document';
import { consultationsService } from '../services/consultationsService';
import LandingPageDocumentDetailBlocks from '../components/landingPage/LandingPageDocumentDetailBlocks';
import { useGeoLocation } from '../hooks/useGeoLocation';
import { setCurrencySymbol } from '../utils/setCurrencySymbol';
import { getConsultationPriceForCountry, consultationDetailPath } from '../utils/getConsultationPriceForCountry';
import { decodeHtmlEntities } from '../utils/utilText';

const ConsultationBookingModal = React.lazy(() => import('../components/landingPage/ConsultationBookingModal'));

const ctaButtonSx = {
	textTransform: 'none' as const,
	fontFamily: 'Varela Round',
	background: 'linear-gradient(135deg, rgba(0, 82, 163, 0.95) 0%, rgba(0, 102, 204, 0.95) 100%)',
	boxShadow: 'none',
	'&:hover': {
		background: 'linear-gradient(135deg, rgba(0, 82, 163, 1) 0%, rgba(0, 102, 204, 1) 100%)',
		boxShadow: '0 4px 15px rgba(0, 82, 163, 0.35)',
	},
};

function getDisplayPrice(consultation: Consultation, countryCode?: string | null): { label: string; isFree: boolean } {
	const price = getConsultationPriceForCountry(consultation, countryCode);
	if (!price) return { label: 'Ücretsiz', isFree: true };
	const amt = price.amount?.trim();
	if (amt === '' || amt === '0' || amt?.toLowerCase() === 'free') return { label: 'Ücretsiz', isFree: true };
	return { label: `${setCurrencySymbol(price.currency)}${price.amount}`, isFree: false };
}

const LandingPageConsultation = () => {
	const { consultationId } = useParams();
	const navigate = useNavigate();
	const { orgId } = useContext(OrganisationContext);
	const geoLocation = useGeoLocation();
	const baseUrl = import.meta.env.VITE_SITE_URL || 'https://adenacademy.co.uk';
	const [bookingModalOpen, setBookingModalOpen] = useState(false);

	const {
		data: consultation,
		isLoading,
		isFetching,
		isError,
	} = useQuery(
		['lpPublicConsultationDetail', orgId, consultationId],
		async () => consultationsService.getConsultationByIdPublic(orgId!, consultationId!) as Promise<Consultation>,
		{
			enabled: Boolean(orgId && consultationId),
			staleTime: 60_000,
		},
	);

	const showLoader = !orgId || !consultationId || (!consultation && (isLoading || isFetching));
	const showError = Boolean(orgId && consultationId && isError);
	const showNotFound = Boolean(orgId && consultationId && !isLoading && !isFetching && !isError && !consultation);

	const detailBlocks: DocumentDetailBlock[] = Array.isArray(consultation?.detailBlocks) ? consultation!.detailBlocks! : [];
	const introPlainForSeo = detailBlocks
		.filter((b): b is Extract<DocumentDetailBlock, { type: 'section' }> => b.type === 'section')
		.map((b) => (b.body || '').replace(/<[^>]*>/g, ' '))
		.join(' ')
		.replace(/\s+/g, ' ')
		.trim();

	const displayPrice = consultation ? getDisplayPrice(consultation, geoLocation?.countryCode) : null;
	const listPath = '/landing-page-consultations';
	const consultationUrl = consultation ? `${baseUrl}${consultationDetailPath(consultation)}` : '';
	const seoDescription =
		introPlainForSeo ||
		(consultation?.description ? decodeHtmlEntities(consultation.description) : '') ||
		'Aden Academy uzman danışmanlarıyla bire bir online görüşme randevusu alın.';
	const canBook = Boolean(consultation && consultation.hasAvailableSlots !== false);

	const openBooking = () => {
		if (!consultation || !canBook) return;
		setBookingModalOpen(true);
	};

	return (
		<>
			{consultation && (
				<>
					<SEO
						title={`${consultation.title} - Danışmanlık | Aden Academy`}
						description={seoDescription.slice(0, 160)}
						keywords={`${consultation.title}, danışmanlık, online danışmanlık, Aden Academy`}
						image={consultation.coverImageUrl}
						url={consultationUrl}
						type='article'
					/>
					<StructuredData type='Organization' />
					<StructuredData
						type='BreadcrumbList'
						data={{
							breadcrumbs: [
								{ name: 'Home', url: baseUrl },
								{ name: 'Danışmanlık', url: `${baseUrl}/landing-page-consultations` },
								{ name: consultation.title, url: consultationUrl },
							],
						}}
					/>
				</>
			)}

			<Box
				sx={{
					position: 'relative',
					overflow: 'visible',
					minHeight: '100vh',
					background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 40%, rgba(0, 82, 163, 0.05) 100%)',
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
				}}>
				<Box sx={{ position: 'relative', zIndex: 2 }}>
					<LandingPageLayout>
						{showLoader && (
							<Box
								sx={{
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									justifyContent: 'center',
									gap: 2,
									minHeight: '40vh',
									width: '100%',
									paddingTop: '16vh',
								}}>
								<CircularProgress sx={{ color: '#0052a3' }} aria-busy aria-label='Yükleniyor' />
								<Typography sx={{ fontFamily: 'Varela Round', color: '#64748b', fontSize: '1rem' }}>Yükleniyor</Typography>
							</Box>
						)}

						{showError && (
							<Box sx={{ paddingTop: '25vh', textAlign: 'center', px: 2 }}>
								<Typography variant='h6' sx={{ fontFamily: 'Varela Round', color: 'error.main' }}>
									Danışmanlık yüklenirken bir hata oluştu
								</Typography>
							</Box>
						)}

						{showNotFound && (
							<Box sx={{ paddingTop: '25vh', textAlign: 'center' }}>
								<Typography variant='h6' sx={{ fontFamily: 'Varela Round' }}>
									Danışmanlık bulunamadı
								</Typography>
							</Box>
						)}

						{!showLoader && !showError && consultation && (
							<Box
								sx={{
									width: '100%',
									maxWidth: '56rem',
									mx: 'auto',
									px: { xs: 2, sm: 3 },
									pt: { xs: '12vh', md: '13vh' },
									pb: 6,
								}}>
								<Button
									component={RouterLink}
									to={listPath}
									startIcon={<ArrowBack />}
									sx={{
										mb: 2.5,
										textTransform: 'none',
										fontFamily: 'Varela Round',
										color: '#0052a3',
										px: 0,
										'&:hover': { backgroundColor: 'transparent', color: '#004c99' },
									}}>
									Danışmanlık
								</Button>

								<Box
									sx={{
										display: 'flex',
										flexDirection: { xs: 'column', md: consultation.coverImageUrl ? 'row' : 'column' },
										gap: { xs: 2.5, md: consultation.coverImageUrl ? 4 : 0 },
										alignItems: { xs: 'stretch', md: 'flex-start' },
										mb: { xs: 3, md: 4 },
									}}>
									{consultation.coverImageUrl ? (
										<Box
											sx={{
												width: { xs: '100%', md: 220 },
												maxWidth: { xs: 280, md: 220 },
												mx: { xs: 'auto', md: 0 },
												aspectRatio: '3 / 4',
												borderRadius: '0.75rem',
												overflow: 'hidden',
												flexShrink: 0,
											}}>
											<Box
												component='img'
												src={consultation.coverImageUrl}
												alt={consultation.title}
												sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
											/>
										</Box>
									) : null}

									<Box sx={{ flex: 1, width: '100%', minWidth: 0 }}>
										<Typography
											component='h1'
											sx={{
												fontFamily: 'Varela Round',
												fontWeight: 700,
												fontSize: { xs: '1.5rem', md: '1.85rem' },
												color: '#0052a3',
												lineHeight: 1.3,
												m: 0,
												mb: 1.5,
											}}>
											{consultation.title}
										</Typography>

										{consultation.description && (
											<Typography
												sx={{
													fontFamily: 'Varela Round',
													color: '#475569',
													fontSize: { xs: '0.9rem', md: '1rem' },
													mb: 2,
													whiteSpace: 'pre-wrap',
													wordBreak: 'break-word',
												}}>
												{decodeHtmlEntities(consultation.description)}
											</Typography>
										)}

										<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2.5, alignItems: 'center' }}>
											{consultation.duration ? (
												<Typography
													sx={{
														fontFamily: 'Varela Round',
														fontSize: '0.85rem',
														color: '#64748b',
														backgroundColor: 'rgba(0, 82, 163, 0.06)',
														px: 1.25,
														py: 0.5,
														borderRadius: '0.35rem',
													}}>
													Süre: {consultation.duration} dakika
												</Typography>
											) : null}
											{displayPrice && (
												<Typography
													sx={{
														fontFamily: 'Varela Round',
														fontSize: '0.95rem',
														fontWeight: 700,
														color: displayPrice.isFree ? '#059669' : '#0052a3',
													}}>
													{displayPrice.label}
												</Typography>
											)}
										</Box>

										{canBook ? (
											<Button variant='contained' onClick={openBooking} endIcon={<EventAvailable />} sx={ctaButtonSx}>
												Randevu Al
											</Button>
										) : (
											<Typography
												sx={{
													fontFamily: 'Varela Round',
													fontWeight: 500,
													color: '#64748b',
													fontSize: '0.9rem',
													fontStyle: 'italic',
												}}>
												Yeni oturumlar yakında başlayacak
											</Typography>
										)}
									</Box>
								</Box>

								<LandingPageDocumentDetailBlocks blocks={detailBlocks} />

								<Box
									sx={{
										mt: { xs: 4, md: 5 },
										pt: { xs: 3, md: 3.5 },
										borderTop: '1px solid rgba(15, 23, 42, 0.08)',
										display: 'flex',
										flexDirection: { xs: 'column', sm: 'row' },
										alignItems: { xs: 'stretch', sm: 'center' },
										justifyContent: 'space-between',
										gap: 2,
									}}>
									<Box>
										<Typography
											sx={{
												fontFamily: 'Varela Round',
												fontWeight: 600,
												fontSize: { xs: '1rem', md: '1.1rem' },
												color: '#0f172a',
												mb: 0.5,
											}}>
											{consultation.title}
										</Typography>
										{displayPrice && (
											<Typography
												sx={{
													fontFamily: 'Varela Round',
													fontSize: '0.95rem',
													fontWeight: 700,
													color: displayPrice.isFree ? '#059669' : '#0052a3',
												}}>
												{displayPrice.label}
											</Typography>
										)}
									</Box>
									{canBook && (
										<Button
											variant='contained'
											onClick={openBooking}
											endIcon={<EventAvailable />}
											sx={{ ...ctaButtonSx, px: 2.5, py: 1, alignSelf: { xs: 'stretch', sm: 'auto' } }}>
											Randevu Al
										</Button>
									)}
								</Box>
							</Box>
						)}
					</LandingPageLayout>
					<ChatWhatsApp />
					<ScrollToTopButton />
				</Box>
			</Box>

			{bookingModalOpen && (
				<Suspense
					fallback={
						<Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
							<CircularProgress />
						</Box>
					}>
					<ConsultationBookingModal
						open={bookingModalOpen}
						onClose={() => setBookingModalOpen(false)}
						consultation={consultation ?? null}
						consultationId={consultation?._id}
						onAddedToCart={() => navigate('/landing-page-cart')}
					/>
				</Suspense>
			)}
		</>
	);
};

export default LandingPageConsultation;
