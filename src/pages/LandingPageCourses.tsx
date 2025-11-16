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
import { SEO, StructuredData } from '../components/seo';
import LondonBg from '../assets/london-bg.jpg';

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

	const baseUrl = import.meta.env.VITE_SITE_URL || 'https://learnscape-qa.netlify.app';

	return (
		<>
			<SEO
				title='Browse All Courses - LearnScape'
				description='Explore our comprehensive collection of online courses. Find courses in programming, business, design, and more. Start learning today with expert instructors.'
				keywords='online courses, course catalog, programming courses, business courses, design courses, LearnScape courses, educational content, skill development'
				type='website'
			/>
			<StructuredData type='Organization' />
			<StructuredData type='WebSite' />
			<StructuredData
				type='BreadcrumbList'
				data={{
					breadcrumbs: [
						{ name: 'Home', url: baseUrl },
						{ name: 'All Courses', url: `${baseUrl}/landing-page-courses` },
					],
				}}
			/>
			<StructuredData
				type='WebPage'
				data={{
					url: `${baseUrl}/landing-page-courses`,
					name: 'Browse All Courses - LearnScape',
					description:
						'Explore our comprehensive collection of online courses. Find courses in programming, business, design, and more. Start learning today with expert instructors.',
				}}
			/>
			<Box
				sx={{
					'position': 'relative',
					'overflow': 'hidden',
					'minHeight': '100vh',
					// Fixed background image - London cityscape
					'backgroundImage': `url(${LondonBg})`,
					'backgroundSize': 'cover',
					'backgroundPosition': 'center',
					'backgroundRepeat': 'no-repeat',
					'backgroundAttachment': 'fixed',
					// Overlay for better content readability
					'&::before': {
						content: '""',
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.75) 100%)',
						zIndex: 0,
						pointerEvents: 'none',
					},
					// Subtle gradient accent overlay
					'&::after': {
						content: '""',
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background:
							'radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.08) 0%, transparent 50%)',
						zIndex: 0,
						pointerEvents: 'none',
					},
					'& h1, h2, h3, h4, h5, h6': {
						fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
						fontWeight: 500,
					},
					'& button': {
						fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
						fontWeight: 400,
					},
					'& .gradient-text': {
						'background': 'linear-gradient(135deg, #4f46e5 0%, #5b21b6 50%, #7c3aed 100%)',
						'WebkitBackgroundClip': 'text',
						'WebkitTextFillColor': 'transparent',
						'backgroundClip': 'text',
						'backgroundSize': '200% 200%',
						'animation': 'gradientShift 6s ease infinite',
						'@keyframes gradientShift': {
							'0%': { backgroundPosition: '0% 50%' },
							'50%': { backgroundPosition: '100% 50%' },
							'100%': { backgroundPosition: '0% 50%' },
						},
					},
					'& .accent-color': {
						color: '#1e293b',
					},
					'& .secondary-color': {
						color: '#6366f1',
					},
					'& .tertiary-color': {
						color: '#64748b',
					},
					'& .kaizen-title': {
						fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
						fontWeight: 600,
					},
				}}>
				<Box sx={{ position: 'relative', zIndex: 2 }}>
					<LandingPageLayout>
						<Box
							sx={{
								position: 'sticky',
								top: 0,
								zIndex: 1000,
								paddingTop: isMobileSize ? '10vh' : '13vh',
								width: '100%',
								backgroundColor: 'transparent',
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
				</Box>
			</Box>
		</>
	);
};

export default LandingPageCourses;
