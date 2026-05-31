import { Box, Typography, Grid, Button, CircularProgress } from '@mui/material';
import LandingPageLayout from '../components/landingPage/LandingPageLayout';
import { useContext, useEffect, useState } from 'react';
import { LandingPageResourcesContext } from '../contexts/LandingPageResourcesContextProvider';
import { useLocation } from 'react-router-dom';
import DocumentCard from '../components/landingPage/DocumentCard';
import ChatWhatsApp from '../components/landingPage/ChatWhatsApp';
import ScrollToTopButton from '../components/landingPage/ScrollToTopButton';
import SearchFilter from '../components/landingPage/SearchFilter';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import { SEO, StructuredData } from '../components/seo';
import { useGeoLocation } from '../hooks/useGeoLocation';

const LandingPageResources = () => {
	const {
		resources,
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
	} = useContext(LandingPageResourcesContext);
	const location = useLocation();
	const geoLocation = useGeoLocation();

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const [isScrolled, setIsScrolled] = useState(false);

	useEffect(() => {
		const handleScroll = () => setIsScrolled(window.scrollY > 10);
		handleScroll();
		window.addEventListener('scroll', handleScroll, { passive: true });
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

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
		// URL param can still override when explicitly provided.
		const country = new URLSearchParams(location.search).get('country') || geoLocation?.countryCode || 'US';

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

	const baseUrl = import.meta.env.VITE_SITE_URL || 'https://adenacademy.co.uk';

	return (
		<>
			<SEO
				title='Learning Resources - Aden Academy'
				description='Access free learning resources, documents, and educational materials. Download PDFs, guides, and study materials to enhance your learning experience.'
				keywords='learning resources, educational documents, study materials, PDF downloads, free resources, educational content, learning guides, Aden Academy resources'
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
					name: 'Learning Resources - Aden Academy',
					description:
						'Access free learning resources, documents, and educational materials. Download PDFs, guides, and study materials to enhance your learning experience.',
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
						<Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
							{/* Spacer for fixed header */}
							<Box sx={{ height: isMobileSize ? '10vh' : '13vh', flexShrink: 0 }} />
							<Box
								sx={{
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									justifyContent: 'center',
									width: '100%',
									position: 'sticky',
									top: isMobileSize ? '10vh' : '13vh',
									zIndex: 1000,
									paddingTop: isScrolled ? 0 : isMobileSize ? '1rem' : '1.25rem',
									paddingBottom: isScrolled ? 0 : '0.25rem',
									backgroundColor: 'transparent',
									transition: 'padding 0.25s ease',
								}}>
								<Box sx={{ width: '85%', mt: '0rem' }}>
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
										transparentSearchBox
										isScrolled={isScrolled}
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
									{error ? (
										<Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '30vh' }}>
											<Typography sx={{ textAlign: 'center', fontSize: '1.1rem', color: 'error.main', fontFamily: 'Varela Round' }}>
												{error}
											</Typography>
										</Grid>
									) : (loading || isSearching) && resources.length === 0 ? (
										<Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
											<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
												<CircularProgress sx={{ color: '#0052a3' }} aria-busy aria-label='Yükleniyor' />
												<Typography sx={{ fontFamily: 'Varela Round', color: '#64748b', fontSize: '1rem' }}>Yükleniyor</Typography>
											</Box>
										</Grid>
									) : (
										<>
											{resources?.map((doc) => (
												<Grid item xs={12} sm={6} md={4} lg={3} display='flex' justifyContent='center' key={doc._id}>
													<DocumentCard document={doc} userCurrency={userCurrency} fromHomePage={true} />
												</Grid>
											))}
											{resources.length === 0 && (
												<Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '30vh' }}>
													<Typography variant='h6' align='center' color='#334155' sx={{ fontFamily: 'Varela Round' }}>
														{searchedValue || activeFilter ? 'Arama kriterlerinize uygun kaynak bulunamadı.' : 'Yeni kaynaklar yakında eklenecektir'}
													</Typography>
												</Grid>
											)}
										</>
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
													fontWeight: 600,
													padding: '0.5rem 1.5rem',
													textTransform: 'capitalize',
													borderRadius: '0.75rem',
													background: '#FF6B3D',
													boxShadow: '0 4px 15px rgba(255, 107, 61, 0.35)',
													transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
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
