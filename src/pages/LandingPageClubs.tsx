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
import { ForumOutlined } from '@mui/icons-material';
import { pickPackPrice, clubPaymentPath } from '../utils/clubPurchasePricing';
import { useIsLpQaPreview } from '../hooks/useIsLpQaPreview';
import { LP_QA_PREVIEW_SEGMENT } from '../utils/lpQaPreview';
import ClubJoinHowItWorks from '../components/clubs/ClubJoinHowItWorks';

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

	const goToDetail = (club: Club) => {
		const path = `/landing-page-clubs/${encodeURIComponent(club.title || '')}/${club._id}${isQaPreview ? `/${LP_QA_PREVIEW_SEGMENT}` : ''
			}`;
		navigate(path);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	const goToPayment = (club: Club) => {
		navigate(clubPaymentPath(club, isQaPreview));
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	return (
		<>
			<SEO
				title='Kulüpler - Aden Academy'
				description='Haftalık Zoom kulüp oturumları. Oturum hakkı alın, bilet kodunuzla katılın.'
				keywords='kulüp, zoom kulüp, oturum'
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
					<Box sx={{ width: '90%', maxWidth: 820, mx: 'auto', pt: isMobileSize ? '12vh' : '14vh', pb: 6 }}>
						{isQaPreview && <ClubJoinHowItWorks />}

						{clubs.length > 0 && !isQaPreview && (
							<Box sx={{ textAlign: 'center', mb: 4 }}>
								<Typography sx={{ fontFamily: 'Varela Round', color: '#475569', maxWidth: 640, mx: 'auto' }}>
									Kulüp detayını inceleyin, istediğiniz oturum sayısını seçin ve bilet alın. Bilet kodunuz e-postanıza
									gelir.
								</Typography>
							</Box>
						)}

						{clubs.length > 0 && isQaPreview && (
							<Box sx={{ textAlign: 'center', mb: 3 }}>
								<Typography
									sx={{
										fontFamily: 'Varela Round',
										fontWeight: 700,
										fontSize: isMobileSize ? '1rem' : '1.1rem',
										color: '#0A1A2F',
									}}>
									Kulüpler (QA önizleme)
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
							<Box
								sx={{
									display: 'grid',
									gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 360px))' },
									justifyContent: 'center',
									gap: 3,
									alignItems: 'stretch',
								}}>
								{clubs.map((club) => {
									const unitPack = (club.packs || []).find((p) => p.sessionCount === 1) || (club.packs || [])[0];
									const fromPrice = unitPack ? pickPackPrice(unitPack, geoLocation?.countryCode) : null;
									const isInactive = club.isActive === false;
									return (
										<Box
											key={club._id}
											sx={{
												maxWidth: 320,
												width: '100%',
												mx: 'auto',
												height: '100%',
												minHeight: { xs: 420, sm: 460 },
												p: '4px',
												borderRadius: '0.75rem',
												boxSizing: 'border-box',
												position: 'relative',
												backgroundColor: 'transparent',
												border: '1.5px solid transparent',
												boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
												opacity: isInactive ? 0.92 : 1,
												transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out',
												'&::before': {
													content: '""',
													position: 'absolute',
													inset: 0,
													borderRadius: '0.75rem',
													background: 'linear-gradient(90deg, #0052a3 0%, #0052a380 100%)',
													opacity: 0,
													transition: 'opacity 0.25s ease-out',
													pointerEvents: 'none',
													zIndex: 0,
												},
												'&:hover': {
													transform: 'translate3d(0, -4px, 0)',
													boxShadow: '0 8px 24px #0052a328',
													'&::before': { opacity: 1 },
												},
											}}>
											<Card
												sx={{
													position: 'relative',
													zIndex: 1,
													display: 'flex',
													flexDirection: 'column',
													height: '100%',
													width: '100%',
													borderRadius: 'calc(0.75rem - 4px)',
													overflow: 'hidden',
													margin: 0,
													backgroundColor: '#FFFFFF',
													border: 'none',
													boxShadow: 'none',
												}}>
												<CardActionArea
													onClick={() => goToDetail(club)}
													sx={{
														alignItems: 'stretch',
														flex: 1,
														display: 'flex',
														flexDirection: 'column',
														height: '100%',
														backgroundColor: 'transparent',
														'&:hover': { backgroundColor: 'transparent' },
														'& .MuiCardActionArea-focusHighlight': {
															backgroundColor: 'transparent',
															opacity: '0 !important',
														},
													}}>
													{club.coverImageUrl && (
														<Box
															component='img'
															src={club.coverImageUrl}
															alt={club.title}
															sx={{ width: '100%', height: 240, objectFit: 'cover', display: 'block', flexShrink: 0 }}
														/>
													)}
													<CardContent sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
														<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
															<ForumOutlined sx={{ color: '#0052a3', fontSize: 22 }} />
															<Typography sx={{ fontFamily: 'Varela Round', fontWeight: 600, fontSize: '1.15rem' }}>
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
																	fontSize: '0.9rem',
																	display: '-webkit-box',
																	WebkitLineClamp: 3,
																	WebkitBoxOrient: 'vertical',
																	overflow: 'hidden',
																}}>
																{club.description}
															</Typography>
														)}
														<Typography sx={{ fontFamily: 'Varela Round', color: '#334155', mb: 0.5, fontSize: '0.88rem' }}>
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
												<Box
													sx={{
														px: 2.5,
														pb: 2.5,
														pt: 0.5,
														mt: 'auto',
														display: 'flex',
														justifyContent: 'flex-end',
														gap: 1,
														flexWrap: 'wrap',
														backgroundColor: '#FFFFFF',
													}}>
													<Button
														variant='outlined'
														size='small'
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
														size='small'
														disabled={!club.packs?.length || (isInactive && !isQaPreview)}
														onClick={() => goToPayment(club)}
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
										</Box>
									);
								})}
							</Box>
						)}
					</Box>
				</LandingPageLayout>
				<ChatWhatsApp />
				<ScrollToTopButton />
			</Box>
		</>
	);
};

export default LandingPageClubs;
