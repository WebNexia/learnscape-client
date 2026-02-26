import { Box, Container, Grid, Typography } from '@mui/material';
import { motion } from 'framer-motion';

const colorScheme = {
	primary: '#2C3E50',
	secondary: '#3498DB',
	accent: '#FFFF',
	text: '#34495E',
};

const StatisticsSection = () => {
	const stats = [
		{ number: '10K+', label: 'Active Students' },
		{ number: '50+', label: 'Courses' },
		{ number: '95%', label: 'Completion Rate' },
		{ number: '24/7', label: 'Support' },
	];

	return (
		<Box
			sx={{
				position: 'relative',
				background: 'linear-gradient(90deg, rgba(0, 204, 255, 0.15) 0%, rgba(0, 102, 204, 0.12) 50%, transparent 100%)',
			}}>
			<Box
				sx={{
					py: 8,
					position: 'relative',
					overflow: 'hidden',
				}}>
				{/* Animated Background Pattern */}
				<Box
					sx={{
						'position': 'absolute',
						'top': 0,
						'left': 0,
						'right': 0,
						'bottom': 0,
						'opacity': 0.15,
						'background': 'radial-gradient(circle, rgba(0, 204, 255, 0.12) 1px, transparent 1px)',
						'backgroundSize': '40px 40px',
						'animation': 'floatPattern 20s linear infinite',
						'@keyframes floatPattern': {
							'0%': { transform: 'translate(0, 0)' },
							'100%': { transform: 'translate(40px, 40px)' },
						},
					}}
				/>

				<Container>
					<Grid container spacing={4} justifyContent='center'>
						{stats?.map((stat, index) => (
							<Grid item xs={6} sm={3} key={index}>
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									whileInView={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.5, delay: index * 0.1 }}
									viewport={{ once: true }}>
									<Box sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
										<Typography
											sx={{
												'fontWeight': 700,
												'mb': 1,
												'fontSize': { xs: '1.75rem', sm: '2.75rem' },
												'background': 'linear-gradient(135deg, #004c99 0%, #0052a3 50%, #0066CC 100%)',
												'WebkitBackgroundClip': 'text',
												'WebkitTextFillColor': 'transparent',
												'backgroundClip': 'text',
												'backgroundSize': '200% 200%',
												'animation': 'gradientShift 5s ease infinite',
												'fontFamily': 'Varela Round',
												'@keyframes gradientShift': {
													'0%': { backgroundPosition: '0% 50%' },
													'50%': { backgroundPosition: '100% 50%' },
													'100%': { backgroundPosition: '0% 50%' },
												},
											}}>
											{stat.number}
										</Typography>
										<Typography
											variant='h6'
											sx={{
												color: '#334155',
												fontWeight: 500,
												fontFamily: 'Varela Round',
												fontSize: { xs: '0.9rem', sm: '1.35rem' },
											}}>
											{stat.label === 'Active Students'
												? 'Aktif Öğrenci'
												: stat.label === 'Courses'
													? 'Kurs'
													: stat.label === 'Completion Rate'
														? 'Tamamlama Oranı'
														: '7/24 Destek'}
										</Typography>
									</Box>
								</motion.div>
							</Grid>
						))}
					</Grid>
				</Container>
			</Box>
		</Box>
	);
};

export default StatisticsSection;
