import {
	Box,
	Typography,
	Button,
	Card,
	CardContent,
	CardActionArea,
	CircularProgress,
	Chip,
} from '@mui/material';
import LandingPageLayout from '../components/landingPage/LandingPageLayout';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import { useContext, useEffect, useState } from 'react';
import { Club } from '../interfaces/club';
import { clubsService } from '../services/clubsService';
import ChatWhatsApp from '../components/landingPage/ChatWhatsApp';
import ScrollToTopButton from '../components/landingPage/ScrollToTopButton';
import { SEO } from '../components/seo';
import { setCurrencySymbol } from '../utils/setCurrencySymbol';
import { useGeoLocation } from '../hooks/useGeoLocation';
import { useNavigate } from 'react-router-dom';
import { Groups } from '@mui/icons-material';
import ClubPurchaseDialog, { pickPackPrice } from '../components/clubs/ClubPurchaseDialog';
import { useIsLpQaPreview } from '../hooks/useIsLpQaPreview';
import { LP_QA_PREVIEW_SEGMENT } from '../utils/lpQaPreview';

const DAY_NAMES = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

const LandingPageClubs = () => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const { orgId } = useContext(OrganisationContext);
	const geoLocation = useGeoLocation();
	const navigate = useNavigate();
	const isQaPreview = useIsLpQaPreview();

	const [clubs, setClubs] = useState<Club[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [purchaseClub, setPurchaseClub] = useState<Club | null>(null);

	useEffect(() => {
		if (!orgId) return;
		let cancelled = false;
		(async () => {
			try {
				setLoading(true);
				const data = await clubsService.getPublicClubs(orgId, { qaPreview: isQaPreview });
				if (!cancelled) setClubs(data || []);
			} catch {
				if (!cancelled) setError('Kulüpler yüklenemedi.');
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [orgId, isQaPreview]);

	const clubsBase = isQaPreview ? `/landing-page-clubs/${LP_QA_PREVIEW_SEGMENT}` : '/landing-page-clubs';
	const ticketPath = isQaPreview
		? `/landing-page-clubs/ticket/${LP_QA_PREVIEW_SEGMENT}`
		: '/landing-page-clubs/ticket';

	const goToDetail = (club: Club) => {
		const path = `/landing-page-clubs/${encodeURIComponent(club.title || '')}/${club._id}${isQaPreview ? `/${LP_QA_PREVIEW_SEGMENT}` : ''
			}`;
		navigate(path);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	return (
		<>
			<SEO
				title='Kulüpler - Aden Academy'
				description='Haftalık Zoom kulüp oturumları. Oturum hakkı alın, bilet kodunuzla katılın.'
				keywords='kulüp, zoom kulüp, konuşma kulübü, oturum'
				type='website'
				noIndex={isQaPreview}
			/>
			<Box
				sx={{
					position: 'relative',
					overflow: 'hidden',
					minHeight: '100vh',
					background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 40%, rgba(0, 82, 163, 0.05) 100%)',
				}}>
				<LandingPageLayout>
					<Box sx={{ width: '90%', maxWidth: 960, mx: 'auto', pt: isMobileSize ? '12vh' : '14vh', pb: 6 }}>
						{clubs.length > 0 && (
							<Box sx={{ textAlign: 'center', mb: 4 }}>
								<Typography sx={{ fontFamily: 'Varela Round', color: '#475569', maxWidth: 640, mx: 'auto' }}>
									Kulüp detayını inceleyin, istediğiniz oturum sayısını seçin ve bilet alın. Bilet kodunuz e-postanıza
									gelir.
								</Typography>
							</Box>
						)}

						{error && (
							<Typography color='error' textAlign='center' sx={{ fontFamily: 'Varela Round' }}>
								{error}
							</Typography>
						)}
						{loading ? (
							<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
								<CircularProgress sx={{ color: '#0052a3' }} />
							</Box>
						) : clubs.length === 0 ? (
							<Box sx={{ textAlign: 'center', py: 8, px: 2, maxWidth: 520, mx: 'auto' }}>
								<Typography
									sx={{
										fontFamily: 'Varela Round',
										color: '#334155',
										fontSize: isMobileSize ? '1.05rem' : '1.2rem',
										fontWeight: 600,
										mb: 1.5,
										lineHeight: 1.5,
									}}>
									Yakında kulüplerimiz başlayacaktır
								</Typography>
								<Typography sx={{ fontFamily: 'Varela Round', color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6 }}>
									Sayfalarımızı takip edin; yeni kulüp oturumları yayınlandığında burada yer alacaktır.
								</Typography>
							</Box>
						) : (
							<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
								{clubs.map((club) => {
									const unitPack = (club.packs || []).find((p) => p.sessionCount === 1) || (club.packs || [])[0];
									const fromPrice = unitPack ? pickPackPrice(unitPack, geoLocation?.countryCode) : null;
									const isInactive = club.isActive === false;
									return (
										<Card
											key={club._id}
											sx={{
												borderRadius: '0.75rem',
												border: '1px solid rgba(0, 82, 163, 0.15)',
												boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
												overflow: 'hidden',
												opacity: isInactive ? 0.92 : 1,
											}}>
											<CardActionArea onClick={() => goToDetail(club)} sx={{ alignItems: 'stretch' }}>
												{club.coverImageUrl && (
													<Box
														component='img'
														src={club.coverImageUrl}
														alt={club.title}
														sx={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
													/>
												)}
												<CardContent sx={{ p: 3 }}>
													<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
														<Groups sx={{ color: '#0052a3' }} />
														<Typography sx={{ fontFamily: 'Varela Round', fontWeight: 600, fontSize: '1.2rem' }}>
															{club.title}
														</Typography>
														{isQaPreview && isInactive && (
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
																color: '#64748b',
																mb: 1.5,
																fontSize: '0.95rem',
																display: '-webkit-box',
																WebkitLineClamp: 3,
																WebkitBoxOrient: 'vertical',
																overflow: 'hidden',
															}}>
															{club.description}
														</Typography>
													)}
													<Typography sx={{ fontFamily: 'Varela Round', color: '#334155', mb: 0.5, fontSize: '0.9rem' }}>
														Program: {(club.schedule?.daysOfWeek || []).map((d) => DAY_NAMES[d]).join(', ')}{' '}
														{club.schedule?.startTime}
													</Typography>
													{fromPrice && (
														<Typography
															sx={{
																fontFamily: 'Varela Round',
																fontWeight: 700,
																color: '#0052a3',
																fontSize: '0.95rem',
																mt: 1,
															}}>
															{setCurrencySymbol(fromPrice.currency)}
															{fromPrice.amount}
															{unitPack?.sessionCount === 1 ? ' / oturum' : ''}
														</Typography>
													)}
												</CardContent>
											</CardActionArea>
											<Box sx={{ px: 3, pb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
												<Button
													variant='outlined'
													onClick={() => goToDetail(club)}
													sx={{
														fontFamily: 'Varela Round',
														textTransform: 'none',
														borderColor: '#0052a3',
														color: '#0052a3',
														'&:hover': { borderColor: '#004c99', backgroundColor: 'rgba(0, 82, 163, 0.06)' },
													}}>
													Detayları Gör
												</Button>
												<Button
													variant='contained'
													disabled={!club.packs?.length || (isInactive && !isQaPreview)}
													onClick={() => setPurchaseClub(club)}
													sx={{
														fontFamily: 'Varela Round',
														textTransform: 'none',
														background: 'linear-gradient(135deg, #0052a3 0%, #0066cc 100%)',
														boxShadow: 'none',
														'&:hover': {
															background: 'linear-gradient(135deg, #004c99 0%, #0052a3 100%)',
															boxShadow: '0 4px 15px rgba(0, 82, 163, 0.35)',
														},
													}}>
													Oturum Satın Al
												</Button>
											</Box>
										</Card>
									);
								})}
							</Box>
						)}
					</Box>
				</LandingPageLayout>
				<ChatWhatsApp />
				<ScrollToTopButton />
			</Box>

			<ClubPurchaseDialog
				open={!!purchaseClub}
				club={purchaseClub}
				orgId={orgId}
				cancelUrl={`${window.location.origin}${clubsBase}`}
				onClose={() => setPurchaseClub(null)}
			/>
		</>
	);
};

export default LandingPageClubs;
