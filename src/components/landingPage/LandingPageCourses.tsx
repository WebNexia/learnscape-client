import { ArrowBackIosNew, ArrowForwardIos } from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';
import DashboardCourseCard from '../userCourses/DashboardCourseCard';
import { forwardRef, useContext, useEffect, useRef, useState } from 'react';
import { CoursesContext } from '../../contexts/CoursesContextProvider';
import { motion } from 'framer-motion';
import { SingleCourse } from '../../interfaces/course';

const LandingPageCourses = forwardRef<HTMLDivElement>((_, ref) => {
	const { sortedPublicCoursesData, fetchPublicCourses } = useContext(CoursesContext);
	const isInitialMount = useRef(true);

	useEffect(() => {
		if (isInitialMount.current) {
			isInitialMount.current = false;
		} else {
			fetchPublicCourses();
		}
	}, []);

	const coursesPerPage = 3; // Number of visible courses
	const [currentIndex, setCurrentIndex] = useState<number>(0);
	const totalCourses = sortedPublicCoursesData.length;

	const nextCourses = () => {
		if (currentIndex + 1 <= totalCourses - coursesPerPage) {
			setCurrentIndex((prev) => prev + 1);
		}
	};

	const prevCourses = () => {
		if (currentIndex > 0) {
			setCurrentIndex((prev) => prev - 1);
		}
	};
	return (
		<Box ref={ref} sx={{ bgcolor: '#fff', position: 'relative' }}>
			<Box sx={{ position: 'relative', width: '100%', backgroundColor: '#FDF7F0', overflow: 'hidden' }}>
				<svg
					xmlns='http://www.w3.org/2000/svg'
					viewBox='0 0 1440 320'
					preserveAspectRatio='none'
					style={{ display: 'block', width: '100%', height: '150px' }} // Increased height for more dramatic waves
				>
					<path fill='#FFFFFF' d='M0,120 C180,420 360,100 540,160 C720,220 900,300 1080,200 C1260,100 1440,160 1440,160 L1440,320 L0,320 Z' />
				</svg>
			</Box>
			<Box sx={{ width: '100%', textAlign: 'center', padding: '3rem 0' }}>
				<Typography variant='h2' sx={{ fontSize: '2rem', textShadow: '0.2rem 0.2rem rgba(0, 0, 0, 0.1)' }}>
					Courses
				</Typography>
			</Box>

			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
				<IconButton
					onClick={prevCourses}
					disabled={currentIndex === 0}
					sx={{
						visibility: currentIndex === 0 ? 'hidden' : 'visible',
						position: 'absolute',
						left: 30,
						zIndex: 10,
						border: 'solid #4D7B8B 0.01rem',
						'&:hover': { backgroundColor: '#4D7B8B' },
						'&:hover svg': { color: '#fff' },
					}}>
					<ArrowBackIosNew sx={{ color: '#4D7B8B', transition: 'color 0.3s ease' }} />
				</IconButton>

				<Box sx={{ overflow: 'hidden', width: '80%', maxWidth: '1200px', position: 'relative' }}>
					<motion.div
						style={{
							display: 'flex',
							width: '100%', // Instead of dynamic width, force it to fit exactly
						}}
						animate={{ x: `-${(currentIndex * 100) / coursesPerPage}%` }} // Moves left by one course
						transition={{ type: 'tween', duration: 0.5, ease: 'easeInOut' }}>
						{sortedPublicCoursesData.map((course: SingleCourse) => (
							<Box key={course._id} sx={{ flex: '1 0 calc(100% / 3)' }}>
								<DashboardCourseCard course={course} fromHomePage />
							</Box>
						))}
					</motion.div>
				</Box>

				<IconButton
					onClick={nextCourses}
					disabled={currentIndex + coursesPerPage >= totalCourses}
					sx={{
						visibility: currentIndex + coursesPerPage >= totalCourses ? 'hidden' : 'visible',
						position: 'absolute',
						right: 30,
						zIndex: 10,
						border: 'solid #4D7B8B 0.01rem',
						'&:hover': { backgroundColor: '#4D7B8B' },
						'&:hover svg': { color: '#fff' },
					}}>
					<ArrowForwardIos sx={{ color: '#4D7B8B', transition: 'color 0.3s ease' }} />
				</IconButton>
			</Box>

			<svg
				xmlns='http://www.w3.org/2000/svg'
				viewBox='0 0 1440 320'
				preserveAspectRatio='none'
				style={{ display: 'block', width: '100%', height: '150px' }} // Adjust height as needed
			>
				<path
					fill='#FDF7F0' // Next section's background
					d='M0,260 C180,220 360,100 540,160 C720,220 900,300 1080,200 C1260,100 1440,160 1440,160 L1440,320 L0,320 Z'
				/>
			</svg>
		</Box>
	);
});

export default LandingPageCourses;
