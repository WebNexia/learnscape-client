import { Box, IconButton, Typography, Button } from '@mui/material';
import LandingPageLayout from '../components/landingPage/LandingPageLayout';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import { useContext, useState } from 'react';
import { AllPublicCoursesContext } from '../contexts/AllPublicCoursesContextProvider';
import { SingleCourse } from '../interfaces/course';
import DashboardCourseCard from '../components/userCourses/DashboardCourseCard';
import { InfoOutlined } from '@mui/icons-material';
import LandingPageCoursesInfoDialog from '../components/landingPage/LandingPageCoursesInfoDialog';
import ChatWhatsApp from '../components/landingPage/ChatWhatsApp';
import ScrollToTopButton from '../components/landingPage/ScrollToTopButton';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';

const LandingPageCourses = () => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const { orgId } = useContext(OrganisationContext);

	const { courses, loading, error, hasMore, loadMore } = useContext(AllPublicCoursesContext);

	const [isInfoDialogOpen, setIsInfoDialogOpen] = useState<boolean>(false);

	// Filter courses by organization
	const publishedCourses = courses?.filter((course: SingleCourse) => course.orgId === orgId) || [];

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
					{error ? (
						<Typography
							sx={{
								textAlign: 'center',
								fontSize: '1.25rem',
								color: 'error.main',
								fontFamily: 'Varela Round',
								mt: 5,
							}}>
							{error}
						</Typography>
					) : publishedCourses.length > 0 ? (
						<>
							{publishedCourses?.map((course: SingleCourse) => (
								<Box key={course._id} sx={{}}>
									<DashboardCourseCard course={course} fromHomePage />
								</Box>
							))}

							{/* Load More Button */}
							{hasMore && (
								<Box sx={{ width: '100%', textAlign: 'center', mt: '2rem' }}>
									<Button
										onClick={loadMore}
										disabled={loading}
										variant='contained'
										sx={{
											'backgroundColor': '#2C3E50',
											'color': 'white',
											'fontFamily': 'Varela Round',
											'fontSize': '1rem',
											'fontWeight': 500,
											'padding': '0.75rem 2rem',
											'&:hover': {
												backgroundColor: '#34495E',
											},
											'&:disabled': {
												backgroundColor: '#ccc',
											},
										}}>
										{loading ? 'Yükleniyor...' : 'Daha Fazla Yükle'}
									</Button>
								</Box>
							)}
						</>
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
			<ScrollToTopButton />
		</LandingPageLayout>
	);
};

export default LandingPageCourses;
