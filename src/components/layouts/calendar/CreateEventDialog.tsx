import {
	Box,
	Checkbox,
	DialogContent,
	FormControl,
	FormControlLabel,
	IconButton,
	MenuItem,
	Select,
	SelectChangeEvent,
	Typography,
	Snackbar,
	Alert,
	DialogActions,
} from '@mui/material';
import CustomDialog from '../dialog/CustomDialog';
import CustomTextField from '../../forms/customFields/CustomTextField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { Cancel, InfoOutlined } from '@mui/icons-material';
import CustomDialogActions from '../dialog/CustomDialogActions';
import { AttendeeInfo, Event } from '../../../interfaces/event';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/en-gb';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useContext, useState, useEffect, useRef } from 'react';
import { CoursesContext } from '../../../contexts/CoursesContextProvider';
import { User } from '../../../interfaces/user';
import theme from '../../../themes';
import { UserAuthContext } from '../../../contexts/UserAuthContextProvider';
import { OrganisationContext } from '../../../contexts/OrganisationContextProvider';
import EventUserSearchSelect from '../../EventUserSearchSelect';
import EventInstructorSearchSelect from '../../EventInstructorSearchSelect';
import EventCourseSearchSelect from '../../EventCourseSearchSelect';
import { SearchUser } from '../../../interfaces/search';
import { SearchCourse } from '../../../interfaces/search';

import { EventsContext } from '../../../contexts/EventsContextProvider';
import { truncateText } from '../../../utils/utilText';
import { sendEventCreatedNotifications } from '../../../utils/eventNotifications';

import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import axios from '@utils/axiosInstance';
import HandleImageUploadURL from '../../forms/uploadImageVideoDocument/HandleImageUploadURL';
import ImageThumbnail from '../../forms/uploadImageVideoDocument/ImageThumbnail';
import { validateImageUrl } from '../../../utils/urlValidation';
import { useDashboardSync, dashboardSyncHelpers } from '../../../utils/dashboardSync';
import { useAuth } from '../../../hooks/useAuth';
import CustomCancelButton from '../../../components/forms/customButtons/CustomCancelButton';

interface CreateEventDialogProps {
	newEvent: Event;
	newEventModalOpen: boolean;
	setNewEvent: React.Dispatch<React.SetStateAction<Event>>;
	setNewEventModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const getDateTimeFormat = (locale: string) => {
	switch (locale.toLowerCase()) {
		case 'en-gb':
			return 'DD/MM/YYYY HH:mm';
		case 'tr':
		case 'tr-tr':
			return 'DD.MM.YYYY HH:mm';
		case 'de':
		case 'de-de':
			return 'DD.MM.YYYY HH:mm';
		default:
			return 'MM/DD/YYYY hh:mm A'; // fallback to US
	}
};

const CreateEventDialog = ({ newEvent, newEventModalOpen, setNewEvent, setNewEventModalOpen }: CreateEventDialogProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { user } = useContext(UserAuthContext);
	const { orgId } = useContext(OrganisationContext);
	const { courses } = useContext(CoursesContext);
	const { addNewEvent } = useContext(EventsContext);
	const { hasAdminAccess, isLearner, isInstructor } = useAuth();

	// Dashboard sync for real-time updates
	const { refreshDashboard } = useDashboardSync();

	const { isSmallScreen, isRotatedMedium, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const [searchLearnerValue, setSearchLearnerValue] = useState<string>('');
	const [searchInstructorValue, setSearchInstructorValue] = useState<string>('');
	const [searchCourseValue, setSearchCourseValue] = useState<string>('');
	const [enterCoverImageUrl, setEnterCoverImageUrl] = useState<boolean>(true);

	const [instructorSearchInfoOpen, setInstructorSearchInfoOpen] = useState<boolean>(false);
	const [learnerSearchInfoOpen, setLearnerSearchInfoOpen] = useState<boolean>(false);
	const [courseSearchInfoOpen, setCourseSearchInfoOpen] = useState<boolean>(false);

	// Refs for search components to access their reset functions
	const userSearchRef = useRef<any>(null);
	const instructorSearchRef = useRef<any>(null);
	const courseSearchRef = useRef<any>(null);

	// Handlers for new search components
	const handleUserSelect = (selectedUser: SearchUser) => {
		// Convert SearchUser to User format for compatibility
		const user: User = {
			_id: selectedUser._id, // Use MongoDB ObjectId
			firebaseUserId: selectedUser.firebaseUserId,
			username: selectedUser.username,
			email: selectedUser.email || '',
			imageUrl: selectedUser.imageUrl,
			role: selectedUser.role,
			// Add other required fields with defaults
			firstName: selectedUser.firstName || '',
			lastName: selectedUser.lastName || '',
			phone: '',
			orgId: orgId,
			isActive: true,
			hasRegisteredCourse: false,
			countryCode: '',
			isEmailVerified: false,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			// Add missing subscription properties
			isSubscribed: false,
			subscriptionType: null,
			subscriptionExpiry: '',
			subscriptionStatus: 'none',
			subscriptionValidUntil: '',
			accessLevel: 'limited',
		};

		// Check if user is already selected
		const isAlreadySelected = newEvent.attendees?.some((attendee) => attendee._id === user._id);
		if (!isAlreadySelected) {
			setNewEvent((prevData) => ({
				...prevData,
				attendees: [...prevData.attendees, user],
			}));
		}
		setSearchLearnerValue('');
	};

	const handleInstructorSelect = (selectedInstructor: SearchUser) => {
		// Convert SearchUser to User format for compatibility
		const instructor: User = {
			_id: selectedInstructor._id, // Use MongoDB ObjectId
			firebaseUserId: selectedInstructor.firebaseUserId,
			username: selectedInstructor.username,
			email: selectedInstructor.email || '',
			imageUrl: selectedInstructor.imageUrl,
			role: selectedInstructor.role,
			// Add other required fields with defaults
			firstName: selectedInstructor.firstName || '',
			lastName: selectedInstructor.lastName || '',
			phone: '',
			orgId: orgId,
			isActive: true,
			hasRegisteredCourse: false,
			countryCode: '',
			isEmailVerified: false,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			// Add missing subscription properties
			isSubscribed: false,
			subscriptionType: null,
			subscriptionExpiry: '',
			subscriptionStatus: 'none',
			subscriptionValidUntil: '',
			accessLevel: 'limited',
		};

		// Check if instructor is already selected
		const isAlreadySelected = newEvent.attendees?.some((attendee) => attendee._id === instructor._id);
		if (!isAlreadySelected) {
			setNewEvent((prevData) => {
				const newAttendees = [...prevData.attendees, instructor];
				return {
					...prevData,
					attendees: newAttendees,
				};
			});
		}
		setSearchInstructorValue('');
	};

	const handleCourseSelect = (selectedCourse: SearchCourse) => {
		// For event creation, we only need the course ID
		// Check if course is already selected
		const isAlreadySelected = newEvent.coursesIds?.includes(selectedCourse._id);
		if (!isAlreadySelected) {
			setNewEvent((prevData) => ({
				...prevData,
				coursesIds: [...prevData.coursesIds, selectedCourse._id],
			}));
		}
		setSearchCourseValue('');
	};

	// URL validation error handling
	const [isUrlErrorOpen, setIsUrlErrorOpen] = useState<boolean>(false);
	const [urlErrorMessage, setUrlErrorMessage] = useState<string>('');
	const [isProcessing, setIsProcessing] = useState<boolean>(false);

	useEffect(() => {
		let locale = navigator.language;
		// Map known browser locales to Dayjs locales
		if (locale.toLowerCase() === 'en-gb') {
			locale = 'en-gb';
		} else if (locale.toLowerCase() === 'tr' || locale.toLowerCase() === 'tr-tr') {
			locale = 'tr';
		} // Add more mappings as needed
		dayjs.locale(locale);
	}, []);

	// URL validation function
	const validateUrls = async (): Promise<boolean> => {
		let hasErrors = false;
		let errorMessages: string[] = [];

		// Validate event link URL if provided
		if (newEvent.eventLinkUrl?.trim()) {
			try {
				const url = new URL(newEvent.eventLinkUrl.trim());
				if (!url.protocol.startsWith('http')) {
					errorMessages.push('Event Link URL: Invalid URL format. Must start with http:// or https://');
					hasErrors = true;
				}
			} catch (error) {
				errorMessages.push('Event Link URL: Invalid URL format');
				hasErrors = true;
			}
		}

		// Validate cover image URL if provided (for public events)
		if (newEvent.isPublic && newEvent.coverImageUrl?.trim()) {
			const imageValidation = await validateImageUrl(newEvent.coverImageUrl.trim());
			if (!imageValidation.isValid) {
				errorMessages.push(`Cover Image URL: ${imageValidation.error}`);
				hasErrors = true;
			}
		}

		// Show error Snackbar if there are validation errors
		if (hasErrors) {
			setUrlErrorMessage(errorMessages.join('\n'));
			setIsUrlErrorOpen(true);
		}

		return !hasErrors;
	};

	const handleAddEvent = async () => {
		setIsProcessing(true);
		// Validate URLs before proceeding
		const urlsValid = await validateUrls();
		if (!urlsValid) {
			setIsProcessing(false);
			return; // Don't proceed if URL validation fails
		}

		const participants = [...newEvent.attendees]; // Start with selected attendees
		let allParticipantsIds: string[] = [];
		let allCoursesParticipantsInfo: AttendeeInfo[] = [];

		// Build the complete list of participants based on selections
		let allInstructors: AttendeeInfo[] = [];
		let allLearners: AttendeeInfo[] = [];
		let allSubscribers: AttendeeInfo[] = [];
		let courseParticipants: AttendeeInfo[] = [];

		// Handle "All Instructors" selection - fetch from API to get ALL instructors
		if (newEvent.isAllInstructorsSelected) {
			try {
				const response = await axios.get(`${base_url}/users/organisation/${orgId}?role=instructor&limit=10000`);
				const instructors = response.data.data || [];
				allInstructors = instructors.map((instructor: any) => ({
					_id: instructor._id,
					username: instructor.username,
					firebaseUserId: instructor.firebaseUserId,
					role: instructor.role,
				}));
			} catch (error) {
				console.error('Error fetching all instructors:', error);
			}
		}

		// Handle "All Learners" selection - fetch from API to get ALL learners
		if (newEvent.isAllLearnersSelected) {
			try {
				const response = await axios.get(`${base_url}/users/organisation/${orgId}?role=learner&limit=10000`);
				const learners = response.data.data || [];
				allLearners = learners.map((learner: any) => ({
					_id: learner._id,
					username: learner.username,
					firebaseUserId: learner.firebaseUserId,
					role: learner.role,
				}));
			} catch (error) {
				console.error('Error fetching all learners:', error);
			}
		}

		// Handle "All Subscribers" selection - fetch from API to get ALL subscribers
		if (newEvent.isAllSubscribersSelected) {
			try {
				const response = await axios.get(
					`${base_url}/users/organisation/${orgId}?role=learner&isSubscribed=true&subscriptionStatus=active&limit=10000`
				);
				const subscribers = response.data.data || [];
				allSubscribers = subscribers.map((subscriber: any) => ({
					_id: subscriber._id,
					username: subscriber.username,
					firebaseUserId: subscriber.firebaseUserId,
					role: subscriber.role,
				}));
			} catch (error) {
				console.error('Error fetching all subscribers:', error);
			}
		}

		// Handle "All Courses" selection
		if (newEvent.isAllCoursesSelected) {
			try {
				const res = await axios.get(`${base_url}/usercourses/participants/organisation/${orgId}`);
				courseParticipants = res.data.participants;
			} catch (error) {
				console.log(error);
			}
		} else if (newEvent.coursesIds && newEvent.coursesIds.length > 0) {
			// Handle specific courses selection
			await Promise.all(
				newEvent.coursesIds?.map((courseId) => {
					return (async () => {
						try {
							const res = await axios.get(`${base_url}/usercourses/course/${courseId}`);
							courseParticipants.push(...res.data.users);
						} catch (error) {
							console.log(error);
						}
					})();
				}) || []
			);
		}

		// Combine all participant sources and deduplicate
		const allParticipantSources = [
			...allInstructors,
			...allLearners,
			...allSubscribers,
			...courseParticipants,
			...participants, // Manually selected attendees
		];

		allCoursesParticipantsInfo = Array.from(new Map(allParticipantSources.map((user) => [user._id, user])).values());
		allParticipantsIds = allCoursesParticipantsInfo.map((participant) => participant._id);

		// Update event state with final participant list
		setNewEvent((prevData) => ({ ...prevData, allAttendeesIds: allParticipantsIds }));

		const event = {
			title: newEvent.title,
			description: newEvent.description,
			start: newEvent.start,
			end: newEvent.end,
			eventLinkUrl: newEvent.isZoomMeeting ? '' : newEvent.eventLinkUrl, // Clear eventLinkUrl if Zoom is selected
			location: newEvent.location,
			isAllDay: newEvent.isAllDay,
			isActive: true,
			orgId,
			attendees: newEvent.attendees?.map((attendee) => attendee._id) || [], // Send only ObjectIds
			allAttendeesIds: allParticipantsIds,
			isAllLearnersSelected: newEvent.isAllLearnersSelected,
			isAllInstructorsSelected: newEvent.isAllInstructorsSelected,
			isAllSubscribersSelected: newEvent.isAllSubscribersSelected,
			isAllCoursesSelected: newEvent.isAllCoursesSelected,
			coursesIds: newEvent.coursesIds,
			createdBy: user?._id!,
			isPublic: newEvent.isPublic,
			coverImageUrl: newEvent.isPublic ? newEvent.coverImageUrl : '',
			type: newEvent.isPublic ? newEvent.type : '',
			isZoomMeeting: newEvent.isZoomMeeting || false, // Send flag to backend to create Zoom meeting
		};

		try {
			// Use instructor route if user is instructor
			const endpoint = `${base_url}/events`;
			const res = await axios.post(endpoint, event);

			const createdEvent = res.data.data;
			// Backend now creates Zoom meeting automatically if isZoomMeeting is true
			// Zoom meeting data is already included in the response

			addNewEvent({
				...event,
				_id: createdEvent._id,
				...(createdEvent.zoomMeetingId && {
					zoomMeetingId: createdEvent.zoomMeetingId,
					zoomMeetingPassword: createdEvent.zoomMeetingPassword,
					zoomMeetingNumber: createdEvent.zoomMeetingNumber,
					zoomJoinUrl: createdEvent.zoomJoinUrl,
				}),
			});

			// Trigger dashboard sync when event is created
			dashboardSyncHelpers.onEventCreated(refreshDashboard);

			const startDate = newEvent?.start?.toLocaleDateString(navigator.language || undefined, {
				weekday: 'long',
				year: 'numeric',
				month: 'long',
				day: 'numeric',
				timeZoneName: 'short',
			});
			const startTime = newEvent?.start?.toLocaleTimeString(navigator.language || undefined, {
				hour: '2-digit',
				minute: '2-digit',
				timeZoneName: 'short',
			});

			void sendEventCreatedNotifications({
				user,
				newEventTitle: newEvent.title,
				startDate: startDate || '',
				startTime: startTime || '',
				participants: allCoursesParticipantsInfo,
				eventId: res.data.data._id,
				baseUrl: base_url,
				orgId,
				isPublic: newEvent.isPublic,
			}).catch((error) => {
				console.warn('Failed to send event created notifications:', error);
			});
		} catch (error: any) {
			console.log(error);
			// Show error message to user
			if (error?.response?.data?.message) {
				setUrlErrorMessage(error.response.data.message);
			} else {
				setUrlErrorMessage('Failed to create event. Please try again.');
			}
			setIsUrlErrorOpen(true);
		} finally {
			setIsProcessing(false);
		}

		// Only reset form and close modal on success
		resetNewEventForm();
		setNewEventModalOpen(false);
	};

	const resetNewEventForm = () => {
		setNewEvent(() => ({
			_id: '',
			title: '',
			description: '',
			start: null,
			end: null,
			eventLinkUrl: '',
			location: '',
			isAllDay: false,
			isActive: true,
			orgId,
			attendees: [],
			createdBy: '',
			createdAt: '',
			updatedAt: '',
			coursesIds: [],
			allAttendeesIds: [],
			isAllLearnersSelected: false,
			isAllSubscribersSelected: false,
			isAllCoursesSelected: false,
			isPublic: false,
			coverImageUrl: '',
			participantCount: 0,
			type: '',
			// Zoom fields
			zoomMeetingId: '',
			zoomMeetingPassword: '',
			zoomMeetingNumber: '',
			zoomJoinUrl: '',
			isZoomMeeting: false,
		}));

		setSearchLearnerValue('');
		setSearchInstructorValue('');
		setSearchCourseValue('');
	};

	return (
		<CustomDialog
			openModal={newEventModalOpen}
			closeModal={() => {
				if (!isProcessing) {
					setNewEventModalOpen(false);
					resetNewEventForm();
				}
			}}
			title='Create Event'
			maxWidth='sm'>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					handleAddEvent();
				}}>
				<DialogContent sx={{ mt: '-0.5rem' }}>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
						<CustomTextField
							label='Title'
							value={newEvent.title}
							placeholder='Enter a title (max 40 characters)'
							onChange={(e) => setNewEvent((prevData) => ({ ...prevData, title: e.target.value }))}
							InputProps={{ inputProps: { maxLength: 40 } }}
							sx={{ flex: 3 }}
						/>

						{hasAdminAccess && (
							<FormControlLabel
								labelPlacement='start'
								control={
									<Checkbox
										checked={newEvent.isPublic}
										onChange={(e) => {
											setNewEvent((prevData) => ({ ...prevData, isPublic: e.target.checked }));

											if (e.target.checked) {
												setNewEvent((prevData) => ({
													...prevData,
													attendees: [],
													coursesIds: [],
													allAttendeesIds: [],
													isAllCoursesSelected: false,
													isAllLearnersSelected: false,
												}));
											}
										}}
										sx={{
											'& .MuiSvgIcon-root': {
												fontSize: isMobileSize ? '0.9rem' : '1rem',
											},
										}}
									/>
								}
								label='Public Event'
								sx={{
									'& .MuiFormControlLabel-label': {
										fontSize: isMobileSize ? '0.6rem' : '0.7rem',
									},
									'mb': '0.85rem',
									'flex': 1,
									'ml': '1.65rem',
								}}
							/>
						)}
					</Box>

					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
						<CustomTextField
							label='Description'
							multiline
							rows={3}
							required={false}
							value={newEvent.description}
							onChange={(e) => setNewEvent((prevData) => ({ ...prevData, description: e.target.value }))}
							InputProps={{ inputProps: { maxLength: 75 } }}
							sx={{ flex: 3, mr: newEvent.isPublic ? '1rem' : '0rem' }}
							placeholder='Enter a description (max 75 characters)'
						/>
						{newEvent.isPublic && (
							<FormControl sx={{ flex: 1, mb: '0.5rem' }}>
								<Select
									displayEmpty
									value={newEvent.type}
									onChange={(e: SelectChangeEvent) => {
										setNewEvent(() => {
											return { ...newEvent, type: e.target.value };
										});
									}}
									size='small'
									required
									sx={{ backgroundColor: theme.bgColor?.common, fontSize: '0.8rem' }}>
									<MenuItem
										value=''
										selected
										sx={{
											fontSize: isMobileSize ? '0.65rem' : '0.8rem',
											textTransform: 'capitalize',
											padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
											minHeight: '2rem',
										}}>
										Select Type
									</MenuItem>
									{['Webinar', 'Guest Talk', 'Workshop', 'Training', 'Meeting', 'Other']?.map((type) => (
										<MenuItem value={type} key={type} sx={{ fontSize: '0.8rem' }}>
											{type}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						)}
					</Box>

					{newEvent.isPublic && (
						<Box sx={{ display: 'flex', mt: '1rem', mb: '1.5rem', justifyContent: 'space-between', alignItems: 'flex-start' }}>
							<Box sx={{ flex: 1 }}>
								<HandleImageUploadURL
									label='Cover Image'
									onImageUploadLogic={(url) => {
										if (newEvent) {
											setNewEvent({ ...newEvent, coverImageUrl: url });
										}
									}}
									onChangeImgUrl={(e) => {
										if (newEvent) {
											setNewEvent({ ...newEvent, coverImageUrl: e.target.value });
										}
									}}
									imageUrlValue={newEvent?.coverImageUrl || ''}
									imageFolderName='EventImages'
									enterImageUrl={enterCoverImageUrl}
									setEnterImageUrl={setEnterCoverImageUrl}
								/>
							</Box>
							<Box sx={{ ml: '3rem' }}>
								<ImageThumbnail
									imgSource={newEvent?.coverImageUrl || 'https://placehold.co/400x300/e2e8f0/64748b?text=Cover+Image'}
									removeImage={() => {
										if (newEvent) {
											setNewEvent({ ...newEvent, coverImageUrl: '' });
										}
									}}
									boxStyle={{ width: '8rem', height: '8rem' }}
									imgStyle={{ objectFit: 'cover', maxWidth: '100%', maxHeight: '100%' }}
								/>
							</Box>
						</Box>
					)}

					<Box sx={{ display: 'flex', mb: '0.85rem', justifyContent: 'space-between' }}>
						<Box sx={{ display: 'flex', flex: 4, justifyContent: 'space-between', mr: '0.5rem' }}>
							<LocalizationProvider dateAdapter={AdapterDayjs}>
								<DateTimePicker
									label='Start Time'
									value={newEvent.start ? dayjs(newEvent.start) : null}
									onChange={(newValue: Dayjs | null) => {
										setNewEvent((prevData) => {
											const updatedStart = newValue ? newValue.toDate() : null;
											let updatedEnd = prevData.end;

											// Check if the new start time is after the current end time
											if (updatedStart && updatedEnd && updatedStart >= updatedEnd) {
												// Set the end time to 1 hour after the new start time
												updatedEnd = new Date(updatedStart);
												updatedEnd.setHours(updatedStart.getHours() + 1);
											}

											return {
												...prevData,
												start: updatedStart,
												end: updatedEnd,
											};
										});
									}}
									slotProps={{
										textField: {
											fullWidth: true,
											variant: 'outlined',
											required: true,
											InputProps: {
												sx: { fontSize: isMobileSize ? '0.75rem' : '0.85rem' }, // Set font size
											},
										},
									}}
									sx={{ backgroundColor: '#fff', mr: '0.5rem' }}
									disabled={newEvent.isAllDay}
									format={getDateTimeFormat(navigator.language)}
								/>
							</LocalizationProvider>

							<LocalizationProvider dateAdapter={AdapterDayjs}>
								<DateTimePicker
									label='End Time'
									value={newEvent.end ? dayjs(newEvent.end) : null}
									onChange={(newValue: Dayjs | null) => {
										setNewEvent((prevData) => ({
											...prevData,
											end: newValue ? newValue.toDate() : null,
										}));
									}}
									slotProps={{
										textField: {
											fullWidth: true,
											variant: 'outlined',
											InputProps: {
												sx: { fontSize: isMobileSize ? '0.75rem' : '0.85rem' }, // Set font size
											},
										},
									}}
									sx={{ backgroundColor: '#fff' }}
									disabled={newEvent.isAllDay}
									format={getDateTimeFormat(navigator.language)}
								/>
							</LocalizationProvider>
						</Box>
						<FormControlLabel
							labelPlacement='start'
							control={
								<Checkbox
									checked={newEvent.isAllDay}
									onChange={(e) => {
										const isAllDay = e.target.checked;
										setNewEvent((prevData) => {
											let updatedStart = prevData.start;
											let updatedEnd = prevData.end;

											// If "All Day" is checked, set start and end to cover the full day
											if (isAllDay && updatedStart && updatedEnd) {
												updatedStart = new Date(updatedStart.setHours(0, 0, 0, 0));
												updatedEnd = new Date(updatedStart); // Start with the same day
												updatedEnd.setHours(23, 59, 59, 999);
											}

											return {
												...prevData,
												isAllDay,
												start: updatedStart,
												end: updatedEnd,
											};
										});
									}}
									sx={{
										'& .MuiSvgIcon-root': {
											fontSize: isVerySmallScreen ? '0.9rem' : '1rem', // Adjust the checkbox icon size
										},
									}}
								/>
							}
							label='All Day'
							sx={{
								'mt': '0.5rem',
								'& .MuiFormControlLabel-label': {
									fontSize: isMobileSize ? '0.7rem' : '0.8rem',
								},
							}}
						/>
					</Box>

					{!newEvent.isPublic && hasAdminAccess && (
						<>
							{/* Show selected instructors above instructor search */}
							{newEvent.attendees &&
								newEvent.attendees.filter((attendee) => {
									return attendee.role === 'instructor' || attendee.role === 'admin' || attendee.role === 'owner' || attendee.role === 'super-admin';
								}).length > 0 && (
									<Box sx={{ display: 'flex', margin: '1.5rem 0 0.75rem 0', flexWrap: 'wrap' }}>
										{newEvent.attendees
											?.filter(
												(attendee) =>
													attendee.role === 'instructor' || attendee.role === 'admin' || attendee.role === 'owner' || attendee.role === 'super-admin'
											)
											.map((attendee) => {
												return (
													<Box
														key={attendee._id}
														sx={{
															display: 'flex',
															alignItems: 'center',
															border: 'solid lightgray 0.1rem',
															padding: '0 0.25rem',
															height: '1.75rem',
															borderRadius: '0.25rem',
															margin: '0.35rem 0.35rem 0 0',
														}}>
														<Typography sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>{attendee.username}</Typography>
														<IconButton
															onClick={() => {
																const updatedAttendees =
																	newEvent.attendees?.filter((filteredAttendee) => attendee._id !== filteredAttendee._id) || [];
																setNewEvent((prevData) => ({ ...prevData, attendees: updatedAttendees }));
															}}>
															<Cancel sx={{ fontSize: isMobileSize ? '0.8rem' : '0.9rem' }} />
														</IconButton>
													</Box>
												);
											})}
									</Box>
								)}

							<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', mt: '0.5rem' }}>
								<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
									<Box sx={{ display: 'flex', flex: isMobileSize ? 5 : 3.5, alignItems: 'flex-start' }}>
										<EventInstructorSearchSelect
											ref={instructorSearchRef}
											value={searchInstructorValue}
											onChange={setSearchInstructorValue}
											onSelect={handleInstructorSelect}
											currentUserId={user?.firebaseUserId}
											placeholder={newEvent.isPublic || newEvent.isAllInstructorsSelected ? '' : 'Search Instructor'}
											disabled={newEvent.isPublic || newEvent.isAllInstructorsSelected}
											selectedUserIds={newEvent.attendees?.map((attendee) => attendee._id) || []}
											sx={{
												backgroundColor: newEvent.isPublic || newEvent.isAllInstructorsSelected ? 'transparent' : '#fff',
											}}
										/>
										{hasAdminAccess && (
											<IconButton
												sx={{ 'ml': '0.25rem', 'mt': '0.5rem', '&:hover': { backgroundColor: 'transparent' } }}
												onClick={() => setInstructorSearchInfoOpen(true)}>
												<InfoOutlined fontSize='small' sx={{ fontSize: isMobileSize ? '0.9rem' : '1rem' }} />
											</IconButton>
										)}
									</Box>
									<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: '0.55rem', flex: 1 }}>
										<FormControlLabel
											labelPlacement='start'
											disabled={newEvent.isPublic}
											control={
												<Checkbox
													checked={newEvent.isAllInstructorsSelected || false}
													onChange={(e) => {
														setSearchInstructorValue('');
														setSearchLearnerValue('');
														setSearchCourseValue('');

														setNewEvent((prevData) => ({
															...prevData,
															isAllInstructorsSelected: e.target.checked,
															// "All Instructors" and "All Courses" can be selected together (instructors are independent of courses)
														}));

														// Reset search results when "All Instructors" is checked
														if (e.target.checked) {
															// Reset all search results
															if (instructorSearchRef.current?.reset) {
																instructorSearchRef.current.reset();
															}
															if (userSearchRef.current?.reset) {
																userSearchRef.current.reset();
															}
															if (courseSearchRef.current?.reset) {
																courseSearchRef.current.reset();
															}

															// Clear all selections when "All Instructors" is selected
															setNewEvent((prevData) => ({
																...prevData,
																attendees: [],
																coursesIds: [],
																allAttendeesIds: [],
															}));
														}
													}}
													sx={{
														'& .MuiSvgIcon-root': {
															fontSize: isMobileSize ? '0.9rem' : '1rem',
														},
													}}
												/>
											}
											label={isMobileSize ? 'All' : 'All Instructors'}
											sx={{
												'& .MuiFormControlLabel-label': {
													fontSize: isMobileSize ? '0.6rem' : '0.7rem',
												},
											}}
										/>
									</Box>
								</Box>
							</Box>
						</>
					)}

					{!newEvent.isPublic && !isLearner && (
						<>
							{/* Show selected learners above learner search */}
							{newEvent.attendees && newEvent.attendees.filter((attendee) => attendee.role === 'learner').length > 0 && (
								<Box sx={{ display: 'flex', margin: '1.5rem 0 0.75rem 0', flexWrap: 'wrap' }}>
									{newEvent.attendees
										?.filter((attendee) => attendee.role === 'learner')
										.map((attendee) => {
											return (
												<Box
													key={attendee._id}
													sx={{
														display: 'flex',
														alignItems: 'center',
														border: 'solid lightgray 0.1rem',
														padding: '0 0.25rem',
														height: '1.75rem',
														borderRadius: '0.25rem',
														margin: '0.35rem 0.35rem 0 0',
													}}>
													<Typography sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>{attendee.username}</Typography>
													<IconButton
														onClick={() => {
															const updatedAttendees = newEvent.attendees?.filter((filteredAttendee) => attendee._id !== filteredAttendee._id) || [];
															setNewEvent((prevData) => ({ ...prevData, attendees: updatedAttendees }));
														}}>
														<Cancel sx={{ fontSize: isMobileSize ? '0.8rem' : '0.9rem' }} />
													</IconButton>
												</Box>
											);
										})}
								</Box>
							)}

							<Box
								sx={{
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									position: 'relative',
									mt: '0.5rem',
								}}>
								<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
									<Box sx={{ display: 'flex', flex: isMobileSize ? 5 : 3.5, alignItems: 'flex-start' }}>
										<EventUserSearchSelect
											ref={userSearchRef}
											value={searchLearnerValue}
											onChange={setSearchLearnerValue}
											onSelect={handleUserSelect}
											currentUserId={user?.firebaseUserId}
											placeholder={newEvent.isAllLearnersSelected || newEvent.isPublic ? '' : 'Search Learner'}
											disabled={newEvent.isAllLearnersSelected || newEvent.isPublic}
											selectedUserIds={newEvent.attendees?.map((attendee) => attendee._id) || []}
											sx={{
												backgroundColor: newEvent.isAllLearnersSelected || newEvent.isPublic ? 'transparent' : '#fff',
											}}
										/>
										{!isLearner && (
											<IconButton sx={{ 'ml': '0.25rem', 'mt': '0.5rem', '&:hover': { backgroundColor: 'transparent' } }}>
												<InfoOutlined
													fontSize='small'
													sx={{ fontSize: isMobileSize ? '0.9rem' : '1rem' }}
													onClick={() => setLearnerSearchInfoOpen(true)}
												/>
											</IconButton>
										)}
									</Box>
									{hasAdminAccess && (
										<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: '0.55rem', flex: 1 }}>
											<FormControlLabel
												labelPlacement='start'
												disabled={newEvent.isPublic}
												control={
													<Checkbox
														checked={newEvent.isAllLearnersSelected}
														onChange={(e) => {
															setSearchCourseValue('');
															setSearchLearnerValue('');
															setSearchInstructorValue('');

															setNewEvent((prevData) => ({
																...prevData,
																isAllLearnersSelected: e.target.checked,
																// "All Learners" covers all subscribers, so uncheck "All Subscribers" when "All Learners" is selected
																isAllSubscribersSelected: e.target.checked ? false : prevData.isAllSubscribersSelected,
																// "All Learners" and "All Courses" overlap (courses contain learners), so uncheck "All Courses" when "All Learners" is selected
																isAllCoursesSelected: e.target.checked ? false : prevData.isAllCoursesSelected,
															}));

															// Reset search results when "All Learners" is checked
															if (e.target.checked) {
																// Reset all search results
																if (userSearchRef.current?.reset) {
																	userSearchRef.current.reset();
																}
																if (courseSearchRef.current?.reset) {
																	courseSearchRef.current.reset();
																}
																if (instructorSearchRef.current?.reset) {
																	instructorSearchRef.current.reset();
																}

																setNewEvent((prevData) => ({
																	...prevData,
																	attendees: [],
																	coursesIds: [],
																	allAttendeesIds: [],
																}));
															}
														}}
														sx={{
															'& .MuiSvgIcon-root': {
																fontSize: isMobileSize ? '0.9rem' : '1rem',
															},
														}}
													/>
												}
												label={isMobileSize ? 'All' : 'All Learners'}
												sx={{
													'& .MuiFormControlLabel-label': {
														fontSize: isMobileSize ? '0.6rem' : '0.7rem',
													},
												}}
											/>
										</Box>
									)}
								</Box>
							</Box>
						</>
					)}

					{!newEvent.isPublic && hasAdminAccess && (
						<>
							<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', mt: '-0.5rem', mb: '2rem' }}>
								<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
									<Box sx={{ flex: 3 }}>{/* Placeholder for future subscriber search if needed */}</Box>
									<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: '0.55rem' }}>
										<FormControlLabel
											labelPlacement='start'
											disabled={newEvent.isPublic || newEvent.isAllLearnersSelected}
											control={
												<Checkbox
													checked={newEvent.isAllSubscribersSelected || false}
													onChange={(e) => {
														setSearchCourseValue('');
														setSearchLearnerValue('');
														setSearchInstructorValue('');

														setNewEvent((prevData) => ({
															...prevData,
															isAllSubscribersSelected: e.target.checked,
															// "All Subscribers" and "All Courses" can be selected together (different groups)
															// "All Subscribers" and "All Instructors" can be selected together (different groups)
														}));

														// Reset search results when "All Subscribers" is checked
														if (e.target.checked) {
															// Reset all search results
															if (userSearchRef.current?.reset) {
																userSearchRef.current.reset();
															}
															if (courseSearchRef.current?.reset) {
																courseSearchRef.current.reset();
															}
															if (instructorSearchRef.current?.reset) {
																instructorSearchRef.current.reset();
															}

															setNewEvent((prevData) => ({
																...prevData,
																attendees: [],
																coursesIds: [],
																allAttendeesIds: [],
															}));
														}
													}}
													sx={{
														'& .MuiSvgIcon-root': {
															fontSize: isMobileSize ? '0.9rem' : '1rem',
														},
													}}
												/>
											}
											label='All Subscribers'
											sx={{
												'& .MuiFormControlLabel-label': {
													fontSize: isMobileSize ? '0.6rem' : '0.7rem',
												},
											}}
										/>
									</Box>
								</Box>
							</Box>
						</>
					)}

					{newEvent.coursesIds && newEvent.coursesIds.length > 0 && (
						<Box sx={{ display: 'flex', margin: hasAdminAccess ? '-2rem 0 0.75rem 0' : '0.5rem 0 0.75rem 0', flexWrap: 'wrap' }}>
							{newEvent.coursesIds?.map((id) => {
								const course = courses?.find((course) => course._id === id);
								return (
									<Box
										key={course?._id}
										sx={{
											display: 'flex',
											alignItems: 'center',
											border: 'solid lightgray 0.1rem',
											padding: '0 0.25rem',
											height: '1.75rem',
											borderRadius: '0.25rem',
											margin: '0.35rem 0.35rem 0 0',
										}}>
										<Typography sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem' }}>{truncateText(course?.title!, 20)}</Typography>
										<IconButton
											onClick={() => {
												const updatedCourses = newEvent.coursesIds?.filter((filteredCourseId) => course?._id !== filteredCourseId) || [];

												setNewEvent((prevData) => ({ ...prevData, coursesIds: updatedCourses }));
											}}>
											<Cancel sx={{ fontSize: isMobileSize ? '0.8rem' : '0.9rem' }} />
										</IconButton>
									</Box>
								);
							})}
						</Box>
					)}

					{!newEvent.isPublic && !isLearner && (
						<Box
							sx={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								position: 'relative',
								mt: newEvent.coursesIds && newEvent.coursesIds.length > 0 ? '0.5rem' : '-1.25rem',
							}}>
							<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start', mt: '1rem' }}>
								<Box sx={{ display: 'flex', flex: isMobileSize ? 5 : 3.5, alignItems: 'flex-start' }}>
									<EventCourseSearchSelect
										ref={courseSearchRef}
										value={searchCourseValue}
										onChange={setSearchCourseValue}
										onSelect={handleCourseSelect}
										placeholder={newEvent.isAllLearnersSelected || newEvent.isAllCoursesSelected || newEvent.isPublic ? '' : 'Search Course'}
										disabled={newEvent.isAllLearnersSelected || newEvent.isAllCoursesSelected || newEvent.isPublic}
										selectedCourseIds={newEvent.coursesIds}
										sx={{
											backgroundColor: newEvent.isAllLearnersSelected || newEvent.isAllCoursesSelected || newEvent.isPublic ? 'transparent' : '#fff',
										}}
									/>
									{!isLearner && (
										<IconButton sx={{ 'ml': '0.25rem', 'mb': '2.15rem', '&:hover': { backgroundColor: 'transparent' } }}>
											<InfoOutlined
												fontSize='small'
												sx={{ fontSize: isMobileSize ? '0.9rem' : '1rem' }}
												onClick={() => setCourseSearchInfoOpen(true)}
											/>
										</IconButton>
									)}
								</Box>
								{hasAdminAccess && (
									<Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: '2.15rem', flex: 1 }}>
										<FormControlLabel
											disabled={newEvent.isAllLearnersSelected || newEvent.isPublic}
											labelPlacement='start'
											control={
												<Checkbox
													checked={newEvent.isAllCoursesSelected}
													onChange={(e) => {
														setSearchCourseValue('');
														setSearchLearnerValue('');
														setSearchInstructorValue('');

														setNewEvent((prevData) => ({
															...prevData,
															isAllCoursesSelected: e.target.checked,
															// "All Courses" contains learners, so uncheck "All Learners" when "All Courses" is selected
															// "All Instructors" can stay selected (instructors are independent of courses)
															isAllLearnersSelected: e.target.checked ? false : prevData.isAllLearnersSelected,
														}));

														// Reset search results when "All Courses" is checked
														if (e.target.checked) {
															// Reset all search results
															if (courseSearchRef.current?.reset) {
																courseSearchRef.current.reset();
															}
															if (userSearchRef.current?.reset) {
																userSearchRef.current.reset();
															}
															if (instructorSearchRef.current?.reset) {
																instructorSearchRef.current.reset();
															}

															setNewEvent((prevData) => ({
																...prevData,
																coursesIds: [],
																attendees: [],
																allAttendeesIds: [],
															}));
														}
													}}
													sx={{
														'& .MuiSvgIcon-root': {
															fontSize: isMobileSize ? '0.9rem' : '1rem', // Adjust the checkbox icon size
														},
													}}
												/>
											}
											label={isMobileSize ? 'All' : 'All Courses'}
											sx={{
												'& .MuiFormControlLabel-label': {
													fontSize: isMobileSize ? '0.6rem' : '0.7rem', // Adjust the label font size
												},
											}}
										/>
									</Box>
								)}
							</Box>
						</Box>
					)}

					{(hasAdminAccess || isInstructor) && (
						<FormControlLabel
							labelPlacement='start'
							control={
								<Checkbox
									checked={newEvent.isZoomMeeting || false}
									onChange={(e) => {
										const isChecked = e.target.checked;
										setNewEvent((prevData) => ({
											...prevData,
											isZoomMeeting: isChecked,
											// Clear event link when Zoom is selected
											eventLinkUrl: isChecked ? '' : prevData.eventLinkUrl,
										}));
									}}
									sx={{
										'& .MuiSvgIcon-root': {
											fontSize: isVerySmallScreen ? '0.9rem' : '1rem',
										},
									}}
								/>
							}
							label='Create Zoom Meeting'
							sx={{
								'mb': '0.5rem',
								'ml': '0rem',
								'& .MuiFormControlLabel-label': {
									fontSize: isMobileSize ? '0.7rem' : '0.8rem',
								},
							}}
						/>
					)}

					{!(hasAdminAccess || isInstructor) || !newEvent.isZoomMeeting ? (
						<CustomTextField
							label='Event Link'
							value={newEvent.eventLinkUrl}
							onChange={(e) => setNewEvent((prevData) => ({ ...prevData, eventLinkUrl: e.target.value }))}
							required={false}
							disabled={(hasAdminAccess || isInstructor) && newEvent.isZoomMeeting}
						/>
					) : null}

					<CustomTextField
						label='Location'
						value={newEvent.location}
						onChange={(e) => setNewEvent((prevData) => ({ ...prevData, location: e.target.value }))}
						required={false}
						InputProps={{ inputProps: { maxLength: 150 } }}
						placeholder='Enter a location (max 150 characters)'
						multiline
						rows={3}
					/>
				</DialogContent>
				<CustomDialogActions
					actionSx={{ margin: '-1rem 0.5rem 0.5rem 0' }}
					onCancel={() => {
						if (!isProcessing) {
							setNewEventModalOpen(false);
							resetNewEventForm();
						}
					}}
					disableCancelBtn={isProcessing}
					disableBtn={isProcessing}
				/>
			</form>
			<Snackbar
				open={isUrlErrorOpen}
				autoHideDuration={3500}
				anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
				onClose={() => setIsUrlErrorOpen(false)}>
				<Alert severity='error' variant='filled' sx={{ width: '100%' }}>
					{urlErrorMessage}
				</Alert>
			</Snackbar>
			<CustomDialog
				maxWidth='xs'
				openModal={instructorSearchInfoOpen}
				closeModal={() => setInstructorSearchInfoOpen(false)}
				title='Instructor Search Info'>
				<DialogContent>
					<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', lineHeight: 1.7 }}>
						This search is used to search for instructors and admins in the organization.
					</Typography>
				</DialogContent>
				<DialogActions>
					<CustomCancelButton onClick={() => setInstructorSearchInfoOpen(false)} sx={{ margin: '0 0.5rem 0.5rem 0' }}>
						Close
					</CustomCancelButton>
				</DialogActions>
			</CustomDialog>
			<CustomDialog maxWidth='xs' openModal={learnerSearchInfoOpen} closeModal={() => setLearnerSearchInfoOpen(false)} title='Learner Search Info'>
				<DialogContent>
					{hasAdminAccess ? (
						<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', lineHeight: 1.7 }}>
							This search is used to search for active learners (has registered course or subscriber) in the organization.
						</Typography>
					) : (
						<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', lineHeight: 1.7 }}>
							This search is used to search for active learners who has registered courses which you are the instructor of.
						</Typography>
					)}
				</DialogContent>
				<DialogActions>
					<CustomCancelButton onClick={() => setLearnerSearchInfoOpen(false)} sx={{ margin: '0 0.5rem 0.5rem 0' }}>
						Close
					</CustomCancelButton>
				</DialogActions>
			</CustomDialog>
			<CustomDialog maxWidth='xs' openModal={courseSearchInfoOpen} closeModal={() => setCourseSearchInfoOpen(false)} title='Course Search Info'>
				<DialogContent>
					{hasAdminAccess ? (
						<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', lineHeight: 1.7 }}>
							This search is used to search for published courses in the organization.
						</Typography>
					) : (
						<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', lineHeight: 1.7 }}>
							This search is used to search for published courses which you are the instructor of.
						</Typography>
					)}
					<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', lineHeight: 1.7, mt: '0.5rem' }}>
						When course(s) are selected, all the learners enrolled in the selected course(s) will be added to the event.
					</Typography>
				</DialogContent>
				<DialogActions>
					<CustomCancelButton onClick={() => setCourseSearchInfoOpen(false)} sx={{ margin: '0 0.5rem 0.5rem 0' }}>
						Close
					</CustomCancelButton>
				</DialogActions>
			</CustomDialog>
		</CustomDialog>
	);
};

export default CreateEventDialog;
