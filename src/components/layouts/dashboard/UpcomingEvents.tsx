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

	const eventsToShow = dashboardEvents || [];

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				boxShadow: '0.1rem 0.3rem 0.3rem 0.3rem rgba(0,0,0,0.2)',
				padding: '1rem',
				height: '12rem',
				borderRadius: '0.35rem',
				cursor: 'pointer',
				transition: '0.3s',
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
						justifyContent: 'center',
						margin: '0.65rem 0 0 0.75rem',
						height: '7rem',
						overflow: 'auto',
					}}>
					<ul>
						{eventsToShow.map((event) => (
							<Typography key={event.id} component='li' sx={{ fontSize: isMobileSize ? '0.65rem' : '0.85rem', mb: '0.35rem' }}>
								{truncateText(event.title, 20)} — {format(new Date(event.startDate), 'dd MMM HH:mm')}
							</Typography>
						))}
					</ul>
				</Box>
			) : (
				<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '7rem' }}>
					<Typography sx={{ fontSize: isMobileSize ? '0.65rem' : '0.85rem', color: 'gray', textAlign: 'center' }}>No upcoming events</Typography>
				</Box>
			)}
		</Box>
	);
};

export default UpcomingEvents;
