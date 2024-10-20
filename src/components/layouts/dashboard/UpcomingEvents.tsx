import { Box, Typography } from '@mui/material';
import { format } from 'date-fns';
import { Event } from '../../../interfaces/event';
import { truncateText } from '../../../utils/utilText';
import { EventNote } from '@mui/icons-material';
import theme from '../../../themes';

interface UpcomingEventsProps {
	sortedEventsData: Event[];
}

const UpcomingEvents = ({ sortedEventsData }: UpcomingEventsProps) => {
	const currentDate = new Date(); // Current date
	const sevenDaysFromNow = new Date();
	sevenDaysFromNow.setDate(currentDate.getDate() + 7);
	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				height: '12rem',
				boxShadow: '0.1rem 0.3rem 0.3rem 0.3rem rgba(0,0,0,0.2)',
				padding: '1rem',
				borderRadius: '0.35rem',
				cursor: 'pointer',
				transition: '0.3s',
				':hover': {
					boxShadow: '0rem 0.1rem 0.2rem 0.1rem rgba(0,0,0,0.3)',
				},
			}}>
			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
				<Typography variant='h5'>Upcoming Events</Typography>
				<EventNote sx={{ ml: '0.5rem', color: theme.textColor?.greenPrimary.main }} />
			</Box>

			{sortedEventsData
				?.filter((event) => {
					return event.start && new Date(event.start) >= currentDate && new Date(event.start) <= sevenDaysFromNow;
				})
				.sort((a: Event, b: Event) => new Date(a.start!).getTime() - new Date(b.start!).getTime()).length > 0 ? (
				<Box sx={{ mt: '0.5rem', overflow: 'auto' }}>
					{sortedEventsData
						?.filter((event) => {
							return event.start && new Date(event.start) >= currentDate && new Date(event.start) <= sevenDaysFromNow;
						})
						.sort((a: Event, b: Event) => new Date(a.start!).getTime() - new Date(b.start!).getTime())
						.map((event) => (
							<Box key={event._id} sx={{ marginBottom: '0.5rem' }}>
								<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
									<Typography variant='body2'>{truncateText(event.title, 12)}</Typography>
									<Typography sx={{ fontSize: '0.85rem', ml: '0.75rem' }}>
										{event.start ? format(new Date(event.start), 'dd MMM yy, HH:mm') : 'No start date'}
									</Typography>
								</Box>
							</Box>
						))}
				</Box>
			) : (
				<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '7rem' }}>
					<Typography sx={{ fontSize: '0.85rem' }}>No upcoming events</Typography>
				</Box>
			)}
		</Box>
	);
};

export default UpcomingEvents;
