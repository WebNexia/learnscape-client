import { useContext } from 'react';
import { Event } from '../../../interfaces/event';
import CustomCancelButton from '../../forms/customButtons/CustomCancelButton';
import CustomDialog from '../dialog/CustomDialog';
import { Box, DialogActions, DialogContent, Link, Typography } from '@mui/material';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

interface EventDetailsDialogProps {
	eventDetailsModalOpen: boolean;
	selectedEvent: Event | null;
	setEventDetailsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
	setSelectedEvent: React.Dispatch<React.SetStateAction<Event | null>>;
}

const EventDetailsDialog = ({ eventDetailsModalOpen, selectedEvent, setEventDetailsModalOpen, setSelectedEvent }: EventDetailsDialogProps) => {
	const { isRotated, isVerySmallScreen, isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;
	return (
		<CustomDialog
			openModal={eventDetailsModalOpen}
			closeModal={() => {
				setEventDetailsModalOpen(false);
				setSelectedEvent(null);
			}}
			title='Event Details'
			maxWidth='sm'>
			<DialogContent sx={{ margin: isMobileSizeSmall ? '0rem' : '0.5rem 1rem 1rem 1rem' }}>
				<Box sx={{ display: 'flex', alignItems: 'center', mb: '0.75rem' }}>
					<Typography variant='h6' sx={{ fontSize: isMobileSizeSmall ? '0.85rem' : isMobileSize ? '0.9rem' : undefined }}>
						Title:
					</Typography>
					<Typography variant='body1' sx={{ ml: '0.5rem', fontSize: isMobileSizeSmall ? '0.75rem' : isMobileSize ? '0.85rem' : undefined }}>
						{selectedEvent?.title}
					</Typography>
				</Box>
				{selectedEvent?.description && (
					<Box sx={{ display: 'flex', alignItems: 'center', mb: '0.75rem' }}>
						<Typography variant='h6' sx={{ fontSize: isMobileSizeSmall ? '0.85rem' : isMobileSize ? '0.9rem' : undefined }}>
							Description:
						</Typography>
						<Typography variant='body1' sx={{ ml: '0.5rem', fontSize: isMobileSizeSmall ? '0.75rem' : isMobileSize ? '0.85rem' : undefined }}>
							{selectedEvent?.description}
						</Typography>
					</Box>
				)}

				{selectedEvent?.start && (
					<Box sx={{ display: 'flex', alignItems: 'center', mb: '0.5rem' }}>
						<Typography variant='h6' sx={{ fontSize: isMobileSizeSmall ? '0.85rem' : isMobileSize ? '0.9rem' : undefined }}>
							Starts:
						</Typography>
						<Typography variant='body1' sx={{ ml: '0.5rem', fontSize: isMobileSizeSmall ? '0.75rem' : isMobileSize ? '0.85rem' : undefined }}>
							{selectedEvent.start.toLocaleString(undefined, {
								weekday: 'long',
								year: 'numeric',
								month: 'long',
								day: 'numeric',
								hour: '2-digit',
								minute: '2-digit',
								timeZoneName: 'short',
							})}
						</Typography>
					</Box>
				)}
				{selectedEvent?.end && (
					<Box sx={{ display: 'flex', alignItems: 'center', mb: '0.75rem' }}>
						<Typography variant='h6' sx={{ fontSize: isMobileSizeSmall ? '0.85rem' : isMobileSize ? '0.9rem' : undefined }}>
							Ends:
						</Typography>
						<Typography variant='body1' sx={{ ml: '0.5rem', fontSize: isMobileSizeSmall ? '0.75rem' : isMobileSize ? '0.85rem' : undefined }}>
							{selectedEvent.end.toLocaleString(undefined, {
								weekday: 'long',
								year: 'numeric',
								month: 'long',
								day: 'numeric',
								hour: '2-digit',
								minute: '2-digit',
								timeZoneName: 'short',
							})}
						</Typography>
					</Box>
				)}
				{selectedEvent?.eventLinkUrl && (
					<Box sx={{ display: 'flex', alignItems: 'center', mb: '0.75rem' }}>
						<Typography variant='h6' sx={{ fontSize: isMobileSizeSmall ? '0.85rem' : isMobileSize ? '0.9rem' : undefined }}>
							Link:
						</Typography>
						<Link href={selectedEvent.eventLinkUrl} sx={{ ml: '0.5rem' }} rel='noopener' target='_blank'>
							<Typography variant='body1' sx={{ fontSize: isMobileSizeSmall ? '0.75rem' : isMobileSize ? '0.85rem' : undefined }}>
								{selectedEvent.eventLinkUrl}
							</Typography>
						</Link>
					</Box>
				)}

				{selectedEvent?.location && (
					<Box sx={{ display: 'flex', alignItems: 'center', mb: '0.75rem' }}>
						<Typography variant='h6' sx={{ fontSize: isMobileSizeSmall ? '0.85rem' : isMobileSize ? '0.9rem' : undefined }}>
							Location:
						</Typography>
						<Typography sx={{ ml: '0.5rem', fontSize: isMobileSizeSmall ? '0.75rem' : isMobileSize ? '0.85rem' : undefined }}>
							{selectedEvent.location}
						</Typography>
					</Box>
				)}
			</DialogContent>
			<DialogActions>
				<CustomCancelButton
					onClick={() => {
						setEventDetailsModalOpen(false);
						setSelectedEvent(null);
					}}
					sx={{ margin: '-1rem 1.5rem 1rem 0rem' }}>
					Close
				</CustomCancelButton>
			</DialogActions>
		</CustomDialog>
	);
};

export default EventDetailsDialog;
