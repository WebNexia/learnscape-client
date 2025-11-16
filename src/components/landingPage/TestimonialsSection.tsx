import { Box, Container, Typography, Avatar, Button } from '@mui/material';
import { useRef, useState } from 'react';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import { responsiveStyles } from '../../styles/responsiveStyles';

const colorScheme = {
	primary: '#2C3E50',
	secondary: '#3498DB',
	accent: '#FF6B6B',
	cardGradient: 'linear-gradient(90deg, #4ECDC4 0%, #3498DB 100%)',
	cardShadow: '4px 4px 6px 4px rgba(0, 0, 0, 0.20)',
};

const avatarColors = ['#4ECDC4', '#FF6B6B', '#3498DB'];

const TestimonialsSection = () => {
	const scrollRef = useRef<HTMLDivElement>(null);
	const [activeIndex, setActiveIndex] = useState(0);

	const handleScroll = () => {
		if (!scrollRef.current) return;
		const scrollLeft = scrollRef.current.scrollLeft;
		const containerWidth = scrollRef.current.clientWidth;
		const index = Math.round(scrollLeft / containerWidth);
		setActiveIndex(index);
	};
	const testimonials = [
		{
			quote: 'Bu platform öğrenme deneyimimi dönüştürdü. Kurslar çok iyi yapılandırılmış ve ilgi çekici.',
			author: 'Sarah Johnson',
			role: 'Software Developer',
			avatar: '/path-to-avatar1.jpg',
		},
		{
			quote: 'Topluluk desteği inanılmaz. Hem eğitmenlerden hem de diğer öğrencilerden çok şey öğrendim.',
			author: 'Michael Chen',
			role: 'Data Scientist',
			avatar: '/path-to-avatar2.jpg',
		},
		{
			quote: 'Kendi hızımda öğrenme esnekliği ve uzman rehberliğine erişim paha biçilemezdi.',
			author: 'Emma Rodriguez',
			role: 'UX Designer',
			avatar: '/path-to-avatar3.jpg',
		},
	];

	const scrollToIndex = (index: number) => {
		if (!scrollRef.current) return;
		const container = scrollRef.current;
		const cardWidth = container.clientWidth;
		container.scrollTo({
			left: cardWidth * index,
			behavior: 'smooth',
		});
	};

	return (
		<Box sx={{ position: 'relative', backgroundColor: 'transparent' }}>
			<Box sx={{ py: responsiveStyles.spacing.section, backgroundColor: 'transparent', position: 'relative' }}>
				<Container maxWidth='md' sx={{ px: responsiveStyles.spacing.container }}>
					<Typography
						align='center'
						sx={{
							'fontSize': responsiveStyles.typography.h2,
							'mb': responsiveStyles.spacing.section,
							'background': 'linear-gradient(135deg, #4f46e5 0%, #5b21b6 25%, #7c3aed 50%, #3b82f6 75%, #2563eb 100%)',
							'WebkitBackgroundClip': 'text',
							'WebkitTextFillColor': 'transparent',
							'backgroundClip': 'text',
							'backgroundSize': '200% 200%',
							'animation': 'gradientShift 5s ease infinite',
							'fontWeight': 700,
							'fontFamily': 'Varela Round',
							'@keyframes gradientShift': {
								'0%': { backgroundPosition: '0% 50%' },
								'50%': { backgroundPosition: '100% 50%' },
								'100%': { backgroundPosition: '0% 50%' },
							},
						}}>
						Öğrencilerimiz Ne Diyor?
					</Typography>

					<Box
						ref={scrollRef}
						onScroll={handleScroll}
						sx={{
							'display': 'flex',
							'overflowX': 'auto',
							'scrollSnapType': 'x mandatory',
							'WebkitOverflowScrolling': 'touch',
							'scrollbarWidth': 'none',
							'&::-webkit-scrollbar': { display: 'none' },
						}}>
						{testimonials?.map((testimonial, index) => (
							<Box
								key={index}
								sx={{
									flex: '0 0 100%',
									scrollSnapAlign: 'center',
									px: { xs: 4, sm: 7, md: 6 },
									py: 1,
									minHeight: { xs: '280px', sm: '320px', md: '340px' },
								}}>
								<Box
									sx={{
										'p': responsiveStyles.components.card.padding,
										'backgroundColor': 'rgba(255, 255, 255, 0.9)',
										'backdropFilter': 'blur(10px)',
										'borderRadius': responsiveStyles.components.card.borderRadius,
										'textAlign': 'center',
										'boxShadow': '0 4px 20px rgba(91, 141, 239, 0.1)',
										'position': 'relative',
										'overflow': 'hidden',
										'border': '2px solid rgba(91, 141, 239, 0.15)',
										'minHeight': '10rem',
										'transition': 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
										'&:hover': {
											transform: 'translateY(-5px)',
											boxShadow: '0 8px 30px rgba(91, 141, 239, 0.2)',
											borderColor: 'rgba(91, 141, 239, 0.3)',
										},
									}}>
									<Box
										sx={{
											content: '""',
											display: 'block',
											position: 'absolute',
											top: 0,
											left: 0,
											width: '100%',
											height: '7px',
											background: colorScheme.cardGradient,
											borderTopLeftRadius: '1rem',
											borderTopRightRadius: '1rem',
											zIndex: 1,
										}}
									/>
									<FormatQuoteIcon
										sx={{
											fontSize: { xs: 36, sm: 42, md: 48 },
											color: colorScheme.accent,
											opacity: 0.18,
											position: 'absolute',
											top: { xs: 12, sm: 14, md: 16 },
											left: { xs: 16, sm: 20, md: 24 },
											zIndex: 0,
										}}
									/>
									<Typography
										variant='body1'
										sx={{
											mb: responsiveStyles.spacing.item,
											fontStyle: 'italic',
											color: '#334155',
											fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1.25rem' },
											fontFamily: 'Varela Round',
											lineHeight: 1.6,
											position: 'relative',
											zIndex: 2,
										}}>
										"{testimonial.quote}"
									</Typography>
									<Box
										sx={{
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											gap: responsiveStyles.spacing.item,
											mt: responsiveStyles.spacing.item,
											position: 'relative',
											zIndex: 2,
										}}>
										<Avatar
											src={testimonial.avatar}
											sx={{
												width: { xs: 42, sm: 48, md: 54 },
												height: { xs: 42, sm: 48, md: 54 },
												border: `2px solid ${colorScheme.secondary}`,
												boxShadow: '0 4px 12px rgba(52, 152, 219, 0.15)',
												background: avatarColors[index % avatarColors.length],
												color: '#fff',
												fontWeight: 700,
												fontSize: { xs: 16, sm: 20, md: 24 },
											}}>
											{testimonial.author[0]}
										</Avatar>
										<Box>
											<Typography
												variant='subtitle1'
												fontWeight={700}
												sx={{
													color: '#5B8DEF',
													fontSize: responsiveStyles.typography.body1,
													fontFamily: 'Varela Round',
												}}>
												{testimonial.author}
											</Typography>
											<Typography
												variant='body2'
												sx={{
													opacity: 0.8,
													color: '#334155',
													fontSize: responsiveStyles.typography.body2,
													fontFamily: 'Varela Round',
												}}>
												{testimonial.role}
											</Typography>
										</Box>
									</Box>
								</Box>
							</Box>
						))}
					</Box>

					{/* Navigation dots */}
					<Box sx={{ display: 'flex', justifyContent: 'center', mt: '-3rem', gap: 1 }}>
						{testimonials?.map((_, index) => (
							<Button
								key={index}
								onClick={() => scrollToIndex(index)}
								sx={{
									'minWidth': 0,
									'width': { xs: 8, sm: 10 },
									'height': { xs: 8, sm: 10 },
									'borderRadius': '50%',
									'backgroundColor': index === activeIndex ? '#5B8DEF' : 'rgba(91, 141, 239, 0.15)',
									'p': 0,
									'&:hover': {
										backgroundColor: index === activeIndex ? '#6B9EFF' : 'rgba(91, 141, 239, 0.25)',
										transform: 'scale(1.1)',
									},
									'transition': 'all 0.3s ease',
								}}
							/>
						))}
					</Box>
				</Container>
			</Box>
		</Box>
	);
};

export default TestimonialsSection;
