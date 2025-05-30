import { ArrowBackIosNew, ArrowForwardIos } from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';
import DashboardCourseCard from '../userCourses/DashboardCourseCard';
import { forwardRef, useContext, useState } from 'react';
import { CoursesContext } from '../../contexts/CoursesContextProvider';
import { motion } from 'framer-motion';
import { SingleCourse } from '../../interfaces/course';

const LandingPageCourses = forwardRef<HTMLDivElement>((_, ref) => {
	const { sortedCoursesData } = useContext(CoursesContext);

	const coursesPerPage = 3; // Number of visible courses
	const [currentIndex, setCurrentIndex] = useState<number>(0);
	const totalCourses = sortedCoursesData.filter((course: SingleCourse) => course.isActive).length;

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
		<Box ref={ref} sx={{ bgcolor: '#fff', position: 'relative', padding: '3rem 0' }}>
			<Box sx={{ width: '100%', textAlign: 'center', mb: '0.5rem' }}>
				<Typography variant='h2' sx={{ textShadow: '0.2rem 0.2rem rgba(0, 0, 0, 0.1)', fontSize:'2.5rem' }}>
					{/* Courses */}
					Kurslar
				</Typography>
			</Box>

			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
				<IconButton
					onClick={prevCourses}
					disabled={currentIndex === 0}
					sx={{
						'visibility': currentIndex === 0 ? 'hidden' : 'visible',
						'position': 'absolute',
						'left': 30,
						'zIndex': 10,
						'border': 'solid #4D7B8B 0.01rem',
						'&:hover': { backgroundColor: '#4D7B8B' },
						'&:hover svg': { color: '#fff' },
					}}>
					<ArrowBackIosNew sx={{ color: '#4D7B8B', transition: 'color 0.3s ease' }} />
				</IconButton>

				<Box sx={{ overflow: 'hidden', width: '1080px', maxWidth: '100vw', position: 'relative', padding: '1.5rem', margin: '0 auto' }}>
					<motion.div
						style={{
							display: 'flex',
							width: '100%',
						}}
						animate={{ x: `-${currentIndex * 360}px` }}
						transition={{ type: 'tween', duration: 0.5, ease: 'easeInOut' }}>
						{sortedCoursesData
							.filter((course: SingleCourse) => course.isActive)
							.map((course: SingleCourse) => (
								<Box key={course._id} sx={{ flex: '0 0 360px', width: '360px', minWidth: '360px', maxWidth: '360px' }}>
									<DashboardCourseCard course={course} fromHomePage />
								</Box>
							))}
					</motion.div>
				</Box>

				<IconButton
					onClick={nextCourses}
					disabled={currentIndex + coursesPerPage >= totalCourses}
					sx={{
						'visibility': currentIndex + coursesPerPage >= totalCourses ? 'hidden' : 'visible',
						'position': 'absolute',
						'right': 30,
						'zIndex': 10,
						'border': 'solid #4D7B8B 0.01rem',
						'&:hover': { backgroundColor: '#4D7B8B' },
						'&:hover svg': { color: '#fff' },
					}}>
					<ArrowForwardIos sx={{ color: '#4D7B8B', transition: 'color 0.3s ease' }} />
				</IconButton>
			</Box>
		</Box>
	);
});

export default LandingPageCourses;
