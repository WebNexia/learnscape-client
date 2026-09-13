import { Box, Collapse, IconButton, Typography } from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { useContext, useState } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import heroImg from '../../assets/HeroSecImage.png';
import writingImg from '../../assets/man-writing-notebook-with-giant-pen.png';
import cardImg from '../../assets/credit-card.png';
import logoImg from '../../assets/logo.png';
import progressImg from '../../assets/ProgressIcon.png';
import londonImg from '../../assets/london-bg.jpg';
import visaImg from '../../assets/visa.png';
import mastercardImg from '../../assets/mastercard.png';

const FONT = 'Varela Round';
const BLUE = '#0052a3';
const ORANGE = '#FF6B3D';

type Step = {
	n: number;
	title: string;
	blurb: string;
	tip: string;
	image: string;
	imageAlt: string;
	accent: string;
};

const STEPS: Step[] = [
	{
		n: 1,
		title: 'Kulübünü seç',
		blurb: 'Aşağıdaki kartlardan birine tıkla. Gün, saat ve fiyatı bir bakışta gör.',
		tip: 'Merak etme — henüz ödeme yok!',
		image: heroImg,
		imageAlt: 'Aden Academy öğrenenler',
		accent: BLUE,
	},
	{
		n: 2,
		title: 'Oturum hakkını al',
		blurb: 'Oturum Satın Al’a bas. Adını, e-postanı yaz; kaç oturum istediğini seç.',
		tip: 'Hesap açmana gerek yok.',
		image: writingImg,
		imageAlt: 'Not defteri illüstrasyonu',
		accent: ORANGE,
	},
	{
		n: 3,
		title: 'Güvenli öde',
		blurb: 'Sözleşmeyi onayla, Ödemeye Git. Kartını Stripe’ın sayfasında gir.',
		tip: 'Aden kart bilgisi saklamaz.',
		image: cardImg,
		imageAlt: 'Kart ödeme',
		accent: BLUE,
	},
	{
		n: 4,
		title: 'Bilet kodun gelsin',
		blurb: 'Ödeme bitince bilet kodun e-postana düşer. O kod senin giriş anahtarın.',
		tip: 'Gelen kutusunu (ve spam’i) kontrol et.',
		image: logoImg,
		imageAlt: 'Aden Academy logo',
		accent: ORANGE,
	},
	{
		n: 5,
		title: 'Oturuma yazıl',
		blurb: 'Bilet ile Katıl sayfasında kod + e-posta ile bak. Yaklaşan bir oturuma kaydol.',
		tip: 'Hakların yalnızca bu kulüpte geçer.',
		image: progressImg,
		imageAlt: 'İlerleme',
		accent: BLUE,
	},
	{
		n: 6,
		title: 'Zoom’a katıl',
		blurb: 'Kayıt sonrası özel Zoom linkin gelir. Program saatinde linke tıkla — tamam!',
		tip: 'Biraz erken gir, sesini test et.',
		image: londonImg,
		imageAlt: 'Aden Academy atmosfer',
		accent: ORANGE,
	},
];

/**
 * QA preview only: playful first-time club join guide using site assets.
 */
const ClubJoinHowItWorks = () => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const [open, setOpen] = useState(true);

	return (
		<Box
			sx={{
				mb: 5,
				borderRadius: '1rem',
				border: '2px dashed rgba(0, 82, 163, 0.28)',
				background: 'linear-gradient(165deg, rgba(255,255,255,0.95) 0%, rgba(232,238,244,0.9) 55%, rgba(255,107,61,0.08) 100%)',
				overflow: 'hidden',
			}}>
			<Box
				onClick={() => setOpen((prev) => !prev)}
				role='button'
				tabIndex={0}
				onKeyDown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						setOpen((prev) => !prev);
					}
				}}
				aria-expanded={open}
				sx={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					gap: 1.5,
					px: { xs: 2, sm: 2.5 },
					py: 1.75,
					cursor: 'pointer',
					userSelect: 'none',
					'&:hover': { backgroundColor: 'rgba(0, 82, 163, 0.04)' },
				}}>
				<Box sx={{ minWidth: 0, flex: 1 }}>
					<Typography
						sx={{
							fontFamily: FONT,
							fontWeight: 700,
							fontSize: isMobileSize ? '1.05rem' : '1.25rem',
							color: '#0A1A2F',
							mb: 0.35,
						}}>
						Kulübe ilk kez mi geliyorsun?
					</Typography>
					<Typography
						sx={{
							fontFamily: FONT,
							fontSize: isMobileSize ? '0.78rem' : '0.88rem',
							color: '#475569',
							lineHeight: 1.45,
						}}>
						{open
							? '6 kısa adım — Biletini al, oturuma katıl, Zoom’a gir. Hesap açmana gerek yok.'
							: 'Adımları görmek için tıkla · hesap gerekmez'}
					</Typography>
				</Box>
				<IconButton
					size='small'
					aria-label={open ? 'Rehberi kapat' : 'Rehberi aç'}
					sx={{
						flexShrink: 0,
						transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
						transition: 'transform 0.25s ease',
						color: BLUE,
						backgroundColor: 'rgba(255,255,255,0.9)',
						border: '1px solid rgba(0, 82, 163, 0.15)',
						'&:hover': { backgroundColor: '#fff' },
					}}>
					<ExpandMore />
				</IconButton>
			</Box>

			<Collapse in={open} timeout='auto' unmountOnExit>
				<Box sx={{ px: { xs: 2, sm: 2.5 }, pb: { xs: 2, sm: 2.5 }, pt: 0.5 }}>
					<Box
						sx={{
							mb: 2,
							display: 'flex',
							justifyContent: 'center',
						}}>
						<Box
							sx={{
								display: 'inline-flex',
								alignItems: 'center',
								gap: 1,
								px: 1.5,
								py: 0.5,
								borderRadius: 999,
								backgroundColor: 'rgba(255, 255, 255, 0.85)',
								border: '1px solid rgba(0, 82, 163, 0.12)',
							}}>
							<Box component='img' src={visaImg} alt='Visa' sx={{ height: 14, width: 'auto' }} />
							<Box component='img' src={mastercardImg} alt='Mastercard' sx={{ height: 18, width: 'auto' }} />
							<Typography sx={{ fontFamily: FONT, fontSize: '0.7rem', color: '#64748b' }}>
								Ödeme Stripe ile güvenli
							</Typography>
						</Box>
					</Box>

					<Box
						sx={{
							display: 'grid',
							gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
							gap: 2,
						}}>
						{STEPS.map((step) => (
							<Box
								key={step.n}
								sx={{
									display: 'flex',
									gap: 1.5,
									alignItems: 'flex-start',
									p: 1.5,
									borderRadius: '0.85rem',
									backgroundColor: '#fff',
									border: '1px solid rgba(0, 82, 163, 0.1)',
									boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
									transition: 'transform 0.2s ease-out',
									'&:hover': { transform: 'translateY(-2px)' },
								}}>
								<Box
									sx={{
										position: 'relative',
										flexShrink: 0,
										width: isMobileSize ? 64 : 76,
										height: isMobileSize ? 64 : 76,
										borderRadius: '0.75rem',
										overflow: 'hidden',
										border: `2px solid ${step.accent}33`,
										backgroundColor: '#f8fafc',
									}}>
									<Box
										component='img'
										src={step.image}
										alt={step.imageAlt}
										sx={{
											width: '100%',
											height: '100%',
											objectFit: step.n === 3 || step.n === 5 ? 'contain' : 'cover',
											objectPosition: 'center',
											p: step.n === 3 || step.n === 4 || step.n === 5 ? 0.75 : 0,
											boxSizing: 'border-box',
										}}
									/>
									<Box
										sx={{
											position: 'absolute',
											top: 4,
											left: 4,
											width: 22,
											height: 22,
											borderRadius: '50%',
											backgroundColor: step.accent,
											color: '#fff',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											fontFamily: FONT,
											fontSize: '0.7rem',
											fontWeight: 700,
											boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
										}}>
										{step.n}
									</Box>
								</Box>
								<Box sx={{ minWidth: 0, pt: 0.25 }}>
									<Typography
										sx={{
											fontFamily: FONT,
											fontWeight: 700,
											fontSize: isMobileSize ? '0.88rem' : '0.95rem',
											color: '#0A1A2F',
											mb: 0.35,
										}}>
										{step.title}
									</Typography>
									<Typography
										sx={{
											fontFamily: FONT,
											fontSize: isMobileSize ? '0.75rem' : '0.8rem',
											color: '#475569',
											lineHeight: 1.45,
											mb: 0.5,
										}}>
										{step.blurb}
									</Typography>
									<Typography
										sx={{
											fontFamily: FONT,
											fontSize: '0.7rem',
											fontWeight: 600,
											color: step.accent,
											lineHeight: 1.35,
										}}>
										{step.tip}
									</Typography>
								</Box>
							</Box>
						))}
					</Box>

					<Typography
						sx={{
							mt: 2.5,
							textAlign: 'center',
							fontFamily: FONT,
							fontSize: '0.78rem',
							color: '#64748b',
						}}>
						Hazırsan aşağıdan bir kulüp seç — gerisini adımlar söyleyecek.
					</Typography>
				</Box>
			</Collapse>
		</Box>
	);
};

export default ClubJoinHowItWorks;
