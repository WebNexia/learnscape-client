import { Box, Button, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CustomDialog from '../dialog/CustomDialog';
import { SingleCourse } from '../../../interfaces/course';
import { getIntroVideoEmbedSrc, resolveCourseIntroModal } from '../../../utils/courseIntroModal';
import { sanitizeLandingPageHtml } from '../../../utils/sanitizeHtml';
import { interpolateLandingPagePricePlaceholders } from '../../../utils/interpolateLandingPagePrices';
import { useGeoLocation } from '../../../hooks/useGeoLocation';
import theme from '../../../themes';

interface CourseIntroModalDialogProps {
	course: SingleCourse;
	open: boolean;
	onClose: () => void;
	fromHomePage?: boolean;
	isTrUi?: boolean;
}

const CourseIntroModalDialog = ({ course, open, onClose, fromHomePage, isTrUi }: CourseIntroModalDialogProps) => {
	const geoLocation = useGeoLocation();
	const resolved = resolveCourseIntroModal(course);
	const introEmbedSrc = resolved.showVideo ? getIntroVideoEmbedSrc(resolved.videoUrl) : null;
	const videoOnly = resolved.showVideo && !resolved.showContent;
	const interpolatedBody = resolved.showContent
		? interpolateLandingPagePricePlaceholders(resolved.body, course, geoLocation?.countryCode)
		: '';
	const safeBody = interpolatedBody ? sanitizeLandingPageHtml(interpolatedBody) : '';
	const heading = resolved.title || (isTrUi ? 'Kurs Bilgisi' : 'Course Info');
	const font = fromHomePage ? "'Varela Round', 'Segoe UI', Arial, sans-serif" : theme.fontFamily?.main;

	if (!resolved.shouldOpen) return null;

	if (videoOnly) {
		return (
			<CustomDialog
				openModal={open}
				closeModal={onClose}
				maxWidth='md'
				PaperProps={{
					style: { backgroundColor: 'transparent' },
					sx: {
						backgroundColor: 'transparent',
						backgroundImage: 'none',
						overflow: 'hidden',
						boxShadow: 'none',
						borderRadius: { xs: '0.5rem', sm: '0.75rem' },
						margin: { xs: '0.75rem', sm: '1.5rem' },
						width: { xs: 'calc(100% - 1.5rem)', sm: '100%' },
						maxWidth: { xs: 'calc(100% - 1.5rem)', md: '900px' },
					},
				}}>
				<Box sx={{ p: 0 }}>
					{introEmbedSrc ? (
						<Box
							sx={{
								position: 'relative',
								width: 'min(100%, calc((100dvh - 2rem) * 16 / 9))',
								aspectRatio: '16 / 9',
								mx: 'auto',
								overflow: 'hidden',
								bgcolor: '#000',
								borderRadius: { xs: '0.5rem', sm: '0.75rem' },
							}}>
							<Box
								component='iframe'
								src={open ? introEmbedSrc : undefined}
								title={isTrUi ? 'Kurs tanıtım videosu' : 'Course intro video'}
								allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
								allowFullScreen
								sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, backgroundColor: '#000' }}
							/>
						</Box>
					) : (
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
							<Typography variant='body2' sx={{ fontFamily: font, color: '#fff' }}>
								{isTrUi
									? 'Video bu sayfada gömülü izlenemiyor; yeni sekmede açabilirsiniz.'
									: 'This video cannot be embedded here; you can open it in a new tab.'}
							</Typography>
							<Button
								component='a'
								href={resolved.videoUrl}
								target='_blank'
								rel='noopener noreferrer'
								variant='contained'
								sx={{ fontFamily: font, textTransform: 'none', alignSelf: 'flex-start', borderRadius: '0.75rem' }}>
								{isTrUi ? 'Videoyu aç' : 'Open video'}
							</Button>
						</Box>
					)}
				</Box>
			</CustomDialog>
		);
	}

	return (
		<CustomDialog
			openModal={open}
			closeModal={onClose}
			maxWidth={resolved.showVideo ? 'md' : 'xs'}
			PaperProps={{
				style: { backgroundColor: '#fff' },
				sx: {
					backgroundColor: '#fff',
					backgroundImage: 'none',
					overflow: 'hidden',
					boxShadow: '0 20px 50px rgba(15, 23, 42, 0.2)',
					borderRadius: '1.25rem',
					margin: { xs: '1rem', sm: '1.5rem' },
					width: { xs: 'calc(100% - 2rem)', sm: '100%' },
					maxWidth: resolved.showVideo ? 720 : 440,
					maxHeight: { xs: 'calc(100dvh - 2rem)', sm: 'calc(100dvh - 3rem)' },
					display: 'flex',
					flexDirection: 'column',
				},
			}}>
			<Box
				sx={{
					display: 'flex',
					alignItems: 'flex-start',
					justifyContent: 'space-between',
					gap: 1.5,
					px: { xs: 2, sm: 2.5 },
					pt: { xs: 2, sm: 2.25 },
					pb: 1.5,
					borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
				}}>
				<Typography
					component='h2'
					sx={{
						fontFamily: font,
						fontWeight: 700,
						fontSize: { xs: '1.05rem', sm: '1.2rem' },
						lineHeight: 1.35,
						color: '#01435A',
						pt: '0.15rem',
					}}>
					{heading}
				</Typography>
				<IconButton
					aria-label={isTrUi ? 'Kapat' : 'Close'}
					onClick={onClose}
					size='small'
					sx={{
						mt: '-0.15rem',
						color: '#64748b',
						flexShrink: 0,
						'&:hover': { backgroundColor: 'rgba(15, 23, 42, 0.06)', color: '#0f172a' },
					}}>
					<CloseIcon fontSize='small' />
				</IconButton>
			</Box>

			<Box sx={{ overflow: 'auto', flex: '1 1 auto' }}>
				{resolved.showVideo &&
					(introEmbedSrc ? (
						<Box sx={{ px: { xs: 2, sm: 2.5 }, pt: 2 }}>
							<Box
								sx={{
									position: 'relative',
									width: '100%',
									aspectRatio: '16 / 9',
									overflow: 'hidden',
									bgcolor: '#000',
									borderRadius: '0.75rem',
								}}>
								<Box
									component='iframe'
									src={open ? introEmbedSrc : undefined}
									title={isTrUi ? 'Kurs tanıtım videosu' : 'Course intro video'}
									allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
									allowFullScreen
									sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, backgroundColor: '#000' }}
								/>
							</Box>
						</Box>
					) : (
						<Box sx={{ px: { xs: 2, sm: 2.5 }, pt: 2, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
							<Typography variant='body2' sx={{ fontFamily: font, color: theme.textColor?.primary.main }}>
								{isTrUi
									? 'Video bu sayfada gömülü izlenemiyor; yeni sekmede açabilirsiniz.'
									: 'This video cannot be embedded here; you can open it in a new tab.'}
							</Typography>
							<Button
								component='a'
								href={resolved.videoUrl}
								target='_blank'
								rel='noopener noreferrer'
								variant='contained'
								sx={{ fontFamily: font, textTransform: 'none', alignSelf: 'flex-start', borderRadius: '0.75rem' }}>
								{isTrUi ? 'Videoyu aç' : 'Open video'}
							</Button>
						</Box>
					))}

				{safeBody ? (
					<Box
						className='lp-intro-modal-prose'
						sx={{
							px: { xs: 2, sm: 2.5 },
							pt: resolved.showVideo ? 2 : 2,
							pb: 0.5,
							fontFamily: font,
							color: '#0f172a',
							fontSize: { xs: '0.88rem', sm: '0.95rem' },
							lineHeight: 1.7,
							'& p': { margin: '0 0 0.8em' },
							'& p:last-child': { marginBottom: 0 },
							'& strong, & b, & span[style*="font-weight"]': {
								fontFamily: "'Nunito', sans-serif",
								fontWeight: 700,
								color: '#0f172a',
							},
							'& em, & i:not(.icon)': {
								fontFamily: "'Nunito', sans-serif",
								fontStyle: 'italic',
							},
							'& u': { textDecoration: 'underline' },
							'& s, & strike': { textDecoration: 'line-through' },
							'& ul, & ol': { pl: '1.2rem', my: 1 },
							'& li': { mb: 0.45 },
							'& img': {
								display: 'block',
								maxWidth: '100%',
								height: 'auto',
								borderRadius: '0.65rem',
								margin: '0.75rem 0',
							},
							'& a': { color: '#0052a3' },
							'& h1, & h2, & h3, & h4': {
								fontFamily: 'inherit',
								color: '#01435A',
								mt: 1.1,
								mb: 0.6,
							},
						}}
						dangerouslySetInnerHTML={{ __html: safeBody }}
					/>
				) : null}
			</Box>

			<Box
				sx={{
					display: 'flex',
					justifyContent: 'flex-end',
					px: { xs: 2, sm: 2.5 },
					pt: 1.75,
					pb: { xs: 2, sm: 2.25 },
				}}>
				<Button
					onClick={onClose}
					variant='contained'
					sx={{
						fontFamily: font,
						textTransform: 'none',
						fontWeight: 600,
						fontSize: { xs: '0.85rem', sm: '0.9rem' },
						borderRadius: '0.75rem',
						px: 2.25,
						py: 0.85,
						backgroundColor: '#FF6F4E',
						boxShadow: 'none',
						'&:hover': { backgroundColor: '#ff7d55', boxShadow: 'none' },
					}}>
					{isTrUi ? 'Tamam' : 'OK'}
				</Button>
			</Box>
		</CustomDialog>
	);
};

export default CourseIntroModalDialog;
