import { Box, Typography } from '@mui/material';
import { format } from 'date-fns';
import { truncateText } from '../../../utils/utilText';
import { EventNote } from '@mui/icons-material';
import { useContext } from 'react';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import { UpcomingEvent } from '../../../hooks/useDashboardSummary';

interface UpcomingEventsProps {
	dashboardEvents?: UpcomingEvent[];
}

const UpcomingEvents = ({ dashboardEvents }: UpcomingEventsProps) => {
	const { isRotated, isSmallScreen } = useContext(MediaQueryContext);
	const isMobileSize: boolean = isSmallScreen || isRotated;

	// Use dashboard events (backend already filters and sorts them)
	const eventsToShow = dashboardEvents || [];

	return (
		<Box
			sx={{
				'display': 'flex',
				'flexDirection': 'column',
				'height': '12rem',
				'borderRadius': '0.5rem',
				'border': '1px solid rgba(0, 82, 163, 0.12)',
				'boxShadow': '0 4px 16px rgba(0, 82, 163, 0.08)',
				'padding': '1rem',
				'cursor': 'pointer',
				'transition': 'all 0.3s ease',
				':hover': {
					boxShadow: '0 8px 24px rgba(0, 82, 163, 0.12)',
				},
			}}>
			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
				<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.85rem' : null, fontWeight: 600, color: '#0052a3' }}>
					Upcoming Events
				</Typography>
				<EventNote sx={{ ml: '0.5rem', color: '#0052a3' }} fontSize={isMobileSize ? 'small' : 'medium'} />
			</Box>

			{eventsToShow.length > 0 ? (
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						width: '100%',
						mt: '0.75rem',
						overflow: 'auto',
						height: '7rem',
					}}>
					{eventsToShow.map((event) => (
						<Box
							key={event.id}
							sx={{
								marginBottom: '0.5rem',
								width: '100%',
								paddingBottom: '0.5rem',
								borderBottom: '1px solid rgba(0, 82, 163, 0.06)',
								'&:last-of-type': { borderBottom: 'none', marginBottom: 0, paddingBottom: 0 },
							}}>
							<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
								<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.65rem' : '0.75rem', fontWeight: 600, color: '#0052a3' }}>
									{truncateText(event.title, 10)}
								</Typography>
								<Typography sx={{ fontSize: isMobileSize ? '0.65rem' : '0.75rem', ml: '0.75rem', color: 'rgba(0, 82, 163, 0.7)' }}>
									{format(new Date(event.startDate), 'dd MMM yy, HH:mm')}
								</Typography>
							</Box>
						</Box>
					))}
				</Box>
			) : (
				<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '7rem' }}>
					<Typography sx={{ fontSize: isMobileSize ? '0.65rem' : '0.85rem', color: 'rgba(0, 82, 163, 0.6)' }}>No upcoming events</Typography>
				</Box>
			)}
		</Box>
	);
};

export default UpcomingEvents;
