import { Box, IconButton, Typography } from '@mui/material';
import LandingPageLayout from '../components/landingPage/LandingPageLayout';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import { useContext, useState } from 'react';
import { CoursesContext } from '../contexts/CoursesContextProvider';
import { SingleCourse } from '../interfaces/course';
import DashboardCourseCard from '../components/userCourses/DashboardCourseCard';
import { InfoOutlined } from '@mui/icons-material';
import LandingPageCoursesInfoDialog from '../components/landingPage/LandingPageCoursesInfoDialog';
import ChatWhatsApp from '../components/landingPage/ChatWhatsApp';
import ScrollToTopButton from '../components/landingPage/ScrollToTopButton';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import ReportBugButton from '../components/landingPage/ReportBugButton';

const LandingPageCourses = () => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const { orgId } = useContext(OrganisationContext);

	const { sortedPublicCoursesData } = useContext(CoursesContext);

	const [isInfoDialogOpen, setIsInfoDialogOpen] = useState<boolean>(false);

	const publishedCourses = sortedPublicCoursesData
		.filter((course: SingleCourse) => course.isActive && course.publishedAt && course.orgId === orgId)
		.sort((a, b) => new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime());

	return (
		<LandingPageLayout>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					paddingTop: isMobileSize ? '10vh' : '13vh',
					width: '100%',
				}}>
				<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: '1rem' }}>
					<Typography
						variant='h2'
						sx={{
							fontSize: isMobileSize ? '1.35rem' : '2rem',
							fontWeight: 600,
							fontFamily: 'Varela Round',
							color: '#2C3E50',
						}}>
						Tüm Kurslar
					</Typography>
					<IconButton
						size='small'
						sx={{ 'ml': { xs: '0.5rem', sm: '0.75rem' }, '& svg': { fontSize: { xs: '1.1rem', sm: '1.25rem' } } }}
						onClick={() => setIsInfoDialogOpen(true)}>
						<InfoOutlined />
					</IconButton>
				</Box>
				<Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '1rem', mt: '3rem', width: '85%' }}>
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
								fontFamily: 'Varela Round',
								mt: 5,
							}}>
							Henüz yayınlanmış kurs bulunmamaktadır.
						</Typography>
					)}
				</Box>
			</Box>
			<LandingPageCoursesInfoDialog isInfoDialogOpen={isInfoDialogOpen} setIsInfoDialogOpen={setIsInfoDialogOpen} />
			<ChatWhatsApp />
			<ReportBugButton />
			<ScrollToTopButton />
		</LandingPageLayout>
	);
};

export default LandingPageCourses;
