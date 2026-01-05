import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert, Button, Paper } from '@mui/material';
import axios from '@utils/axiosInstance';
import axiosOriginal from 'axios';

interface RecordingData {
	recordingId: string;
	recordingStart: string;
	recordingEnd: string;
	fileType: string;
	fileSize: number;
	playUrl: string;
	recordingType: string;
	status: string;
	password?: string; // Recording passcode if available
}

interface EventRecordingData {
	recordings: RecordingData[];
	meetingId: string;
	meetingTopic: string;
}

const EventRecordingPage = () => {
	const { eventId, recordingId } = useParams<{ eventId: string; recordingId: string }>();
	const navigate = useNavigate();
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [recording, setRecording] = useState<RecordingData | null>(null);
	const [eventData, setEventData] = useState<EventRecordingData | null>(null);
	const [eventDetails, setEventDetails] = useState<{ youtubeVideoId?: string; title?: string } | null>(null);

	useEffect(() => {
		const fetchRecording = async () => {
			if (!eventId) {
				setError('Event ID is missing');
				setLoading(false);
				return;
			}

			try {
				// First, fetch event details to check for YouTube video
				const eventResponse = await axios.get(`${base_url}/events/${eventId}`);
				const event = eventResponse.data.data;
				setEventDetails({
					youtubeVideoId: event?.youtubeVideoId,
					title: event?.title,
				});

				// If YouTube video exists, use that instead of Zoom recording
				if (event?.youtubeVideoId) {
					setLoading(false);
					return; // Will render YouTube embed
				}

				// Otherwise, fetch Zoom recording (if recordingId provided)
				if (!recordingId) {
					setError('Recording ID is missing');
					setLoading(false);
					return;
				}

				// Fetch all recordings for the event
				const response = await axios.get(`${base_url}/events/${eventId}/zoom-recordings`);
				const data: EventRecordingData = response.data.data;

				if (!data || !data.recordings || data.recordings.length === 0) {
					setError('No recordings found for this event');
					setLoading(false);
					return;
				}

				// Find the specific recording
				const foundRecording = data.recordings.find((r) => r.recordingId === recordingId);
				if (!foundRecording) {
					setError('Recording not found');
					setLoading(false);
					return;
				}

				setRecording(foundRecording);
				setEventData(data);
				setLoading(false);
			} catch (err: any) {
				console.error('Error fetching recording:', err);
				if (axiosOriginal.isAxiosError(err) && err.response?.status === 404) {
					setError('Recording not found');
				} else if (axiosOriginal.isAxiosError(err) && err.response?.status === 403) {
					setError('You do not have access to this recording');
				} else if (axiosOriginal.isAxiosError(err) && err.response?.status === 401) {
					setError('Authentication required to view this recording');
				} else {
					setError(err.response?.data?.message || 'Failed to load recording');
				}
				setLoading(false);
			}
		};

		fetchRecording();
	}, [eventId, recordingId, base_url]);

	if (loading) {
		return (
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'center',
					height: '100vh',
					gap: 2,
				}}>
				<CircularProgress />
				<Typography variant='body1'>Loading recording...</Typography>
			</Box>
		);
	}

	// If YouTube video exists, show YouTube embed
	if (eventDetails?.youtubeVideoId) {
		return (
			<Box
				sx={{
					width: '100%',
					height: '100vh',
					display: 'flex',
					flexDirection: 'column',
					p: { xs: 1, sm: 2, md: 3 },
					justifyContent: 'center',
					alignItems: 'center',
					overflow: 'hidden',
				}}>
				<Paper
					elevation={3}
					sx={{
						width: '100%',
						height: '100%',
						maxWidth: { xs: '100%', sm: 1100 },
						maxHeight: '100%',
						mx: 'auto',
						p: { xs: 1.5, sm: 2, md: 3 },
						bgcolor: 'white',
						display: 'flex',
						flexDirection: 'column',
						overflow: 'hidden',
					}}>
					{/* Event Info */}
					<Box
						sx={{
							mb: { xs: 1.5, sm: 2 },
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							flexShrink: 0,
							gap: 1,
						}}>
						<Typography
							variant='h4'
							sx={{
								fontWeight: 'bold',
								fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' },
								overflow: 'hidden',
								textOverflow: 'ellipsis',
								whiteSpace: 'nowrap',
								flex: 1,
							}}>
							{eventDetails.title || 'Event Recording'}
						</Typography>
						<Button variant='outlined' onClick={() => navigate(-1)} sx={{ textTransform: 'capitalize', flexShrink: 0 }} size='small'>
							Go Back
						</Button>
					</Box>

					{/* Embedded YouTube Player - Responsive container */}
					<Box
						sx={{
							position: 'relative',
							width: '100%',
							flex: 1,
							minHeight: 0,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							borderRadius: 2,
							boxShadow: 2,
							overflow: 'hidden',
							mb: { xs: 1.5, sm: 2 },
							bgcolor: '#000',
						}}>
						<Box
							sx={{
								'position': 'relative',
								// Fit video within available space while maintaining 16:9 aspect ratio
								'width': '100%',
								'height': '100%',
								'aspectRatio': '16 / 9',
								'maxWidth': '100%',
								'maxHeight': '100%',
								// Landscape: use full width, height adjusts automatically
								'@media (orientation: landscape)': {
									width: '100%',
									height: 'auto',
									maxHeight: '100%',
								},
								// Portrait: use full height, width adjusts to maintain aspect ratio
								'@media (orientation: portrait)': {
									width: 'auto',
									height: '100%',
									maxWidth: '100%',
									// Ensure minimum width to prevent too narrow video
									minWidth: 0,
								},
							}}>
							<iframe
								src={`https://www.youtube.com/embed/${eventDetails.youtubeVideoId}`}
								title='YouTube Recording'
								style={{
									position: 'absolute',
									top: 0,
									left: 0,
									width: '100%',
									height: '100%',
									border: 'none',
								}}
								allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
								allowFullScreen
							/>
						</Box>
					</Box>
				</Paper>
			</Box>
		);
	}

	// Fallback to Zoom recording if YouTube not available
	if (error || !recording || !eventData) {
		return (
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'center',
					height: '100vh',
					gap: 2,
					p: 3,
				}}>
				<Alert severity='error' sx={{ mb: 2, maxWidth: 500 }}>
					{error || 'Recording not found'}
				</Alert>
				<Button variant='contained' onClick={() => navigate(-1)}>
					Go Back
				</Button>
			</Box>
		);
	}

	return (
		<Box
			sx={{
				width: '100%',
				minHeight: '100vh',
				display: 'flex',
				flexDirection: 'column',
				bgcolor: '#f7f9fb',
				p: { xs: 2, sm: 3, md: 4 },
			}}>
			<Paper
				elevation={3}
				sx={{
					width: '100%',
					maxWidth: 1200,
					mx: 'auto',
					p: { xs: 2, sm: 3, md: 4 },
					bgcolor: 'white',
				}}>
				{/* Event Info */}
				<Box sx={{ mb: 3 }}>
					<Typography variant='h4' sx={{ mb: 1, fontWeight: 'bold' }}>
						{eventData.meetingTopic}
					</Typography>
					<Typography variant='body2' sx={{ color: 'text.secondary', mb: 2 }}>
						Recording from {new Date(recording.recordingStart).toLocaleString()} - {new Date(recording.recordingEnd).toLocaleString()}
					</Typography>
					{recording.password && (
						<Alert severity='info' sx={{ mt: 2, mb: 2 }}>
							<Typography variant='body2' sx={{ fontWeight: 'bold', mb: 0.5 }}>
								Recording Passcode:
							</Typography>
							<Typography variant='h6' sx={{ fontFamily: 'monospace', letterSpacing: 2 }}>
								{recording.password}
							</Typography>
							<Typography variant='caption' sx={{ mt: 1, display: 'block' }}>
								If prompted, enter this passcode to view the recording.
							</Typography>
						</Alert>
					)}
				</Box>

				{/* Embedded Zoom Player */}
				<Box
					sx={{
						position: 'relative',
						width: '100%',
						paddingBottom: '56.25%', // 16:9 aspect ratio
						height: 0,
						overflow: 'hidden',
						borderRadius: 2,
						boxShadow: 2,
						mb: 3,
					}}>
					<iframe
						src={recording.playUrl}
						title='Zoom Recording'
						style={{
							position: 'absolute',
							top: 0,
							left: 0,
							width: '100%',
							height: '100%',
							border: 'none',
						}}
						allow='autoplay; encrypted-media'
						allowFullScreen
					/>
				</Box>

				{/* Back Button */}
				<Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
					<Button variant='outlined' onClick={() => navigate(-1)}>
						Go Back
					</Button>
				</Box>
			</Paper>
		</Box>
	);
};

export default EventRecordingPage;
