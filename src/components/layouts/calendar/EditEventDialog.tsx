import {
	Box,
	Button,
	Checkbox,
	DialogContent,
	FormControl,
	FormControlLabel,
	IconButton,
	MenuItem,
	Select,
	SelectChangeEvent,
	Tooltip,
	Typography,
	Snackbar,
	Alert,
	DialogActions,
} from '@mui/material';
import { AttendeeInfo, Event } from '../../../interfaces/event';
import CustomDialog from '../dialog/CustomDialog';
import CustomTextField from '../../forms/customFields/CustomTextField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/en-gb';
import { Cancel, InfoOutlined } from '@mui/icons-material';
import { User } from '../../../interfaces/user';
import { useContext, useState, useRef, useEffect } from 'react';
import { UsersContext } from '../../../contexts/UsersContextProvider';
import { UserAuthContext } from '../../../contexts/UserAuthContextProvider';
import { CoursesContext } from '../../../contexts/CoursesContextProvider';
import CustomDialogActions from '../dialog/CustomDialogActions';
import { EventsContext } from '../../../contexts/EventsContextProvider';

import CustomDeleteButton from '../../forms/customButtons/CustomDeleteButton';
import theme from '../../../themes';
import { truncateText } from '../../../utils/utilText';

import { OrganisationContext } from '../../../contexts/OrganisationContextProvider';
import { sendEventUpdatedNotifications } from '../../../utils/eventNotifications';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import axios from '@utils/axiosInstance';
import HandleImageUploadURL from '../../forms/uploadImageVideoDocument/HandleImageUploadURL';
import ImageThumbnail from '../../forms/uploadImageVideoDocument/ImageThumbnail';
import { validateImageUrl } from '../../../utils/urlValidation';
import { useDashboardSync, dashboardSyncHelpers } from '../../../utils/dashboardSync';
import EventUserSearchSelect from '../../EventUserSearchSelect';
import EventInstructorSearchSelect from '../../EventInstructorSearchSelect';
import EventCourseSearchSelect from '../../EventCourseSearchSelect';
import { SearchUser } from '../../../interfaces/search';
import { SearchCourse } from '../../../interfaces/search';
import { useAuth } from '../../../hooks/useAuth';
import CustomCancelButton from '../../../components/forms/customButtons/CustomCancelButton';

interface EditEventDialogProps {
	setIsEventDeleted: React.Dispatch<React.SetStateAction<boolean>>;
	editEventModalOpen: boolean;
	selectedEvent: Event | null;
	setEditEventModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
	setSelectedEvent: React.Dispatch<React.SetStateAction<Event | null>>;
	setIsUpdatingEvent?: React.Dispatch<React.SetStateAction<boolean>>;
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

const EditEventDialog = ({
	setIsEventDeleted,
	editEventModalOpen,
	selectedEvent,
	setEditEventModalOpen,
	setSelectedEvent,
	setIsUpdatingEvent,
}: EditEventDialogProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { users } = useContext(UsersContext);
	const { user } = useContext(UserAuthContext);
	const { orgId } = useContext(OrganisationContext);
	const { courses } = useContext(CoursesContext);
	const { updateEvent, removeEvent } = useContext(EventsContext);
	const { hasAdminAccess, isLearner, isInstructor } = useAuth();
	const canManageEvent = !!selectedEvent && (selectedEvent.createdBy === user?._id || hasAdminAccess);

	// Dashboard sync for real-time updates
	const { refreshDashboard } = useDashboardSync();

	const { isSmallScreen, isRotatedMedium, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const [deleteEventModalOpen, setDeleteEventModalOpen] = useState<boolean>(false);
	const [isProcessing, setIsProcessing] = useState<boolean>(false);
	const [isStartingMeeting, setIsStartingMeeting] = useState<boolean>(false);

	const [searchLearnerValue, setSearchLearnerValue] = useState<string>('');
	const [searchInstructorValue, setSearchInstructorValue] = useState<string>('');
	const [searchCourseValue, setSearchCourseValue] = useState<string>('');

	const [isEventUpdated, setIsEventUpdated] = useState<boolean>(false);
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
			firstName: '',
			lastName: '',
			phone: '',
			orgId: orgId,
			isActive: true,
			hasRegisteredCourse: false,
			countryCode: '',
			isEmailVerified: false,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			isSubscribed: false,
			subscriptionType: null,
			subscriptionExpiry: '',
			subscriptionStatus: 'none',
			subscriptionValidUntil: '',
			accessLevel: 'limited',
		};

		// Check if user is already selected
		const isAlreadySelected = selectedEvent?.attendees?.some((attendee) => attendee._id === user._id);
		if (!isAlreadySelected && selectedEvent) {
			setSelectedEvent((prevData) => {
				if (prevData) {
					const newAttendees = [...prevData.attendees, user];

					return {
						...prevData,
						attendees: newAttendees,
					};
				}
				return prevData;
			});
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
		const isAlreadySelected = selectedEvent?.attendees?.some((attendee) => attendee._id === instructor._id);
		if (!isAlreadySelected && selectedEvent) {
			setSelectedEvent((prevData) => {
				if (prevData) {
					const newAttendees = [...prevData.attendees, instructor];

					return {
						...prevData,
						attendees: newAttendees,
					};
				}
				return prevData;
			});
		}
		setSearchInstructorValue('');
	};

	const handleCourseSelect = (selectedCourse: SearchCourse) => {
		// For event editing, we only need the course ID
		// Check if course is already selected
		const isAlreadySelected = selectedEvent?.coursesIds?.includes(selectedCourse._id);
		if (!isAlreadySelected && selectedEvent) {
			setSelectedEvent((prevData) => {
				if (prevData) {
					return {
						...prevData,
						coursesIds: [...prevData.coursesIds, selectedCourse._id],
					};
				}
				return prevData;
			});
		}
		setSearchCourseValue('');
	};

	// URL validation error handling
	const [isUrlErrorOpen, setIsUrlErrorOpen] = useState<boolean>(false);
	const [urlErrorMessage, setUrlErrorMessage] = useState<string>('');

	const originalIsPublic = useRef<boolean>(false);

	// Store the original isPublic value when the dialog was opened
	useEffect(() => {
		if (editEventModalOpen && selectedEvent) {
			originalIsPublic.current = selectedEvent.isPublic;
		}
	}, [editEventModalOpen]);

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
		if (selectedEvent?.eventLinkUrl?.trim()) {
			try {
				const url = new URL(selectedEvent.eventLinkUrl.trim());
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
		if (selectedEvent?.isPublic && selectedEvent?.coverImageUrl?.trim()) {
			const imageValidation = await validateImageUrl(selectedEvent.coverImageUrl.trim());
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

	// Populate role information for existing attendees when dialog opens
	// Also set isZoomMeeting flag if Zoom fields exist
	useEffect(() => {
		if (editEventModalOpen && selectedEvent) {
			// Check if Zoom fields exist to set isZoomMeeting flag
			const hasZoomFields = !!(selectedEvent.zoomMeetingId || selectedEvent.zoomMeetingNumber);
			if (hasZoomFields && !selectedEvent.isZoomMeeting) {
				setSelectedEvent((prevData) => {
					if (prevData) {
						return { ...prevData, isZoomMeeting: true };
					}
					return prevData;
				});
			}

			// Populate role information for attendees
			if (selectedEvent.attendees && users) {
				const attendeesWithoutRole = selectedEvent.attendees.filter((attendee) => !attendee.role);

				if (attendeesWithoutRole.length > 0) {
					// Find role information from users context
					const attendeesToUpdate = attendeesWithoutRole.map((attendee) => {
						const userFromContext = users.find((user) => user._id === attendee._id);
						if (userFromContext && userFromContext.role) {
							return { ...attendee, role: userFromContext.role };
						}
						return attendee;
					});

					// Update attendees with role information
					const hasUpdates = attendeesToUpdate.some((attendee, index) => attendee.role !== attendeesWithoutRole[index].role);

					if (hasUpdates) {
						setSelectedEvent((prevData) => {
							if (prevData) {
								const updatedAttendees = prevData.attendees.map((a) => {
									const updatedAttendee = attendeesToUpdate.find((ua) => ua._id === a._id);
									return updatedAttendee || a;
								});
								return { ...prevData, attendees: updatedAttendees };
							}
							return prevData;
						});
					}
				}
			}
		}
	}, [editEventModalOpen, users]); // Removed selectedEvent?.attendees dependency to prevent infinite loops

	const editEvent = async () => {
		setIsProcessing(true);
		if (setIsUpdatingEvent) setIsUpdatingEvent(true);

		// Validate URLs before proceeding
		const urlsValid = await validateUrls();
		if (!urlsValid) {
			setIsProcessing(false);
			if (setIsUpdatingEvent) setIsUpdatingEvent(false);
			return; // Don't proceed if URL validation fails
		}

		// Use the original isPublic value from when the dialog was opened
		const wasPublic = originalIsPublic.current;
		const previousAttendeeIds = selectedEvent?.allAttendeesIds || [];
		const participants = [...(selectedEvent?.attendees || [])]; // Start with selected attendees
		let allParticipantsIds: string[] = [];
		let allCoursesParticipantsInfo: AttendeeInfo[] = [];

		// Build the complete list of participants based on selections
		let allInstructors: AttendeeInfo[] = [];
		let allLearners: AttendeeInfo[] = [];
		let allSubscribers: AttendeeInfo[] = [];
		let courseParticipants: AttendeeInfo[] = [];

		// Handle "All Instructors" selection - fetch from API to get ALL instructors
		if (selectedEvent?.isAllInstructorsSelected) {
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
		if (selectedEvent?.isAllLearnersSelected) {
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
		if (selectedEvent?.isAllSubscribersSelected) {
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
		if (selectedEvent?.isAllCoursesSelected) {
			try {
				const res = await axios.get(`${base_url}/usercourses/participants/organisation/${orgId}`);
				courseParticipants = res.data.participants;
			} catch (error) {
				console.log(error);
			}
		} else if (selectedEvent?.coursesIds && selectedEvent?.coursesIds && selectedEvent?.coursesIds.length > 0) {
			// Handle specific courses selection
			await Promise.all(
				selectedEvent?.coursesIds?.map((courseId) => {
					return (async () => {
						try {
							const res = await axios.get(`${base_url}/userCourses/course/${courseId}`);
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
		setSelectedEvent((prevData) => {
			if (prevData) {
				return { ...prevData, allAttendeesIds: allParticipantsIds };
			}
			return prevData;
		});

		try {
			const uniqueAllAttendeesIds = [...new Set(allParticipantsIds)];
			// Only update the event if there are changes
			let updateResponse = null;
			if (isEventUpdated) {
				const endpoint = `${base_url}/events/${selectedEvent?._id}`;

				updateResponse = await axios.patch(endpoint, {
					...selectedEvent,
					attendees: selectedEvent?.attendees?.map((a) => a._id) || [],
					allAttendeesIds: uniqueAllAttendeesIds,
					isAllInstructorsSelected: selectedEvent?.isAllInstructorsSelected,
					isAllSubscribersSelected: selectedEvent?.isAllSubscribersSelected,
					type: !selectedEvent?.isPublic ? '' : selectedEvent?.type,
					coverImageUrl: !selectedEvent?.isPublic ? '' : selectedEvent?.coverImageUrl,
					// Clear eventLinkUrl if Zoom is selected
					eventLinkUrl: selectedEvent?.isZoomMeeting ? '' : selectedEvent?.eventLinkUrl,
					isZoomMeeting: selectedEvent?.isZoomMeeting || false, // Send flag to backend to create Zoom meeting
				});

				// Backend now creates Zoom meeting automatically if isZoomMeeting is true
				// Update local state with Zoom data from response if it exists
				const updatedEventData = updateResponse.data.data;
				if (updatedEventData?.zoomMeetingId) {
					setSelectedEvent((prevData) => {
						if (prevData) {
							return {
								...prevData,
								zoomMeetingId: updatedEventData.zoomMeetingId,
								zoomMeetingPassword: updatedEventData.zoomMeetingPassword,
								zoomMeetingNumber: updatedEventData.zoomMeetingNumber,
								zoomJoinUrl: updatedEventData.zoomJoinUrl,
							};
						}
						return prevData;
					});
				}
			}

			if (selectedEvent) {
				// Get updated event data from response (includes Zoom meeting data if created)
				const updatedEventData = isEventUpdated && updateResponse?.data?.data ? updateResponse.data.data : selectedEvent;

				updateEvent({
					...selectedEvent,
					allAttendeesIds: uniqueAllAttendeesIds,
					type: !selectedEvent?.isPublic ? '' : selectedEvent?.type,
					coverImageUrl: !selectedEvent?.isPublic ? '' : selectedEvent?.coverImageUrl,
					// Include Zoom data from backend response if it exists
					...(updatedEventData?.zoomMeetingId && {
						zoomMeetingId: updatedEventData.zoomMeetingId,
						zoomMeetingPassword: updatedEventData.zoomMeetingPassword,
						zoomMeetingNumber: updatedEventData.zoomMeetingNumber,
						zoomJoinUrl: updatedEventData.zoomJoinUrl,
					}),
				});
			}

			// Trigger dashboard sync when event is updated
			dashboardSyncHelpers.onEventCreated(refreshDashboard);

			const startDate = selectedEvent?.start?.toLocaleDateString(navigator.language || undefined, {
				weekday: 'long',
				year: 'numeric',
				month: 'long',
				day: 'numeric',
				timeZoneName: 'short',
			});
			const startTime = selectedEvent?.start?.toLocaleTimeString(navigator.language || undefined, {
				hour: '2-digit',
				minute: '2-digit',
				timeZoneName: 'short',
			});

			// Send notifications using the utility function
			void sendEventUpdatedNotifications({
				user,
				selectedEvent,
				startDate: startDate || '',
				startTime: startTime || '',
				previousAttendeeIds,
				allCoursesParticipantsInfo,
				baseUrl: base_url,
				orgId,
				wasPublic,
			}).catch((error) => {
				console.warn('Failed to send event updated notifications:', error);
			});

			// Prevent Calendar.tsx effect from immediately re-opening the dialog when selectedEvent changes.
			setSelectedEvent(null);
			setEditEventModalOpen(false);
		} catch (error: any) {
			console.log(error);
			// Show error message to user
			if (error?.response?.data?.message) {
				setUrlErrorMessage(error.response.data.message);
			} else {
				setUrlErrorMessage('Failed to update event. Please try again.');
			}
			setIsUrlErrorOpen(true);
		} finally {
			setIsProcessing(false);
			if (setIsUpdatingEvent) setIsUpdatingEvent(false);
		}
	};

	const deleteEvent = async () => {
		try {
			// Use instructor route if user is instructor
			const endpoint = `${base_url}/events/${selectedEvent?._id}`;
			await axios.delete(endpoint);
			if (selectedEvent?._id) removeEvent(selectedEvent?._id);

			// Trigger dashboard sync when event is deleted
			dashboardSyncHelpers.onEventCreated(refreshDashboard);

			setIsEventDeleted(true);
			setEditEventModalOpen(false);
			setDeleteEventModalOpen(false);
		} catch (error) {
			console.log(error);
		}
	};

	return (
		<CustomDialog
			openModal={editEventModalOpen}
			closeModal={() => {
				if (!isProcessing) {
					setEditEventModalOpen(false);
					setSearchLearnerValue('');
					setSearchInstructorValue('');
					setSearchCourseValue('');
					setIsEventUpdated(false);
				}
			}}
			title={`Edit Event${selectedEvent?.createdByName ? ` - (Added by ${selectedEvent.createdByName})` : ''}`}
			maxWidth='sm'>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					editEvent();
					setIsEventUpdated(false);
					setSearchLearnerValue('');
					setSearchInstructorValue('');
					setSearchCourseValue('');
				}}>
				<DialogContent sx={{ mt: '-1rem' }}>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
						<Tooltip title='Max 40 characters' placement='top' arrow>
							<CustomTextField
								label='Title'
								value={selectedEvent?.title}
								onChange={(e) => {
									setSelectedEvent((prevData) => {
										if (prevData) {
											return { ...prevData, title: e.target.value };
										}
										return prevData;
									});
									setIsEventUpdated(true);
								}}
								InputProps={{ inputProps: { maxLength: 40 } }}
								sx={{ flex: 3 }}
								disabled={selectedEvent?.isPublic || selectedEvent?.createdBy !== user?._id}
							/>
						</Tooltip>
						{hasAdminAccess && selectedEvent?.createdBy === user?._id && (
							<FormControlLabel
								labelPlacement='start'
								control={
									<Checkbox
										checked={selectedEvent?.isPublic}
										onChange={(e) => {
											setSelectedEvent((prevData) => {
												if (prevData) {
													return { ...prevData, isPublic: e.target.checked, type: '' };
												}
												return prevData;
											});
											setIsEventUpdated(true);
											if (e.target.checked) {
												setSelectedEvent((prevData) => {
													if (prevData) {
														return {
															...prevData,
															attendees: [],
															coursesIds: [],
															allAttendeesIds: [],
															isAllCoursesSelected: false,
															isAllLearnersSelected: false,
														};
													}
													return prevData;
												});
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
							value={selectedEvent?.description}
							onChange={(e) => {
								setSelectedEvent((prevData) => {
									if (prevData) {
										return { ...prevData, description: e.target.value };
									}
									return prevData;
								});
								setIsEventUpdated(true);
							}}
							InputProps={{ inputProps: { maxLength: 75 } }}
							sx={{ flex: 3, mr: selectedEvent?.isPublic ? '1rem' : '0rem' }}
							placeholder='Enter a description for the event (max 75 characters)'
							disabled={selectedEvent?.isPublic || selectedEvent?.createdBy !== user?._id}
						/>
						{selectedEvent?.isPublic && (
							<FormControl sx={{ flex: 1, mb: '0.5rem' }}>
								<Select
									displayEmpty
									value={selectedEvent?.type}
									onChange={(e: SelectChangeEvent) => {
										setSelectedEvent((prevData) => {
											if (prevData) {
												return { ...prevData, type: e.target.value };
											}
											return prevData;
										});
										setIsEventUpdated(true);
									}}
									size='small'
									disabled={!canManageEvent}
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

					{selectedEvent?.isPublic && (
						<Box sx={{ display: 'flex', mt: '1rem', mb: '1.5rem', justifyContent: 'space-between', alignItems: 'flex-start' }}>
							<Box sx={{ flex: 1 }}>
								<HandleImageUploadURL
									label='Cover Image'
									onImageUploadLogic={(url) => {
										if (selectedEvent) {
											setSelectedEvent({ ...selectedEvent, coverImageUrl: url });
										}
										setIsEventUpdated(true);
									}}
									onChangeImgUrl={(e) => {
										if (selectedEvent) {
											setSelectedEvent({ ...selectedEvent, coverImageUrl: e.target.value });
										}
										setIsEventUpdated(true);
									}}
									imageUrlValue={selectedEvent?.coverImageUrl || ''}
									imageFolderName='EventImages'
									enterImageUrl={enterCoverImageUrl}
									setEnterImageUrl={setEnterCoverImageUrl}
									disabled={!canManageEvent}
								/>
							</Box>
							<Box sx={{ ml: '3rem' }}>
								<ImageThumbnail
									imgSource={selectedEvent?.coverImageUrl || 'https://placehold.co/400x300/e2e8f0/64748b?text=Cover+Image'}
									removeImage={() => {
										if (selectedEvent) {
											setSelectedEvent({ ...selectedEvent, coverImageUrl: '' });
										}
										setIsEventUpdated(true);
									}}
									boxStyle={{ width: '8rem', height: '8rem' }}
									imgStyle={{ objectFit: 'cover', maxWidth: '100%', maxHeight: '100%' }}
									disableRemove={selectedEvent?.createdBy !== user?._id}
								/>
							</Box>
						</Box>
					)}

					<Box sx={{ display: 'flex', mb: '0.85rem', justifyContent: 'space-between' }}>
						<Box sx={{ display: 'flex', flex: 4, justifyContent: 'space-between', mr: '0.5rem' }}>
							<LocalizationProvider dateAdapter={AdapterDayjs}>
								<DateTimePicker
									label='Start Time'
									value={selectedEvent?.start ? dayjs(selectedEvent.start) : null}
									onChange={(newValue: Dayjs | null) => {
										setIsEventUpdated(true);
										setSelectedEvent((prevData) => {
											if (prevData) {
												const updatedStart = newValue ? newValue.toDate() : null;
												let updatedEnd = prevData?.end;

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
											}
											return prevData;
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
									disabled={selectedEvent?.isAllDay || selectedEvent?.createdBy !== user?._id}
									format={getDateTimeFormat(navigator.language)}
								/>
							</LocalizationProvider>

							<LocalizationProvider dateAdapter={AdapterDayjs}>
								<DateTimePicker
									label='End Time'
									value={selectedEvent?.end ? dayjs(selectedEvent?.end) : null}
									onChange={(newValue: Dayjs | null) => {
										setIsEventUpdated(true);
										setSelectedEvent((prevData) => {
											if (prevData) {
												return { ...prevData, end: newValue ? newValue.toDate() : null };
											}
											return prevData;
										});
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
									disabled={selectedEvent?.isAllDay || selectedEvent?.createdBy !== user?._id}
									format={getDateTimeFormat(navigator.language)}
								/>
							</LocalizationProvider>
						</Box>
						<FormControlLabel
							labelPlacement='start'
							control={
								<Checkbox
									checked={selectedEvent?.isAllDay}
									disabled={selectedEvent?.isPublic || selectedEvent?.createdBy !== user?._id}
									onChange={(e) => {
										setIsEventUpdated(true);

										const isAllDay = e.target.checked;
										setSelectedEvent((prevData) => {
											if (prevData) {
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
											}
											return prevData;
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
									fontSize: isVerySmallScreen ? '0.7rem' : '0.8rem', // Adjust the label font size
								},
							}}
						/>
					</Box>

					{!selectedEvent?.isPublic && hasAdminAccess && (
						<>
							{/* Show selected instructors above instructor search */}
							{selectedEvent?.attendees &&
								selectedEvent.attendees.filter(
									(attendee) =>
										attendee.role === 'instructor' || attendee.role === 'admin' || attendee.role === 'owner' || attendee.role === 'super-admin'
								).length > 0 && (
									<Box sx={{ display: 'flex', margin: '1.5rem 0 0.75rem 0', flexWrap: 'wrap' }}>
										{selectedEvent.attendees
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
															disabled={!canManageEvent}
															onClick={() => {
																setIsEventUpdated(true);
																const updatedAttendees =
																	selectedEvent.attendees?.filter((filteredAttendee) => attendee._id !== filteredAttendee._id) || [];
																setSelectedEvent((prevData) => {
																	if (prevData) {
																		return { ...prevData, attendees: updatedAttendees };
																	}
																	return prevData;
																});
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
											placeholder={selectedEvent?.isPublic || selectedEvent?.isAllInstructorsSelected ? '' : 'Search Instructor'}
											disabled={selectedEvent?.isPublic || selectedEvent?.createdBy !== user?._id || selectedEvent?.isAllInstructorsSelected}
											selectedUserIds={selectedEvent?.attendees?.map((attendee) => attendee._id) || []}
											sx={{
												backgroundColor: selectedEvent?.isAllInstructorsSelected || selectedEvent?.isPublic ? 'transparent' : '#fff',
											}}
										/>
										{hasAdminAccess && (
											<IconButton sx={{ 'ml': '0.25rem', 'mt': '0.5rem', '&:hover': { backgroundColor: 'transparent' } }}>
												<InfoOutlined
													fontSize='small'
													sx={{ fontSize: isMobileSize ? '0.9rem' : '1rem' }}
													onClick={() => setInstructorSearchInfoOpen(true)}
												/>
											</IconButton>
										)}
									</Box>
									<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: '0.55rem', flex: 1 }}>
										<FormControlLabel
											labelPlacement='start'
											disabled={selectedEvent?.isPublic || selectedEvent?.createdBy !== user?._id}
											control={
												<Checkbox
													checked={selectedEvent?.isAllInstructorsSelected || false}
													onChange={(e) => {
														setSearchInstructorValue('');
														setSearchLearnerValue('');
														setSearchCourseValue('');
														setIsEventUpdated(true);

														setSelectedEvent((prevData) => {
															if (prevData) {
																return {
																	...prevData,
																	isAllInstructorsSelected: e.target.checked,
																	// "All Instructors" and "All Courses" can be selected together (instructors are independent of courses)
																};
															}
															return prevData;
														});

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
															setSelectedEvent((prevData) => {
																if (prevData) {
																	return {
																		...prevData,
																		attendees: [],
																		coursesIds: [],
																		allAttendeesIds: [],
																	};
																}
																return prevData;
															});
														}
													}}
													sx={{
														'& .MuiSvgIcon-root': {
															fontSize: isVerySmallScreen ? '0.9rem' : '1rem',
														},
													}}
												/>
											}
											label={isMobileSize ? 'All' : 'All Instructors'}
											sx={{
												'mt': '0rem',
												'& .MuiFormControlLabel-label': {
													fontSize: isVerySmallScreen ? '0.6rem' : '0.7rem',
												},
											}}
										/>
									</Box>
								</Box>
							</Box>
						</>
					)}

					{!selectedEvent?.isPublic && !isLearner && (
						<>
							{/* Show selected learners above learner search */}
							{selectedEvent?.attendees && selectedEvent.attendees.filter((attendee) => attendee.role === 'learner').length > 0 && (
								<Box sx={{ display: 'flex', margin: '1.5rem 0 0.75rem 0', flexWrap: 'wrap' }}>
									{selectedEvent.attendees
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
														disabled={!canManageEvent}
														onClick={() => {
															setIsEventUpdated(true);
															const updatedAttendees =
																selectedEvent.attendees?.filter((filteredAttendee) => attendee._id !== filteredAttendee._id) || [];
															setSelectedEvent((prevData) => {
																if (prevData) {
																	return { ...prevData, attendees: updatedAttendees };
																}
																return prevData;
															});
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
										<EventUserSearchSelect
											ref={userSearchRef}
											value={searchLearnerValue}
											onChange={(value) => {
												setSearchLearnerValue(value);
												setIsEventUpdated(true);
											}}
											onSelect={handleUserSelect}
											currentUserId={user?.firebaseUserId}
											placeholder={selectedEvent?.isAllLearnersSelected || selectedEvent?.isPublic ? '' : 'Search Learner'}
											disabled={selectedEvent?.isAllLearnersSelected || selectedEvent?.isPublic || selectedEvent?.createdBy !== user?._id}
											selectedUserIds={selectedEvent?.attendees?.map((attendee) => attendee._id) || []}
											sx={{
												backgroundColor: selectedEvent?.isAllLearnersSelected || selectedEvent?.isPublic ? 'transparent' : '#fff',
											}}
										/>
										{hasAdminAccess && (
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
												disabled={selectedEvent?.isPublic || selectedEvent?.createdBy !== user?._id}
												control={
													<Checkbox
														checked={selectedEvent?.isAllLearnersSelected}
														onChange={(e) => {
															setSearchCourseValue('');
															setSearchLearnerValue('');
															setSearchInstructorValue('');
															setIsEventUpdated(true);

															setSelectedEvent((prevData) => {
																if (prevData) {
																	return {
																		...prevData,
																		isAllLearnersSelected: e.target.checked,
																		// "All Learners" covers all subscribers, so uncheck "All Subscribers" when "All Learners" is selected
																		isAllSubscribersSelected: e.target.checked ? false : prevData.isAllSubscribersSelected,
																		// "All Learners" and "All Courses" overlap (courses contain learners), so uncheck "All Courses" when "All Learners" is selected
																		isAllCoursesSelected: e.target.checked ? false : prevData.isAllCoursesSelected,
																	};
																}
																return prevData;
															});

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

																setSelectedEvent((prevData) => {
																	if (prevData) {
																		return { ...prevData, attendees: [], coursesIds: [], allAttendeesIds: [] };
																	}
																	return prevData;
																});
															}
														}}
														sx={{
															'& .MuiSvgIcon-root': {
																fontSize: isVerySmallScreen ? '0.9rem' : '1rem',
															},
														}}
													/>
												}
												label={isMobileSize ? 'All' : 'All Learners'}
												sx={{
													'mt': '0rem',
													'& .MuiFormControlLabel-label': {
														fontSize: isVerySmallScreen ? '0.6rem' : '0.7rem',
													},
												}}
											/>
										</Box>
									)}
								</Box>
							</Box>
						</>
					)}

					{!selectedEvent?.isPublic && hasAdminAccess && (
						<>
							<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', mt: '-0.5rem', mb: '2rem' }}>
								<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
									<Box sx={{ display: 'flex', flex: isMobileSize ? 5 : 3.5, alignItems: 'flex-start' }}>
										{/* Placeholder for future subscriber search if needed */}
									</Box>
									<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: '0.55rem' }}>
										<FormControlLabel
											labelPlacement='start'
											disabled={selectedEvent?.isPublic || selectedEvent?.createdBy !== user?._id}
											control={
												<Checkbox
													checked={selectedEvent?.isAllSubscribersSelected || false}
													onChange={(e) => {
														setSearchCourseValue('');
														setSearchLearnerValue('');
														setSearchInstructorValue('');
														setIsEventUpdated(true);

														setSelectedEvent((prevData) => {
															if (prevData) {
																return {
																	...prevData,
																	isAllSubscribersSelected: e.target.checked,
																	// "All Subscribers" and "All Courses" can be selected together (different groups)
																	// "All Subscribers" and "All Instructors" can be selected together (different groups)
																};
															}
															return prevData;
														});

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

															setSelectedEvent((prevData) => {
																if (prevData) {
																	return {
																		...prevData,
																		attendees: [],
																		coursesIds: [],
																		allAttendeesIds: [],
																	};
																}
																return prevData;
															});
														}
													}}
													sx={{
														'& .MuiSvgIcon-root': {
															fontSize: isVerySmallScreen ? '0.9rem' : '1rem',
														},
													}}
												/>
											}
											label='All Subscribers'
											sx={{
												'mt': '0rem',
												'& .MuiFormControlLabel-label': {
													fontSize: isVerySmallScreen ? '0.6rem' : '0.7rem',
												},
											}}
										/>
									</Box>
								</Box>
							</Box>
						</>
					)}

					{selectedEvent?.coursesIds && selectedEvent.coursesIds && selectedEvent.coursesIds.length > 0 && (
						<Box sx={{ display: 'flex', margin: '-0.5rem 0 0.75rem 0', flexWrap: 'wrap' }}>
							{selectedEvent.coursesIds?.map((id) => {
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
										<Typography sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>{truncateText(course?.title!, 20)}</Typography>
										<IconButton
											disabled={selectedEvent?.isPublic || selectedEvent?.createdBy !== user?._id}
											onClick={() => {
												setIsEventUpdated(true);
												const updatedCoursesIds = selectedEvent.coursesIds?.filter((filteredCourseId) => course?._id !== filteredCourseId) || [];

												setSelectedEvent((prevData) => {
													if (prevData) {
														return { ...prevData, coursesIds: updatedCoursesIds };
													}
													return prevData;
												});
											}}>
											<Cancel sx={{ fontSize: isMobileSize ? '0.85rem' : '0.95rem' }} />
										</IconButton>
									</Box>
								);
							})}
						</Box>
					)}

					{!selectedEvent?.isPublic && !isLearner && (
						<Box
							sx={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								position: 'relative',
								mt: selectedEvent?.coursesIds && selectedEvent.coursesIds && selectedEvent.coursesIds.length > 0 ? '0.5rem' : '-1.25rem',
							}}>
							<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
								<Box sx={{ display: 'flex', flex: isMobileSize ? 5 : 3.5, alignItems: 'flex-start' }}>
									<EventCourseSearchSelect
										ref={courseSearchRef}
										value={searchCourseValue}
										onChange={(value) => {
											setSearchCourseValue(value);
											setIsEventUpdated(true);
										}}
										onSelect={handleCourseSelect}
										placeholder={
											selectedEvent?.isAllLearnersSelected || selectedEvent?.isAllCoursesSelected || selectedEvent?.isPublic ? '' : 'Search Course'
										}
										disabled={
											selectedEvent?.isAllLearnersSelected ||
											selectedEvent?.isAllCoursesSelected ||
											selectedEvent?.isPublic ||
											selectedEvent?.createdBy !== user?._id
										}
										selectedCourseIds={selectedEvent?.coursesIds || []}
										sx={{
											backgroundColor:
												selectedEvent?.isAllLearnersSelected || selectedEvent?.isAllCoursesSelected || selectedEvent?.isPublic
													? 'transparent'
													: '#fff',
										}}
									/>
									{hasAdminAccess && (
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
									<Box sx={{ display: 'flex', justifyContent: 'flex-end', flex: 1 }}>
										<FormControlLabel
											disabled={selectedEvent?.isAllLearnersSelected || selectedEvent?.isPublic || selectedEvent?.createdBy !== user?._id}
											labelPlacement='start'
											control={
												<Checkbox
													checked={selectedEvent?.isAllCoursesSelected}
													onChange={(e) => {
														setSearchCourseValue('');
														setSearchLearnerValue('');
														setSearchInstructorValue('');
														setIsEventUpdated(true);

														setSelectedEvent((prevData) => {
															if (prevData) {
																return {
																	...prevData,
																	isAllCoursesSelected: e.target.checked,
																	// "All Courses" contains learners, so uncheck "All Learners" when "All Courses" is selected
																	// "All Instructors" can stay selected (instructors are independent of courses)
																	isAllLearnersSelected: e.target.checked ? false : prevData.isAllLearnersSelected,
																};
															}
															return prevData;
														});

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

															setSelectedEvent((prevData) => {
																if (prevData) {
																	return {
																		...prevData,
																		coursesIds: [],
																		attendees: [],
																		allAttendeesIds: [],
																	};
																}
																return prevData;
															});
														}
													}}
													sx={{
														'& .MuiSvgIcon-root': {
															fontSize: isVerySmallScreen ? '0.9rem' : '1rem',
														},
													}}
												/>
											}
											label={isMobileSize ? 'All' : 'All Courses'}
											sx={{
												'& .MuiFormControlLabel-label': {
													fontSize: isVerySmallScreen ? '0.6rem' : '0.7rem', // Adjust the label font size
												},
											}}
										/>
									</Box>
								)}
							</Box>
						</Box>
					)}

					{(hasAdminAccess || isInstructor) &&
						(() => {
							const hasZoomMeeting = !!(selectedEvent?.zoomMeetingId || selectedEvent?.zoomMeetingNumber || selectedEvent?.zoomJoinUrl);
							if (hasZoomMeeting) {
								return (
									<Box sx={{ mb: '0.75rem' }}>
										<Button
											variant='contained'
											disabled={!selectedEvent?._id || (!hasAdminAccess && selectedEvent?.createdBy !== user?._id) || isStartingMeeting}
											onClick={async () => {
												if (!selectedEvent?._id) return;
												if (!hasAdminAccess && selectedEvent?.createdBy !== user?._id) {
													setUrlErrorMessage('You do not have permission to start this Zoom meeting.');
													setIsUrlErrorOpen(true);
													return;
												}

												try {
													setIsStartingMeeting(true);
													// Start as host via Meeting SDK (no Zoom login required in browser)
													const url = `${window.location.origin}/zoom-meeting/${selectedEvent._id}?autojoin=1&host=1`;
													window.open(url, '_blank', 'noopener,noreferrer');
												} catch (error: any) {
													const msg =
														error?.response?.data?.message ||
														'Failed to start Zoom meeting. If this is an older meeting, the host start link may have expired—try recreating the Zoom meeting.';
													setUrlErrorMessage(msg);
													setIsUrlErrorOpen(true);
												} finally {
													setIsStartingMeeting(false);
												}
											}}
											sx={{
												'backgroundColor': '#2D8CFF',
												'textTransform': 'capitalize',
												'fontSize': isMobileSize ? '0.75rem' : '0.85rem',
												'fontWeight': 550,
												'&:hover': {
													backgroundColor: '#2681F2',
												},
												'mt': '0.5rem',
											}}>
											Start Meeting
										</Button>
									</Box>
								);
							}

							return (
								<FormControlLabel
									labelPlacement='start'
									control={
										<Checkbox
											checked={selectedEvent?.isZoomMeeting || false}
											onChange={(e) => {
												const isChecked = e.target.checked;
												setSelectedEvent((prevData) => {
													if (prevData) {
														return {
															...prevData,
															isZoomMeeting: isChecked,
															// Clear event link when Zoom is selected
															eventLinkUrl: isChecked ? '' : prevData.eventLinkUrl,
														};
													}
													return prevData;
												});
												setIsEventUpdated(true);
												// Zoom meeting will be created when form is submitted (in editEvent function)
											}}
											disabled={selectedEvent?.createdBy !== user?._id}
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
							);
						})()}

					{!(hasAdminAccess || isInstructor) || !selectedEvent?.isZoomMeeting ? (
						<CustomTextField
							label='Event Link'
							value={selectedEvent?.eventLinkUrl}
							onChange={(e) => {
								setSelectedEvent((prevData) => {
									if (prevData) {
										return { ...prevData, eventLinkUrl: e.target.value };
									}
									return prevData;
								});
								setIsEventUpdated(true);
							}}
							required={false}
							disabled={selectedEvent?.createdBy !== user?._id || ((hasAdminAccess || isInstructor) && selectedEvent?.isZoomMeeting)}
						/>
					) : null}

					<CustomTextField
						label='Location'
						value={selectedEvent?.location}
						sx={{ marginBottom: '-0.5rem' }}
						onChange={(e) => {
							setIsEventUpdated(true);
							setSelectedEvent((prevData) => {
								if (prevData) {
									return { ...prevData, location: e.target.value };
								}
								return prevData;
							});
						}}
						required={false}
						InputProps={{ inputProps: { maxLength: 150 } }}
						placeholder='Enter a location for the event (max 150 characters)'
						multiline
						rows={3}
						disabled={selectedEvent?.isPublic || selectedEvent?.createdBy !== user?._id}
					/>
				</DialogContent>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0.25rem 0.75rem' }}>
					<Box sx={{ marginBottom: '0.5rem' }}>
						<CustomDeleteButton
							type='button'
							onClick={() => setDeleteEventModalOpen(true)}
							disabled={!canManageEvent}
							sx={{ height: isMobileSize ? '1.5rem' : undefined }}>
							{isVerySmallScreen ? 'Delete' : 'Delete Event'}
						</CustomDeleteButton>
					</Box>
					<CustomDialogActions
						onCancel={() => {
							if (!isProcessing) {
								setEditEventModalOpen(false);
								setSearchLearnerValue('');
								setSearchCourseValue('');
								setSearchInstructorValue('');
								setIsEventUpdated(false);
							}
						}}
						submitBtnText='Update'
						disableBtn={isProcessing || !canManageEvent}
						disableCancelBtn={isProcessing}
						actionSx={{ marginBottom: '0rem' }}
					/>
				</Box>
				<CustomDialog openModal={deleteEventModalOpen} closeModal={() => setDeleteEventModalOpen(false)} title='Delete Event' maxWidth='xs'>
					<DialogContent>
						<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', lineHeight: 1.7 }}>
							Are you sure you want to delete the event?
						</Typography>
						<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', lineHeight: 1.7, mt: '0.75rem' }}>
							If you delete the event and if there is a Zoom meeting created for the event, the Zoom meeting will be deleted as well.
						</Typography>
					</DialogContent>
					<CustomDialogActions
						deleteBtn
						onCancel={() => setDeleteEventModalOpen(false)}
						onDelete={deleteEvent}
						actionSx={{ marginBottom: '0.5rem' }}
					/>
				</CustomDialog>
				<Snackbar
					open={isUrlErrorOpen}
					autoHideDuration={4000}
					anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
					onClose={() => setIsUrlErrorOpen(false)}>
					<Alert severity='error' variant='filled' sx={{ width: '100%' }}>
						{urlErrorMessage}
					</Alert>
				</Snackbar>
			</form>
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
					<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', lineHeight: 1.7 }}>
						This search is used to search for active learners (has registered course or subscriber) in the organization.
					</Typography>
				</DialogContent>
				<DialogActions>
					<CustomCancelButton onClick={() => setLearnerSearchInfoOpen(false)} sx={{ margin: '0 0.5rem 0.5rem 0' }}>
						Close
					</CustomCancelButton>
				</DialogActions>
			</CustomDialog>
			<CustomDialog maxWidth='xs' openModal={courseSearchInfoOpen} closeModal={() => setCourseSearchInfoOpen(false)} title='Course Search Info'>
				<DialogContent>
					<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', lineHeight: 1.7 }}>
						This search is used to search for published courses in the organization.
					</Typography>
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

export default EditEventDialog;
