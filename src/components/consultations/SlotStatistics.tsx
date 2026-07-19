import { Box, Typography, Grid, Card, CardContent } from '@mui/material';
import { useContext, useMemo } from 'react';
import { ConsultationSlot } from '../../interfaces/consultation';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import theme from '../../themes';

interface SlotStatisticsProps {
	slots: ConsultationSlot[];
}

const SlotStatistics = ({ slots }: SlotStatisticsProps) => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const totalSlots = slots.length;
	const bookedSlots = useMemo(
		() => slots.reduce((count, slot) => count + (slot.appointmentRef ? 1 : 0), 0),
		[slots]
	);
	const availableSlots = totalSlots - bookedSlots;
	const bookingRate = totalSlots > 0 ? ((bookedSlots / totalSlots) * 100).toFixed(1) : '0.0';

	const cardSx = {
		backgroundColor: theme.bgColor?.common,
		borderRadius: '0.75rem',
		padding: isMobileSize ? '0.75rem' : '1rem',
		border: `1px solid ${theme.palette.divider}`,
		boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
	};

	return (
		<Box sx={{ ...cardSx, mb: '1.5rem' }}>
			<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.85rem' : '0.9rem', mb: '0.75rem' }}>
				Slot Statistics
			</Typography>
			<Grid container spacing={1.5}>
				<Grid item xs={6} sm={3}>
					<Card sx={{ backgroundColor: theme.palette.primary.light + '20', height: '100%', boxShadow: 'none' }}>
						<CardContent sx={{ padding: isMobileSize ? '0.5rem !important' : '0.75rem !important', '&:last-child': { paddingBottom: isMobileSize ? '0.5rem' : '0.75rem' } }}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.65rem' : '0.7rem', color: theme.palette.text.secondary, mb: '0.25rem' }}>
								Total Slots
							</Typography>
							<Typography variant='h6' sx={{ fontSize: isMobileSize ? '1rem' : '1.25rem', fontWeight: 'bold', color: theme.palette.primary.main }}>
								{totalSlots}
							</Typography>
						</CardContent>
					</Card>
				</Grid>
				<Grid item xs={6} sm={3}>
					<Card sx={{ backgroundColor: theme.palette.success.light + '20', height: '100%', boxShadow: 'none' }}>
						<CardContent sx={{ padding: isMobileSize ? '0.5rem !important' : '0.75rem !important', '&:last-child': { paddingBottom: isMobileSize ? '0.5rem' : '0.75rem' } }}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.65rem' : '0.7rem', color: theme.palette.text.secondary, mb: '0.25rem' }}>
								Available
							</Typography>
							<Typography variant='h6' sx={{ fontSize: isMobileSize ? '1rem' : '1.25rem', fontWeight: 'bold', color: theme.palette.success.main }}>
								{availableSlots}
							</Typography>
						</CardContent>
					</Card>
				</Grid>
				<Grid item xs={6} sm={3}>
					<Card sx={{ backgroundColor: theme.palette.grey[300] + '40', height: '100%', boxShadow: 'none' }}>
						<CardContent sx={{ padding: isMobileSize ? '0.5rem !important' : '0.75rem !important', '&:last-child': { paddingBottom: isMobileSize ? '0.5rem' : '0.75rem' } }}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.65rem' : '0.7rem', color: theme.palette.text.secondary, mb: '0.25rem' }}>
								Booked
							</Typography>
							<Typography variant='h6' sx={{ fontSize: isMobileSize ? '1rem' : '1.25rem', fontWeight: 'bold', color: theme.palette.text.secondary }}>
								{bookedSlots}
							</Typography>
						</CardContent>
					</Card>
				</Grid>
				<Grid item xs={6} sm={3}>
					<Card sx={{ backgroundColor: theme.palette.info.light + '20', height: '100%', boxShadow: 'none' }}>
						<CardContent sx={{ padding: isMobileSize ? '0.5rem !important' : '0.75rem !important', '&:last-child': { paddingBottom: isMobileSize ? '0.5rem' : '0.75rem' } }}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.65rem' : '0.7rem', color: theme.palette.text.secondary, mb: '0.25rem' }}>
								Booking Rate
							</Typography>
							<Typography variant='h6' sx={{ fontSize: isMobileSize ? '1rem' : '1.25rem', fontWeight: 'bold', color: theme.palette.info.main }}>
								{bookingRate}%
							</Typography>
						</CardContent>
					</Card>
				</Grid>
			</Grid>
		</Box>
	);
};

export default SlotStatistics;
