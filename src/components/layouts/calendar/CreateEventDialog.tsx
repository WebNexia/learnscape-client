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
} from '@mui/material';
import CustomDialog from '../dialog/CustomDialog';
import CustomTextField from '../../forms/customFields/CustomTextField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { Cancel } from '@mui/icons-material';
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
import { UsersContext } from '../../../contexts/UsersContextProvider';
import { OrganisationContext } from '../../../contexts/OrganisationContextProvider';
import EventUserSearchSelect from '../../EventUserSearchSelect';
import EventCourseSearchSelect from '../../EventCourseSearchSelect';
import { SearchUser } from '../../../interfaces/search';
import { SearchCourse } from '../../../interfaces/search';

import { EventsContext } from '../../../contexts/EventsContextProvider';
import { truncateText } from '../../../utils/utilText';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

import { db } from '../../../firebase';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import axios from '@utils/axiosInstance';
import HandleImageUploadURL from '../../forms/uploadImageVideoDocument/HandleImageUploadURL';
import ImageThumbnail from '../../forms/uploadImageVideoDocument/ImageThumbnail';
import { validateImageUrl } from '../../../utils/urlValidation';

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
	const { users } = useContext(UsersContext);
	const { courses } = useContext(CoursesContext);
	const { addNewEvent } = useContext(EventsContext);

	const { isSmallScreen, isRotatedMedium, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const [searchLearnerValue, setSearchLearnerValue] = useState<string>('');
	const [searchCourseValue, setSearchCourseValue] = useState<string>('');
	const [enterCoverImageUrl, setEnterCoverImageUrl] = useState<boolean>(true);

	// Refs for search components to access their reset functions
	const userSearchRef = useRef<any>(null);
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
		};

		// Check if user is already selected
		const isAlreadySelected = newEvent.attendees.some((attendee) => attendee._id === user._id);
		if (!isAlreadySelected) {
			setNewEvent((prevData) => ({
				...prevData,
				attendees: [...prevData.attendees, user],
			}));
		}
		setSearchLearnerValue('');
	};

	const handleCourseSelect = (selectedCourse: SearchCourse) => {
		// For event creation, we only need the course ID
		// Check if course is already selected
		const isAlreadySelected = newEvent.coursesIds.includes(selectedCourse._id);
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
		// Validate URLs before proceeding
		const urlsValid = await validateUrls();
		if (!urlsValid) {
			return; // Don't proceed if URL validation fails
		}

		const allFirebaseUserIds: string[] = users
			?.filter((filteredUser) => filteredUser._id !== user?._id)
			?.map((mappedUser) => mappedUser.firebaseUserId);

		const participants = [...newEvent.attendees]; // Start with selected attendees
		let allParticipantsIds: string[] = [];
		let allCoursesParticipantsInfo: AttendeeInfo[] = [];

		if (newEvent.isAllLearnersSelected) {
			setNewEvent((prevData) => ({ ...prevData, allAttendeesIds: [], coursesIds: [], attendees: [] }));
			allCoursesParticipantsInfo = [];
		} else if (newEvent.isAllCoursesSelected) {
			try {
				const res = await axios.get(`${base_url}/usercourses/participants/organisation/${orgId}`);

				allCoursesParticipantsInfo = [...res.data.participants, ...participants];
				allParticipantsIds = [...res.data.participants, ...participants]?.map((participant: AttendeeInfo) => participant._id);
			} catch (error) {
				console.log(error);
			}
		} else if (newEvent.coursesIds.length > 0) {
			const courseParticipants: AttendeeInfo[] = [];

			await Promise.all(
				newEvent.coursesIds?.map(async (courseId) => {
					try {
						const res = await axios.get(`${base_url}/userCourses/course/${courseId}`);
						courseParticipants.push(...res.data.users); // Collect participants directly
					} catch (error) {
						console.log(error);
					}
				})
			);

			const combinedParticipants = Array.from(new Map([...courseParticipants, ...participants]?.map((user) => [user._id, user])).values());

			allCoursesParticipantsInfo = combinedParticipants; // Update state once with final list
			allParticipantsIds = combinedParticipants?.map((participant) => participant._id);
		} else {
			// If no special selection, update with direct attendees
			const uniqueParticipants = Array.from(new Map([...participants]?.map((user) => [user._id, user])).values());

			allCoursesParticipantsInfo = uniqueParticipants;
			allParticipantsIds = uniqueParticipants.map((participant) => participant._id);
			setNewEvent((prevData) => ({ ...prevData, allAttendeesIds: allParticipantsIds }));
		}

		const event = {
			title: newEvent.title,
			description: newEvent.description,
			start: newEvent.start,
			end: newEvent.end,
			eventLinkUrl: newEvent.eventLinkUrl,
			location: newEvent.location,
			isAllDay: newEvent.isAllDay,
			isActive: true,
			orgId,
			attendees: newEvent.attendees.map((attendee) => attendee._id), // Send only ObjectIds
			allAttendeesIds: allParticipantsIds,
			isAllLearnersSelected: newEvent.isAllLearnersSelected,
			isAllCoursesSelected: newEvent.isAllCoursesSelected,
			coursesIds: newEvent.coursesIds,
			createdBy: user?._id!,
			isPublic: newEvent.isPublic,
			coverImageUrl: newEvent.isPublic ? newEvent.coverImageUrl : '',
			type: newEvent.isPublic ? newEvent.type : '',
		};

		try {
			const res = await axios.post(`${base_url}/events`, event);

			addNewEvent({ ...event, _id: res.data.data._id });

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
			const adminName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username || 'Admin';
			const notificationData = {
				title: 'Added to Event',
				message: `${adminName} has added you to a new event: "${truncateText(newEvent.title, 20)}". The event will start on ${startDate} at ${startTime}.`,
				isRead: false,
				timestamp: serverTimestamp(),
				type: 'AddToEvent',
				userImageUrl: user?.imageUrl,
				eventId: res.data.data._id,
			};

			if (newEvent.isAllLearnersSelected) {
				for (const id of allFirebaseUserIds) {
					const notificationRef = collection(db, 'notifications', id, 'userNotifications');
					await addDoc(notificationRef, notificationData);
				}
			} else {
				for (const participant of allCoursesParticipantsInfo) {
					const notificationRef = collection(db, 'notifications', participant.firebaseUserId, 'userNotifications');
					await addDoc(notificationRef, notificationData);
				}
			}

			if (newEvent.isPublic) {
				const allFirebaseUserIds: string[] = users
					?.filter((filteredUser) => filteredUser._id !== user?._id)
					?.map((mappedUser) => mappedUser.firebaseUserId);

				const adminName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username || 'Admin';
				const publicEventNotification = {
					title: 'New Public Event',
					message: `${adminName} has added a public event: "${newEvent.title}". It will take place on ${startDate} at ${startTime}.`,
					isRead: false,
					timestamp: serverTimestamp(),
					type: 'PublicEvent',
					userImageUrl: user?.imageUrl,
					eventId: res.data.data._id,
				};

				for (const id of allFirebaseUserIds) {
					const notificationRef = collection(db, 'notifications', id, 'userNotifications');
					await addDoc(notificationRef, publicEventNotification);
				}
			}
		} catch (error: any) {
			console.log(error);
			// Show error message to user
			if (error?.response?.data?.message) {
				setUrlErrorMessage(error.response.data.message);
			} else {
				setUrlErrorMessage('Failed to create event. Please try again.');
			}
			setIsUrlErrorOpen(true);
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
			isAllCoursesSelected: false,
			isPublic: false,
			coverImageUrl: '',
			participantCount: 0,
			type: '',
		}));

		setSearchLearnerValue('');
		setSearchCourseValue('');
	};

	return (
		<CustomDialog
			openModal={newEventModalOpen}
			closeModal={() => {
				setNewEventModalOpen(false);
				resetNewEventForm();
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

					{newEvent.attendees.length > 0 && (
						<Box sx={{ display: 'flex', margin: '1.5rem 0 0.75rem 0', flexWrap: 'wrap' }}>
							{newEvent.attendees?.map((attendee) => {
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
										<Typography sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem' }}>{attendee.username}</Typography>
										<IconButton
											onClick={() => {
												const updatedAttendees = newEvent.attendees.filter((filteredAttendee) => attendee._id !== filteredAttendee._id);

												setNewEvent((prevData) => ({ ...prevData, attendees: updatedAttendees }));
											}}>
											<Cancel sx={{ fontSize: isMobileSize ? '0.8rem' : '0.9rem' }} />
										</IconButton>
									</Box>
								);
							})}
						</Box>
					)}

					{!newEvent.isPublic && (
						<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', mt: '0.5rem' }}>
							<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
								<Box sx={{ flex: 3 }}>
									<EventUserSearchSelect
										ref={userSearchRef}
										value={searchLearnerValue}
										onChange={setSearchLearnerValue}
										onSelect={handleUserSelect}
										currentUserId={user?.firebaseUserId}
										placeholder={newEvent.isAllLearnersSelected || newEvent.isPublic ? '' : 'Search Learner'}
										disabled={newEvent.isAllLearnersSelected || newEvent.isPublic}
										selectedUserIds={newEvent.attendees.map((attendee) => attendee._id)}
										sx={{
											backgroundColor: newEvent.isAllLearnersSelected || newEvent.isPublic ? 'transparent' : '#fff',
										}}
									/>
								</Box>
								<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: '0.55rem' }}>
									<FormControlLabel
										labelPlacement='start'
										disabled={newEvent.isPublic}
										control={
											<Checkbox
												checked={newEvent.isAllLearnersSelected}
												onChange={(e) => {
													setSearchCourseValue('');
													setSearchLearnerValue('');
													setNewEvent((prevData) => ({ ...prevData, isAllLearnersSelected: e.target.checked }));

													// Reset search results when "All Learners" is checked
													if (e.target.checked) {
														// Reset user search results
														if (userSearchRef.current?.reset) {
															userSearchRef.current.reset();
														}
														// Reset course search results
														if (courseSearchRef.current?.reset) {
															courseSearchRef.current.reset();
														}

														setNewEvent((prevData) => ({
															...prevData,
															attendees: [],
															coursesIds: [],
															allAttendeesIds: [],
															isAllCoursesSelected: false,
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
										label='All Learners'
										sx={{
											'& .MuiFormControlLabel-label': {
												fontSize: isMobileSize ? '0.6rem' : '0.7rem',
											},
										}}
									/>
								</Box>
							</Box>
						</Box>
					)}

					{newEvent.coursesIds.length > 0 && (
						<Box sx={{ display: 'flex', margin: '-0.5rem 0 0.75rem 0', flexWrap: 'wrap' }}>
							{newEvent.coursesIds?.map((id) => {
								const course = courses.find((course) => course._id === id);
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
												const updatedCourses = newEvent.coursesIds.filter((filteredCourseId) => course?._id !== filteredCourseId);

												setNewEvent((prevData) => ({ ...prevData, coursesIds: updatedCourses }));
											}}>
											<Cancel sx={{ fontSize: isMobileSize ? '0.8rem' : '0.9rem' }} />
										</IconButton>
									</Box>
								);
							})}
						</Box>
					)}

					{!newEvent.isPublic && (
						<Box
							sx={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								position: 'relative',
								mt: newEvent.coursesIds.length > 0 ? '0.5rem' : '-1.25rem',
							}}>
							<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
								<Box sx={{ flex: 3 }}>
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
								</Box>
								<Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: '2.15rem' }}>
									<FormControlLabel
										disabled={newEvent.isAllLearnersSelected || newEvent.isPublic}
										labelPlacement='start'
										control={
											<Checkbox
												checked={newEvent.isAllCoursesSelected}
												onChange={(e) => {
													setSearchCourseValue('');
													setNewEvent((prevData) => ({ ...prevData, isAllCoursesSelected: e.target.checked }));

													// Reset search results when "All Courses" is checked
													if (e.target.checked) {
														// Reset course search results
														if (courseSearchRef.current?.reset) {
															courseSearchRef.current.reset();
														}

														setNewEvent((prevData) => ({ ...prevData, coursesIds: [] }));
													}
												}}
												sx={{
													'& .MuiSvgIcon-root': {
														fontSize: isMobileSize ? '0.9rem' : '1rem', // Adjust the checkbox icon size
													},
												}}
											/>
										}
										label='All Courses'
										sx={{
											'& .MuiFormControlLabel-label': {
												fontSize: isMobileSize ? '0.6rem' : '0.7rem', // Adjust the label font size
											},
										}}
									/>
								</Box>
							</Box>
						</Box>
					)}

					<CustomTextField
						label='Event Link'
						value={newEvent.eventLinkUrl}
						onChange={(e) => setNewEvent((prevData) => ({ ...prevData, eventLinkUrl: e.target.value }))}
						required={false}
					/>

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
						setNewEventModalOpen(false);
						resetNewEventForm();
					}}
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
		</CustomDialog>
	);
};

export default CreateEventDialog;
