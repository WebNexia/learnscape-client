import { Box, Typography, Button } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { useQuery } from 'react-query';
import LandingPageLayout from '../components/landingPage/LandingPageLayout';
import ClubPaymentForm from '../components/clubs/ClubPaymentForm';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import { clubsService } from '../services/clubsService';
import { Club } from '../interfaces/club';
import { useIsLpQaPreview } from '../hooks/useIsLpQaPreview';
import { clubDetailPath } from '../utils/clubPurchasePricing';

export default function LandingPageClubPayment() {
	const { clubId } = useParams();
	const navigate = useNavigate();
	const { orgId } = useContext(OrganisationContext);
	const isQaPreview = useIsLpQaPreview();

	const {
		data: club,
		isLoading,
		isError,
	} = useQuery(
		['lpPublicClubDetail', orgId, clubId, isQaPreview],
		async () => clubsService.getPublicClub(orgId!, clubId!, { qaPreview: isQaPreview }) as Promise<Club>,
		{
			enabled: Boolean(orgId && clubId),
			staleTime: 60_000,
		},
	);

	const detailUrl = club ? clubDetailPath(club, isQaPreview) : '/landing-page-clubs';
	const canPurchase = Boolean(club?.packs?.length && (isQaPreview || club?.isActive !== false));

	if (!isLoading && (isError || !club)) {
		return (
			<LandingPageLayout>
				<Box sx={{ py: 8, px: 2, textAlign: 'center' }}>
					<Typography sx={{ fontFamily: 'Varela Round', mb: 2 }}>Kulüp bulunamadı.</Typography>
					<Button variant='outlined' onClick={() => navigate(-1)} sx={{ fontFamily: 'Varela Round' }}>
						Geri
					</Button>
				</Box>
			</LandingPageLayout>
		);
	}

	if (isLoading || !club) {
		return (
			<LandingPageLayout>
				<Box sx={{ py: 8, px: 2, textAlign: 'center' }}>
					<Typography sx={{ fontFamily: 'Varela Round', mb: 2 }}>Kulüp yükleniyor...</Typography>
				</Box>
			</LandingPageLayout>
		);
	}

	if (!canPurchase) {
		return (
			<LandingPageLayout>
				<Box
					sx={{
						minHeight: { xs: 'calc(100vh - 7rem)', md: 'calc(100vh - 8rem)' },
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						px: 2,
						textAlign: 'center',
					}}>
					<Typography sx={{ fontFamily: 'Varela Round', mb: 2 }}>Bu kulüp için satın alma şu an mümkün değil.</Typography>
					<Button variant='outlined' onClick={() => navigate(detailUrl)} sx={{ fontFamily: 'Varela Round' }}>
						Kulübe Dön
					</Button>
				</Box>
			</LandingPageLayout>
		);
	}

	return (
		<LandingPageLayout>
			<Box
				sx={{
					maxWidth: 1100,
					mx: 'auto',
					pt: { xs: '12vh', md: '15vh' },
					pb: { xs: 2, sm: 3 },
					px: { xs: 2, sm: 3 },
				}}>
				<ClubPaymentForm club={club} onCancel={() => navigate(detailUrl)} />
			</Box>
		</LandingPageLayout>
	);
}
