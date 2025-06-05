import { ArrowBackIosNew, ArrowForwardIos, InfoOutlined } from '@mui/icons-material';
import { Box, IconButton, Typography, Chip, DialogContent, DialogActions } from '@mui/material';
import DashboardCourseCard from '../userCourses/DashboardCourseCard';
import { forwardRef, useContext, useState } from 'react';
import { CoursesContext } from '../../contexts/CoursesContextProvider';
import { motion } from 'framer-motion';
import { SingleCourse } from '../../interfaces/course';
import CustomDialog from '../../components/layouts/dialog/CustomDialog';
import CustomCancelButton from '../../components/forms/customButtons/CustomCancelButton';

const DIALOG_BG = 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.98))';
const DIALOG_BORDERRADIUS = '1.5rem';
const DIALOG_BOXSHADOW = '0 0.5rem 2rem rgba(44, 62, 80, 0.1)';
const DIALOG_BORDER = '0.5rem solid rgba(255, 255, 255, 0.18)';
const DIALOG_FONT = 'Varela Round';

const LandingPageCourses = forwardRef<HTMLDivElement>((_, ref) => {
	const { sortedCoursesData } = useContext(CoursesContext);

	const coursesPerPage = 3; // Number of visible courses
	const [currentIndex, setCurrentIndex] = useState<number>(0);
	const totalCourses = sortedCoursesData.filter((course: SingleCourse) => course.isActive).length;

	const [isInfoDialogOpen, setIsInfoDialogOpen] = useState<boolean>(false);

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
			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', textAlign: 'center', mb: '0.5rem' }}>
				<Typography variant='h2' sx={{ textShadow: '0.2rem 0.2rem rgba(0, 0, 0, 0.1)', fontSize: '2.5rem' }}>
					{/* Courses */}
					Kurslar
				</Typography>
				<IconButton size='small' sx={{ ml: '0.75rem' }} onClick={() => setIsInfoDialogOpen(true)}>
					<InfoOutlined />
				</IconButton>
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

			<CustomDialog
				openModal={isInfoDialogOpen}
				closeModal={() => setIsInfoDialogOpen(false)}
				maxWidth='sm'
				title='Kurslar Hakkında Bilgi'
				titleSx={{
					fontSize: '1.5rem',
					fontWeight: 600,
					fontFamily: DIALOG_FONT,
					color: '#2C3E50',
					ml: '0.5rem',
					textAlign: 'center',
					mb: 1,
				}}
				PaperProps={{
					sx: {
						height: 'auto',
						maxHeight: '90vh',
						overflow: 'visible',
						borderRadius: DIALOG_BORDERRADIUS,
						background: DIALOG_BG,
						boxShadow: DIALOG_BOXSHADOW,
						backdropFilter: 'blur(8px)',
						border: DIALOG_BORDER,
						fontFamily: DIALOG_FONT,
					},
				}}>
				<DialogContent>
					<Box sx={{ p: 2 }}>
						<Typography sx={{ mb: '2rem', mt: '-1rem', fontFamily: 'Varela Round', fontSize: '1rem', color: 'text.secondary' }}>
							LearnScape'de iki tür kurs bulunmaktadır. Her kurs türü farklı bir deneyim sunar:
						</Typography>
						<Box sx={{ display: 'flex', alignItems: 'center', mb: '2rem' }}>
							<Chip
								label='Platform Kursu'
								color='success'
								size='small'
								sx={{ fontFamily: 'Varela Round', fontWeight: 500, mr: 2, minWidth: '7.5rem' }}
							/>
							<Typography sx={{ fontFamily: 'Varela Round', fontSize: '0.9rem', color: 'text.primary' }}>
								Tüm eğitim materyalleri ve yönetim hizmetleri platformumuz aracılığıyla sunulur. Giriş yaptıktan sonra kurslarınıza kolayca
								ulaşabilirsiniz.
							</Typography>
						</Box>
						<Box sx={{ display: 'flex', alignItems: 'center' }}>
							<Chip label='Partner Kursu' color='info' size='small' sx={{ fontFamily: 'Varela Round', fontWeight: 500, mr: 2, minWidth: '7.5rem' }} />
							<Typography sx={{ fontFamily: 'Varela Round', fontSize: '0.9rem', color: 'text.primary' }}>
								Bu kurslar iş birliği yaptığımız eğitmenler tarafından sunulur. Kayıt işlemleri sayfamız üzerinden gerçekleştirilir; ancak derslerin
								sunumu ve içerik yönetimi, eğitmenlerin tercih ettiği platform ve yöntemlerle yapılır.
							</Typography>
						</Box>
					</Box>
				</DialogContent>
				<DialogActions sx={{ mt: '-1rem' }}>
					<CustomCancelButton onClick={() => setIsInfoDialogOpen(false)} sx={{ fontFamily: 'Varela Round', margin: '0 2rem 1rem 0' }}>
						Kapat
					</CustomCancelButton>
				</DialogActions>
			</CustomDialog>
		</Box>
	);
});

export default LandingPageCourses;
