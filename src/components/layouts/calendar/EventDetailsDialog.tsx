import { useContext, useState } from 'react';
import { Event } from '../../../interfaces/event';
import CustomCancelButton from '../../forms/customButtons/CustomCancelButton';
import CustomDialog from '../dialog/CustomDialog';
import { Alert, Box, DialogActions, DialogContent, Link, Snackbar, Typography } from '@mui/material';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import CustomSubmitButton from '../../forms/customButtons/CustomSubmitButton';
import theme from '../../../themes';
import axios from 'axios';
import { OrganisationContext } from '../../../contexts/OrganisationContextProvider';
import { UserAuthContext } from '../../../contexts/UserAuthContextProvider';
import CustomErrorMessage from '../../forms/customFields/CustomErrorMessage';

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

	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { user } = useContext(UserAuthContext);
	const [isRegisterForEventSuccess, setIsRegisterForEventSuccess] = useState<boolean>(false);

	const [isRegisterForEventSending, setIsRegisterForEventSending] = useState<boolean>(false);
	const [registerErrorMsg, setRegisterErrorMsg] = useState<string | null>(null);

	const handleRegisterForEvent = async () => {
		if (!selectedEvent?._id) return;

		// Check if event is in the past
		const now = new Date();
		let eventEnd: Date | null = null;
		if (selectedEvent.end && typeof selectedEvent.end === 'string') {
			eventEnd = new Date(selectedEvent.end);
		} else if (selectedEvent.start && typeof selectedEvent.start === 'string') {
			eventEnd = new Date(selectedEvent.start);
		} else if (selectedEvent.end && selectedEvent.end instanceof Date) {
			eventEnd = selectedEvent.end;
		} else if (selectedEvent.start && selectedEvent.start instanceof Date) {
			eventEnd = selectedEvent.start;
		}
		if (eventEnd && eventEnd < now) {
			setRegisterErrorMsg('You cannot register because this event has already ended.');
			return;
		}

		try {
			setIsRegisterForEventSending(true);
			setRegisterErrorMsg(null);
			await axios.post(`${base_url}/event-registrations`, {
				eventId: selectedEvent?._id,
				userId: user?._id,
				firstName: user?.firstName,
				lastName: user?.lastName,
				email: user?.email,
				orgId,
			});
			setIsRegisterForEventSuccess(true);
		} catch (error: any) {
			if (axios.isAxiosError(error) && error.response?.status === 409) {
				setRegisterErrorMsg('You have already registered for this event.');
			} else {
				setRegisterErrorMsg('An error occurred while registering for the event.');
			}
		} finally {
			setIsRegisterForEventSending(false);
		}
	};

	return (
		<CustomDialog
			openModal={eventDetailsModalOpen}
			closeModal={() => {
				setEventDetailsModalOpen(false);
				setSelectedEvent(null);
				setIsRegisterForEventSuccess(false);
				setRegisterErrorMsg(null);
			}}
			title='Event Details'
			maxWidth='sm'>
			<DialogContent sx={{ margin: isMobileSizeSmall ? '0rem' : '0.5rem 1rem 1rem 1rem' }}>
				<Box sx={{ display: 'flex', alignItems: 'center', mb: '0.75rem' }}>
					<Typography variant='h6' sx={{ fontSize: isMobileSizeSmall ? '0.85rem' : isMobileSize ? '0.9rem' : undefined }}>
						Title:
					</Typography>
					<Typography variant='body1' sx={{ ml: '0.5rem', fontSize: isMobileSizeSmall ? '0.75rem' : isMobileSize ? '0.85rem' : '0.95rem' }}>
						{selectedEvent?.title}
					</Typography>
				</Box>
				{selectedEvent?.description && (
					<Box sx={{ display: 'flex', alignItems: 'center', mb: '0.75rem' }}>
						<Typography variant='h6' sx={{ fontSize: isMobileSizeSmall ? '0.85rem' : isMobileSize ? '0.9rem' : undefined }}>
							Description:
						</Typography>
						<Typography variant='body1' sx={{ ml: '0.5rem', fontSize: isMobileSizeSmall ? '0.75rem' : isMobileSize ? '0.85rem' : '0.95rem' }}>
							{selectedEvent?.description}
						</Typography>
					</Box>
				)}

				{selectedEvent?.start && (
					<Box sx={{ display: 'flex', alignItems: 'center', mb: '0.5rem' }}>
						<Typography variant='h6' sx={{ fontSize: isMobileSizeSmall ? '0.85rem' : isMobileSize ? '0.9rem' : undefined }}>
							Starts:
						</Typography>
						<Typography variant='body1' sx={{ ml: '0.5rem', fontSize: isMobileSizeSmall ? '0.75rem' : isMobileSize ? '0.85rem' : '0.95rem' }}>
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
						<Typography variant='body1' sx={{ ml: '0.5rem', fontSize: isMobileSizeSmall ? '0.75rem' : isMobileSize ? '0.85rem' : '0.95rem' }}>
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
							<Typography variant='body1' sx={{ fontSize: isMobileSizeSmall ? '0.75rem' : isMobileSize ? '0.85rem' : '0.95rem' }}>
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
						<Typography sx={{ ml: '0.5rem', fontSize: isMobileSizeSmall ? '0.75rem' : isMobileSize ? '0.85rem' : '0.95rem' }}>
							{selectedEvent.location}
						</Typography>
					</Box>
				)}

				{selectedEvent?.isPublic && (
					<Box sx={{ display: 'flex', alignItems: 'center' }}>
						<Typography variant='h6' sx={{ fontSize: isMobileSizeSmall ? '0.85rem' : isMobileSize ? '0.9rem' : undefined }}>
							Type:
						</Typography>
						<Typography sx={{ ml: '0.5rem', fontSize: isMobileSizeSmall ? '0.75rem' : isMobileSize ? '0.85rem' : '0.95rem' }}>
							{selectedEvent.type}
						</Typography>
					</Box>
				)}
				{registerErrorMsg && <CustomErrorMessage sx={{ mt: '1rem' }}>{registerErrorMsg}</CustomErrorMessage>}
			</DialogContent>
			<DialogActions sx={{ margin: '-1.5rem 1rem 1rem 0rem' }}>
				<CustomCancelButton
					onClick={() => {
						setEventDetailsModalOpen(false);
						setSelectedEvent(null);
						setIsRegisterForEventSuccess(false);
						setRegisterErrorMsg(null);
					}}>
					Close
				</CustomCancelButton>
				{selectedEvent?.isPublic && (
					<CustomSubmitButton onClick={handleRegisterForEvent} disabled={isRegisterForEventSending}>
						{isRegisterForEventSending ? 'Registering...' : 'Register'}
					</CustomSubmitButton>
				)}
			</DialogActions>
			{isRegisterForEventSuccess && (
				<Snackbar
					open={isRegisterForEventSuccess}
					autoHideDuration={3000}
					anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
					onClose={() => {
						setIsRegisterForEventSuccess(false);
						setEventDetailsModalOpen(false);
					}}
					sx={{ mt: { xs: '1.5rem', sm: '1.5rem', md: '2.5rem', lg: '2.5rem' } }}>
					<Alert
						severity='success'
						variant='filled'
						sx={{
							width: '100%',
							fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem', lg: '1rem' },
							letterSpacing: 0,
							color: theme.palette.common.white,
						}}>
						You have been registered for the event. Please check your email for more details.
					</Alert>
				</Snackbar>
			)}
		</CustomDialog>
	);
};

export default EventDetailsDialog;
