import { Box, Button, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { useNavigate } from 'react-router-dom';
import CustomDialog from '../layouts/dialog/CustomDialog';
import { PromoBanner, isPromoBannerActive } from '../../utils/promoBanner';

interface PromoBannerModalProps {
	banner?: Partial<PromoBanner> | null;
	open: boolean;
	onClose: () => void;
	/** Admin preview still renders when the announcement is switched off. */
	preview?: boolean;
}

const font = "'Varela Round', 'Segoe UI', Arial, sans-serif";

const PromoBannerModal = ({ banner, open, onClose, preview = false }: PromoBannerModalProps) => {
	const navigate = useNavigate();
	const title = (banner?.title || '').trim();
	const body = (banner?.body || '').trim();
	const buttonLabel = (banner?.buttonLabel || '').trim();
	const buttonUrl = (banner?.buttonUrl || '').trim();
	const visible = preview ? Boolean(title || body) : isPromoBannerActive(banner);
	const paragraphs = body
		.split(/\n+/)
		.map((line) => line.trim())
		.filter(Boolean);
	const hasCta = Boolean(buttonLabel && buttonUrl);

	if (!open || !visible) return null;

	const goToLink = () => {
		onClose();
		if (preview || !buttonUrl) return;
		if (buttonUrl.startsWith('/')) {
			navigate(buttonUrl);
			return;
		}
		window.open(buttonUrl, '_blank', 'noopener,noreferrer');
	};

	return (
		<CustomDialog
			openModal={open}
			closeModal={onClose}
			maxWidth='xs'
			dialogPaperSx={preview ? { zIndex: 1600 } : undefined}
			BackdropProps={{
				sx: {
					backgroundColor: 'rgba(2, 18, 32, 0.62)',
					backdropFilter: 'blur(7px)',
				},
			}}
			PaperProps={{
				style: { backgroundColor: '#fff' },
				sx: {
					backgroundColor: '#fff',
					backgroundImage: 'none',
					overflow: 'hidden',
					boxShadow: '0 28px 70px rgba(2, 18, 32, 0.38)',
					borderRadius: '1.6rem',
					margin: { xs: '1rem', sm: '1.5rem' },
					width: { xs: 'calc(100% - 2rem)', sm: '100%' },
					maxWidth: 420,
				},
			}}>
			<Box
				sx={{
					position: 'relative',
					overflow: 'hidden',
					px: { xs: 2.25, sm: 2.75 },
					pt: { xs: 2.25, sm: 2.5 },
					pb: { xs: 2.4, sm: 2.75 },
					color: '#fff',
					background:
						'radial-gradient(70% 90% at 100% 0%, rgba(255, 122, 77, 0.42) 0%, rgba(255, 122, 77, 0) 52%), linear-gradient(165deg, #011826 0%, #01324a 62%, #01486e 100%)',
				}}>
				<Box
					sx={{
						position: 'absolute',
						width: 140,
						height: 140,
						borderRadius: '50%',
						right: -48,
						bottom: -70,
						background: 'rgba(255,255,255,0.08)',
						pointerEvents: 'none',
					}}
				/>
				<Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5, position: 'relative' }}>
					<Box
						sx={{
							width: 42,
							height: 42,
							borderRadius: '0.9rem',
							display: 'grid',
							placeItems: 'center',
							background: 'rgba(255,255,255,0.14)',
							border: '1px solid rgba(255,255,255,0.2)',
							boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)',
						}}>
						<LocalOfferOutlinedIcon sx={{ fontSize: 22 }} />
					</Box>
					<IconButton
						aria-label='Kapat'
						onClick={onClose}
						size='small'
						sx={{
							color: '#fff',
							backgroundColor: 'rgba(255,255,255,0.12)',
							'&:hover': { backgroundColor: 'rgba(255,255,255,0.22)' },
						}}>
						<CloseIcon fontSize='small' />
					</IconButton>
				</Box>
				{title ? (
					<Typography
						component='h2'
						sx={{
							position: 'relative',
							mt: 1.75,
							fontFamily: font,
							fontWeight: 700,
							fontSize: { xs: '1.55rem', sm: '1.75rem' },
							lineHeight: 1.15,
							letterSpacing: '-0.02em',
							color: '#fff',
							textShadow: '0 1px 1px rgba(0, 0, 0, 0.18)',
						}}>
						{title}
					</Typography>
				) : null}
			</Box>

			<Box sx={{ px: { xs: 2.25, sm: 2.75 }, pt: 2.25, pb: 2.5 }}>
				{paragraphs.length > 0 ? (
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
						{paragraphs.map((paragraph, index) => (
							<Typography
								key={`${index}-${paragraph.slice(0, 24)}`}
								sx={{
									fontFamily: font,
									color: index === 0 ? '#0f172a' : '#64748b',
									fontWeight: index === 0 ? 600 : 400,
									fontSize: index === 0 ? { xs: '1.02rem', sm: '1.08rem' } : { xs: '0.92rem', sm: '0.95rem' },
									lineHeight: 1.55,
								}}>
								{paragraph}
							</Typography>
						))}
					</Box>
				) : null}

				<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75, mt: paragraphs.length > 0 ? 2.25 : 0 }}>
					{hasCta ? (
						<Button
							onClick={goToLink}
							variant='contained'
							endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: '1.05rem !important' }} />}
							sx={{
								width: '100%',
								fontFamily: font,
								textTransform: 'none',
								fontWeight: 700,
								fontSize: '0.98rem',
								borderRadius: '999px',
								py: 1.15,
								background: 'linear-gradient(180deg, #ff815c 0%, #ff6434 100%)',
								boxShadow: '0 12px 24px rgba(255, 100, 52, 0.32)',
								'&:hover': {
									background: 'linear-gradient(180deg, #ff906e 0%, #ff7246 100%)',
									boxShadow: '0 14px 28px rgba(255, 100, 52, 0.4)',
								},
							}}>
							{buttonLabel}
						</Button>
					) : null}
					<Button
						onClick={onClose}
						variant={hasCta ? 'text' : 'contained'}
						sx={{
							fontFamily: font,
							textTransform: 'none',
							fontWeight: 600,
							fontSize: '0.88rem',
							borderRadius: '999px',
							color: hasCta ? '#64748b' : '#fff',
							minWidth: hasCta ? 0 : '100%',
							py: hasCta ? 0.4 : 1.15,
							backgroundColor: hasCta ? 'transparent' : '#01486e',
							boxShadow: 'none',
							'&:hover': {
								backgroundColor: hasCta ? 'transparent' : '#015a86',
								color: hasCta ? '#0f172a' : '#fff',
								boxShadow: 'none',
							},
						}}>
						Kapat
					</Button>
				</Box>
			</Box>
		</CustomDialog>
	);
};

export default PromoBannerModal;
