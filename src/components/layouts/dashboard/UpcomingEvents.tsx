import { Box, Typography } from '@mui/material';
import { format } from 'date-fns';
import { truncateText } from '../../../utils/utilText';
import { EventNote } from '@mui/icons-material';
import theme from '../../../themes';
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
				'boxShadow': '0.1rem 0.3rem 0.3rem 0.3rem rgba(0,0,0,0.2)',
				'padding': '1rem',
				'borderRadius': '0.35rem',
				'cursor': 'pointer',
				'transition': '0.3s',
				':hover': {
					boxShadow: '0rem 0.1rem 0.2rem 0.1rem rgba(0,0,0,0.3)',
				},
			}}>
			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
				<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.85rem' : null }}>
					Upcoming Events
				</Typography>
				<EventNote sx={{ ml: '0.5rem', color: theme.textColor?.greenPrimary.main }} fontSize={isMobileSize ? 'small' : 'medium'} />
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
						<Box key={event.id} sx={{ marginBottom: '0.5rem', width: '100%' }}>
							<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
								<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.65rem' : '0.75rem' }}>
									{truncateText(event.title, 10)}
								</Typography>
								<Typography sx={{ fontSize: isMobileSize ? '0.65rem' : '0.75rem', ml: '0.75rem' }}>
									{format(new Date(event.startDate), 'dd MMM yy, HH:mm')}
								</Typography>
							</Box>
						</Box>
					))}
				</Box>
			) : (
				<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '7rem' }}>
					<Typography sx={{ fontSize: isMobileSize ? '0.65rem' : '0.85rem', color: 'gray' }}>No upcoming events</Typography>
				</Box>
			)}
		</Box>
	);
};

export default UpcomingEvents;
