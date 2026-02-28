import { Box, Button, Card, CardContent, CardMedia, Typography, useTheme, Dialog, DialogContent, IconButton } from '@mui/material';
import { Document } from '../../interfaces/document';
import { motion } from 'framer-motion';
import CloseIcon from '@mui/icons-material/Close';
import { useState } from 'react';
import { Download, AddShoppingCart, ChevronLeft, ChevronRight, Check } from '@mui/icons-material';
import { decodeHtmlEntities } from '../../utils/utilText';
import { useDocumentCart } from '../../contexts/DocumentCartContextProvider';

interface DocumentCardProps {
	document: Pick<Document, '_id' | 'name' | 'prices' | 'imageUrl' | 'description' | 'samplePageImageUrls' | 'documentUrl' | 'orgId' | 'pageCount'>;
	userCurrency: string;
	fromHomePage?: boolean;
	onAddedToCart?: () => void;
}

const DocumentCard = ({ document, userCurrency, fromHomePage, onAddedToCart }: DocumentCardProps) => {
	const theme = useTheme();
	const { items: documentCartItems, addItem: addToDocumentCart } = useDocumentCart();
	const isInCart = documentCartItems.some((item) => item.documentId === document._id);
	const [openSample, setOpenSample] = useState(false);
	const [sampleIndex, setSampleIndex] = useState(0);
	const sampleUrls = document.samplePageImageUrls ?? [];
	const hasSamplePages = sampleUrls.length > 0;
	const currentSampleUrl = sampleUrls[sampleIndex];
	const price = document.prices?.find((p) => p.currency === userCurrency);
	const isFree = !price || price.amount === '0' || price.amount === 'Free';

	const handleAddToCart = () => {
		if (isFree || !price || !document.orgId) return;
		addToDocumentCart({
			documentId: document._id,
			orgId: document.orgId,
			title: document.name || 'Kaynak',
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

	return (
		<>
			<motion.div transition={{ duration: 0.3 }} style={{ width: '100%', maxWidth: '17.5rem' }}>
				<Card
					sx={{
						height: { xs: '22rem', sm: '22rem', md: '24rem', lg: '24rem' },
						display: 'flex',
						flexDirection: 'column',
						borderRadius: '0.75rem',
						border: '1px solid rgba(0, 82, 163, 0.15)',
						boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
						overflow: 'hidden',
						backgroundColor: theme.palette.background.paper,
						position: 'relative',
						width: { xs: '15.5rem', sm: '15.5rem', md: '17.5rem', lg: '17.5rem' },
						maxWidth: '17.5rem',
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
					{/* Cover Image */}
					<Box
						sx={{
							height: { xs: '12rem', sm: '12rem', md: '15rem', lg: '15rem' },
							position: 'relative',
							backgroundColor: theme.palette.grey[100],
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}>
						{document.imageUrl ? (
							<CardMedia
								component='img'
								image={document.imageUrl}
								alt={decodeHtmlEntities(document.name || '')}
								sx={{
									height: { xs: '8rem', sm: '8rem', md: '9rem', lg: '9rem' },
									objectFit: 'cover',
								}}
							/>
						) : (
							<Box
								sx={{
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									gap: 1,
									color: theme.palette.grey[500],
									height: { xs: '7rem', sm: '7rem', md: '8rem', lg: '8rem' },
									padding: '1.5rem',
								}}>
								<svg width='3rem' height='5rem' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
									<path
										d='M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z'
										stroke='currentColor'
										strokeWidth='2'
										strokeLinecap='round'
										strokeLinejoin='round'
									/>
									<path
										d='M8.5 10C9.32843 10 10 9.32843 10 8.5C10 7.67157 9.32843 7 8.5 7C7.67157 7 7 7.67157 7 8.5C7 9.32843 7.67157 10 8.5 10Z'
										stroke='currentColor'
										strokeWidth='2'
										strokeLinecap='round'
										strokeLinejoin='round'
									/>
									<path d='M21 15L16 10L5 21' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
								</svg>
								<Typography variant='body2'>No Cover Image</Typography>
							</Box>
						)}
					</Box>

					{/* Price Tag */}
					{!isFree && (
						<Box
							sx={{
								position: 'absolute',
								top: '0.75rem',
								right: '0.75rem',
								backgroundColor: 'rgba(0, 82, 163, 0.9)',
								color: 'white',
								px: 1,
								py: 0.375,
								borderRadius: '999px',
								fontWeight: 600,
								boxShadow: '0 2px 8px rgba(0, 82, 163, 0.3)',
								fontFamily: "'Varela Round', sans-serif",
								fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.85rem', lg: '0.85rem' },
							}}>
							{price?.amount} {userCurrency.toUpperCase()}
						</Box>
					)}

					<CardContent sx={{ flexGrow: 1, padding: { xs: '0.75rem', sm: '0.75rem', md: '1.25rem', lg: '1.25rem' } }}>
						<Typography
							variant='h6'
							component='h3'
							sx={{
								fontFamily: "'Varela Round', sans-serif",
								fontWeight: 'bold',
								marginBottom: { xs: '0.5rem', sm: '0.5rem', md: '0.75rem', lg: '0.75rem' },
								color: fromHomePage ? '#0052a3' : theme.palette.text.primary,
								fontSize: {
									xs: document?.name?.length > 35 ? '0.7rem' : '0.8rem',
									sm: document?.name?.length > 35 ? '0.725rem' : '0.8rem',
									md: document?.name?.length > 35 ? '0.775rem' : '0.9rem',
									lg: document?.name?.length > 35 ? '0.775rem' : '0.9rem',
								},
							}}>
							{decodeHtmlEntities(document.name || '')}
						</Typography>

						<Box
							sx={{
								'height': 'auto',
								'minHeight': '2.5rem',
								'maxHeight': '4rem',
								'overflow': 'auto',
								'marginBottom': '20px',
								'&::-webkit-scrollbar': {
									width: '4px',
								},
								'&::-webkit-scrollbar-track': {
									background: theme.palette.grey[100],
									borderRadius: '4px',
								},
								'&::-webkit-scrollbar-thumb': {
									'background': theme.palette.grey[400],
									'borderRadius': '4px',
									'&:hover': {
										background: theme.palette.grey[500],
									},
								},
							}}>
							<Typography
								variant='body2'
								sx={{
									color: theme.palette.text.secondary,
									lineHeight: 1.4,
									fontFamily: "'Varela Round', sans-serif",
									paddingRight: '0.1rem',
									whiteSpace: 'pre-wrap',
									wordBreak: 'break-word',
									fontSize: {
										xs: document?.description?.length > 60 ? '0.65rem' : '0.75rem',
										sm: document?.description?.length > 60 ? '0.7rem' : '0.8rem',
										md: document?.description?.length > 60 ? '0.7rem' : '0.85rem',
										lg: document?.description?.length > 60 ? '0.7rem' : '0.85rem',
									},
									overflow: 'hidden',
								}}>
								{document.description || 'No description available'}
							</Typography>
						</Box>

						<Typography
							variant='body2'
							sx={{
								color: theme.palette.text.secondary,
								fontFamily: "'Varela Round', sans-serif",
								fontSize: { xs: '0.8rem', sm: '0.8rem', md: '0.85rem', lg: '0.85rem' },
								mb: 1,
							}}>
							{document.pageCount} sayfa
						</Typography>

						<Box sx={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', flexWrap: 'wrap' }}>
							<Button
								variant='outlined'
								fullWidth
								onClick={handleOpenSample}
								sx={{
									'borderColor': '#0052a3',
									'color': '#0052a3',
									'&:hover': {
										borderColor: '#004c99',
										backgroundColor: 'rgba(0, 82, 163, 0.06)',
									},
									'fontFamily': "'Varela Round', sans-serif",
									'fontSize': { xs: '0.75rem', sm: '0.8rem', md: '0.85rem', lg: '0.85rem' },
									'textTransform': 'none',
									'height': '1.85rem',
								}}>
								{sampleUrls.length > 1 ? 'Örnek Sayfalar' : 'Örnek Sayfa'}
							</Button>
							{isFree ? (
								<Button
									variant='text'
									fullWidth
									onClick={() => window.open(document.documentUrl, '_blank')}
									sx={{
										'background': 'linear-gradient(135deg, rgba(0, 82, 163, 0.9) 0%, rgba(0, 102, 204, 0.9) 100%)',
										'color': 'white',
										'&:hover': {
											background: 'linear-gradient(135deg, rgba(0, 82, 163, 1) 0%, rgba(0, 102, 204, 1) 100%)',
											boxShadow: '0 4px 15px rgba(0, 82, 163, 0.35)',
										},
										'fontFamily': "'Varela Round', sans-serif",
										'fontSize': { xs: '0.75rem', sm: '0.8rem', md: '0.85rem', lg: '0.85rem' },
										'textTransform': 'none',
										'height': '1.85rem',
									}}
									endIcon={<Download />}>
									İndir
								</Button>
							) : (
								<Button
									variant='text'
									fullWidth
									disabled={isInCart}
									onClick={handleAddToCart}
									sx={{
										'background': isInCart ? 'grey.300' : '#FF6B3D',
										'color': 'white',
										'&:hover': !isInCart ? { background: '#ff7d55', boxShadow: '0 4px 15px rgba(255, 107, 61, 0.4)' } : {},
										'fontFamily': "'Varela Round', sans-serif",
										'fontSize': { xs: '0.75rem', sm: '0.8rem', md: '0.85rem', lg: '0.85rem' },
										'textTransform': 'none',
										'height': '1.85rem',
									}}
									endIcon={isInCart ? <Check /> : <AddShoppingCart />}>
									{isInCart ? 'Eklendi' : 'Sepete Ekle'}
								</Button>
							)}
						</Box>
					</CardContent>
				</Card>
			</motion.div>

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
		</>
	);
};

export default DocumentCard;
