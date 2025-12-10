import { Box, Button, Card, CardContent, CardMedia, Typography, useTheme, Dialog, DialogContent, IconButton, Snackbar, Alert } from '@mui/material';
import { Document } from '../../interfaces/document';
import { motion } from 'framer-motion';
import CloseIcon from '@mui/icons-material/Close';
import { useState } from 'react';
import DocumentPaymentDialogWrapper from './DocumentPaymentDialogWrapper';
import { Download, ShoppingCart } from '@mui/icons-material';
import { decodeHtmlEntities } from '../../utils/utilText';

interface DocumentCardProps {
	document: Pick<Document, '_id' | 'name' | 'prices' | 'imageUrl' | 'description' | 'samplePageImageUrl' | 'documentUrl' | 'orgId' | 'pageCount'>;
	userCurrency: string;
	fromHomePage?: boolean;
}

const DocumentCard = ({ document, userCurrency, fromHomePage }: DocumentCardProps) => {
	const theme = useTheme();
	const [openSample, setOpenSample] = useState(false);
	const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
	const [showSuccess, setShowSuccess] = useState(false);
	const [showEmailWarning, setShowEmailWarning] = useState(false);
	const price = document.prices?.find((p) => p.currency === userCurrency);
	const isFree = !price || price.amount === '0' || price.amount === 'Free';

	const handleOpenSample = () => {
		setOpenSample(true);
	};

	const handleCloseSample = () => {
		setOpenSample(false);
	};

	return (
		<>
			<motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }} style={{ width: '100%', maxWidth: '17.5rem' }}>
				<Card
					sx={{
						height: { xs: '22rem', sm: '22rem', md: '24rem', lg: '24rem' },
						display: 'flex',
						flexDirection: 'column',
						borderRadius: '1rem',
						boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
						overflow: 'hidden',
						backgroundColor: theme.palette.background.paper,
						position: 'relative',
						width: { xs: '15.5rem', sm: '15.5rem', md: '17.5rem', lg: '17.5rem' },
						maxWidth: '17.5rem',
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
									'height': { xs: '8rem', sm: '8rem', md: '9rem', lg: '9rem' },
									'objectFit': 'cover',
									'transition': 'transform 0.3s ease-in-out',
									'&:hover': {
										transform: 'scale(1.05)',
									},
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
								backgroundColor: theme.palette.primary.main,
								color: 'white',
								padding: '0.5rem 1rem',
								borderRadius: '1.25rem',
								fontWeight: 'bold',
								boxShadow: '0 0.25rem 0.5rem rgba(0, 0, 0, 0.2)',
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
								color: theme.palette.text.primary,
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

						<Box sx={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
							<Button
								variant='outlined'
								fullWidth
								onClick={handleOpenSample}
								sx={{
									'borderColor': theme.palette.primary.main,
									'color': theme.palette.primary.main,
									'&:hover': {
										borderColor: theme.palette.primary.dark,
										backgroundColor: 'rgba(25, 118, 210, 0.04)',
									},
									'fontFamily': "'Varela Round', sans-serif",
									'fontSize': { xs: '0.75rem', sm: '0.8rem', md: '0.85rem', lg: '0.85rem' },
									'textTransform': 'none',
									'height': '1.85rem',
								}}>
								Örnek Sayfa
							</Button>
							<Button
								variant='text'
								fullWidth
								onClick={() => {
									if (isFree) {
										window.open(document.documentUrl, '_blank');
									} else {
										setIsPaymentDialogOpen(true);
									}
								}}
								sx={{
									'background': 'linear-gradient(135deg, rgba(79, 70, 229, 0.7) 0%, rgba(91, 33, 182, 0.7) 50%, rgba(124, 58, 237, 0.7) 100%)',
									'color': 'white',
									'&:hover': {
										background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, rgba(124, 58, 237, 0.9) 50%, rgba(147, 51, 234, 0.9) 100%)',
										boxShadow: '0 4px 15px rgba(79, 70, 229, 0.4)',
									},
									'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
									'fontFamily': "'Varela Round', sans-serif",
									'fontSize': { xs: '0.75rem', sm: '0.8rem', md: '0.85rem', lg: '0.85rem' },
									'padding': '0.5rem',
									'textTransform': 'none',
									'px': '0',
									'height': '1.85rem',
								}}
								endIcon={isFree ? <Download /> : <ShoppingCart />}>
								{isFree ? 'İndir' : 'Satın Al'}
							</Button>
						</Box>
					</CardContent>
				</Card>
			</motion.div>

			{/* Sample Page Dialog */}
			<Dialog
				open={openSample}
				onClose={handleCloseSample}
				maxWidth={false}
				PaperProps={{
					sx: {
						borderRadius: '16px',
						backgroundColor: 'transparent',
						width: !document.samplePageImageUrl ? '30rem' : 'fit-content',
						height: !document.samplePageImageUrl ? '60vh' : 'fit-content',
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
						width: !document?.samplePageImageUrl ? '100%' : { xs: '80vw', sm: '50vw', md: '25vw', lg: '30vw' },
					}}>
					<IconButton
						onClick={handleCloseSample}
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
					{document.samplePageImageUrl ? (
						<Box
							sx={{
								width: '100%',
								height: '100%',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								overflow: 'hidden',
							}}>
							<img
								src={document.samplePageImageUrl}
								alt='Sample Page'
								style={{
									maxWidth: '100%',
									maxHeight: '100%',
									objectFit: 'contain',
								}}
							/>
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

			<DocumentPaymentDialogWrapper
				document={document}
				isPaymentDialogOpen={isPaymentDialogOpen}
				setIsPaymentDialogOpen={setIsPaymentDialogOpen}
				userCurrency={userCurrency}
				fromHomePage={fromHomePage}
				showSuccess={showSuccess}
				setShowSuccess={setShowSuccess}
				showEmailWarning={showEmailWarning}
				setShowEmailWarning={setShowEmailWarning}
			/>

			{/* Success Snackbar */}
			<Snackbar
				open={showSuccess}
				autoHideDuration={3500}
				anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
				onClose={() => setShowSuccess(false)}
				sx={{ mt: '6rem' }}>
				<Alert
					severity='success'
					variant='filled'
					sx={{
						width: '100%',
						fontFamily: 'Varela Round',
						fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem', lg: '1rem' },
						backgroundColor: 'rgba(147, 51, 234, 1)',
						color: theme.palette.common.white,
					}}>
					Ödeme başarıyla tamamlandı! Satın aldığınız kaynağa email'inizden ulaşabilirsiniz.
				</Alert>
			</Snackbar>

			{/* Email Warning Snackbar */}
			<Snackbar
				open={showEmailWarning}
				autoHideDuration={5000}
				anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
				onClose={() => setShowEmailWarning(false)}
				sx={{ mt: '6rem' }}>
				<Alert
					severity='warning'
					variant='filled'
					sx={{
						width: '100%',
						fontFamily: 'Varela Round',
						fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem', lg: '1rem' },
						color: '#fff',
						backgroundColor: '#FFA726',
					}}>
					Ödeme başarılı, ancak email gönderilemedi. Lütfen destek için iletişime geçin.
				</Alert>
			</Snackbar>
		</>
	);
};

export default DocumentCard;
