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

	return (
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
						backgroundColor: '#FDF7F0',
						backgroundImage: `
						linear-gradient(135deg, rgba(44, 62, 80, 0.05), rgba(52, 152, 219, 0.05)),
						radial-gradient(circle, rgba(44,62,80,0.08) 1px, transparent 1px)
					`,
						backgroundSize: 'auto, 30px 30px',
						backgroundRepeat: 'repeat, repeat',
					}}>
					<Box sx={{ width: '85%' }}>
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
								<Typography variant='h6' align='center' color='text.secondary'>
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
	);
};

export default LandingPageResources;
