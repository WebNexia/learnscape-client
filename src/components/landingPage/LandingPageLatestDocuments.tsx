import { Box, Typography } from '@mui/material';
import { useContext, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { AutoStoriesOutlined, MenuBookOutlined } from '@mui/icons-material';
import { LandingPageLatestDocumentsContext } from '../../contexts/LandingPageLatestDocumentsContextProvider';
import { OrganisationContext } from '../../contexts/OrganisationContextProvider';
import { Document } from '../../interfaces/document';
import LandingPageSectionHeader from './LandingPageSectionHeader';
import DocumentCard from './DocumentCard';
import { mulberry32, scatterNonOverlapping } from '../../utils/lpDecorScatter';
import { useGeoLocation } from '../../hooks/useGeoLocation';
import { getCurrencyForCountry } from '../../utils/getPriceForCountry';

const DIALOG_FONT = 'Varela Round';

const LATEST_DOCUMENTS_DECOR_COUNT = 15;

const SECTION_BG =
	'linear-gradient(195deg, #f2f6fb 0%, #e9f0f7 42%, #f5f8fc 78%, #eef4fa 100%), radial-gradient(ellipse 80% 50% at 82% 18%, rgba(0, 102, 204, 0.07) 0%, transparent 55%), radial-gradient(ellipse 65% 45% at 12% 80%, rgba(0, 76, 153, 0.06) 0%, transparent 50%)';

const LandingPageLatestDocuments = () => {
	const { latestDocuments } = useContext(LandingPageLatestDocumentsContext);
	const { orgId } = useContext(OrganisationContext);
	const location = useLocation();
	const geoLocation = useGeoLocation();

	const country = new URLSearchParams(location.search).get('country') || geoLocation?.countryCode || 'US';
	const userCurrency = getCurrencyForCountry(country);

	const backgroundDecor = useMemo(() => {
		const positions = scatterNonOverlapping(0x424f4f4b, LATEST_DOCUMENTS_DECOR_COUNT, {
			topMin: 0.12,
			minNormDist: 0.13,
		});
		const rand = mulberry32(0x424f4f4b ^ 0xace5);
		return positions.map((pos, i) => ({
			Icon: i % 2 === 0 ? AutoStoriesOutlined : MenuBookOutlined,
			top: `${pos.y * 100}%`,
			left: `${pos.x * 100}%`,
			rotate: (rand() - 0.5) * 55,
			fontSize: 20 + rand() * 28,
			opacity: 0.04 + rand() * 0.1,
		}));
	}, []);

	const publishedDocuments = latestDocuments?.filter((document: Document) => String(document.orgId) === String(orgId)) || [];

	return (
		<Box
			sx={{
				position: 'relative',
				overflow: 'hidden',
				py: '3rem',
				width: '100%',
				boxSizing: 'border-box',
				background: SECTION_BG,
			}}>
			<Box
				aria-hidden
				sx={{
					position: 'absolute',
					inset: 0,
					zIndex: 0,
					pointerEvents: 'none',
					overflow: 'hidden',
				}}>
				{backgroundDecor.map(({ Icon, top, left, rotate, fontSize, opacity }, index) => (
					<Icon
						key={index}
						sx={{
							position: 'absolute',
							top,
							left,
							transform: `translate(-50%, -50%) rotate(${rotate}deg)`,
							fontSize,
							opacity,
							color: '#004c99',
						}}
					/>
				))}
			</Box>
			<Box sx={{ position: 'relative', zIndex: 1 }}>
				<LandingPageSectionHeader
					title='Kitaplarımız'
					subtitle='Eğitim materyallerimizden öne çıkan kitaplara göz atın. Size uygun kaynağı seçerek hemen incelemeye başlayın.'
				/>

				<Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '1rem', mt: { xs: 2, sm: 3 }, px: { xs: 1.5, sm: 2 } }}>
					{publishedDocuments && publishedDocuments.length > 0 ? (
						publishedDocuments.map((document: Document) => (
							<Box key={document._id}>
								<DocumentCard document={document} userCurrency={userCurrency} fromHomePage={true} />
							</Box>
						))
					) : (
						<Typography
							sx={{
								textAlign: 'center',
								fontSize: '1.05rem',
								color: '#475569',
								fontFamily: DIALOG_FONT,
								lineHeight: 1.65,
								maxWidth: '28rem',
								mt: '2rem',
								px: 2,
							}}>
							Yeni kitaplarımız çok yakında burada olacak. Materyaller hakkında bilgi almak için bizimle iletişime geçebilirsiniz.
						</Typography>
					)}
				</Box>
			</Box>
		</Box>
	);
};

export default LandingPageLatestDocuments;
