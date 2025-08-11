import { InfoOutlined } from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';
import DashboardCourseCard from '../userCourses/DashboardCourseCard';
import { forwardRef, useContext, useState } from 'react';
import { CoursesContext } from '../../contexts/CoursesContextProvider';
import { SingleCourse } from '../../interfaces/course';
import LandingPageCoursesInfoDialog from './LandingPageCoursesInfoDialog';
import { responsiveStyles } from '../../styles/responsiveStyles';
import { OrganisationContext } from '../../contexts/OrganisationContextProvider';

const DIALOG_FONT = 'Varela Round';

const LandingPageCourses = forwardRef<HTMLDivElement>((_, ref) => {
	const { sortedPublicCoursesData } = useContext(CoursesContext);

	const { orgId } = useContext(OrganisationContext);

	const [isInfoDialogOpen, setIsInfoDialogOpen] = useState<boolean>(false);

	const publishedCourses = sortedPublicCoursesData
		.filter((course: SingleCourse) => course.isActive && course.publishedAt && course.orgId === orgId)
		.sort((a, b) => new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime())
		.slice(0, 3);

	return (
		<Box ref={ref} sx={{ bgcolor: '#f7f9fa', position: 'relative', padding: '3rem 0' }}>
			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', textAlign: 'center', mb: { xs: 2, sm: 3 } }}>
				<Typography
					variant='h2'
					sx={{
						fontSize: responsiveStyles.typography.h2,
						fontFamily: DIALOG_FONT,
						color: '#2C3E50',
						letterSpacing: '-0.02em',
						lineHeight: 1.2,
					}}>
					Son Eklenen Kurslar
				</Typography>
				<IconButton
					size='small'
					sx={{ 'ml': { xs: '0.5rem', sm: '0.75rem' }, '& svg': { fontSize: { xs: '1.1rem', sm: '1.25rem' } } }}
					onClick={() => setIsInfoDialogOpen(true)}>
					<InfoOutlined />
				</IconButton>
			</Box>

			<Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '1rem', mt: '3rem' }}>
				{publishedCourses.length > 0 ? (
					publishedCourses.map((course: SingleCourse) => (
						<Box key={course._id} sx={{}}>
							<DashboardCourseCard course={course} fromHomePage />
						</Box>
					))
				) : (
					<Typography
						sx={{
							textAlign: 'center',
							fontSize: '1.25rem',
							color: 'text.secondary',
							fontFamily: DIALOG_FONT,
							mt: '3rem',
						}}>
						Henüz yayınlanmış kurs bulunmamaktadır.
					</Typography>
				)}
			</Box>

			<LandingPageCoursesInfoDialog isInfoDialogOpen={isInfoDialogOpen} setIsInfoDialogOpen={setIsInfoDialogOpen} />
		</Box>
	);
});

export default LandingPageCourses;
