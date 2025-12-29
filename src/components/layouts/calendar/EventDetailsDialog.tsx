import { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Event } from '../../../interfaces/event';
import CustomCancelButton from '../../forms/customButtons/CustomCancelButton';
import CustomDialog from '../dialog/CustomDialog';
import { Alert, Box, DialogActions, DialogContent, Link, Snackbar, Typography } from '@mui/material';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import CustomSubmitButton from '../../forms/customButtons/CustomSubmitButton';
import theme from '../../../themes';
import axios from '@utils/axiosInstance';
import axiosOriginal from 'axios';
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

	const navigate = useNavigate();
	const [isRegisterForEventSuccess, setIsRegisterForEventSuccess] = useState<boolean>(false);

	const [isRegisterForEventSending, setIsRegisterForEventSending] = useState<boolean>(false);
	const [registerErrorMsg, setRegisterErrorMsg] = useState<string | null>(null);
	const [isUserRegistered, setIsUserRegistered] = useState<boolean>(false);
	const [recordings, setRecordings] = useState<
		Array<{
			recordingId: string;
			recordingStart: string;
			recordingEnd: string;
			fileType: string;
			fileSize: number;
			playUrl: string;
			recordingType: string;
			status: string;
		}>
	>([]);
	const [isLoadingRecordings, setIsLoadingRecordings] = useState<boolean>(false);

	// Check if user is registered for the event (for public events)
	useEffect(() => {
		const checkRegistration = async () => {
			if (!selectedEvent?._id || !user || !selectedEvent?.isPublic) {
				setIsUserRegistered(false);
				return;
			}

			try {
				const response = await axios.get(`${base_url}/eventRegistrations/check/${selectedEvent._id}`);
				setIsUserRegistered(response.data.isRegistered || false);
			} catch (error) {
				console.error('Error checking registration:', error);
				setIsUserRegistered(false);
			}
		};

		if (eventDetailsModalOpen && selectedEvent) {
			checkRegistration();
		} else {
			setIsUserRegistered(false);
		}
	}, [eventDetailsModalOpen, selectedEvent?._id, user, selectedEvent?.isPublic, base_url]);

	// Fetch recordings for the event
	useEffect(() => {
		const fetchRecordings = async () => {
			if (!selectedEvent?._id || !selectedEvent?.zoomMeetingId) {
				setRecordings([]);
				return;
			}

			try {
				setIsLoadingRecordings(true);
				const response = await axios.get(`${base_url}/events/${selectedEvent._id}/zoom-recordings`);
				setRecordings(response.data.data?.recordings || []);
			} catch (error: any) {
				// 404 is normal if no recordings exist
				if (axiosOriginal.isAxiosError(error) && error.response?.status === 404) {
					setRecordings([]);
				} else {
					console.error('Error fetching recordings:', error);
					setRecordings([]);
				}
			} finally {
				setIsLoadingRecordings(false);
			}
		};

		if (eventDetailsModalOpen && selectedEvent) {
			fetchRecordings();
		} else {
			setRecordings([]);
		}
	}, [eventDetailsModalOpen, selectedEvent?._id, selectedEvent?.zoomMeetingId, base_url]);

	// Helper function to check if event has ended
	const isEventEnded = (event: Event | null): boolean => {
		if (!event) return false;
		const now = new Date();
		let eventEnd: Date | null = null;
		if (event.end && typeof event.end === 'string') {
			eventEnd = new Date(event.end);
		} else if (event.start && typeof event.start === 'string') {
			eventEnd = new Date(event.start);
		} else if (event.end && event.end instanceof Date) {
			eventEnd = event.end;
		} else if (event.start && event.start instanceof Date) {
			eventEnd = event.start;
		}
		return eventEnd ? eventEnd < now : false;
	};

	const handleRegisterForEvent = async () => {
		if (!selectedEvent?._id) return;

		// Check if event is in the past
		if (isEventEnded(selectedEvent)) {
			setRegisterErrorMsg('You cannot register because this event has already ended.');
			return;
		}

		try {
			setIsRegisterForEventSending(true);
			setRegisterErrorMsg(null);
			await axios.post(`${base_url}/eventRegistrations`, {
				eventId: selectedEvent?._id,
				userId: user?._id,
				firstName: user?.firstName,
				lastName: user?.lastName,
				email: user?.email,
				orgId,
			});
			setIsUserRegistered(true); // Update registration status
			setEventDetailsModalOpen(false);
			setIsRegisterForEventSuccess(true);
		} catch (error: any) {
			if (axiosOriginal.isAxiosError(error) && error.response?.status === 409) {
				setRegisterErrorMsg('You have already registered for this event.');
				setIsUserRegistered(true); // User is already registered
			} else {
				setRegisterErrorMsg('An error occurred while registering for the event.');
			}
		} finally {
			setIsRegisterForEventSending(false);
		}
	};

	return (
		<>
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
				<DialogContent sx={{ margin: isMobileSizeSmall ? '0rem' : '0.5rem 1rem 1rem 0.25rem' }}>
					<Box sx={{ display: 'flex', alignItems: 'center', mb: '0.75rem' }}>
						<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.85rem' : undefined }}>
							Title:
						</Typography>
						<Typography variant='body2' sx={{ ml: '0.5rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
							{selectedEvent?.title}
						</Typography>
					</Box>
					{selectedEvent?.description && (
						<Box sx={{ display: 'flex', alignItems: 'center', mb: '0.75rem' }}>
							<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.85rem' : undefined }}>
								Description:
							</Typography>
							<Typography variant='body2' sx={{ ml: '0.5rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								{selectedEvent?.description}
							</Typography>
						</Box>
					)}

					{selectedEvent?.start && (
						<Box sx={{ display: 'flex', alignItems: 'center', mb: '0.5rem' }}>
							<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.85rem' : undefined }}>
								Starts:
							</Typography>
							<Typography variant='body2' sx={{ ml: '0.5rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
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
							<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.85rem' : undefined }}>
								Ends:
							</Typography>
							<Typography variant='body2' sx={{ ml: '0.5rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
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
					{selectedEvent?.eventLinkUrl && !selectedEvent?.zoomJoinUrl && (
						<Box sx={{ display: 'flex', alignItems: 'center', mb: '0.75rem' }}>
							<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.85rem' : undefined }}>
								Link:
							</Typography>
							<Link href={selectedEvent.eventLinkUrl} sx={{ ml: '0.5rem' }} rel='noopener noreferrer' target='_blank'>
								<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
									{selectedEvent.eventLinkUrl}
								</Typography>
							</Link>
						</Box>
					)}

					{selectedEvent?.location && (
						<Box sx={{ display: 'flex', alignItems: 'center', mb: '0.75rem' }}>
							<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.85rem' : undefined }}>
								Location:
							</Typography>
							<Typography variant='body2' sx={{ ml: '0.5rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								{selectedEvent.location}
							</Typography>
						</Box>
					)}

					{selectedEvent?.isPublic && (
						<Box sx={{ display: 'flex', alignItems: 'center', mb: '0.75rem' }}>
							<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.85rem' : undefined }}>
								Type:
							</Typography>
							<Typography variant='body2' sx={{ ml: '0.5rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								{selectedEvent.type}
							</Typography>
						</Box>
					)}

					{selectedEvent?.createdBy && (
						<Box sx={{ display: 'flex', alignItems: 'center', mb: '0.75rem' }}>
							<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.85rem' : undefined }}>
								Added By:
							</Typography>
							<Typography variant='body2' sx={{ ml: '0.5rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								{selectedEvent.createdByName}
							</Typography>
						</Box>
					)}
					{/* Recordings section - show YouTube if available, otherwise Zoom recording */}
					{selectedEvent?.youtubeVideoId ? (
						<Box sx={{ mb: '0.75rem' }}>
							<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.85rem' : undefined, mb: '0.5rem' }}>
								Recording:
							</Typography>
							<Link
								onClick={() => navigate(`/event-recording/${selectedEvent?._id}`)}
								sx={{
									'display': 'block',
									'cursor': 'pointer',
									'color': theme.palette.primary.main,
									'textDecoration': 'none',
									'&:hover': {
										textDecoration: 'underline',
									},
								}}>
								<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
									Watch Recording (YouTube)
								</Typography>
							</Link>
						</Box>
					) : recordings.length > 0 ? (
						<Box sx={{ mb: '0.75rem' }}>
							<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.85rem' : undefined, mb: '0.5rem' }}>
								Recording:
							</Typography>
							<Link
								onClick={() => navigate(`/event-recording/${selectedEvent?._id}/${recordings[0].recordingId}`)}
								sx={{
									'display': 'block',
									'cursor': 'pointer',
									'color': theme.palette.primary.main,
									'textDecoration': 'none',
									'&:hover': {
										textDecoration: 'underline',
									},
								}}>
								<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
									Watch Recording ({new Date(recordings[0].recordingStart).toLocaleString()})
								</Typography>
							</Link>
						</Box>
					) : null}
					{isLoadingRecordings && (
						<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', color: 'text.secondary', mb: '0.75rem' }}>
							Checking for recordings...
						</Typography>
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
					{/* For public events: show Join Meeting if registered and has Zoom, otherwise show Register */}
					{/* Disable Join Meeting if recordings exist (YouTube or Zoom) */}
					{selectedEvent?.isPublic && selectedEvent?.zoomJoinUrl && isUserRegistered && !selectedEvent?.youtubeVideoId && recordings.length === 0 && (
						<CustomSubmitButton
							onClick={() => window.open(`/zoom-meeting/${selectedEvent._id}?autojoin=1`, '_blank', 'noopener,noreferrer')}
							sx={{
								'background': 'linear-gradient(135deg, #2D8CFF 0%, #0066CC 100%) !important',
								'backgroundColor': 'transparent !important',
								'color': 'white !important',
								'&:hover': {
									background: 'linear-gradient(135deg, #0066CC 0%, #2D8CFF 100%) !important',
								},
							}}>
							Join Meeting
						</CustomSubmitButton>
					)}
					{selectedEvent?.isPublic &&
						(!selectedEvent?.zoomJoinUrl || !isUserRegistered) &&
						!isEventEnded(selectedEvent) &&
						!selectedEvent?.youtubeVideoId &&
						recordings.length === 0 && (
							<CustomSubmitButton onClick={handleRegisterForEvent} disabled={isRegisterForEventSending}>
								{isRegisterForEventSending ? 'Registering...' : 'Register'}
							</CustomSubmitButton>
						)}
					{/* For non-public events: show Join Meeting if Zoom exists and no recordings (YouTube or Zoom) */}
					{!selectedEvent?.isPublic && selectedEvent?.zoomJoinUrl && !selectedEvent?.youtubeVideoId && recordings.length === 0 && (
						<CustomSubmitButton
							onClick={() => window.open(`/zoom-meeting/${selectedEvent._id}?autojoin=1`, '_blank', 'noopener,noreferrer')}
							sx={{
								'background': 'linear-gradient(135deg, #2D8CFF 0%, #0066CC 100%) !important',
								'backgroundColor': 'transparent !important',
								'color': 'white !important',
								'&:hover': {
									background: 'linear-gradient(135deg, #0066CC 0%, #2D8CFF 100%) !important',
								},
							}}>
							Join Meeting
						</CustomSubmitButton>
					)}
				</DialogActions>
			</CustomDialog>
			{isRegisterForEventSuccess && (
				<Snackbar
					open={isRegisterForEventSuccess}
					autoHideDuration={3000}
					anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
					onClose={() => {
						setIsRegisterForEventSuccess(false);
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
		</>
	);
};

export default EventDetailsDialog;
