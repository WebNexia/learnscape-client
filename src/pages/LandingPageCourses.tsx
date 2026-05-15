import { Box, Typography, Button, CircularProgress } from '@mui/material';
import LandingPageLayout from '../components/landingPage/LandingPageLayout';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import { useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AllPublicCoursesContext } from '../contexts/AllPublicCoursesContextProvider';
import { SingleCourse } from '../interfaces/course';
import DashboardCourseCard from '../components/userCourses/DashboardCourseCard';
import ChatWhatsApp from '../components/landingPage/ChatWhatsApp';
import ScrollToTopButton from '../components/landingPage/ScrollToTopButton';
import SearchFilter from '../components/landingPage/SearchFilter';
import { SEO, StructuredData } from '../components/seo';

const LandingPageCourses = () => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const location = useLocation();
	const [isScrolled, setIsScrolled] = useState(false);

	useEffect(() => {
		const handleScroll = () => setIsScrolled(window.scrollY > 10);
		handleScroll();
		window.addEventListener('scroll', handleScroll, { passive: true });
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

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

	const baseUrl = import.meta.env.VITE_SITE_URL || 'https://adenacademy.co.uk';

	return (
		<>
			<SEO
				title='Browse All Courses - Aden Academy'
				description='Explore our comprehensive collection of online courses. Find courses in programming, business, design, and more. Start learning today with expert instructors.'
				keywords='online courses, course catalog, programming courses, business courses, design courses, Aden Academy courses, educational content, skill development'
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
					name: 'Browse All Courses - Aden Academy',
					description:
						'Explore our comprehensive collection of online courses. Find courses in programming, business, design, and more. Start learning today with expert instructors.',
				}}
			/>
			<Box
				sx={{
					'position': 'relative',
					'minHeight': '100vh',
					// Aden solid gradient (no image - cleaner UX)
					'background':
						'linear-gradient(180deg, #ffffff 0%, #f8fafc 40%, rgba(0, 82, 163, 0.05) 100%)',
					'&::before': {
						content: '""',
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background:
							'radial-gradient(circle at 20% 30%, rgba(0, 82, 163, 0.06) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(0, 102, 204, 0.04) 0%, transparent 50%)',
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
						'background': 'linear-gradient(135deg, #004c99 0%, #0052a3 50%, #0066CC 100%)',
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
						color: '#0052a3',
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
						{/* Spacer for fixed header */}
						<Box sx={{ height: isMobileSize ? '10vh' : '13vh', flexShrink: 0 }} />
						<Box
							sx={{
								position: 'sticky',
								top: isMobileSize ? '10vh' : '13vh',
								zIndex: 1000,
								paddingTop: isScrolled ? 0 : isMobileSize ? '1rem' : '1.25rem',
								paddingBottom: isScrolled ? 0 : '0.25rem',
								width: '100%',
								backgroundColor: 'transparent',
								transition: 'padding 0.25s ease',
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
								{/* <Box sx={{ width: '85%', mt: '0rem' }}>
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
										isScrolled={isScrolled}
									/>
								</Box> */}
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
								) : (loading || isSearching) && courses.length === 0 ? (
									<Box
										sx={{
											display: 'flex',
											flexDirection: 'column',
											alignItems: 'center',
											justifyContent: 'center',
											gap: 2,
											minHeight: '40vh',
											width: '100%',
											mb: '3rem',
										}}>
										<CircularProgress sx={{ color: '#0052a3' }} aria-busy aria-label='Yükleniyor' />
										<Typography sx={{ fontFamily: 'Varela Round', color: '#64748b', fontSize: '1rem' }}>Yükleniyor</Typography>
									</Box>
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
												<DashboardCourseCard course={course} fromHomePage={true} />
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
														'fontWeight': 600,
														'padding': '0.5rem 1.5rem',
														'textTransform': 'capitalize',
														'borderRadius': '0.75rem',
														'background': '#FF6B3D',
														'boxShadow': '0 4px 15px rgba(255, 107, 61, 0.35)',
														'transition': 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
														'&:hover': {
															background: '#ff7d55',
															transform: 'translateY(-2px)',
															boxShadow: '0 6px 20px rgba(255, 107, 61, 0.45)',
														},
														'&:disabled': {
															backgroundColor: 'rgba(0, 0, 0, 0.12)',
															color: 'rgba(0, 0, 0, 0.26)',
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
