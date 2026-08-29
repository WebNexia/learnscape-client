import { Box, Typography, Button, CircularProgress } from '@mui/material';
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

const landingHeaderStickyTop = {
	xs: '3.25rem',
	sm: '3.5rem',
	md: 'clamp(3.5rem, 9vh, 5.5rem)',
} as const;

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
				title='Kitaplar - Aden Academy'
				description='Ders kitapları, çalışma materyalleri ve rehber dokümanlara buradan ulaşın. Ücretsiz ve ücretli kitapları arayıp indirebilirsiniz.'
				keywords='kitaplar, ders kitapları, eğitim materyalleri, çalışma materyalleri, PDF indirme, ücretsiz kitap, Aden Academy kitaplar'
				type='website'
			/>
			<StructuredData type='Organization' />
			<StructuredData type='WebSite' />
			<StructuredData
				type='BreadcrumbList'
				data={{
					breadcrumbs: [
						{ name: 'Home', url: baseUrl },
						{ name: 'Kitaplar', url: `${baseUrl}/landing-page-resources` },
					],
				}}
			/>
			<StructuredData
				type='WebPage'
				data={{
					url: `${baseUrl}/landing-page-resources`,
					name: 'Kitaplar - Aden Academy',
					description:
						'Ders kitapları, çalışma materyalleri ve rehber dokümanlara buradan ulaşın. Ücretsiz ve ücretli kitapları arayıp indirebilirsiniz.',
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

							{/* Search / filter — sticks below site header */}
							<Box
								sx={{
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									width: '100%',
									position: 'sticky',
									top: landingHeaderStickyTop,
									zIndex: 1000,
									pt: isScrolled ? 0 : isMobileSize ? '1rem' : '1.25rem',
									pb: 0,
									backgroundColor: isScrolled ? '#FFFFFF' : 'transparent',
									boxShadow: isScrolled ? '0 1px 8px rgba(0, 0, 0, 0.04)' : 'none',
									borderBottom: isScrolled ? '1px solid rgba(0, 0, 0, 0.04)' : '1px solid transparent',
									transition: 'background-color 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease, padding 0.25s ease',
								}}>
								{/* <Box sx={{ width: '85%' }}>
									<SearchFilter
										searchValue={searchValue}
										onSearchChange={setSearchValue}
										onSearch={onSearch}
										onReset={onReset}
										activeFilter={activeFilter}
										onFilterChange={setActiveFilter}
										filterOptions={resourceFilterOptions}
										loading={isSearching}
										placeholder='Kitap ismi veya açıklamasında arayın...'
										searchLabel='Kitap Ara'
										searchedValue={searchedValue}
										onRemoveSearch={onRemoveSearch}
										totalCount={total}
										hasActiveSearchOrFilter={!!(searchedValue || activeFilter)}
										transparentSearchBox
										isScrolled={isScrolled}
									/>
								</Box> */}
							</Box>

							{/* Intro — scrolls with page */}
							<Box sx={{ width: '85%', pb: { xs: 1, sm: 1.5 }, px: { xs: 0, sm: 1 } }}>
								<Typography
									align='center'
									sx={{
										color: '#475569',
										fontSize: { xs: '0.95rem', sm: '1rem', md: '1.05rem' },
										fontFamily: 'Varela Round',
										fontWeight: 400,
										lineHeight: 1.65,
										maxWidth: { xs: '100%', sm: '36rem', md: '42rem' },
										mx: 'auto',
									}}>
									Ders notları, çalışma materyalleri ve rehber dokümanlara buradan ulaşın. Ücretsiz ve ücretli kitapları indirebilirsiniz.
								</Typography>
							</Box>

							<Box
								sx={{
									display: 'flex',
									justifyContent: 'center',
									flexWrap: 'wrap',
									gap: '1rem',
									mt: '3rem',
									width: { xs: '90%', sm: '90%', md: '100%', lg: '85%' },
									mb: '3rem',
								}}>
								{error ? (
									<Typography sx={{ textAlign: 'center', fontSize: '1.1rem', color: 'error.main', fontFamily: 'Varela Round', mt: 5 }}>
										{error}
									</Typography>
								) : (loading || isSearching) && resources.length === 0 ? (
									<Box
										sx={{
											display: 'flex',
											flexDirection: 'column',
											alignItems: 'center',
											justifyContent: 'center',
											gap: 2,
											minHeight: '40vh',
											width: '100%',
										}}>
										<CircularProgress sx={{ color: '#0052a3' }} aria-busy aria-label='Yükleniyor' />
										<Typography sx={{ fontFamily: 'Varela Round', color: '#64748b', fontSize: '1rem' }}>Yükleniyor</Typography>
									</Box>
								) : resources && resources.length > 0 ? (
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
										{resources.map((doc) => (
											<Box key={doc._id}>
												<DocumentCard document={doc} userCurrency={userCurrency} fromHomePage={true} />
											</Box>
										))}
									</Box>
								) : (
									<Typography
										align='center'
										sx={{
											fontFamily: 'Varela Round',
											color: '#475569',
											fontSize: { xs: '1rem', sm: '1.05rem' },
											lineHeight: 1.65,
											maxWidth: '28rem',
											px: 2,
											mt: 5,
										}}>
										{searchedValue || activeFilter
											? 'Arama kriterlerinize uygun kitap bulunamadı. Farklı bir anahtar kelime deneyebilir veya filtreleri temizleyebilirsiniz.'
											: 'Yeni kitaplarımız yakında eklenecek. Güncel materyaller için sayfayı düzenli kontrol edebilirsiniz.'}
									</Typography>
								)}
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
												{loading ? 'Yükleniyor...' : 'Daha Fazla Kitap Yükle'}
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
