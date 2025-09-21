import { Box, Typography, Button } from '@mui/material';
import LandingPageLayout from '../components/landingPage/LandingPageLayout';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import { useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AllPublicCoursesContext } from '../contexts/AllPublicCoursesContextProvider';
import { SingleCourse } from '../interfaces/course';
import DashboardCourseCard from '../components/userCourses/DashboardCourseCard';
import ChatWhatsApp from '../components/landingPage/ChatWhatsApp';
import ScrollToTopButton from '../components/landingPage/ScrollToTopButton';
import SearchFilter from '../components/landingPage/SearchFilter';

const LandingPageCourses = () => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const location = useLocation();

	const {
		courses,
		loading,
		error,
		total,
		hasMore,
		loadMore,
		searchValue,
		setSearchValue,
		activeFilter,
		setActiveFilter,
		searchedValue,
		onSearch,
		onReset,
		onRemoveSearch,
		isSearching,
	} = useContext(AllPublicCoursesContext);

	// Cleanup search state function
	const cleanupSearchState = () => {
		onReset(); // This will clear search state in the context
	};

	// Cleanup on component unmount
	useEffect(() => {
		return () => {
			cleanupSearchState();
		};
	}, []);

	// Cleanup when navigating away from page
	useEffect(() => {
		return () => {
			cleanupSearchState();
		};
	}, [location.pathname]);

	// Filter options for courses
	const courseFilterOptions = [
		{ value: 'partner', label: 'Partner' },
		{ value: 'platform', label: 'Platform' },
		{ value: 'free', label: 'Ücretsiz' },
		{ value: 'paid', label: 'Ücretli' },
	];

	return (
		<LandingPageLayout>
			<Box
				sx={{
					position: 'sticky',
					top: 0,
					zIndex: 1000,
					paddingTop: isMobileSize ? '10vh' : '13vh',
					width: '100%',
					backgroundColor: '#FDF7F0',
					backgroundImage: `
						linear-gradient(135deg, rgba(44, 62, 80, 0.05), rgba(52, 152, 219, 0.05)),
						radial-gradient(circle, rgba(44,62,80,0.08) 1px, transparent 1px)
					`,
					backgroundSize: 'auto, 30px 30px',
					backgroundRepeat: 'repeat, repeat',
				}}>
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						width: '100%',
					}}>
					{/* Search and Filter Component */}
					<Box sx={{ width: '85%', mt: '0.5rem' }}>
						<SearchFilter
							searchValue={searchValue}
							onSearchChange={setSearchValue}
							onSearch={onSearch}
							onReset={onReset}
							activeFilter={activeFilter}
							onFilterChange={setActiveFilter}
							filterOptions={courseFilterOptions}
							loading={isSearching}
							placeholder='Kurs ismi, açıklama veya eğitmen isminde arayın...'
							searchLabel='Kurs Ara'
							searchedValue={searchedValue}
							onRemoveSearch={onRemoveSearch}
							totalCount={total}
							isCoursesPage={true}
							hasActiveSearchOrFilter={!!(searchedValue || activeFilter)}
						/>
					</Box>
				</Box>
			</Box>

			{/* Scrollable Content Section */}
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					width: '100%',
				}}>
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
					) : courses && courses.length > 0 ? (
						<Box
							sx={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								width: '100%',
								flexWrap: 'wrap',
								gap: '1rem',
								mb: '2rem',
								mt: '-2rem',
							}}>
							{courses?.map((course: SingleCourse) => (
								<Box key={course._id}>
									<DashboardCourseCard course={course} fromHomePage />
								</Box>
							))}

							{/* Load More Button */}
							{hasMore && (
								<Box sx={{ width: '100%', textAlign: 'center', mt: '2rem', mb: '2rem' }}>
									<Button
										onClick={loadMore}
										disabled={loading}
										variant='contained'
										sx={{
											'color': 'white',
											'fontFamily': 'Varela Round',
											'fontSize': '1rem',
											'fontWeight': 500,
											'padding': '0.5rem 1rem',
											'textTransform': 'capitalize',
											'borderRadius': '0.5rem',
											'&:disabled': {
												backgroundColor: '#ccc',
											},
										}}>
										{loading ? 'Yükleniyor...' : 'Daha Fazla Yükle'}
									</Button>
								</Box>
							)}
						</Box>
					) : (
						<Typography
							sx={{
								textAlign: 'center',
								fontSize: { xs: '1rem', sm: '1.25rem' },
								color: 'text.secondary',
								fontFamily: 'Varela Round',
								mt: '3rem',
								marginBottom: '3rem',
							}}>
							{searchedValue || activeFilter ? 'Arama kriterlerinize uygun kurs bulunamadı.' : 'Henüz yayınlanmış kurs bulunmamaktadır.'}
						</Typography>
					)}
				</Box>
			</Box>

			<ChatWhatsApp />
			<ScrollToTopButton />
		</LandingPageLayout>
	);
};

export default LandingPageCourses;
