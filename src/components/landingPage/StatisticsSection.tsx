import { Box, Container, Grid, Typography } from '@mui/material';
import { motion } from 'framer-motion';

const colorScheme = {
	primary: '#2C3E50',
	secondary: '#3498DB',
	accent: '#FDF7F0',
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
		<Box sx={{ position: 'relative', backgroundColor: colorScheme.primary }}>
			{/* Soft shadow at the top for modern transition */}
			<Box
				sx={{
					width: '100%',
					height: '24px',
					boxShadow: '0 -8px 24px -8px rgba(44, 62, 80, 0.1)',
					background: 'transparent',
				}}
			/>
			<Box
				sx={{
					py: 8,
					backgroundColor: colorScheme.primary,
					color: '#fff',
					position: 'relative',
					overflow: 'hidden',
				}}>
				{/* Background Pattern */}
				<Box
					sx={{
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						opacity: 0.1,
						background: 'radial-gradient(circle, #fff 1px, transparent 1px)',
						backgroundSize: '30px 30px',
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
									<Box sx={{ textAlign: 'center' }}>
										<Typography
											variant='h2'
											sx={{
												fontWeight: 700,
												mb: 1,
												fontSize: { xs: '1.75rem', sm: '2.75rem' },
												background: 'linear-gradient(45deg, #fff, rgba(255, 255, 255, 0.8))',
												WebkitBackgroundClip: 'text',
												WebkitTextFillColor: 'transparent',
												backgroundClip: 'text',
												textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
											}}>
											{stat.number}
										</Typography>
										<Typography
											variant='h6'
											sx={{
												color: '#fff',
												fontWeight: 500,
												fontFamily: "'Plus Jakarta Sans', sans-serif",
												textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
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
