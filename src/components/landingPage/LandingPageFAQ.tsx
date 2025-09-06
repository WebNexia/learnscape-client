import { Accordion, AccordionSummary, AccordionDetails, Typography, Box, useTheme, Slide } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import { useState } from 'react';

const faqData = [
	{
		question: 'LearnScape nedir?',
		answer:
			'LearnScape, kendi hızınızda öğrenmenize ve gelişmenize yardımcı olacak kurslar, etkinlikler ve kaynaklar sunan interaktif bir online platformdur.',
	},
	{
		question: 'Bir kursa nasıl kayıt olabilirim?',
		answer: "Kurs kataloğumuzu inceleyin, bir kurs seçin ve 'Kayıt Ol' butonuna tıklayın. Kayıt olduktan hemen sonra öğrenmeye başlayabilirsiniz.",
	},
	{
		question: 'İçeriğe mobil cihazlardan erişebilir miyim?',
		answer: 'Evet! LearnScape tamamen duyarlıdır ve akıllı telefon, tablet ve masaüstü cihazlarda sorunsuz çalışır.',
	},
	{
		question: 'Ücretsiz deneme var mı?',
		answer: 'Kesinlikle! Ücretsiz kurslarımızdan bazılarına erişmek ve platformumuzu keşfetmek için kaydolabilirsiniz.',
	},
	{
		question: 'Destek ekibine nasıl ulaşabilirim?',
		answer: 'Web sitemizdeki iletişim formunu kullanarak veya support@learnscape.com adresine e-posta göndererek destek ekibimize ulaşabilirsiniz.',
	},
];

const splitFaqData = (data: typeof faqData) => {
	const mid = Math.ceil(data.length / 2);
	return [data?.slice(0, mid) || [], data?.slice(mid) || []];
};

const LandingPageFAQ = () => {
	const [expanded, setExpanded] = useState<number | false>(false);

	const handleChange = (panel: number) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
		setExpanded(isExpanded ? panel : false);
	};

	const [leftColumn, rightColumn] = splitFaqData(faqData);

	return (
		<Box
			sx={{
				maxWidth: 1200,
				mx: { xs: 3, sm: 4, md: '10%', lg: '15%' },
				my: { xs: 4, md: 8 },
				px: { xs: 3, sm: 4, md: 2 },
				py: { xs: 3, sm: 6 },
				borderRadius: 6,
				position: 'relative',
				overflow: 'hidden',
				fontFamily: 'Varela Round, Arial, sans-serif',
				background: 'linear-gradient(120deg, #b6e0fe 0%, #031f3b 100%)',
				boxShadow: 8,
			}}>
			{/* Decorative SVG Wave */}
			<Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', zIndex: 0 }}>
				<svg viewBox='0 0 800 80' fill='none' xmlns='http://www.w3.org/2000/svg' style={{ width: '100%', height: 80 }}>
					<path d='M0 80 Q400 0 800 80 V0 H0 V80Z' fill='#fff' fillOpacity='0.3' />
				</svg>
			</Box>
			<Box sx={{ display: 'flex', alignItems: 'center', mb: 4, zIndex: 1, position: 'relative' }}>
				<EmojiObjectsIcon sx={{ fontSize: 40, color: '#ff7043', mr: 1 }} />
				<Typography
					variant='h3'
					fontWeight={700}
					color='#2d3a4a'
					sx={{ fontFamily: 'Varela Round', fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' } }}>
					Sıkça Sorulan Sorular
				</Typography>
			</Box>
			<Box
				sx={{
					display: 'grid',
					gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
					gap: 3,
					alignItems: 'stretch',
				}}>
				{[leftColumn, rightColumn]?.map((column, colIdx) => (
					<Box key={colIdx} sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
						{column?.map((faq, idx) => {
							// Calculate the global index for expanded state
							const globalIdx = colIdx === 0 ? idx : leftColumn.length + idx;
							return (
								<Slide in direction='up' timeout={500 + globalIdx * 150} key={globalIdx}>
									<Box sx={{ height: '100%' }}>
										<Accordion
											expanded={expanded === globalIdx}
											onChange={handleChange(globalIdx)}
											sx={{
												'borderRadius': 3,
												'boxShadow': expanded === globalIdx ? 6 : 2,
												'transition': 'box-shadow 0.3s, transform 0.3s',
												'background': '#fff',
												'display': 'flex',
												'flexDirection': 'column',
												'height': '100%',
												'&:hover': {
													boxShadow: 8,
													transform: 'translateY(-2px) scale(1.01)',
												},
												'borderLeft': `6px solid ${expanded === globalIdx ? '#ff7043' : '#b6e0fe'}`,
												...(globalIdx === faqData.length - 1 && {
													'borderBottomLeftRadius': 24,
													'borderBottomRightRadius': 24,
													'& .MuiAccordionDetails-root': {
														borderBottomLeftRadius: 24,
														borderBottomRightRadius: 24,
													},
												}),
											}}>
											<AccordionSummary
												expandIcon={<ExpandMoreIcon sx={{ color: '#ff7043' }} />}
												aria-controls={`faq-content-${globalIdx}`}
												id={`faq-header-${globalIdx}`}
												sx={{
													borderRadius: 3,
													fontWeight: 600,
													minHeight: 56,
													background: expanded === globalIdx ? 'rgba(255,112,67,0.07)' : 'rgba(0,0,0,0.01)',
													transition: 'background 0.3s',
													fontFamily: 'Varela Round',
													color: '#2d3a4a',
													fontSize: { xs: '0.95rem', sm: '1.05rem', md: '1.1rem' },
												}}>
												<Typography
													variant='subtitle1'
													fontWeight={600}
													sx={{ fontFamily: 'Varela Round', fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' } }}>
													{faq.question}
												</Typography>
											</AccordionSummary>
											<AccordionDetails
												sx={{
													background: 'rgba(182,224,254,0.13)',
													borderRadius: 2,
													fontFamily: 'Varela Round',
													fontSize: { xs: '0.9rem', sm: '1rem', md: '1.05rem' },
												}}>
												<Typography
													variant='body1'
													color='#4f5b6b'
													sx={{ fontFamily: 'Varela Round', fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' } }}>
													{faq.answer}
												</Typography>
											</AccordionDetails>
										</Accordion>
									</Box>
								</Slide>
							);
						})}
					</Box>
				))}
			</Box>
		</Box>
	);
};

export default LandingPageFAQ;
