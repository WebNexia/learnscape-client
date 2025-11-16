import { Box, Typography, Grid, Button } from '@mui/material';
import LandingPageLayout from '../components/landingPage/LandingPageLayout';
import { useContext, useEffect } from 'react';
import { LandingPageResourcesContext } from '../contexts/LandingPageResourcesContextProvider';
import { useLocation } from 'react-router-dom';
import DocumentCard from '../components/landingPage/DocumentCard';
import ChatWhatsApp from '../components/landingPage/ChatWhatsApp';
import ScrollToTopButton from '../components/landingPage/ScrollToTopButton';
import SearchFilter from '../components/landingPage/SearchFilter';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import { SEO, StructuredData } from '../components/seo';
import LondonBg from '../assets/london-bg.jpg';

const LandingPageResources = () => {
	const {
		resources,
		loading,
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
	} = useContext(LandingPageResourcesContext);
	const location = useLocation();

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

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

	// Filter options for resources
	const resourceFilterOptions = [
		{ value: 'free', label: 'Ücretsiz' },
		{ value: 'paid', label: 'Ücretli' },
	];

	const getUserCurrency = () => {
		// Get user's country from URL or default to US
		const country = new URLSearchParams(location.search).get('country') || 'US';

		switch (country.toUpperCase()) {
			case 'GB':
				return 'gbp';
			case 'TR':
				return 'try';
			case 'EU':
				return 'eur';
			default:
				return 'usd';
		}
	};

	const userCurrency = getUserCurrency();

	const baseUrl = import.meta.env.VITE_SITE_URL || 'https://learnscape-qa.netlify.app';

	return (
		<>
			<SEO
				title='Learning Resources - LearnScape'
				description='Access free learning resources, documents, and educational materials. Download PDFs, guides, and study materials to enhance your learning experience.'
				keywords='learning resources, educational documents, study materials, PDF downloads, free resources, educational content, learning guides, LearnScape resources'
				type='website'
			/>
			<StructuredData type='Organization' />
			<StructuredData type='WebSite' />
			<StructuredData
				type='BreadcrumbList'
				data={{
					breadcrumbs: [
						{ name: 'Home', url: baseUrl },
						{ name: 'Resources', url: `${baseUrl}/resources` },
					],
				}}
			/>
			<StructuredData
				type='WebPage'
				data={{
					url: `${baseUrl}/resources`,
					name: 'Learning Resources - LearnScape',
					description:
						'Access free learning resources, documents, and educational materials. Download PDFs, guides, and study materials to enhance your learning experience.',
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
						<Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
							<Box
								sx={{
									display: 'flex',
									justifyContent: 'center',
									alignItems: 'center',
									position: 'sticky',
									top: 0,
									zIndex: 1000,
									paddingTop: isMobileSize ? '10vh' : '13vh',
									width: '100%',
									backgroundColor: 'transparent',
								}}>
								<Box sx={{ width: '85%', mt: '0.5rem' }}>
									<SearchFilter
										searchValue={searchValue}
										onSearchChange={setSearchValue}
										onSearch={onSearch}
										onReset={onReset}
										activeFilter={activeFilter}
										onFilterChange={setActiveFilter}
										filterOptions={resourceFilterOptions}
										loading={isSearching}
										placeholder='Kaynak ismi veya açıklamasında arayın...'
										searchLabel='Kaynak Ara'
										searchedValue={searchedValue}
										onRemoveSearch={onRemoveSearch}
										totalCount={total}
										hasActiveSearchOrFilter={!!(searchedValue || activeFilter)}
										isCoursesPage={false}
									/>
								</Box>
							</Box>

							<Box
								sx={{
									display: 'flex',
									justifyContent: 'center',
									alignItems: 'center',
									margin: '0rem 0 3rem 0',
									width: { xs: '90%', sm: '90%', md: '100%', lg: '85%' },
								}}>
								<Grid container spacing={3} justifyContent='center' alignItems='stretch' sx={{ maxWidth: '80rem', margin: '0 auto', width: '100%' }}>
									{resources?.map((doc) => (
										<Grid item xs={12} sm={6} md={4} lg={3} display='flex' justifyContent='center' key={doc._id}>
											<DocumentCard document={doc} userCurrency={userCurrency} fromHomePage={true} />
										</Grid>
									))}
									{resources && resources.length === 0 && (
										<Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '30vh' }}>
											<Typography variant='h6' align='center' color='#334155'>
												{searchedValue || activeFilter ? 'Arama kriterlerinize uygun kaynak bulunamadı.' : 'Şu anda kaynak bulunmamaktadır.'}
											</Typography>
										</Grid>
									)}
								</Grid>
							</Box>

							{/* Load More Button and Total Count */}
							{resources && resources.length > 0 && (
								<>
									{/* Load More Button */}
									{hasMore && (
										<Box sx={{ width: '100%', textAlign: 'center', mt: '2rem', mb: '2rem' }}>
											<Button
												onClick={loadMore}
												disabled={loading}
												variant='contained'
												sx={{
													color: 'white',
													fontFamily: 'Varela Round',
													fontSize: '1rem',
													fontWeight: 500,
													padding: '0.5rem 1rem',
													textTransform: 'capitalize',
													borderRadius: '0.5rem',
												}}>
												{loading ? 'Yükleniyor...' : 'Daha Fazla Kaynak Yükle'}
											</Button>
										</Box>
									)}
								</>
							)}

							<ChatWhatsApp />
							<ScrollToTopButton />
						</Box>
					</LandingPageLayout>
				</Box>
			</Box>
		</>
	);
};

export default LandingPageResources;
