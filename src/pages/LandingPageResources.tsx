import { Box, Tab, Tabs, Typography, Grid } from '@mui/material';
import LandingPageLayout from '../components/landingPage/LandingPageLayout';
import theme from '../themes';
import { useContext, useEffect, useState } from 'react';
import { DocumentsContext } from '../contexts/DocumentsContextProvider';
import { useLocation } from 'react-router-dom';
import DocumentCard from '../components/landingPage/DocumentCard';
import { Document } from '../interfaces/document';

interface Price {
	currency: string;
	amount: string;
}

const LandingPageResources = () => {
	const [value, setValue] = useState<string>('free');
	const { sortedLandingPageDocumentsData } = useContext(DocumentsContext);
	const [freeDocuments, setFreeDocuments] = useState<Document[]>([]);
	const [paidDocuments, setPaidDocuments] = useState<Document[]>([]);
	const location = useLocation();

	const handleChange = (_: React.SyntheticEvent, newValue: string) => {
		setValue(newValue);
	};

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

	const isDocumentFree = (document: Document) => {
		const userCurrency = getUserCurrency();
		const price = document.prices.find((p: Price) => p.currency === userCurrency);
		return !price || price.amount === '0' || price.amount === 'Free';
	};

	useEffect(() => {
		if (sortedLandingPageDocumentsData) {
			const free = sortedLandingPageDocumentsData.filter((doc) => isDocumentFree(doc));
			const paid = sortedLandingPageDocumentsData.filter((doc) => !isDocumentFree(doc));
			setFreeDocuments(free);
			setPaidDocuments(paid);
		}
	}, [sortedLandingPageDocumentsData, location.search]);

	const userCurrency = getUserCurrency();

	return (
		<LandingPageLayout>
			<Box sx={{ paddingTop: '13vh', width: '100%' }}>
				<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem' }}>
					<Tabs
						value={value}
						onChange={handleChange}
						textColor='primary'
						indicatorColor='secondary'
						sx={{
							'& .MuiTabs-indicator': {
								backgroundColor: theme.textColor?.secondary.main,
							},
							'& .MuiTab-root': {
								'fontFamily': "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
								'fontSize': '1.1rem',
								'textTransform': 'none',
								'color': theme.textColor?.primary.main,
								'&.Mui-selected': {
									color: theme.textColor?.secondary.main,
								},
							},
						}}>
						<Tab value='free' label='Ücretsiz Kaynaklar' />
						<Tab value='paid' label='Ücretli Kaynaklar' />
					</Tabs>

					<Box sx={{ margin: '2rem 0 3rem 0', width: '100%' }}>
						{value === 'free' && (
							<Grid container spacing={3} justifyContent='center' sx={{ maxWidth: '80rem', margin: '0 auto' }}>
								{freeDocuments.map((doc) => (
									<Grid item xs={12} sm={6} md={3} key={doc._id}>
										<DocumentCard document={doc} userCurrency={userCurrency} />
									</Grid>
								))}
								{freeDocuments.length === 0 && (
									<Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '30vh' }}>
										<Typography variant='h6' align='center' color='text.secondary'>
											Şu anda ücretsiz kaynak bulunmamaktadır.
										</Typography>
									</Grid>
								)}
							</Grid>
						)}
						{value === 'paid' && (
							<Grid container spacing={3} justifyContent='center' sx={{ maxWidth: '80rem', margin: '0 auto' }}>
								{paidDocuments.map((doc) => (
									<Grid item xs={12} sm={6} md={3} key={doc._id}>
										<DocumentCard document={doc} userCurrency={userCurrency} />
									</Grid>
								))}
								{paidDocuments.length === 0 && (
									<Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '30vh' }}>
										<Typography variant='h6' align='center' color='text.secondary'>
											Şu anda ücretli kaynak bulunmamaktadır.
										</Typography>
									</Grid>
								)}
							</Grid>
						)}
					</Box>
				</Box>
			</Box>
		</LandingPageLayout>
	);
};

export default LandingPageResources;
