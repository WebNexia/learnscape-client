import { Box, Container, Typography } from '@mui/material';
import FormatQuoteRoundedIcon from '@mui/icons-material/FormatQuoteRounded';
import LandingPageSectionHeader from './LandingPageSectionHeader';
import { responsiveStyles } from '../../styles/responsiveStyles';

type Testimonial = {
	quote: string;
	author: string;
	role: string;
};

const HOME_TESTIMONIALS: Testimonial[] = [
	{
		quote: 'Canlı dersler ve etütler sayesinde konuşma pratiğim düzenli hale geldi. Ne çalışacağım baştan belli.',
		author: 'Elif K.',
		role: 'Genel İngilizce',
	},
	{
		quote: 'Program net, öğretmenler ilgili. Kendi tempomda ilerlerken takıldığım yerde destek buldum.',
		author: 'Mehmet A.',
		role: 'Sınav hazırlık',
	},
	{
		quote: 'Ders ve etüt aynı yerde olduğu için çalışmam dağınık kalmıyor. İlerlememi de görebiliyorum.',
		author: 'Zeynep Y.',
		role: 'Online öğrenci',
	},
];

const COURSE_TESTIMONIALS: Testimonial[] = [
	{
		quote: 'Dersler sırayla açılıyor, nerede kaldığım kaybolmuyor. Her oturumun bir hedefi var.',
		author: 'Ayşe D.',
		role: 'Kurs öğrencisi',
	},
	{
		quote: 'Canlı derste soru sorabildiğim için konu havada kalmıyor. Etüt de tekrar için yetiyor.',
		author: 'Emre S.',
		role: 'Kurs öğrencisi',
	},
	{
		quote: 'Kısa ve düzenli ilerlemek, uzun bir programa dağılmaktan daha verimli geldi.',
		author: 'Selin T.',
		role: 'Kurs öğrencisi',
	},
];

const accent = ['#004c99', '#0f766e', '#0066CC'];

const TestimonialsSection = ({ variant = 'home' }: { variant?: 'home' | 'course' }) => {
	const isCourse = variant === 'course';
	const testimonials = isCourse ? COURSE_TESTIMONIALS : HOME_TESTIMONIALS;

	return (
		<Box
			component='section'
			aria-label={isCourse ? 'Kurs yorumları' : 'Öğrenci yorumları'}
			sx={{
				py: isCourse ? { xs: '2.5rem', md: '3.5rem' } : responsiveStyles.spacing.section,
				px: responsiveStyles.spacing.container,
				background: isCourse
					? 'transparent'
					: 'linear-gradient(180deg, rgba(232, 238, 244, 0.96) 0%, rgba(255, 255, 255, 0.92) 100%)',
			}}>
			<Container maxWidth='lg' disableGutters>
				<LandingPageSectionHeader
					title={isCourse ? 'Öğrenciler bu kursu nasıl anlatıyor?' : 'Öğrencilerimiz ne diyor?'}
					subtitle={
						isCourse
							? undefined
							: 'Canlı ders, etüt ve dijital çalışmayı birlikte kullanan öğrencilerin deneyimi.'
					}
					sx={{ mb: { xs: '1.5rem', md: '2.25rem' } }}
				/>
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
						gap: { xs: '1rem', md: '1.25rem' },
					}}>
					{testimonials.map((testimonial, index) => (
						<Box
							key={testimonial.author}
							sx={{
								'position': 'relative',
								'display': 'flex',
								'flexDirection': 'column',
								'justifyContent': 'space-between',
								'minHeight': { md: '16.5rem' },
								'p': { xs: '1.25rem 1.15rem 1.1rem', md: '1.5rem 1.35rem 1.25rem' },
								'borderRadius': '1rem',
								'backgroundColor': '#ffffff',
								'border': '1px solid rgba(0, 76, 153, 0.08)',
								'boxShadow': '0 10px 30px rgba(15, 23, 42, 0.06)',
								'overflow': 'hidden',
								'transition': 'transform 0.2s ease, box-shadow 0.2s ease',
								'&::before': {
									content: '""',
									position: 'absolute',
									top: 0,
									left: 0,
									right: 0,
									height: '3px',
									background: `linear-gradient(90deg, ${accent[index]} 0%, ${accent[index]}55 100%)`,
								},
								'&:hover': {
									transform: 'translateY(-4px)',
									boxShadow: '0 16px 36px rgba(0, 76, 153, 0.12)',
								},
							}}>
							<Box>
								<FormatQuoteRoundedIcon sx={{ fontSize: '1.75rem', color: accent[index], opacity: 0.85 }} />
								<Typography
									sx={{
										mt: '0.35rem',
										color: '#1e293b',
										fontFamily: 'Varela Round',
										fontSize: { xs: '0.92rem', md: '1rem' },
										lineHeight: 1.65,
										fontWeight: 500,
									}}>
									{testimonial.quote}
								</Typography>
							</Box>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem', mt: '1.25rem' }}>
								<Box
									aria-hidden
									sx={{
										width: '2.5rem',
										height: '2.5rem',
										borderRadius: '50%',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										flexShrink: 0,
										color: '#fff',
										fontFamily: 'Varela Round',
										fontWeight: 700,
										fontSize: '0.85rem',
										background: `linear-gradient(145deg, ${accent[index]} 0%, ${accent[index]}cc 100%)`,
									}}>
									{testimonial.author.charAt(0)}
								</Box>
								<Box>
									<Typography sx={{ fontFamily: 'Varela Round', fontWeight: 700, color: '#0f172a', fontSize: '0.9rem', lineHeight: 1.2 }}>
										{testimonial.author}
									</Typography>
									<Typography sx={{ fontFamily: 'Varela Round', color: '#64748b', fontSize: '0.78rem', mt: '0.15rem' }}>
										{testimonial.role}
									</Typography>
								</Box>
							</Box>
						</Box>
					))}
				</Box>
			</Container>
		</Box>
	);
};

export default TestimonialsSection;
