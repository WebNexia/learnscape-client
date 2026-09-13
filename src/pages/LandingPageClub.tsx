import { useContext, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { Box, Button, Chip, CircularProgress, Typography } from '@mui/material';
import { ArrowBack, ConfirmationNumber } from '@mui/icons-material';
import { useQuery } from 'react-query';
import LandingPageLayout from '../components/landingPage/LandingPageLayout';
import ChatWhatsApp from '../components/landingPage/ChatWhatsApp';
import ScrollToTopButton from '../components/landingPage/ScrollToTopButton';
import { SEO, StructuredData } from '../components/seo';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import { Club } from '../interfaces/club';
import { DocumentDetailBlock } from '../interfaces/document';
import { clubsService } from '../services/clubsService';
import LandingPageDocumentDetailBlocks from '../components/landingPage/LandingPageDocumentDetailBlocks';
import ClubPurchaseDialog, { pickPackPrice } from '../components/clubs/ClubPurchaseDialog';
import { useGeoLocation } from '../hooks/useGeoLocation';
import { setCurrencySymbol } from '../utils/setCurrencySymbol';
import { useIsLpQaPreview } from '../hooks/useIsLpQaPreview';
import { LP_QA_PREVIEW_SEGMENT, stripLpQaPreviewPath } from '../utils/lpQaPreview';

const DAY_NAMES = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

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

const LandingPageClub = () => {
	const { clubId } = useParams();
	const { orgId } = useContext(OrganisationContext);
	const geoLocation = useGeoLocation();
	const isQaPreview = useIsLpQaPreview();
	const baseUrl = import.meta.env.VITE_SITE_URL || 'https://adenacademy.co.uk';

	const [purchaseOpen, setPurchaseOpen] = useState(false);

	const {
		data: club,
		isLoading,
		isFetching,
		isError,
	} = useQuery(
		['lpPublicClubDetail', orgId, clubId, isQaPreview],
		async () => clubsService.getPublicClub(orgId!, clubId!, { qaPreview: isQaPreview }) as Promise<Club>,
		{
			enabled: Boolean(orgId && clubId),
			staleTime: 60_000,
		},
	);

	const showLoader = !orgId || !clubId || (!club && (isLoading || isFetching));
	const showError = Boolean(orgId && clubId && isError);
	const showNotFound = Boolean(orgId && clubId && !isLoading && !isFetching && !isError && !club);

	const detailBlocks: DocumentDetailBlock[] = Array.isArray(club?.detailBlocks) ? club!.detailBlocks! : [];
	const introPlainForSeo = detailBlocks
		.filter((b): b is Extract<DocumentDetailBlock, { type: 'section' }> => b.type === 'section')
		.map((b) => (b.body || '').replace(/<[^>]*>/g, ' '))
		.join(' ')
		.replace(/\s+/g, ' ')
		.trim();

	const scheduleLabel = club
		? `${(club.schedule?.daysOfWeek || []).map((d) => DAY_NAMES[d]).join(', ')} ${club.schedule?.startTime || ''}`.trim()
		: '';

	const unitPack = (club?.packs || []).find((p) => p.sessionCount === 1) || (club?.packs || [])[0];
	const fromPrice = unitPack ? pickPackPrice(unitPack, geoLocation?.countryCode) : null;

	const clubsListPath = isQaPreview ? `/landing-page-clubs/${LP_QA_PREVIEW_SEGMENT}` : '/landing-page-clubs';
	const ticketPath = isQaPreview
		? `/landing-page-clubs/ticket/${LP_QA_PREVIEW_SEGMENT}`
		: '/landing-page-clubs/ticket';
	const clubUrl = club
		? `${baseUrl}${stripLpQaPreviewPath(`/landing-page-clubs/${encodeURIComponent(club.title || '')}/${club._id}`)}`
		: '';
	const seoDescription =
		introPlainForSeo ||
		club?.description ||
		'Aden Academy Zoom kulübü. Oturum satın alın, bilet kodunuzla katılın.';

	const canPurchase = Boolean(club?.packs?.length && (isQaPreview || club?.isActive !== false));

	return (
		<>
			{club && (
				<>
					<SEO
						title={`${club.title} - Kulüpler | Aden Academy`}
						description={seoDescription.slice(0, 160)}
						keywords={`${club.title}, kulüp, zoom kulüp, Aden Academy`}
						image={club.coverImageUrl}
						url={clubUrl}
						type='article'
						noIndex={isQaPreview}
					/>
					<StructuredData type='Organization' />
					<StructuredData
						type='BreadcrumbList'
						data={{
							breadcrumbs: [
								{ name: 'Home', url: baseUrl },
								{ name: 'Kulüpler', url: `${baseUrl}/landing-page-clubs` },
								{ name: club.title, url: clubUrl },
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
									Kulüp yüklenirken bir hata oluştu
								</Typography>
							</Box>
						)}

						{showNotFound && (
							<Box sx={{ paddingTop: '25vh', textAlign: 'center' }}>
								<Typography variant='h6' sx={{ fontFamily: 'Varela Round' }}>
									Kulüp bulunamadı
								</Typography>
							</Box>
						)}

						{!showLoader && !showError && club && (
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
									to={clubsListPath}
									startIcon={<ArrowBack />}
									sx={{
										mb: 2.5,
										textTransform: 'none',
										fontFamily: 'Varela Round',
										color: '#0052a3',
										px: 0,
										'&:hover': { backgroundColor: 'transparent', color: '#004c99' },
									}}>
									Kulüpler
								</Button>

								<Box
									sx={{
										display: 'flex',
										flexDirection: { xs: 'column', md: club.coverImageUrl ? 'row' : 'column' },
										gap: { xs: 2.5, md: club.coverImageUrl ? 4 : 0 },
										alignItems: { xs: 'stretch', md: 'flex-start' },
										mb: { xs: 3, md: 4 },
									}}>
									{club.coverImageUrl ? (
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
												src={club.coverImageUrl}
												alt={club.title}
												sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
											/>
										</Box>
									) : null}

									<Box sx={{ flex: 1, width: '100%', minWidth: 0 }}>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
											<Typography
												component='h1'
												sx={{
													fontFamily: 'Varela Round',
													fontWeight: 700,
													fontSize: { xs: '1.5rem', md: '1.85rem' },
													color: '#0052a3',
													lineHeight: 1.3,
													m: 0,
												}}>
												{club.title}
											</Typography>
											{isQaPreview && club.isActive === false && (
												<Chip
													label='Inactive'
													size='small'
													sx={{
														fontFamily: 'Varela Round',
														height: 22,
														fontSize: '0.7rem',
														backgroundColor: 'rgba(100, 116, 139, 0.15)',
														color: '#475569',
													}}
												/>
											)}
										</Box>

										{club.description && (
											<Typography
												sx={{
													fontFamily: 'Varela Round',
													color: '#475569',
													fontSize: { xs: '0.9rem', md: '1rem' },
													mb: 2,
													whiteSpace: 'pre-wrap',
													wordBreak: 'break-word',
												}}>
												{club.description}
											</Typography>
										)}

										<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2.5, alignItems: 'center' }}>
											{scheduleLabel && (
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
													{scheduleLabel}
													{club.schedule?.timezone ? ` · ${club.schedule.timezone}` : ''}
												</Typography>
											)}
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
												Kapasite: {club.defaultCapacity}
											</Typography>
											{fromPrice && (
												<Typography
													sx={{
														fontFamily: 'Varela Round',
														fontSize: '0.95rem',
														fontWeight: 700,
														color: '#0052a3',
													}}>
													{setCurrencySymbol(fromPrice.currency)}
													{fromPrice.amount}
													{unitPack?.sessionCount === 1 ? ' / oturum' : ''}
												</Typography>
											)}
										</Box>

										<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
											<Button
												variant='contained'
												disabled={!canPurchase}
												onClick={() => setPurchaseOpen(true)}
												endIcon={<ConfirmationNumber />}
												sx={ctaButtonSx}>
												Oturum Satın Al
											</Button>
											<Button
												variant='outlined'
												component={RouterLink}
												to={ticketPath}
												sx={{
													borderColor: '#0052a3',
													color: '#0052a3',
													textTransform: 'none',
													fontFamily: 'Varela Round',
													'&:hover': {
														borderColor: '#004c99',
														backgroundColor: 'rgba(0, 82, 163, 0.06)',
													},
												}}>
												Bilet ile Katıl
											</Button>
										</Box>
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
											{club.title}
										</Typography>
										{fromPrice && (
											<Typography
												sx={{
													fontFamily: 'Varela Round',
													fontSize: '0.95rem',
													fontWeight: 700,
													color: '#0052a3',
												}}>
												{setCurrencySymbol(fromPrice.currency)}
												{fromPrice.amount}
												{unitPack?.sessionCount === 1 ? ' / oturum' : ''}
											</Typography>
										)}
									</Box>
									<Button
										variant='contained'
										disabled={!canPurchase}
										onClick={() => setPurchaseOpen(true)}
										endIcon={<ConfirmationNumber />}
										sx={{ ...ctaButtonSx, px: 2.5, py: 1, alignSelf: { xs: 'stretch', sm: 'auto' } }}>
										Oturum Satın Al
									</Button>
								</Box>
							</Box>
						)}
					</LandingPageLayout>
					<ChatWhatsApp />
					<ScrollToTopButton />
				</Box>
			</Box>

			<ClubPurchaseDialog
				open={purchaseOpen}
				club={club || null}
				orgId={orgId}
				cancelUrl={
					club
						? `${window.location.origin}/landing-page-clubs/${encodeURIComponent(club.title)}/${club._id}${
								isQaPreview ? `/${LP_QA_PREVIEW_SEGMENT}` : ''
							}`
						: `${window.location.origin}${clubsListPath}`
				}
				onClose={() => setPurchaseOpen(false)}
			/>
		</>
	);
};

export default LandingPageClub;
