import { InfoOutlined } from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';
import DashboardCourseCard from '../userCourses/DashboardCourseCard';
import { forwardRef, useContext, useState } from 'react';
import { LandingPageLatestCoursesContext } from '../../contexts/LandingPageLatestCoursesContextProvider';
import { SingleCourse } from '../../interfaces/course';
import LandingPageCoursesInfoDialog from './LandingPageCoursesInfoDialog';
import { responsiveStyles } from '../../styles/responsiveStyles';
import { OrganisationContext } from '../../contexts/OrganisationContextProvider';

const DIALOG_FONT = 'Varela Round';

const LandingPageLatestCourses = forwardRef<HTMLDivElement>((_, ref) => {
	const { latestCourses } = useContext(LandingPageLatestCoursesContext);

	const { orgId } = useContext(OrganisationContext);

	const [isInfoDialogOpen, setIsInfoDialogOpen] = useState<boolean>(false);

	// Filter courses by organization
	const publishedCourses = latestCourses?.filter((course: SingleCourse) => course.orgId === orgId) || [];

	return (
		<Box
			ref={ref}
			sx={{
				position: 'relative',
				backgroundColor: '#F0F4F8',
				padding: '3rem 0',
			}}>
			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', textAlign: 'center', mb: { xs: 2, sm: 3 } }}>
				<Typography
					sx={{
						fontSize: responsiveStyles.typography.h2,
						fontFamily: DIALOG_FONT,
						background: 'linear-gradient(135deg, #004c99 0%, #0052a3 50%, #0066CC 100%)',
						WebkitBackgroundClip: 'text',
						WebkitTextFillColor: 'transparent',
						backgroundClip: 'text',
						letterSpacing: '-0.02em',
						lineHeight: 1.2,
						fontWeight: 700,
					}}>
					Son Eklenen Kurslar
				</Typography>
				<IconButton
					size='small'
					sx={{
						ml: { xs: '0.5rem', sm: '0.75rem' },
						'& svg': { fontSize: { xs: '1.1rem', sm: '1.25rem' } },
						'&:hover': { backgroundColor: 'rgba(91, 141, 239, 0.1)' },
					}}
					onClick={() => setIsInfoDialogOpen(true)}>
					<InfoOutlined />
				</IconButton>
			</Box>

			<Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '1rem', mt: '3rem' }}>
				{publishedCourses && publishedCourses.length > 0 ? (
					publishedCourses?.map((course: SingleCourse) => {
						return (
							<Box
								key={course._id}
								sx={{
									transition: 'transform 0.2s ease-out',
									'&:hover': {
										transform: 'translate3d(0, -4px, 0)',
									},
								}}>
								<DashboardCourseCard course={course} fromHomePage={true} />
							</Box>
						);
					})
				) : (
					<Typography
						sx={{
							textAlign: 'center',
							fontSize: '1.25rem',
							color: '#334155',
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

export default LandingPageLatestCourses;
