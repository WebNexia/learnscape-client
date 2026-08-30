import {
	Box,
	Button,
	Card,
	CardContent,
	CardMedia,
	Typography,
	useTheme,
	Dialog,
	DialogContent,
	DialogActions,
	IconButton,
	FormControlLabel,
	Checkbox,
	Alert,
	CircularProgress,
} from '@mui/material';
import { Document } from '../../interfaces/document';
import CloseIcon from '@mui/icons-material/Close';
import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, AddShoppingCart, ChevronLeft, ChevronRight, Check } from '@mui/icons-material';
import { decodeHtmlEntities, truncateText } from '../../utils/utilText';
import { useDocumentCart } from '../../contexts/DocumentCartContextProvider';
import { isAxiosError } from 'axios';
import { requestFreeResourceEmail } from '../../services/freeResourceDownloadService';
import CustomTextField from '../forms/customFields/CustomTextField';
import CustomSubmitButton from '../forms/customButtons/CustomSubmitButton';
import CustomCancelButton from '../forms/customButtons/CustomCancelButton';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import { LEARNER_EMPHASIS_FONT_FAMILY } from '../../utils/learnerTypography';
import { setCurrencySymbol } from '@utils/setCurrencySymbol';

interface DocumentCardProps {
	document: Pick<Document, '_id' | 'name' | 'prices' | 'imageUrl' | 'description' | 'samplePageImageUrls' | 'documentUrl' | 'orgId' | 'pageCount'>;
	userCurrency: string;
	fromHomePage?: boolean;
	onAddedToCart?: () => void;
}

const DocumentCard = ({ document, userCurrency, fromHomePage, onAddedToCart }: DocumentCardProps) => {
	const theme = useTheme();
	const navigate = useNavigate();
	const { isSmallScreen, isRotated } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotated;
	const { items: documentCartItems, addItem: addToDocumentCart } = useDocumentCart();
	const isInCart = documentCartItems.some((item) => item.documentId === document._id);
	const [openSample, setOpenSample] = useState(false);
	const [sampleIndex, setSampleIndex] = useState(0);
	const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
	const [downloadEmail, setDownloadEmail] = useState('');
	const [marketingOptIn, setMarketingOptIn] = useState(false);
	const [downloadSubmitting, setDownloadSubmitting] = useState(false);
	const [downloadError, setDownloadError] = useState<string | null>(null);
	const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
	const sampleUrls = document.samplePageImageUrls ?? [];
	const hasSamplePages = sampleUrls.length > 0;
	const currentSampleUrl = sampleUrls[sampleIndex];
	const price = document.prices?.find((p) => p.currency === userCurrency);
	const isFree = !price || price.amount === '0' || price.amount === 'Free';
	const topAccent = '#0052a3';
	const hoverBorderGradient = `linear-gradient(90deg, ${topAccent} 0%, ${topAccent}80 100%)`;
	const decodedName = decodeHtmlEntities(document.name || '');

	const goToDetail = () => {
		if (!fromHomePage || !document._id) return;
		navigate(`/landing-page-document/${encodeURIComponent(document.name || '')}/${document._id}`);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	const handleAddToCart = () => {
		if (isFree || !price || !document.orgId) return;
		addToDocumentCart({
			documentId: document._id,
			orgId: document.orgId,
			title: document.name || 'Kitap',
			amount: price.amount,
			currency: price.currency,
			imageUrl: document.imageUrl,
		});
		onAddedToCart?.();
	};

	const handleOpenSample = () => {
		setOpenSample(true);
	};

	const handleCloseSample = () => {
		setOpenSample(false);
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
			const msg = isAxiosError(e) && e.response?.data && typeof (e.response.data as { message?: string }).message === 'string'
				? (e.response.data as { message: string }).message
				: 'Gönderim başarısız. Lütfen tekrar deneyin.';
			setDownloadError(msg);
		} finally {
			setDownloadSubmitting(false);
		}
	};

	return (
		<>
			<Box
				sx={{
					width: isMobileSize ? '17rem' : '21rem',
					height: isMobileSize ? '27.5rem' : '30.5rem',
					p: '4px',
					borderRadius: '0.75rem',
					boxSizing: 'border-box',
					position: 'relative',
					margin: '0 1rem 2rem 1rem',
					backgroundColor: 'transparent',
					border: '1.5px solid transparent',
					boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
					transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out',
					cursor: fromHomePage ? 'pointer' : 'default',
					'&::before': {
						content: '""',
						position: 'absolute',
						inset: 0,
						borderRadius: '0.75rem',
						background: hoverBorderGradient,
						opacity: 0,
						transition: 'opacity 0.25s ease-out',
						pointerEvents: 'none',
						zIndex: 0,
					},
					'&:hover': {
						transform: 'translate3d(0, -4px, 0)',
						boxShadow: `0 8px 24px ${topAccent}28`,
						'&::before': { opacity: 1 },
					},
				}}
				onClick={fromHomePage ? goToDetail : undefined}
				role={fromHomePage ? 'link' : undefined}
				tabIndex={fromHomePage ? 0 : undefined}
				onKeyDown={
					fromHomePage
						? (e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									goToDetail();
								}
						  }
						: undefined
				}>
				<Card
					sx={{
						position: 'relative',
						zIndex: 1,
						height: '100%',
						width: '100%',
						borderRadius: 'calc(0.75rem - 4px)',
						overflow: 'hidden',
						margin: 0,
						backgroundColor: '#FFFFFF',
						border: 'none',
						boxShadow: 'none',
						display: 'flex',
						flexDirection: 'column',
					}}>
					{/* Cover — full book cover, no crop (portrait covers letterbox) */}
					<Box
						sx={{
							width: '100%',
							height: isMobileSize ? '11.5rem' : '14.5rem',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							backgroundColor: '#f8fafc',
							overflow: 'hidden',
							flexShrink: 0,
						}}>
						{document.imageUrl ? (
							<CardMedia
								component='img'
								image={document.imageUrl}
								alt={decodedName}
								sx={{
									width: '100%',
									height: '100%',
									objectFit: 'contain',
									objectPosition: 'center',
								}}
							/>
						) : (
							<Typography sx={{ fontFamily: 'Varela Round', color: '#94a3b8', fontSize: '0.85rem' }}>Kapak görseli yok</Typography>
						)}
					</Box>

					<CardContent sx={{ flexGrow: 1, padding: '1rem 1.5rem 0.5rem', pb: isMobileSize ? '6.5rem !important' : '5.5rem !important' }}>
						<Typography
							component='h3'
							sx={{
								fontFamily: LEARNER_EMPHASIS_FONT_FAMILY,
								fontWeight: 700,
								marginBottom: isMobileSize ? '0.4rem' : '0.55rem',
								color: fromHomePage ? topAccent : theme.palette.text.primary,
								lineHeight: 1.3,
								fontSize: isMobileSize
									? document?.name?.length > 35
										? '0.95rem'
										: '1.05rem'
									: document?.name?.length > 35
										? '1.05rem'
										: '1.15rem',
							}}>
							{decodedName}
						</Typography>

						<Typography
							variant='body2'
							sx={{
								textAlign: 'justify',
								color: topAccent,
								lineHeight: isMobileSize ? 1.4 : 1.5,
								fontFamily: fromHomePage ? 'Varela Round' : theme.typography.fontFamily,
								fontSize: isMobileSize ? '0.75rem' : '0.875rem',
								wordBreak: 'break-word',
							}}>
							{truncateText(document.description || 'No description available', 150)}
						</Typography>
					</CardContent>

					{/* Footer — mirrors course card bottom bar + action buttons */}
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							width: '100%',
							position: 'absolute',
							bottom: 0,
						}}
						onClick={(e) => e.stopPropagation()}>
						<Box
							sx={{
								display: 'flex',
								alignItems: 'center',
								gap: isMobileSize ? '0.35rem' : '0.5rem',
								px: isMobileSize ? '0.85rem' : '1.25rem',
								pb: 0.75,
							}}
							onClick={(e) => e.stopPropagation()}>
							<Button
								variant='outlined'
								fullWidth
								onClick={(e) => {
									e.stopPropagation();
									handleOpenSample();
								}}
								sx={{
									borderColor: topAccent,
									color: topAccent,
									'&:hover': {
										borderColor: '#004c99',
										backgroundColor: 'rgba(0, 82, 163, 0.06)',
									},
									fontFamily: 'Varela Round',
									fontSize: isMobileSize ? '0.68rem' : '0.82rem',
									textTransform: 'none',
									height: isMobileSize ? '2.15rem' : '1.85rem',
									minWidth: 0,
									px: isMobileSize ? 0.5 : 1,
									whiteSpace: 'nowrap',
									lineHeight: 1.2,
								}}>
								{sampleUrls.length > 1 ? 'Örnek Sayfalar' : 'Örnek Sayfa'}
							</Button>
							{isFree ? (
								<Button
									variant='text'
									fullWidth
									onClick={(e) => {
										e.stopPropagation();
										if (fromHomePage) {
											openFreeDownloadDialog();
										} else {
											window.open(document.documentUrl, '_blank');
										}
									}}
									sx={{
										background: 'linear-gradient(135deg, rgba(0, 82, 163, 0.9) 0%, rgba(0, 102, 204, 0.9) 100%)',
										color: 'white',
										'&:hover': {
											background: 'linear-gradient(135deg, rgba(0, 82, 163, 1) 0%, rgba(0, 102, 204, 1) 100%)',
											boxShadow: '0 4px 15px rgba(0, 82, 163, 0.35)',
										},
										fontFamily: 'Varela Round',
										fontSize: isMobileSize ? '0.68rem' : '0.82rem',
										textTransform: 'none',
										height: isMobileSize ? '2.15rem' : '1.85rem',
										minWidth: 0,
										px: isMobileSize ? 0.5 : 1,
										whiteSpace: 'nowrap',
										lineHeight: 1.2,
										'& .MuiButton-endIcon': { ml: 0.4, mr: 0 },
									}}
									endIcon={<Download sx={{ fontSize: isMobileSize ? '0.9rem !important' : '1rem !important' }} />}>
									İndir
								</Button>
							) : (
								<Button
									variant='text'
									fullWidth
									disabled={isInCart}
									onClick={(e) => {
										e.stopPropagation();
										handleAddToCart();
									}}
									sx={{
										background: isInCart ? 'grey.300' : '#FF6B3D',
										color: 'white',
										'&:hover': !isInCart ? { background: '#ff7d55', boxShadow: '0 4px 15px rgba(255, 107, 61, 0.4)' } : {},
										fontFamily: 'Varela Round',
										fontSize: isMobileSize ? '0.68rem' : '0.82rem',
										textTransform: 'none',
										height: isMobileSize ? '2.15rem' : '1.85rem',
										minWidth: 0,
										px: isMobileSize ? 0.5 : 1,
										whiteSpace: 'nowrap',
										lineHeight: 1.2,
										'& .MuiButton-endIcon': { ml: 0.4, mr: 0 },
									}}
									endIcon={
										isInCart ? (
											<Check sx={{ fontSize: isMobileSize ? '0.9rem !important' : '1rem !important' }} />
										) : (
											<AddShoppingCart sx={{ fontSize: isMobileSize ? '0.9rem !important' : '1rem !important' }} />
										)
									}>
									{isInCart ? 'Eklendi' : 'Sepete Ekle'}
								</Button>
							)}
						</Box>
						<Box
							sx={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								padding: '0.5rem 1.25rem',
								borderTop: '1px solid rgba(0, 82, 163, 0.1)',
								backgroundColor: 'rgba(0, 82, 163, 0.04)',
								borderRadius: '0 0 calc(0.75rem - 4px) calc(0.75rem - 4px)',
							}}>
							<Typography
								sx={{
									fontSize: isMobileSize ? '0.72rem' : '0.8rem',
									fontWeight: 600,
									color: topAccent,
									fontFamily: 'Varela Round',
								}}>
								{document.pageCount} sayfa
							</Typography>
							<Box
								sx={{
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'flex-end',
									gap: 0.25,
									pl: isFree ? 0 : 1,
									borderLeft: isFree ? 'none' : '2px solid',
									borderLeftColor: isFree ? 'transparent' : 'rgba(0, 82, 163, 0.35)',
								}}>
								{!isFree && (
									<Typography
										component='span'
										sx={{
											fontFamily: 'Varela Round',
											fontSize: '0.5625rem',
											fontWeight: 700,
											letterSpacing: '0.14em',
											textTransform: 'uppercase',
											color: 'text.secondary',
											lineHeight: 1,
										}}>
										Ücret
									</Typography>
								)}
								<Typography
									component='span'
									sx={{
										fontFamily: 'Varela Round',
										fontWeight: 700,
										fontSize: isMobileSize ? '0.8125rem' : '0.9375rem',
										fontVariantNumeric: 'tabular-nums',
										letterSpacing: isFree ? 'normal' : '-0.02em',
										lineHeight: 1.2,
										color: isFree ? '#047857' : '#0f172a',
									}}>
									{isFree ? 'Ücretsiz' : `${setCurrencySymbol(price?.currency)}${price?.amount}`}
								</Typography>
							</Box>
						</Box>
					</Box>
				</Card>
			</Box>

			{/* Sample Page Dialog */}
			<Dialog
				open={openSample}
				onClose={() => {
					setSampleIndex(0);
					handleCloseSample();
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
						objectFit: 'contain',
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
							handleCloseSample();
						}}
						sx={{
							'position': 'absolute',
							'right': 8,
							'top': 8,
							'zIndex': 1,
							'color': theme.palette.grey[500],
							'backgroundColor': 'rgba(255, 255, 255, 0.8)',
							'&:hover': {
								backgroundColor: 'rgba(255, 255, 255, 0.9)',
							},
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
							{/* Current image */}
							<img
								src={currentSampleUrl}
								alt={`Sample Page ${sampleIndex + 1}`}
								style={{
									maxWidth: '100%',
									maxHeight: '70vh',
									objectFit: 'contain',
								}}
							/>
							{/* Slider: prev/next arrows when multiple pages */}
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
											'&.Mui-disabled': { backgroundColor: 'rgba(255,255,255,0.5)' },
										}}
										size="small"
									>
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
											'&.Mui-disabled': { backgroundColor: 'rgba(255,255,255,0.5)' },
										}}
										size="small"
									>
										<ChevronRight />
									</IconButton>
									{/* Counter / dots */}
									<Box sx={{ display: 'flex', gap: 0.5, py: 1, alignItems: 'center', justifyContent: 'center' }}>
										<Typography variant="caption" color="text.secondary">
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
								backgroundColor: theme.palette.grey[100],
							}}>
							<Typography color='text.secondary'>Örnek sayfa mevcut değil</Typography>
						</Box>
					)}
				</DialogContent>
			</Dialog>

			{/* Ücretsiz kaynak: e-posta ile gönder */}
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
					<CustomCancelButton onClick={closeFreeDownloadDialog} disabled={downloadSubmitting} sx={{ fontFamily: "'Varela Round', sans-serif", textTransform: 'none' }}>
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

export default DocumentCard;
