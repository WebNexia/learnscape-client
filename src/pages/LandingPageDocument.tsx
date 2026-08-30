import { useContext, useState } from 'react';
import { Link as RouterLink, useLocation, useParams } from 'react-router-dom';
import {
	Alert,
	Box,
	Button,
	Checkbox,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	FormControlLabel,
	IconButton,
	Typography,
} from '@mui/material';
import { AddShoppingCart, ArrowBack, Check, ChevronLeft, ChevronRight, Close as CloseIcon, Download } from '@mui/icons-material';
import axios from 'axios';
import { useQuery } from 'react-query';
import { isAxiosError } from 'axios';
import LandingPageLayout from '../components/landingPage/LandingPageLayout';
import ChatWhatsApp from '../components/landingPage/ChatWhatsApp';
import ScrollToTopButton from '../components/landingPage/ScrollToTopButton';
import { SEO, StructuredData } from '../components/seo';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import { Document } from '../interfaces/document';
import { decodeHtmlEntities } from '../utils/utilText';
import { useDocumentCart } from '../contexts/DocumentCartContextProvider';
import { requestFreeResourceEmail } from '../services/freeResourceDownloadService';
import { useGeoLocation } from '../hooks/useGeoLocation';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import CustomCancelButton from '../components/forms/customButtons/CustomCancelButton';
import LandingPageDocumentDetailBlocks, { resolvePublicDetailBlocks } from '../components/landingPage/LandingPageDocumentDetailBlocks';
import { DocumentDetailBlock } from '../interfaces/document';

type PublicDocumentDetail = Pick<
	Document,
	'_id' | 'name' | 'description' | 'imageUrl' | 'samplePageImageUrls' | 'detailIntroText' | 'detailImageUrls' | 'detailBlocks' | 'prices' | 'pageCount' | 'orgId'
> & {
	createdAt?: string;
	updatedAt?: string;
};

const getUserCurrency = (country?: string) => {
	switch ((country || 'US').toUpperCase()) {
		case 'GB':
			return 'gbp';
		case 'TR':
			return 'try';
		case 'EU':
			return 'eur';
		default:
			return 'usd';
	}
};

const LandingPageDocument = () => {
	const { documentId } = useParams();
	const location = useLocation();
	const { orgId } = useContext(OrganisationContext);
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const baseUrl = import.meta.env.VITE_SITE_URL || 'https://adenacademy.co.uk';
	const geoLocation = useGeoLocation();
	const country = new URLSearchParams(location.search).get('country') || geoLocation?.countryCode || 'US';
	const userCurrency = getUserCurrency(country);
	const { items: documentCartItems, addItem: addToDocumentCart } = useDocumentCart();

	const [openSample, setOpenSample] = useState(false);
	const [sampleIndex, setSampleIndex] = useState(0);
	const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
	const [downloadEmail, setDownloadEmail] = useState('');
	const [marketingOptIn, setMarketingOptIn] = useState(false);
	const [downloadSubmitting, setDownloadSubmitting] = useState(false);
	const [downloadError, setDownloadError] = useState<string | null>(null);
	const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

	const {
		data: document,
		isLoading,
		isFetching,
		isError,
	} = useQuery(
		['lpPublicDocumentDetail', orgId, documentId],
		async () => {
			const res = await axios.get(`${base_url}/documents/public/${orgId}/document/${documentId}`);
			return res?.data?.data as PublicDocumentDetail;
		},
		{
			enabled: Boolean(orgId && documentId),
			staleTime: 60_000,
		}
	);

	const showLoader = !orgId || !documentId || (!document && (isLoading || isFetching));
	const showError = Boolean(orgId && documentId && isError);
	const showNotFound = Boolean(orgId && documentId && !isLoading && !isFetching && !isError && !document);

	const price = document?.prices?.find((p) => p.currency === userCurrency);
	const isFree = !price || price.amount === '0' || price.amount === 'Free';
	const isInCart = document ? documentCartItems.some((item) => item.documentId === document._id) : false;
	const sampleUrls = document?.samplePageImageUrls ?? [];
	const hasSamplePages = sampleUrls.length > 0;
	const detailBlocks: DocumentDetailBlock[] = document ? resolvePublicDetailBlocks(document) : [];
	const introPlainForSeo = detailBlocks
		.filter((b): b is Extract<DocumentDetailBlock, { type: 'section' }> => b.type === 'section')
		.map((b) => (b.body || '').replace(/<[^>]*>/g, ' '))
		.join(' ')
		.replace(/\s+/g, ' ')
		.trim();
	const decodedName = decodeHtmlEntities(document?.name || '');

	const docUrl = document
		? `${baseUrl}/landing-page-document/${encodeURIComponent(document.name || '')}/${document._id}`
		: '';
	const seoDescription =
		introPlainForSeo ||
		document?.description ||
		'Aden Academy kitabı. Detayları inceleyin, örnek sayfalara bakın ve indirin veya satın alın.';

	const handleAddToCart = () => {
		if (!document || isFree || !price || !document.orgId) return;
		addToDocumentCart({
			documentId: document._id,
			orgId: document.orgId,
			title: document.name || 'Kitap',
			amount: price.amount,
			currency: price.currency,
			imageUrl: document.imageUrl,
		});
	};

	const openFreeDownloadDialog = () => {
		setDownloadError(null);
		setDownloadSuccess(null);
		setDownloadEmail('');
		setMarketingOptIn(false);
		setDownloadDialogOpen(true);
	};

	const closeFreeDownloadDialog = () => {
		if (downloadSubmitting) return;
		setDownloadDialogOpen(false);
	};

	const handleSubmitFreeDownload = async () => {
		if (!document) return;
		setDownloadError(null);
		setDownloadSuccess(null);
		const trimmed = downloadEmail.trim();
		if (!trimmed) {
			setDownloadError('Lütfen e-posta adresinizi girin.');
			return;
		}
		if (!document.orgId) {
			setDownloadError('Kitap bilgisi eksik.');
			return;
		}
		setDownloadSubmitting(true);
		try {
			const { message } = await requestFreeResourceEmail({
				orgId: String(document.orgId),
				documentId: String(document._id),
				email: trimmed,
				currency: userCurrency,
				marketingOptIn,
			});
			setDownloadSuccess(message);
		} catch (e: unknown) {
			const msg =
				isAxiosError(e) && e.response?.data && typeof (e.response.data as { message?: string }).message === 'string'
					? (e.response.data as { message: string }).message
					: 'Gönderim başarısız. Lütfen tekrar deneyin.';
			setDownloadError(msg);
		} finally {
			setDownloadSubmitting(false);
		}
	};

	return (
		<>
			{document && (
				<>
					<SEO
						title={`${decodedName} - Kitaplar | Aden Academy`}
						description={seoDescription.slice(0, 160)}
						keywords={`${decodedName}, kitap, öğrenme, Aden Academy`}
						image={document.imageUrl}
						url={docUrl}
						type='article'
					/>
					<StructuredData type='Organization' />
					<StructuredData
						type='BreadcrumbList'
						data={{
							breadcrumbs: [
								{ name: 'Home', url: baseUrl },
								{ name: 'Kitaplar', url: `${baseUrl}/landing-page-resources` },
								{ name: decodedName, url: docUrl },
							],
						}}
					/>
					<StructuredData
						type='WebPage'
						data={{
							url: docUrl,
							name: decodedName,
							description: seoDescription.slice(0, 160),
							datePublished: document.createdAt,
							dateModified: document.updatedAt,
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
									Kitap yüklenirken bir hata oluştu
								</Typography>
							</Box>
						)}

						{showNotFound && (
							<Box sx={{ paddingTop: '25vh', textAlign: 'center' }}>
								<Typography variant='h6' sx={{ fontFamily: 'Varela Round' }}>
									Kitap bulunamadı
								</Typography>
							</Box>
						)}

						{!showLoader && !showError && document && (
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
									to='/landing-page-resources'
									startIcon={<ArrowBack />}
									sx={{
										mb: 3,
										color: '#0052a3',
										textTransform: 'none',
										fontFamily: 'Varela Round',
										fontWeight: 500,
										px: 0,
										'&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' },
									}}>
									Kitaplara dön
								</Button>

								<Box
									sx={{
										display: 'flex',
										flexDirection: { xs: 'column', md: 'row' },
										gap: { xs: 3, md: 4 },
										alignItems: { xs: 'center', md: 'flex-start' },
									}}>
									<Box
										sx={{
											width: { xs: '12rem', sm: '14rem', md: '16rem' },
											flexShrink: 0,
											borderRadius: '0.75rem',
											overflow: 'hidden',
											boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
											backgroundColor: 'transparent',
											aspectRatio: '3 / 4',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
										}}>
										{document.imageUrl ? (
											<Box
												component='img'
												src={document.imageUrl}
												alt={decodedName}
												sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
											/>
										) : (
											<Typography sx={{ fontFamily: 'Varela Round', color: '#94a3b8', p: 2, textAlign: 'center' }}>
												Kapak görseli yok
											</Typography>
										)}
									</Box>

									<Box sx={{ flex: 1, width: '100%', minWidth: 0 }}>
										<Typography
											component='h1'
											sx={{
												fontFamily: 'Varela Round',
												fontWeight: 700,
												fontSize: { xs: '1.5rem', md: '1.85rem' },
												color: '#0052a3',
												mb: 1.5,
												lineHeight: 1.3,
											}}>
											{decodedName}
										</Typography>

										{document.description && (
											<Typography
												sx={{
													fontFamily: 'Varela Round',
													color: '#475569',
													fontSize: { xs: '0.9rem', md: '1rem' },
													mb: 2,
													whiteSpace: 'pre-wrap',
													wordBreak: 'break-word',
												}}>
												{document.description}
											</Typography>
										)}

										<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2.5, alignItems: 'center' }}>
											{typeof document.pageCount === 'number' && document.pageCount > 0 && (
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
													{document.pageCount} sayfa
												</Typography>
											)}
											<Typography
												sx={{
													fontFamily: 'Varela Round',
													fontSize: '0.95rem',
													fontWeight: 700,
													color: isFree ? '#059669' : '#0052a3',
												}}>
												{isFree ? 'Ücretsiz' : `${price?.amount} ${userCurrency.toUpperCase()}`}
											</Typography>
										</Box>

										<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
											<Button
												variant='outlined'
												onClick={() => {
													setSampleIndex(0);
													setOpenSample(true);
												}}
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
												{sampleUrls.length > 1 ? 'Örnek Sayfalar' : 'Örnek Sayfa'}
											</Button>
											{isFree ? (
												<Button
													variant='contained'
													onClick={openFreeDownloadDialog}
													endIcon={<Download />}
													sx={{
														textTransform: 'none',
														fontFamily: 'Varela Round',
														background: 'linear-gradient(135deg, rgba(0, 82, 163, 0.95) 0%, rgba(0, 102, 204, 0.95) 100%)',
														boxShadow: 'none',
														'&:hover': {
															background: 'linear-gradient(135deg, rgba(0, 82, 163, 1) 0%, rgba(0, 102, 204, 1) 100%)',
															boxShadow: '0 4px 15px rgba(0, 82, 163, 0.35)',
														},
													}}>
													İndir
												</Button>
											) : (
												<Button
													variant='contained'
													disabled={isInCart}
													onClick={handleAddToCart}
													endIcon={isInCart ? <Check /> : <AddShoppingCart />}
													sx={{
														textTransform: 'none',
														fontFamily: 'Varela Round',
														background: isInCart ? 'grey.300' : '#FF6B3D',
														boxShadow: 'none',
														'&:hover': !isInCart
															? { background: '#ff7d55', boxShadow: '0 4px 15px rgba(255, 107, 61, 0.4)' }
															: {},
													}}>
													{isInCart ? 'Eklendi' : 'Sepete Ekle'}
												</Button>
											)}
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
											{decodedName}
										</Typography>
										<Typography
											sx={{
												fontFamily: 'Varela Round',
												fontSize: '0.95rem',
												fontWeight: 700,
												color: isFree ? '#059669' : '#0052a3',
											}}>
											{isFree ? 'Ücretsiz' : `${price?.amount} ${userCurrency.toUpperCase()}`}
										</Typography>
									</Box>
									<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: { xs: 'stretch', sm: 'flex-end' } }}>
										{isFree ? (
											<Button
												variant='contained'
												onClick={openFreeDownloadDialog}
												endIcon={<Download />}
												sx={{
													textTransform: 'none',
													fontFamily: 'Varela Round',
													px: 2.5,
													py: 1,
													background: 'linear-gradient(135deg, rgba(0, 82, 163, 0.95) 0%, rgba(0, 102, 204, 0.95) 100%)',
													boxShadow: 'none',
													'&:hover': {
														background: 'linear-gradient(135deg, rgba(0, 82, 163, 1) 0%, rgba(0, 102, 204, 1) 100%)',
														boxShadow: '0 4px 15px rgba(0, 82, 163, 0.35)',
													},
												}}>
												İndir
											</Button>
										) : (
											<Button
												variant='contained'
												disabled={isInCart}
												onClick={handleAddToCart}
												endIcon={isInCart ? <Check /> : <AddShoppingCart />}
												sx={{
													textTransform: 'none',
													fontFamily: 'Varela Round',
													px: 2.5,
													py: 1,
													background: isInCart ? 'grey.300' : '#FF6B3D',
													boxShadow: 'none',
													'&:hover': !isInCart
														? { background: '#ff7d55', boxShadow: '0 4px 15px rgba(255, 107, 61, 0.4)' }
														: {},
												}}>
												{isInCart ? 'Eklendi' : 'Sepete Ekle'}
											</Button>
										)}
									</Box>
								</Box>
							</Box>
						)}

						<Box sx={{ margin: '1rem 0 3rem 0' }}>
							<ChatWhatsApp />
							<ScrollToTopButton />
						</Box>
					</LandingPageLayout>
				</Box>
			</Box>

			{/* Sample pages dialog — same behavior as DocumentCard */}
			<Dialog
				open={openSample}
				onClose={() => {
					setSampleIndex(0);
					setOpenSample(false);
				}}
				maxWidth={false}
				PaperProps={{
					sx: {
						borderRadius: '16px',
						backgroundColor: 'transparent',
						width: !hasSamplePages ? '30rem' : 'fit-content',
						height: !hasSamplePages ? '60vh' : 'fit-content',
						maxWidth: '80vw',
						maxHeight: '80vh',
						overflow: 'hidden',
					},
				}}>
				<DialogContent
					sx={{
						position: 'relative',
						padding: 0,
						height: 'auto',
						width: !hasSamplePages ? '100%' : { xs: '80vw', sm: '50vw', md: '25vw', lg: '30vw' },
					}}>
					<IconButton
						onClick={() => {
							setSampleIndex(0);
							setOpenSample(false);
						}}
						sx={{
							position: 'absolute',
							right: 8,
							top: 8,
							zIndex: 1,
							color: 'grey.500',
							backgroundColor: 'rgba(255, 255, 255, 0.8)',
							'&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.9)' },
						}}>
						<CloseIcon fontSize='small' />
					</IconButton>
					{hasSamplePages ? (
						<Box
							sx={{
								width: '100%',
								height: '100%',
								position: 'relative',
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								justifyContent: 'center',
								overflow: 'hidden',
							}}>
							<img
								src={sampleUrls[sampleIndex]}
								alt={`Sample Page ${sampleIndex + 1}`}
								style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
							/>
							{sampleUrls.length > 1 && (
								<>
									<IconButton
										onClick={() => setSampleIndex((i) => Math.max(0, i - 1))}
										disabled={sampleIndex === 0}
										sx={{
											position: 'absolute',
											left: 8,
											top: '50%',
											transform: 'translateY(-50%)',
											zIndex: 1,
											backgroundColor: 'rgba(255,255,255,0.9)',
											boxShadow: 1,
											'&:hover': { backgroundColor: 'white' },
										}}
										size='small'>
										<ChevronLeft />
									</IconButton>
									<IconButton
										onClick={() => setSampleIndex((i) => Math.min(sampleUrls.length - 1, i + 1))}
										disabled={sampleIndex === sampleUrls.length - 1}
										sx={{
											position: 'absolute',
											right: 8,
											top: '50%',
											transform: 'translateY(-50%)',
											zIndex: 1,
											backgroundColor: 'rgba(255,255,255,0.9)',
											boxShadow: 1,
											'&:hover': { backgroundColor: 'white' },
										}}
										size='small'>
										<ChevronRight />
									</IconButton>
									<Box sx={{ display: 'flex', gap: 0.5, py: 1, alignItems: 'center', justifyContent: 'center' }}>
										<Typography variant='caption' color='text.secondary'>
											{sampleIndex + 1} / {sampleUrls.length}
										</Typography>
									</Box>
								</>
							)}
						</Box>
					) : (
						<Box
							sx={{
								height: '100%',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								backgroundColor: 'grey.100',
							}}>
							<Typography color='text.secondary'>Örnek sayfa mevcut değil</Typography>
						</Box>
					)}
				</DialogContent>
			</Dialog>

			<Dialog open={downloadDialogOpen} onClose={closeFreeDownloadDialog} fullWidth maxWidth='xs'>
				<DialogContent sx={{ pt: 3, pb: 1 }}>
					<Typography variant='h6' sx={{ fontFamily: "'Varela Round', sans-serif", fontWeight: 700, mb: 1, color: '#0f172a' }}>
						Kitabı e-posta ile al
					</Typography>
					<Typography variant='body2' color='text.secondary' sx={{ fontFamily: "'Varela Round', sans-serif", mb: 2 }}>
						{decodedName} e-posta adresinize gönderilecektir.
					</Typography>
					{downloadError && (
						<Alert severity='error' sx={{ mb: 2, fontFamily: "'Varela Round', sans-serif" }}>
							{downloadError}
						</Alert>
					)}
					{downloadSuccess && (
						<Alert severity='success' sx={{ mb: 2, fontFamily: "'Varela Round', sans-serif" }}>
							{downloadSuccess}
						</Alert>
					)}
					{!downloadSuccess && (
						<>
							<CustomTextField
								fullWidth
								type='email'
								label='E-posta'
								value={downloadEmail}
								onChange={(e) => setDownloadEmail(e.target.value)}
								disabled={downloadSubmitting}
								sx={{ mb: 2.5, '& .MuiInputBase-input': { fontFamily: "'Varela Round', sans-serif" } }}
							/>
							<FormControlLabel
								control={
									<Checkbox
										checked={marketingOptIn}
										onChange={(e) => setMarketingOptIn(e.target.checked)}
										disabled={downloadSubmitting}
										size='small'
									/>
								}
								label={
									<Typography variant='body2' sx={{ fontFamily: "'Varela Round', sans-serif", color: 'text.secondary' }}>
										Kampanya ve yenilikler hakkında e-posta almak istiyorum
									</Typography>
								}
							/>
						</>
					)}
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
					<CustomCancelButton
						onClick={closeFreeDownloadDialog}
						disabled={downloadSubmitting}
						sx={{ fontFamily: "'Varela Round', sans-serif", textTransform: 'none' }}>
						{downloadSuccess ? 'Kapat' : 'İptal'}
					</CustomCancelButton>
					{!downloadSuccess && (
						<CustomSubmitButton
							variant='contained'
							onClick={handleSubmitFreeDownload}
							disabled={downloadSubmitting}
							sx={{
								fontFamily: "'Varela Round', sans-serif",
								textTransform: 'none',
								background: 'linear-gradient(135deg, #0052a3 0%, #0066cc 100%)',
							}}
							startIcon={downloadSubmitting ? <CircularProgress size={18} color='inherit' /> : undefined}>
							Gönder
						</CustomSubmitButton>
					)}
				</DialogActions>
			</Dialog>
		</>
	);
};

export default LandingPageDocument;
