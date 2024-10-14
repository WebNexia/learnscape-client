import { Event } from '../../../interfaces/event';
import CustomCancelButton from '../../forms/customButtons/CustomCancelButton';
import CustomDialog from '../dialog/CustomDialog';
import { Box, DialogActions, DialogContent, Link, Typography } from '@mui/material';

interface EventDetailsDialogProps {
	eventDetailsModalOpen: boolean;
	selectedEvent: Event | null;
	setEventDetailsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const EventDetailsDialog = ({ eventDetailsModalOpen, selectedEvent, setEventDetailsModalOpen }: EventDetailsDialogProps) => {
	return (
		<CustomDialog
			openModal={eventDetailsModalOpen}
			closeModal={() => {
				setEventDetailsModalOpen(false);
			}}
			title='Event Details'
			maxWidth='sm'>
			<DialogContent sx={{ margin: '0.5rem 1rem 1rem 1rem' }}>
				<Box sx={{ display: 'flex', alignItems: 'center', mb: '0.5rem' }}>
					<Typography variant='h6'>Title:</Typography>
					<Typography variant='body1' sx={{ ml: '0.5rem' }}>
						{selectedEvent?.title}
					</Typography>
				</Box>
				{selectedEvent?.description && (
					<Box sx={{ display: 'flex', alignItems: 'center', mb: '0.5rem' }}>
						<Typography variant='h6'>Description:</Typography>
						<Typography variant='body1' sx={{ ml: '0.5rem' }}>
							{selectedEvent?.description}
						</Typography>
					</Box>
				)}

				{selectedEvent?.start && (
					<Box sx={{ display: 'flex', alignItems: 'center', mb: '0.5rem' }}>
						<Typography variant='h6'>Starts:</Typography>
						<Typography variant='body1' sx={{ ml: '0.5rem' }}>
							{selectedEvent.start.toLocaleString('en-US', {
								weekday: 'long',
								year: 'numeric',
								month: 'long',
								day: 'numeric',
								hour: '2-digit',
								minute: '2-digit',
							})}
						</Typography>
					</Box>
				)}
				{selectedEvent?.end && (
					<Box sx={{ display: 'flex', alignItems: 'center', mb: '0.5rem' }}>
						<Typography variant='h6'>Ends:</Typography>
						<Typography variant='body1' sx={{ ml: '0.5rem' }}>
							{selectedEvent.end.toLocaleString('en-US', {
								weekday: 'long',
								year: 'numeric',
								month: 'long',
								day: 'numeric',
								hour: '2-digit',
								minute: '2-digit',
							})}
						</Typography>
					</Box>
				)}
				{selectedEvent?.eventLinkUrl && (
					<Box sx={{ display: 'flex', alignItems: 'center', mb: '0.5rem' }}>
						<Typography variant='h6'>Link:</Typography>
						<Link href={selectedEvent.eventLinkUrl} sx={{ ml: '0.5rem' }} rel='noopener' target='_blank'>
							<Typography variant='body1'>{selectedEvent.eventLinkUrl}</Typography>
						</Link>
					</Box>
				)}

				{selectedEvent?.location && (
					<Box sx={{ display: 'flex', alignItems: 'center', mb: '0.5rem' }}>
						<Typography variant='h6'>Location:</Typography>
						<Typography sx={{ ml: '0.5rem' }}>{selectedEvent.location}</Typography>
					</Box>
				)}
			</DialogContent>
			<DialogActions>
				<CustomCancelButton onClick={() => setEventDetailsModalOpen(false)} sx={{ margin: '-1rem 1rem 0.5rem 0rem' }} />
			</DialogActions>
		</CustomDialog>
	);
};

export default EventDetailsDialog;
