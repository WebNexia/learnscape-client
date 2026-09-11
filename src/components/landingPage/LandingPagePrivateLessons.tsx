import { Box, Button, Container } from '@mui/material';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PersonOutlined, SchoolOutlined } from '@mui/icons-material';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import { responsiveStyles } from '../../styles/responsiveStyles';
import LandingPageSectionHeader from './LandingPageSectionHeader';

export const PRIVATE_LESSONS_FORM_PATH = '/form/6aa42822e86726242584534c';
export const PRIVATE_LESSONS_SECTION_ID = 'ozel-ders';

const SECTION_BG =
	'linear-gradient(180deg, #eef4fa 0%, #f4f8fc 45%, #eaf2f9 100%), radial-gradient(ellipse 75% 50% at 50% 0%, rgba(0, 102, 204, 0.08) 0%, transparent 55%)';

const LandingPagePrivateLessons = () => {
	const navigate = useNavigate();
	const { isSmallScreen, isRotatedMedium, isVerySmallScreen } = useContext(MediaQueryContext);

	return (
		<Box
			id={PRIVATE_LESSONS_SECTION_ID}
			sx={{
				position: 'relative',
				overflow: 'hidden',
				py: '3rem',
				width: '100%',
				boxSizing: 'border-box',
				background: SECTION_BG,
			}}>
			<Box
				aria-hidden
				sx={{
					position: 'absolute',
					inset: 0,
					zIndex: 0,
					pointerEvents: 'none',
					overflow: 'hidden',
				}}>
				{[
					{ Icon: PersonOutlined, top: '18%', left: '12%', rotate: -18, fontSize: 36, opacity: 0.07 },
					{ Icon: SchoolOutlined, top: '72%', left: '88%', rotate: 22, fontSize: 42, opacity: 0.06 },
					{ Icon: PersonOutlined, top: '65%', left: '8%', rotate: 12, fontSize: 28, opacity: 0.05 },
					{ Icon: SchoolOutlined, top: '22%', left: '90%', rotate: -28, fontSize: 32, opacity: 0.055 },
				].map(({ Icon, top, left, rotate, fontSize, opacity }, index) => (
					<Icon
						key={index}
						sx={{
							position: 'absolute',
							top,
							left,
							transform: `translate(-50%, -50%) rotate(${rotate}deg)`,
							fontSize,
							opacity,
							color: '#004c99',
						}}
					/>
				))}
			</Box>

			<Container maxWidth='md' sx={{ position: 'relative', zIndex: 1 }}>
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.7 }}
					viewport={{ once: true }}>
					<LandingPageSectionHeader
						title='Aden Hoca ile Özel Ders'
						subtitle='Bire bir özel derslerle eksiklerinizi hedefli çalışmayla kapatın. Seviyenize ve hedeflerinize uygun bir plan için önce kısa bir görüşme yapıyoruz; size en uygun ders formatını birlikte belirliyoruz.'
					/>

					<Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 2.5, sm: 3.5 } }}>
						<Button
							variant='contained'
							size='large'
							onClick={() => {
								navigate(PRIVATE_LESSONS_FORM_PATH);
								window.scrollTo({ top: 0, behavior: 'smooth' });
							}}
							sx={{
								...responsiveStyles.components.button,
								'background': '#FF6B3D',
								'color': '#FFFFFF',
								'fontFamily': 'Varela Round',
								'fontWeight': 500,
								'boxShadow': '0 4px 15px rgba(255, 107, 61, 0.35)',
								'&:hover': {
									background: '#ff7d55',
									transform: 'translateY(-3px)',
									boxShadow: '0 6px 20px rgba(255, 107, 61, 0.45)',
								},
								'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
								'textTransform': 'none',
								'borderRadius': { xs: '0.75rem', sm: '1rem', md: '1.25rem' },
								'padding': isSmallScreen || isRotatedMedium ? '0.55rem 1.15rem' : '0.65rem 1.85rem',
								'fontSize': isVerySmallScreen ? '0.75rem' : isSmallScreen || isRotatedMedium ? '0.9rem' : '1.05rem',
								'maxWidth': { xs: '100%', sm: '28rem' },
								'lineHeight': 1.4,
							}}>
							Özel ders görüşmesi için formu doldurun
						</Button>
					</Box>
				</motion.div>
			</Container>
		</Box>
	);
};

export default LandingPagePrivateLessons;
